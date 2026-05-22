// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONFIG = {
  API_URL: "https://rcapsule.com/api/extension/import",
  TIMEOUT_MS: 10000,
  CLOSE_DELAY_MS: 1500,
};

const CATEGORIES = [
  "t-shirt", "blouse", "shirt", "tank top", "bodysuit", "crop top", "corset",
  "vest", "tights", "tube top", "sweater", "cardigan", "hoodie", "sweatshirt",
  "jeans", "pant", "pants", "trousers", "skirt", "shorts", "leggings",
  "sweatpants", "joggers", "dress", "jumpsuit", "romper", "co-ord set",
  "jacket", "coat", "blazer", "trench", "puffer", "bomber", "sneakers",
  "boots", "heels", "sandals", "loafers", "flats", "slides", "bag", "belt",
  "hat", "scarf", "sunglasses", "jewelry", "beanie", "cap", "underwear",
  "swimwear", "activewear", "purse", "wallet", "necklace", "earrings",
  "card holder", "watch", "bracelet", "ring", "bra", "socks",
];

const ACCESSORIES = [
  "bag", "belt", "hat", "scarf", "sunglasses", "jewelry", "beanie", "cap",
  "purse", "wallet", "necklace", "earrings", "card holder", "watch",
  "bracelet", "ring",
];

const UNSUPPORTED_SITES = [
  "google.com", "youtube.com", "facebook.com", "instagram.com", "tiktok.com",
  "x.com", "twitch.com", "pinterest.com", "netflix.com",
];

// ============================================================================
// STORAGE MANAGER
// ============================================================================

