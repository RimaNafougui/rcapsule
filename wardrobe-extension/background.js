// ============================================================================
// BACKGROUND SERVICE WORKER
// Handles keyboard shortcuts, background tasks, and bulk import orchestration
// ============================================================================

// ============================================================================
// BULK IMPORT STATE
// ============================================================================

const BULK_IMPORT_KEY = "bulk_import_state";

function defaultBulkState() {
  return {
    status: "idle", // idle | scanning | complete | error | cancelled
    products: [],
    scannedProducts: [],
    errors: [],
    currentIndex: 0,
    totalCount: 0,
    startedAt: null,
  };
}

async function getBulkState() {
  const result = await chrome.storage.local.get(BULK_IMPORT_KEY);
  return result[BULK_IMPORT_KEY] || defaultBulkState();
}

async function setBulkState(state) {
  await chrome.storage.local.set({ [BULK_IMPORT_KEY]: state });
}

// ============================================================================
// PRODUCT DETAIL EXTRACTION (injected into background tabs)
// ============================================================================

// This function is self-contained — it gets injected via executeScript({ func })
// into each Aritzia product page tab during Pass 2.
async function extractProductDetailInjected() {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const data = {
    name: "",
    brand: "",
    price: "",
    imageUrl: "",
    link: window.location.href,
    size: "",
    materials: "",
    description: "",
  };

  // JSON-LD extraction
  const jsonLdScripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );
  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.textContent);
      const products = Array.isArray(json) ? json : [json];
      const product = products.find((p) => p["@type"] === "Product");
      if (product) {
        if (product.name) data.name = product.name;
        if (product.brand) {
          data.brand =
            typeof product.brand === "object"
              ? product.brand.name
              : product.brand;
        }
        if (product.offers) {
          const offer = Array.isArray(product.offers)
            ? product.offers[0]
            : product.offers;
          if (offer?.price) data.price = String(offer.price);
        }
        if (product.description) data.description = product.description;
      }
    } catch (e) {
      /* skip */
    }
  }

  // Materials: click "Details" button, wait, read materials list
  const detailsButton = document.querySelector(
    'button[data-testid="details-link"]',
  );
  if (detailsButton) {
    detailsButton.click();
    await wait(800);

    const materialsList = document.querySelector(
      'ul[data-testid="materials-and-care-copy"]',
    );
    if (materialsList) {
      const listItems = Array.from(materialsList.querySelectorAll("li"));
      const contentItem = listItems.find((item) =>
        item.textContent.includes("Content:"),
      );
      if (contentItem) {
        data.materials = contentItem.textContent
          .replace("Content:", "")
          .trim();
      }
    }
  }

  // Description from meta
  if (!data.description) {
    const metaDesc =
      document.querySelector('meta[name="description"]') ||
      document.querySelector('meta[property="og:description"]');
    if (metaDesc) data.description = metaDesc.content;
  }

  // Image: prefer off-body images
  if (!data.imageUrl) {
    const offBodyLink = document.querySelector('a[href*="_off_"]');
    const offBodyImg = document.querySelector('img[src*="_off_"]');
    data.imageUrl = offBodyLink?.href || offBodyImg?.src || "";
  }

  // Fallback image: og:image
  if (!data.imageUrl) {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) data.imageUrl = ogImage.content;
  }

  // Brand fallback
  if (!data.brand) {
    const siteName = document.querySelector(
      'meta[property="og:site_name"]',
    )?.content;
    data.brand = siteName || "Aritzia";
  }

  // Extract selected color name from product page
  // Aritzia: look for the selected color swatch label
  const colorName = (() => {
    // Aritzia pattern: selected color displayed near swatches
    const colorLabel =
      document.querySelector('[data-testid="selected-color"]') ||
      document.querySelector('[data-testid="color-name"]') ||
      document.querySelector('.product-color-name') ||
      document.querySelector('[class*="color-name"]') ||
      document.querySelector('[class*="selectedColor"]');
    if (colorLabel) return colorLabel.textContent.trim();

    // Generic: look for "Color: <value>" pattern in product info
    const allText = document.querySelectorAll('span, p, div');
    for (const el of allText) {
      const text = el.textContent.trim();
      const match = text.match(/^Colou?r:\s*(.+)$/i);
      if (match && match[1].length < 40) return match[1].trim();
    }

    return "";
  })();

  // Append color to name if found, so different variants are distinguishable
  if (colorName && data.name && !data.name.toLowerCase().includes(colorName.toLowerCase())) {
    data.name = `${data.name} — ${colorName}`;
  }

  // Fix protocol-relative URLs
  if (data.imageUrl) {
    if (data.imageUrl.startsWith("//"))
      data.imageUrl = "https:" + data.imageUrl;
    if (data.imageUrl.includes(" "))
      data.imageUrl = data.imageUrl.split(" ")[0];
  }

  return data;
}

