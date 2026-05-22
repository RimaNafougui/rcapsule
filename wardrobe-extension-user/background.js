// ============================================================================
// BACKGROUND SERVICE WORKER (User version)
//
// Responsibilities:
//   1. Toggle the in-page panel when the extension icon is clicked
//   2. Relay API fetch calls from the content script — content scripts are
//      subject to the page's CORS policy, but service workers are not.
// ============================================================================

// ── Toggle panel on icon click ──────────────────────────────────────────────

async function sendToggle(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_PANEL' });
  } catch {
    // Content script not yet injected (e.g. on a new tab / chrome:// page).
    // Inject it first, then toggle.
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      await chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_PANEL' });
    } catch (err) {
      console.warn('Rcapsule: could not inject panel on this page.', err.message);
    }
  }
}

chrome.action.onClicked.addListener((tab) => {
  sendToggle(tab.id);
});

// ── Keyboard shortcuts ───────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle-panel' || command === 'scan-page') {
    sendToggle(tab.id);
  }
});

// ── API relay ────────────────────────────────────────────────────────────────
// The content script cannot make credentialed cross-origin requests reliably,
// so it asks the background worker (which has full host_permissions) to do it.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'API_IMPORT') {
    fetch('https://rcapsule.com/api/extension/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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

// ── Online/offline badge ─────────────────────────────────────────────────────

self.addEventListener('online',  () => {
  chrome.action.setBadgeText({ text: '' });
});
self.addEventListener('offline', () => {
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#DC2626' });
});

// ── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('Rcapsule Wardrobe Import installed (v1.1)');
});