const StorageManager = {
  KEYS: {
    RECENT_SCANS: "recent_scans",
    RATE_LIMIT: "rate_limit_data",
    SETTINGS: "user_settings",
    OFFLINE_QUEUE: "offline_queue",
  },

  CONFIG: {
    MAX_RECENT_SCANS: 10,
    RATE_LIMIT_WINDOW: 60000,
    MAX_REQUESTS_PER_WINDOW: 10,
    CACHE_EXPIRY: 24 * 60 * 60 * 1000,
  },

  async saveRecentScan(productData) {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RECENT_SCANS);
      let recentScans = result[this.KEYS.RECENT_SCANS] || [];

      const scanEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        data: productData,
        url: productData.link,
      };

      recentScans.unshift(scanEntry);
      recentScans = recentScans.slice(0, this.CONFIG.MAX_RECENT_SCANS);

      await chrome.storage.local.set({ [this.KEYS.RECENT_SCANS]: recentScans });
      return true;
    } catch (error) {
      console.error("Error saving recent scan:", error);
      return false;
    }
  },

  async getRecentScans() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RECENT_SCANS);
      return result[this.KEYS.RECENT_SCANS] || [];
    } catch (error) {
      console.error("Error getting recent scans:", error);
      return [];
    }
  },

  async getCachedScan(url) {
    try {
      const recentScans = await this.getRecentScans();
      const cached = recentScans.find((scan) => scan.url === url);

      if (cached) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        if (age < this.CONFIG.CACHE_EXPIRY) {
          return cached.data;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting cached scan:", error);
      return null;
    }
  },

  async clearRecentScans() {
    try {
      await chrome.storage.local.remove(this.KEYS.RECENT_SCANS);
      console.log("Cache cleared successfully");
      return true;
    } catch (error) {
      console.error("Error clearing recent scans:", error);
      return false;
    }
  },

  async checkRateLimit() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RATE_LIMIT);
      const rateLimitData = result[this.KEYS.RATE_LIMIT] || {
        requests: [],
        windowStart: Date.now(),
      };

      const now = Date.now();
      const windowStart = rateLimitData.windowStart;

      if (now - windowStart > this.CONFIG.RATE_LIMIT_WINDOW) {
        rateLimitData.requests = [];
        rateLimitData.windowStart = now;
      }

      rateLimitData.requests = rateLimitData.requests.filter(
        (timestamp) => now - timestamp < this.CONFIG.RATE_LIMIT_WINDOW,
      );

      const requestCount = rateLimitData.requests.length;
      const allowed = requestCount < this.CONFIG.MAX_REQUESTS_PER_WINDOW;
      const remainingRequests = Math.max(
        0,
        this.CONFIG.MAX_REQUESTS_PER_WINDOW - requestCount,
      );
      const resetTime = windowStart + this.CONFIG.RATE_LIMIT_WINDOW;

      return { allowed, remainingRequests, resetTime, currentCount: requestCount };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      return { allowed: true, remainingRequests: this.CONFIG.MAX_REQUESTS_PER_WINDOW };
    }
  },

  async recordRequest() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RATE_LIMIT);
      const rateLimitData = result[this.KEYS.RATE_LIMIT] || {
        requests: [],
        windowStart: Date.now(),
      };
      rateLimitData.requests.push(Date.now());
      await chrome.storage.local.set({ [this.KEYS.RATE_LIMIT]: rateLimitData });
      return true;
    } catch (error) {
      console.error("Error recording request:", error);
      return false;
    }
  },

  async addToOfflineQueue(productData) {
    try {
      const result = await chrome.storage.local.get(this.KEYS.OFFLINE_QUEUE);
      let queue = result[this.KEYS.OFFLINE_QUEUE] || [];
      queue.push({ id: Date.now(), timestamp: new Date().toISOString(), data: productData });
      await chrome.storage.local.set({ [this.KEYS.OFFLINE_QUEUE]: queue });
      return true;
    } catch (error) {
      console.error("Error adding to offline queue:", error);
      return false;
    }
  },

  async getOfflineQueue() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.OFFLINE_QUEUE);
      return result[this.KEYS.OFFLINE_QUEUE] || [];
    } catch (error) {
      console.error("Error getting offline queue:", error);
      return [];
    }
  },

  async clearOfflineQueue() {
    try {
      await chrome.storage.local.remove(this.KEYS.OFFLINE_QUEUE);
      return true;
    } catch (error) {
      console.error("Error clearing offline queue:", error);
      return false;
    }
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function detectCategory(name) {
  if (!name) return "Uncategorized";
  const text = name.toLowerCase();
  const sortedCategories = [...CATEGORIES].sort((a, b) => b.length - a.length);
  for (const cat of sortedCategories) {
    if (text.includes(cat)) {
      return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  }
  return "Uncategorized";
}

function isUnsupportedSite(hostname) {
  return UNSUPPORTED_SITES.some(
    (site) => hostname === site || hostname.endsWith(`.${site}`),
  );
}

function sanitizeProductData(data) {
  return {
    name: String(data.name || "").trim(),
    brand: String(data.brand || "").trim(),
    price: String(data.price || "").trim(),
    size: String(data.size || "").trim(),
    link: String(data.link || "").trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    category: String(data.category || "Uncategorized"),
    materials: String(data.materials || "").trim(),
    description: String(data.description || "").trim(),
  };
}

function setStatus(message, type = "") {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = type;
  }
}

function switchView(viewToShow) {
  ["scanView", "formView"].forEach((viewId) => {
    const el = document.getElementById(viewId);
    if (el) el.classList.toggle("hidden", viewId !== viewToShow);
  });
}

function checkOnlineStatus() {
  return navigator.onLine;
}

// ============================================================================
// DOM MANIPULATION
// ============================================================================

function populateForm(data) {
  const fields = {
    inputName: data.name,
    inputBrand: data.brand,
    inputPrice: data.price,
    inputSize: data.size,
    inputLink: data.link,
    inputCategory: data.category,
    inputImgUrl: data.imageUrl,
    inputMaterials: data.materials,
    inputDescription: data.description,
  };

  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  });

  const imgPreview = document.getElementById("previewImg");
  const imgPlaceholder = document.getElementById("imgPlaceholder");

  if (imgPreview && data.imageUrl) {
    imgPreview.src = data.imageUrl;
    imgPreview.style.display = "block";
    if (imgPlaceholder) imgPlaceholder.style.display = "none";
  } else if (imgPreview) {
    imgPreview.style.display = "none";
    if (imgPlaceholder) imgPlaceholder.style.display = "block";
  }
}