// ============================================================================
// BACKGROUND TAB SCANNING
// ============================================================================

function scanProductInBackground(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    let tabId = null;
    let resolved = false;
    let onUpdatedListener = null;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (onUpdatedListener)
          chrome.tabs.onUpdated.removeListener(onUpdatedListener);
        if (tabId) chrome.tabs.remove(tabId).catch(() => {});
        reject(new Error("Timeout loading page"));
      }
    }, timeoutMs);

    chrome.tabs.create({ url, active: false }, (tab) => {
      if (chrome.runtime.lastError) {
        clearTimeout(timeout);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      tabId = tab.id;

      onUpdatedListener = (updatedTabId, changeInfo) => {
        if (updatedTabId !== tabId || changeInfo.status !== "complete") return;

        chrome.tabs.onUpdated.removeListener(onUpdatedListener);
        onUpdatedListener = null;

        // Wait for dynamic content to render
        setTimeout(async () => {
          if (resolved) return;
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId },
              func: extractProductDetailInjected,
            });

            const data = results?.[0]?.result;

            chrome.tabs.remove(tabId).catch(() => {});
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              resolve(data || {});
            }
          } catch (err) {
            chrome.tabs.remove(tabId).catch(() => {});
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              reject(err);
            }
          }
        }, 1500);
      };

      chrome.tabs.onUpdated.addListener(onUpdatedListener);
    });
  });
}

// ============================================================================
// BULK SCAN ORCHESTRATION
// ============================================================================

async function handleBulkScanStart(products) {
  const TAB_DELAY_MS = 2000;
  const TAB_TIMEOUT_MS = 15000;

  const state = {
    status: "scanning",
    products,
    scannedProducts: [],
    errors: [],
    currentIndex: 0,
    totalCount: products.length,
    startedAt: Date.now(),
  };
  await setBulkState(state);

  for (let i = 0; i < products.length; i++) {
    // Check for cancellation
    const currentState = await getBulkState();
    if (currentState.status === "cancelled") {
      chrome.runtime
        .sendMessage({
          action: "BULK_SCAN_COMPLETE",
          scanned: currentState.scannedProducts.length,
          errors: currentState.errors.length,
          total: currentState.totalCount,
          cancelled: true,
        })
        .catch(() => {});
      return { cancelled: true, scanned: currentState.scannedProducts.length };
    }

    const product = products[i];

    try {
      const fullData = await scanProductInBackground(
        product.url,
        TAB_TIMEOUT_MS,
      );

      // Merge pass-1 data with pass-2 data (pass-2 takes priority where non-empty)
      const merged = {
        name: fullData.name || product.name,
        brand: fullData.brand || product.brand || "Aritzia",
        price: fullData.price || product.price,
        imageUrl: fullData.imageUrl || product.imageUrl,
        link: product.url,
        size: fullData.size || "",
        materials: fullData.materials || "",
        description: fullData.description || "",
      };

      currentState.scannedProducts.push(merged);
      currentState.currentIndex = i + 1;
      await setBulkState(currentState);

      chrome.runtime
        .sendMessage({
          action: "BULK_SCAN_PROGRESS",
          current: i + 1,
          total: products.length,
          product: merged,
        })
        .catch(() => {});
    } catch (error) {
      const currentState = await getBulkState();
      currentState.errors.push({
        url: product.url,
        name: product.name,
        error: error.message,
      });
      currentState.currentIndex = i + 1;
      await setBulkState(currentState);

      chrome.runtime
        .sendMessage({
          action: "BULK_SCAN_ERROR",
          current: i + 1,
          total: products.length,
          url: product.url,
          error: error.message,
        })
        .catch(() => {});
    }

    // Rate limiting delay between products
    if (i < products.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, TAB_DELAY_MS));
    }
  }

  // Mark complete
  const finalState = await getBulkState();
  if (finalState.status !== "cancelled") {
    finalState.status = "complete";
    await setBulkState(finalState);
  }

  chrome.runtime
    .sendMessage({
      action: "BULK_SCAN_COMPLETE",
      scanned: finalState.scannedProducts.length,
      errors: finalState.errors.length,
      total: finalState.totalCount,
      cancelled: false,
    })
    .catch(() => {});

  return {
    complete: true,
    scanned: finalState.scannedProducts.length,
    errors: finalState.errors.length,
  };
}