function getFormData() {
  const isWishlist = document.getElementById("inputWishlist")?.checked || false;
  return {
    name: document.getElementById("inputName")?.value || "",
    brand: document.getElementById("inputBrand")?.value || "",
    price: document.getElementById("inputPrice")?.value || "",
    size: document.getElementById("inputSize")?.value || "",
    link: document.getElementById("inputLink")?.value || "",
    imageUrl: document.getElementById("inputImgUrl")?.value || "",
    category: document.getElementById("inputCategory")?.value || "Uncategorized",
    status: isWishlist ? "wishlist" : "owned",
    purchaseDate: isWishlist ? null : new Date().toISOString().split("T")[0],
    materials: document.getElementById("inputMaterials")?.value || "",
    description: document.getElementById("inputDescription")?.value || "",
  };
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

async function scanPage() {
  setStatus("Scanning page...", "loading");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) throw new Error("No active tab found");

    // Check cache first
    if (tab.url) {
      const cached = await StorageManager.getCachedScan(tab.url);
      if (cached) {
        const sanitized = sanitizeProductData(cached);
        const detectedCategory = detectCategory(sanitized.name);
        sanitized.category = detectedCategory;
        if (ACCESSORIES.includes(detectedCategory.toLowerCase())) {
          sanitized.size = "O/S";
        }
        populateForm(sanitized);
        switchView("formView");
        setStatus("Loaded from cache", "success");
        setTimeout(() => setStatus(""), 2000);
        return;
      }
    }

    // Check for unsupported sites
    if (tab.url) {
      const hostname = new URL(tab.url).hostname;
      if (isUnsupportedSite(hostname)) {
        setStatus("This doesn't look like a clothing store!", "error");
        return;
      }
    }

    // Execute content script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractProductData,
    });

    const data = results?.[0]?.result;

    if (!data?.name) {
      setStatus("Could not find product name.", "error");
      return;
    }

    const sanitized = sanitizeProductData(data);
    const detectedCategory = detectCategory(sanitized.name);
    sanitized.category = detectedCategory;

    if (ACCESSORIES.includes(detectedCategory.toLowerCase())) {
      sanitized.size = "O/S";
    }

    await StorageManager.saveRecentScan(sanitized);

    populateForm(sanitized);
    switchView("formView");
    setStatus("");
  } catch (error) {
    console.error("Scan error:", error);
    setStatus("Error scanning page. Please try again.", "error");
  }
}

async function saveProduct() {
  const saveBtn = document.getElementById("saveBtn");
  if (!saveBtn) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";
  setStatus("", "");

  const productData = getFormData();

  if (!checkOnlineStatus()) {
    await StorageManager.addToOfflineQueue(productData);
    setStatus("Saved offline. Will sync when online.", "success");
    saveBtn.textContent = "Saved Offline";
    setTimeout(() => window.close(), CONFIG.CLOSE_DELAY_MS);
    return;
  }

  const rateLimit = await StorageManager.checkRateLimit();
  if (!rateLimit.allowed) {
    const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    setStatus(`Rate limit reached. Try again in ${waitTime}s`, "error");
    saveBtn.disabled = false;
    saveBtn.textContent = "Add to Wardrobe";
    return;
  }

  try {
    await StorageManager.recordRequest();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(productData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      setStatus("Saved to Wardrobe!", "success");
      saveBtn.textContent = "Saved";
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Save failed");
    }
  } catch (error) {
    console.error("Save error:", error);

    if (error.name === "AbortError") {
      setStatus("Request timeout. Please try again.", "error");
    } else if (!checkOnlineStatus()) {
      await StorageManager.addToOfflineQueue(productData);
      setStatus("Saved offline. Will sync when online.", "success");
      saveBtn.textContent = "Saved Offline";
      setTimeout(() => window.close(), CONFIG.CLOSE_DELAY_MS);
      return;
    } else {
      setStatus(`Error: ${error.message}`, "error");
    }

    saveBtn.disabled = false;
    saveBtn.textContent = "Add to Wardrobe";
  }
}

function cancelForm() {
  switchView("scanView");
  setStatus("");
}

// ============================================================================
// OFFLINE QUEUE PROCESSOR
// ============================================================================

async function processOfflineQueue() {
  if (!checkOnlineStatus()) return;

  const queue = await StorageManager.getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`Processing ${queue.length} offline items...`);

  for (const item of queue) {
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(item.data),
      });
      if (response.ok) {
        console.log("Successfully synced offline item:", item.id);
      }
    } catch (error) {
      console.error("Failed to sync offline item:", error);
      break;
    }
  }

  await StorageManager.clearOfflineQueue();
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      const formView = document.getElementById("formView");
      if (!formView.classList.contains("hidden")) {
        e.preventDefault();
        saveProduct();
      }
    }

    if (e.key === "Escape") {
      const formView = document.getElementById("formView");
      if (!formView.classList.contains("hidden")) {
        e.preventDefault();
        cancelForm();
      }
    }
  });
}