async function handleBulkScanCancel() {
  const state = await getBulkState();
  state.status = "cancelled";
  await setBulkState(state);
  return { cancelled: true };
}

// ============================================================================
// PANEL TOGGLE
// ============================================================================

async function sendToggle(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_PANEL' });
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      await chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_PANEL' });
    } catch (err) {
      console.warn('Rcapsule Admin: could not inject panel on this page.', err.message);
    }
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  sendToggle(tab.id);
});

// ============================================================================
// KEYBOARD COMMANDS
// ============================================================================

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-panel' || command === 'scan-page') {
    sendToggle(tab.id);
  }
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkOnlineStatus") {
    sendResponse({ online: navigator.onLine });
    return true;
  }

  if (request.action === "getRateLimitStatus") {
    sendResponse({ limited: false });
    return true;
  }

  if (request.action === "BULK_SCAN_START") {
    handleBulkScanStart(request.products).then(sendResponse);
    return true;
  }

  if (request.action === "BULK_SCAN_CANCEL") {
    handleBulkScanCancel().then(sendResponse);
    return true;
  }

  if (request.action === "GET_BULK_STATE") {
    getBulkState().then(sendResponse);
    return true;
  }

  if (request.action === "SCROLL_PROGRESS") {
    // Forward scroll progress to the panel in the same tab (no popup anymore)
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "SCROLL_PROGRESS_UPDATE",
        totalProducts: request.totalProducts,
      }).catch(() => {});
    }
    sendResponse({ ok: true });
    return true;
  }

  // ── API relay ──────────────────────────────────────────────────────────────
  // Content scripts cannot make credentialed cross-origin requests reliably;
  // the service worker (which has full host_permissions) does it instead.
  if (request.action === "API_IMPORT") {
    fetch("https://rcapsule.com/api/extension/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request.data),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        sendResponse({ ok: res.ok, status: res.status, body });
      })
      .catch((err) => {
        sendResponse({ ok: false, status: 0, body: { message: err.message } });
      });
    return true; // keep message channel open for async response
  }
});

// ============================================================================
// LIFECYCLE
// ============================================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log("Wardrobe Import extension installed");
});

// Resume incomplete bulk imports on service worker restart
chrome.runtime.onStartup.addListener(async () => {
  const state = await getBulkState();
  if (state.status === "scanning" && state.currentIndex < state.totalCount) {
    console.log(
      `Resuming bulk import from ${state.currentIndex}/${state.totalCount}`,
    );
    const remaining = state.products.slice(state.currentIndex);
    handleBulkScanStart(remaining);
  }
});

// Monitor online/offline status
self.addEventListener("online", () => {
  chrome.action.setBadgeText({ text: "" });
  chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
});

self.addEventListener("offline", () => {
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
});