// ============================================================================
// CONTENT SCRIPT (injected into page)
// ============================================================================

async function extractProductData() {
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

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ========== JSON-LD EXTRACTION ==========
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.textContent);
      const products = Array.isArray(json) ? json : [json];
      const product = products.find((p) => p["@type"] === "Product");

      if (product) {
        if (product.name) data.name = product.name;
        if (product.brand) {
          data.brand =
            typeof product.brand === "object" ? product.brand.name : product.brand;
        }
        if (product.offers) {
          const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
          if (offer?.price) data.price = String(offer.price);
        }
      }
    } catch (e) {
      console.warn("JSON-LD parsing error:", e);
    }
  }

  // ========== SITE-SPECIFIC EXTRACTIONS ==========
  const hostname = window.location.hostname;

  // Nike
  if (hostname.includes("nike")) {
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) data.name = metaTitle.content.trim();

    const selectedSize = document.querySelector(
      '[data-testid="pdp-grid-selector-item-selected"] input',
    );
    if (selectedSize?.value) data.size = selectedSize.value;
  }

  // The RealReal
  if (hostname.includes("therealreal")) {
    const priceEl = document.querySelector('[data-testid="product-price/final"]');
    if (priceEl) {
      data.price = priceEl.textContent.replace(/- Price:\s*/i, "").replace(/[^0-9.]/g, "").trim();
    }
    const sizeEl = document.querySelector('[data-testid="product-size"]');
    if (sizeEl) data.size = sizeEl.textContent.replace(/^Size:\s*/i, "").trim();
    const zoomImg = document.querySelector("img[data-zoom]");
    if (zoomImg?.dataset.zoom) data.imageUrl = zoomImg.dataset.zoom;
  }

  // Grailed
  if (hostname.includes("grailed")) {
    const metadataEl = document.querySelector('p[class*="Details_metadata"]');
    if (metadataEl?.firstChild) data.size = metadataEl.firstChild.textContent.trim();
  }

  // Uniqlo
  if (hostname.includes("uniqlo")) {
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) data.name = metaTitle.content.trim();
    const selectedChip = document.querySelector(".size-chip-selected");
    if (selectedChip) data.size = selectedChip.textContent.trim();
  }

  // H&M
  if (hostname.includes("hm")) {
    const nameEl = document.querySelector('h1[data-testid="product-name"]');
    if (nameEl) {
      data.name = nameEl.textContent.trim();
    } else {
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) data.name = metaTitle.content.trim();
      else if (document.title) data.name = document.title.split("|")[0].trim();
    }

    const redPrice = document.querySelector('[data-testid="red-price"]');
    const whitePrice = document.querySelector('[data-testid="white-price"]');
    data.price = (redPrice || whitePrice)?.textContent.trim().replace(/[^0-9.]/g, "") || "";

    const selectedSize = document.querySelector('[id^="sizeButton"][aria-checked="true"]');
    if (selectedSize) data.size = selectedSize.textContent.trim();

    let productImg =
      document.querySelector('img[alt^="View larger image"][alt$=" 5"]') ||
      document.querySelector('img[alt^="View larger image"]');
    if (productImg) {
      let imgUrl = productImg.currentSrc || productImg.src;
      if (imgUrl.includes("imwidth=")) imgUrl = imgUrl.replace(/imwidth=\d+/, "imwidth=2160");
      data.imageUrl = imgUrl;
    }
  }

  // Aritzia
  if (hostname.includes("aritzia")) {
    const descContainer = document.querySelector('[data-testid="product-description"]');
    if (descContainer) {
      const paragraphs = Array.from(descContainer.querySelectorAll("p"))
        .filter((p) => !p.closest("button"))
        .map((p) => p.textContent.trim())
        .filter((text) => text.length > 0);

      if (paragraphs.length > 0) {
        data.description = paragraphs.join("\n\n");
      } else {
        const clone = descContainer.cloneNode(true);
        clone.querySelectorAll("button").forEach((btn) => btn.remove());
        data.description = clone.textContent.trim();
      }
    }

    const detailsButton = document.querySelector('button[data-testid="details-link"]');
    if (detailsButton) {
      detailsButton.click();
      await wait(500);

      const materialsList = document.querySelector('ul[data-testid="materials-and-care-copy"]');
      if (materialsList) {
        const listItems = Array.from(materialsList.querySelectorAll("li"));
        const contentItem = listItems.find((item) => item.textContent.includes("Content:"));
        if (contentItem) data.materials = contentItem.textContent.replace("Content:", "").trim();
      }
    }

    const selectedButton = document.querySelector(
      'div[data-testid="size-palette"] button[aria-checked="true"]',
    );
    if (selectedButton) {
      data.size = selectedButton.textContent.trim();
    } else {
      const sizeMsg = document.querySelector('[data-testid="siv-select-size-msg"]');
      if (sizeMsg) {
        data.size = sizeMsg.textContent.replace(/^Size\s*/i, "").split(/[—–-]/)[0].trim();
      }
    }

    const colorEl =
      document.querySelector('[data-testid="selected-color"]') ||
      document.querySelector('[data-testid="color-name"]') ||
      document.querySelector(".product-color-name") ||
      document.querySelector('[class*="color-name"]') ||
      document.querySelector('[class*="selectedColor"]');
    const aritziaColor = colorEl?.textContent.trim();
    if (aritziaColor && data.name && !data.name.toLowerCase().includes(aritziaColor.toLowerCase())) {
      data.name = `${data.name} — ${aritziaColor}`;
    }
  }

  // Lululemon
  if (hostname.includes("lululemon")) {
    const titleEl = document.querySelector("h1");
    if (titleEl) data.name = titleEl.innerText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    if (!data.name && document.title) data.name = document.title.split("|")[0].trim();

    const materialLists = document.querySelectorAll('dl[class*="material-and-care"]');
    if (materialLists.length > 0) {
      const lines = Array.from(materialLists).map((dl) => {
        const label = dl.querySelector("dt")?.textContent.trim() || "";
        const values = Array.from(dl.querySelectorAll("dd")).map((dd) => dd.textContent.trim()).join(" ");
        return `${label} ${values}`;
      });
      data.materials = lines.join("; ").trim();
    }
  }

  // ========== GENERIC FALLBACKS ==========

  if (!data.brand) {
    const siteName = document.querySelector('meta[property="og:site_name"]')?.content;
    if (siteName) {
      data.brand = siteName;
    } else {
      data.brand = hostname.replace("www.", "").split(".")[0];
    }
    data.brand = data.brand.charAt(0).toUpperCase() + data.brand.slice(1);
  }

  if (!data.price) {
    const zaraPrice = document.querySelector("span.money-amount__main");
    const genericPrice = document.querySelector('[class*="price"]');
    const priceText = zaraPrice?.textContent || genericPrice?.textContent || "";
    const match = priceText.match(/[\d,]+\.?\d*/);
    if (match) data.price = match[0].replace(/,/g, "");
  }

  if (!data.size) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      for (const [key, value] of urlParams.entries()) {
        if (key.toLowerCase().includes("size") || key === "sz") {
          data.size = decodeURIComponent(value);
          break;
        }
      }
    } catch (e) {
      console.warn("URL param error:", e);
    }
  }

  if (!data.size) {
    const ssenseDropdown = document.getElementById("pdpSizeDropdown");
    if (ssenseDropdown) {
      const selected = ssenseDropdown.options[ssenseDropdown.selectedIndex];
      if (selected && !selected.disabled && selected.value) {
        let text = selected.textContent.trim();
        text = text.includes("=") ? text.split("=")[1].trim() : text;
        data.size = text.split(" -")[0].trim();
      }
    }
  }

  if (!data.size) {
    const activeSize =
      document.querySelector(".size-selector .active") ||
      document.querySelector('[class*="size"] [aria-checked="true"]') ||
      document.querySelector('input[name="size"]:checked + label') ||
      document.querySelector('.selected[class*="size"]');
    if (activeSize) data.size = activeSize.textContent.trim();
  }

  if (data.size) {
    data.size = data.size.replace(/chevron|down/gi, "").replace(/\n/g, " ").trim();
  }

  // ========== COLOR EXTRACTION (generic fallback) ==========
  if (data.name && !data.name.includes(" — ")) {
    const colorLabel = (() => {
      const allEls = document.querySelectorAll("span, p, div, label");
      for (const el of allEls) {
        const text = el.textContent.trim();
        const match = text.match(/^Colou?r:\s*(.+)$/i);
        if (match && match[1].length < 40 && !match[1].includes("\n")) {
          return match[1].trim();
        }
      }
      return "";
    })();
    if (colorLabel) data.name = `${data.name} — ${colorLabel}`;
  }

  // ========== IMAGE EXTRACTION ==========

  const getValidSrc = (img) => {
    if (!img) return null;
    const srcset = img.srcset || img.dataset.srcset;
    if (srcset) {
      const urls = srcset.split(/,\s+/);
      return urls[urls.length - 1].trim().split(" ")[0];
    }
    const src = img.src || img.dataset.src;
    return src && !src.startsWith("data:") ? src : null;
  };

  if (hostname.includes("ssense") && !data.imageUrl) {
    const ssenseImg =
      document.querySelector("img.product-detail-new") ||
      document.querySelector('img[data-test="product-image"]');
    if (ssenseImg) data.imageUrl = getValidSrc(ssenseImg);
  }

  if (hostname.includes("aritzia") && !data.imageUrl) {
    const offBodyLink = document.querySelector('a[href*="_off_"]');
    const offBodyImg = document.querySelector('img[src*="_off_"]');
    data.imageUrl = offBodyLink?.href || offBodyImg?.src || data.imageUrl;
  }

  if (hostname.includes("zara") && !data.imageUrl) {
    let candidates = Array.from(document.querySelectorAll(".media-image__image"));
    if (!candidates.length) candidates = Array.from(document.querySelectorAll("img"));

    const getScore = (img) => {
      let score = 0;
      const src = img.src || "";
      const alt = (img.alt || "").toLowerCase();
      if (alt.includes("front view")) score += 10;
      if (src.includes("-e1.")) score += 5;
      if (src.includes("-p.")) score -= 2;
      if ((img.naturalWidth || 0) < 200) score -= 10;
      return score;
    };

    candidates.sort((a, b) => getScore(b) - getScore(a));

    if (candidates[0]) {
      data.imageUrl = candidates[0].src.split("?")[0];
      if (candidates[0].srcset) {
        const sources = candidates[0].srcset.split(",").map((s) => s.trim().split(" ")[0]);
        if (sources.length) data.imageUrl = sources[sources.length - 1].split("?")[0];
      }
    }
  }

  if (!data.imageUrl) {
    const productImg =
      document.querySelector(".product-detail-images__image-container img") ||
      document.querySelector(".media-image__image");
    if (productImg) data.imageUrl = getValidSrc(productImg);
  }

  if (!data.imageUrl) {
    const images = Array.from(document.querySelectorAll("img"));
    const largeImage = images.find((img) => {
      const valid = getValidSrc(img);
      return (img.naturalWidth > 300 || img.width > 300) && valid;
    });
    if (largeImage) data.imageUrl = getValidSrc(largeImage);
  }

  if (data.imageUrl) {
    if (data.imageUrl.startsWith("//")) data.imageUrl = "https:" + data.imageUrl;
    if (data.imageUrl.includes(" ")) data.imageUrl = data.imageUrl.split(" ")[0];
  }

  return data;
}

// ============================================================================
// EVENT LISTENERS & INITIALIZATION
// ============================================================================

document.getElementById("clearCacheBtn").addEventListener("click", async () => {
  const success = await StorageManager.clearRecentScans();
  if (success) {
    const btn = document.getElementById("clearCacheBtn");
    btn.textContent = "Cleared!";
    setTimeout(() => (btn.textContent = "Clear Cache"), 2000);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const scanBtn = document.getElementById("scanBtn");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  if (scanBtn) scanBtn.addEventListener("click", scanPage);
  if (saveBtn) saveBtn.addEventListener("click", saveProduct);
  if (cancelBtn) cancelBtn.addEventListener("click", cancelForm);

  setupKeyboardShortcuts();

  if (checkOnlineStatus()) {
    processOfflineQueue();
  }

  window.addEventListener("online", () => {
    setStatus("✓ Back online", "success");
    setTimeout(() => setStatus(""), 2000);
    processOfflineQueue();
  });

  window.addEventListener("offline", () => {
    setStatus("⚠️ Offline mode", "error");
  });

  updateOfflineBadge();
  if (!checkOnlineStatus()) {
    setStatus("⚠️ You are offline", "error");
  }
});

function updateOfflineBadge() {
  const badge = document.getElementById("offlineBadge");
  if (badge) badge.style.display = checkOnlineStatus() ? "none" : "block";
}

window.addEventListener("online", updateOfflineBadge);
window.addEventListener("offline", updateOfflineBadge);
