// ============================================================================
// RCAPSULE — Floating Wardrobe Import Panel (Content Script)
// Injected into every page. Panel is created on first toggle, then reused.
// Uses Shadow DOM so the extension's CSS is fully isolated from the page.
// ============================================================================

(function () {
  'use strict';

  // ── Guard against double-injection ─────────────────────────────────────────
  if (window.__rcapsuleInjected__) return;
  window.__rcapsuleInjected__ = true;

  // ── Constants ───────────────────────────────────────────────────────────────

  const CATEGORIES = [
    't-shirt','blouse','shirt','tank top','bodysuit','crop top','corset','vest',
    'tights','tube top','sweater','cardigan','hoodie','sweatshirt','jeans','pant',
    'pants','trousers','skirt','shorts','leggings','sweatpants','joggers','dress',
    'jumpsuit','romper','co-ord set','jacket','coat','blazer','trench','puffer',
    'bomber','sneakers','boots','heels','sandals','loafers','flats','slides','bag',
    'belt','hat','scarf','sunglasses','jewelry','beanie','cap','underwear',
    'swimwear','activewear','purse','wallet','necklace','earrings','card holder',
    'watch','bracelet','ring','bra','socks',
  ];

  const ACCESSORIES = [
    'bag','belt','hat','scarf','sunglasses','jewelry','beanie','cap','purse',
    'wallet','necklace','earrings','card holder','watch','bracelet','ring',
  ];

  const UNSUPPORTED = [
    'google.com','youtube.com','facebook.com','instagram.com','tiktok.com',
    'x.com','twitch.com','pinterest.com','netflix.com',
  ];

  // ── State ────────────────────────────────────────────────────────────────────

  let host = null;       // the element appended to <html>
  let root = null;       // shadow root
  let visible = false;

  // drag state
  let dragging = false;
  let dStartX = 0, dStartY = 0, dOrigLeft = 0, dOrigTop = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const q    = (id) => root.getElementById(id);

  function detectCategory(name) {
    if (!name) return 'Uncategorized';
    const text = name.toLowerCase();
    const sorted = [...CATEGORIES].sort((a, b) => b.length - a.length);
    for (const cat of sorted) {
      if (text.includes(cat)) return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
    return 'Uncategorized';
  }

  function isUnsupported(hostname) {
    return UNSUPPORTED.some((s) => hostname === s || hostname.endsWith('.' + s));
  }

  function sanitize(data) {
    return {
      name:        String(data.name        || '').trim(),
      brand:       String(data.brand       || '').trim(),
      price:       String(data.price       || '').trim(),
      size:        String(data.size        || '').trim(),
      link:        String(data.link        || '').trim(),
      imageUrl:    String(data.imageUrl    || '').trim(),
      category:    String(data.category    || 'Uncategorized'),
      materials:   String(data.materials   || '').trim(),
      description: String(data.description || '').trim(),
    };
  }

  function setStatus(msg, type = '') {
    const el = q('status');
    if (!el) return;
    el.textContent = msg;
    el.className   = type;
  }

  function switchView(id) {
    ['scanView', 'formView'].forEach((v) => {
      const el = q(v);
      if (el) el.classList.toggle('hidden', v !== id);
    });
  }

  // ── Storage manager (same as popup.js) ──────────────────────────────────────

  const Store = {
    KEYS: {
      RECENT:  'recent_scans',
      RATE:    'rate_limit_data',
      OFFLINE: 'offline_queue',
    },
    CFG: {
      MAX: 10,
      WINDOW: 60000,
      MAX_REQ: 10,
      CACHE_TTL: 24 * 60 * 60 * 1000,
    },

    async saveRecent(data) {
      try {
        const res  = await chrome.storage.local.get(this.KEYS.RECENT);
        let list   = res[this.KEYS.RECENT] || [];
        list.unshift({ id: Date.now(), timestamp: new Date().toISOString(), data, url: data.link });
        list = list.slice(0, this.CFG.MAX);
        await chrome.storage.local.set({ [this.KEYS.RECENT]: list });
      } catch {}
    },

    async getCached(url) {
      try {
        const res  = await chrome.storage.local.get(this.KEYS.RECENT);
        const list = res[this.KEYS.RECENT] || [];
        const hit  = list.find((s) => s.url === url);
        if (hit && Date.now() - new Date(hit.timestamp).getTime() < this.CFG.CACHE_TTL) {
          return hit.data;
        }
      } catch {}
      return null;
    },

    async clearRecent() {
      try { await chrome.storage.local.remove(this.KEYS.RECENT); return true; } catch { return false; }
    },

    async checkRate() {
      try {
        const res  = await chrome.storage.local.get(this.KEYS.RATE);
        const d    = res[this.KEYS.RATE] || { requests: [], windowStart: Date.now() };
        const now  = Date.now();
        if (now - d.windowStart > this.CFG.WINDOW) { d.requests = []; d.windowStart = now; }
        d.requests = d.requests.filter((t) => now - t < this.CFG.WINDOW);
        return {
          allowed:          d.requests.length < this.CFG.MAX_REQ,
          remainingRequests: Math.max(0, this.CFG.MAX_REQ - d.requests.length),
          resetTime:         d.windowStart + this.CFG.WINDOW,
        };
      } catch {
        return { allowed: true, remainingRequests: this.CFG.MAX_REQ };
      }
    },

    async recordRequest() {
      try {
        const res = await chrome.storage.local.get(this.KEYS.RATE);
        const d   = res[this.KEYS.RATE] || { requests: [], windowStart: Date.now() };
        d.requests.push(Date.now());
        await chrome.storage.local.set({ [this.KEYS.RATE]: d });
      } catch {}
    },

    async queueOffline(data) {
      try {
        const res = await chrome.storage.local.get(this.KEYS.OFFLINE);
        const q   = res[this.KEYS.OFFLINE] || [];
        q.push({ id: Date.now(), timestamp: new Date().toISOString(), data });
        await chrome.storage.local.set({ [this.KEYS.OFFLINE]: q });
      } catch {}
    },

    async getOffline() {
      try {
        const res = await chrome.storage.local.get(this.KEYS.OFFLINE);
        return res[this.KEYS.OFFLINE] || [];
      } catch { return []; }
    },

    async clearOffline() {
      try { await chrome.storage.local.remove(this.KEYS.OFFLINE); } catch {}
    },
  };

  // ── Panel CSS ─────────────────────────────────────────────────────────────────

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host {
      all: initial;
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #171717;
    }

    #panel {
      background: #FFFFFF;
      border: 1px solid #171717;
      width: 380px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header / drag handle ── */
    #header {
      background: #171717;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: grab;
      user-select: none;
      flex-shrink: 0;
    }
    #header.dragging { cursor: grabbing; }

    .logo {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #FFFFFF;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .version {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #A3A3A3;
    }

    #closeBtn {
      background: transparent;
      border: none;
      color: #A3A3A3;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
      transition: color 150ms;
    }
    #closeBtn:hover { color: #FFFFFF; }

    /* ── Scrollable body ── */
    #body {
      overflow-y: auto;
      padding: 20px;
      flex: 1;
    }
    #body::-webkit-scrollbar { width: 5px; }
    #body::-webkit-scrollbar-track { background: #FAFAFA; }
    #body::-webkit-scrollbar-thumb { background: #D4D4D4; }

    /* ── Intro ── */
    .intro {
      font-size: 12px;
      color: #737373;
      margin-bottom: 18px;
      line-height: 1.6;
      padding-left: 12px;
      border-left: 1px solid #171717;
    }
    .intro strong { color: #171717; font-weight: 600; }

    /* ── Buttons ── */
    .btn {
      display: block;
      width: 100%;
      height: 44px;
      padding: 0 16px;
      border: none;
      border-radius: 0;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      cursor: pointer;
      transition: background-color 150ms, color 150ms, border-color 150ms;
      background: transparent;
    }
    .btn-primary { background: #171717; color: #FFFFFF; }
    .btn-primary:hover:not(:disabled) { background: #404040; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-secondary {
      background: transparent;
      color: #171717;
      border: 1px solid #171717;
      margin-top: 8px;
    }
    .btn-secondary:hover:not(:disabled) { background: #171717; color: #FFFFFF; }
    .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }



    /* ── Utility ── */
    .hidden { display: none !important; }

    /* ── Form ── */
    .form-group { margin-bottom: 14px; }

    .label {
      display: block;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #737373;
      margin-bottom: 6px;
      transition: color 150ms;
    }
    .form-group:focus-within .label { color: #171717; }

    .input,
    select,
    textarea {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      border: 1px solid #E5E5E5;
      border-radius: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      background: #FFFFFF;
      color: #171717;
      transition: border-color 150ms;
      appearance: none;
      -webkit-appearance: none;
    }
    textarea {
      height: auto;
      min-height: 68px;
      padding: 10px 12px;
      resize: vertical;
      line-height: 1.5;
    }
    .input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #171717;
    }
    .input::placeholder, textarea::placeholder { color: #A3A3A3; }

    .flex-row { display: flex; gap: 10px; margin-bottom: 14px; }
    .flex-row .form-group { margin-bottom: 0; }

    /* ── Image preview ── */
    .img-container {
      width: 100%;
      aspect-ratio: 3 / 4;
      background: #F5F5F5;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid #E5E5E5;
      position: relative;
    }
    .img-preview { width: 100%; height: 100%; object-fit: cover; }
    .img-placeholder {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #A3A3A3;
    }

    /* ── Checkbox ── */
    .checkbox-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 14px 0;
      padding: 12px;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      cursor: pointer;
      transition: border-color 150ms;
    }
    .checkbox-wrapper:hover { border-color: #171717; }
    .checkbox-wrapper:has(input:checked) { border-color: #171717; background: #FAFAFA; }
    .checkbox-wrapper input[type="checkbox"] {
      margin-top: 2px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: #171717;
      flex-shrink: 0;
    }
    .checkbox-label { flex: 1; cursor: pointer; }
    .checkbox-title {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .checkbox-desc { font-size: 11px; color: #737373; line-height: 1.4; }

    /* ── Status ── */
    #status {
      margin-top: 10px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-align: center;
      min-height: 16px;
      padding: 4px 8px;
    }
    .error   { color: #DC2626; }
    .success { color: #16A34A; }
    .loading { color: #737373; }

    /* ── Shortcut hint ── */
    .hint {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 9px;
      color: #A3A3A3;
      text-align: center;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .hint kbd {
      background: #F5F5F5;
      border: 1px solid #D4D4D4;
      padding: 1px 5px;
      font-family: inherit;
      font-size: 9px;
    }

    /* ── Scrollbar on selects ── */
    select::-webkit-scrollbar { width: 6px; }
    select::-webkit-scrollbar-track { background: #FAFAFA; }
    select::-webkit-scrollbar-thumb { background: #D4D4D4; }

    /* ── Offline badge ── */
    #offlineBadge {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: #DC2626;
      color: #FFFFFF;
      padding: 2px 6px;
    }

    /* ── View entrance ── */
    #scanView, #formView {
      animation: fadeUp 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
      }
    }
  `;

  // ── Panel HTML ────────────────────────────────────────────────────────────────

  const CATEGORY_OPTIONS = [
    'Uncategorized','Activewear','Bag','Beanie','Belt','Blazer','Blouse','Bodysuit',
    'Bomber','Boots','Bra','Bracelet','Cap','Card Holder','Cardigan','Co-ord Set',
    'Coat','Corset','Crop Top','Dress','Earrings','Flats','Hat','Heels','Hoodie',
    'Jacket','Jeans','Jewelry','Joggers','Jumpsuit','Leggings','Loafers','Pants',
    'Puffer','Ring','Romper','Sandals','Scarf','Shirt','Shorts','Skirt','Slides',
    'Sneakers','Sunglasses','Sweater','Sweatpants','Sweatshirt','Swimwear','T-shirt',
    'Tank Top','Tights','Trench','Trousers','Tube Top','Underwear','Vest','Watch',
    'Socks','Pant',
  ].map((c) => `<option value="${c}">${c === 'Uncategorized' ? '— Select —' : c}</option>`).join('');

  const HTML = `
    <div id="panel">
      <div id="header">
        <span class="logo">Rcapsule / Import</span>
        <div class="header-right">
          <span id="offlineBadge" style="display:none">Offline</span>
          <span class="version">v1.1</span>
          <button id="closeBtn" title="Close panel">✕</button>
        </div>
      </div>

      <div id="body">
        <!-- Scan view -->
        <div id="scanView">
          <p class="intro">
            Navigate to a product page on <strong>Zara</strong>, <strong>SSENSE</strong>,
            <strong>Aritzia</strong>, <strong>Grailed</strong>, <strong>Nike</strong>,
            <strong>H&M</strong>, or other supported retailers to automatically extract details.
          </p>
          <button id="scanBtn" class="btn btn-primary">Scan Current Page</button>
          <button id="manualBtn" class="btn btn-secondary hidden">Enter Manually</button>
          <div class="hint" style="margin-top:10px">
            <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> to scan · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>W</kbd> to toggle
          </div>
        </div>

        <!-- Form view -->
        <div id="formView" class="hidden">
          <div class="img-container">
            <img id="previewImg" src="" alt="Product preview" class="img-preview" style="display:none"
               onerror="this.style.display='none';this.getRootNode().getElementById('imgPlaceholder').style.display='block';" />
            <span class="img-placeholder" id="imgPlaceholder">No Image</span>
          </div>

          <form id="productForm" onsubmit="return false;">
            <div class="form-group">
              <label class="label" for="inputName">Product Name</label>
              <input type="text" id="inputName" class="input" required placeholder="Slim Fit Oxford Shirt" />
            </div>
            <div class="flex-row">
              <div class="form-group" style="flex:1">
                <label class="label" for="inputBrand">Brand</label>
                <input type="text" id="inputBrand" class="input" placeholder="Zara" />
              </div>
              <div class="form-group" style="flex:1">
                <label class="label" for="inputPrice">Price</label>
                <input type="text" id="inputPrice" class="input" placeholder="49.99" />
              </div>
            </div>
            <div class="flex-row">
              <div class="form-group" style="flex:1">
                <label class="label" for="inputSize">Size</label>
                <input type="text" id="inputSize" class="input" placeholder="M" />
              </div>
              <div class="form-group" style="flex:1.5">
                <label class="label" for="inputCategory">Category</label>
                <select id="inputCategory" class="input">${CATEGORY_OPTIONS}</select>
              </div>
            </div>
            <input type="hidden" id="inputLink" />
            <div class="form-group">
              <label class="label" for="inputImgUrl">Image URL</label>
              <input type="url" id="inputImgUrl" class="input" placeholder="https://…" />
            </div>
            <div class="form-group">
              <label class="label" for="inputMaterials">Materials</label>
              <input type="text" id="inputMaterials" class="input" placeholder="100% Cashmere" />
            </div>
            <div class="form-group">
              <label class="label" for="inputDescription">Description</label>
              <textarea id="inputDescription" placeholder="Optional description"></textarea>
            </div>
            <div class="checkbox-wrapper">
              <input type="checkbox" id="inputWishlist" />
              <label for="inputWishlist" class="checkbox-label">
                <span class="checkbox-title">Save to Wishlist</span>
                <span class="checkbox-desc">Item will not affect your total stats.</span>
              </label>
            </div>
            <button id="saveBtn" type="submit" class="btn btn-primary">Add to Wardrobe</button>
            <button id="addAnotherBtn" type="button" class="btn btn-secondary hidden">Scan Another</button>
            <a id="viewInAppBtn" href="https://rcapsule.com/closet" target="_blank" rel="noopener"
               class="btn btn-secondary hidden" style="text-align:center;text-decoration:none;line-height:44px;padding-top:0;padding-bottom:0;">
              View in Rcapsule ↗
            </a>
            <button id="loginBtn" type="button" class="btn btn-secondary hidden">Log in to Rcapsule ↗</button>
            <button id="cancelBtn" type="button" class="btn btn-secondary">Cancel</button>
            <div class="hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> to save · <kbd>Esc</kbd> to cancel</div>
          </form>
        </div>

        <div id="status" role="status" aria-live="polite"></div>
      </div>
    </div>
  `;

  // ── Create panel ──────────────────────────────────────────────────────────────

  function createPanel() {
    host = document.createElement('div');
    host.id = '__rcapsule-host__';
    Object.assign(host.style, {
      position:  'fixed',
      top:       '20px',
      right:     '20px',
      width:     '380px',
      zIndex:    '2147483647',
      display:   'block',
    });

    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>${HTML}`;

    document.documentElement.appendChild(host);

    setupDrag();
    setupHandlers();
    setupOfflineMonitor();
    processOfflineQueue();
  }

  // ── Drag ─────────────────────────────────────────────────────────────────────

  function setupDrag() {
    const header = q('header');

    header.addEventListener('mousedown', (e) => {
      // Don't start drag if clicking the close button
      if (e.target.closest && e.target.closest('#closeBtn')) return;
      dragging = true;
      header.classList.add('dragging');
      dStartX  = e.clientX;
      dStartY  = e.clientY;
      const rect = host.getBoundingClientRect();
      dOrigLeft  = rect.left;
      dOrigTop   = rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx  = e.clientX - dStartX;
      const dy  = e.clientY - dStartY;
      const W   = window.innerWidth;
      const H   = window.innerHeight;
      const pw  = host.offsetWidth;

      const newLeft = Math.max(0, Math.min(W - pw,  dOrigLeft + dx));
      const newTop  = Math.max(0, Math.min(H - 50, dOrigTop  + dy));

      host.style.left  = newLeft + 'px';
      host.style.top   = newTop  + 'px';
      host.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      if (root) q('header')?.classList.remove('dragging');
    });
  }

  // ── Form handlers ─────────────────────────────────────────────────────────────

  function populateForm(data) {
    const map = {
      inputName: data.name, inputBrand: data.brand, inputPrice: data.price,
      inputSize: data.size, inputLink: data.link, inputCategory: data.category,
      inputImgUrl: data.imageUrl, inputMaterials: data.materials,
      inputDescription: data.description,
    };
    for (const [id, val] of Object.entries(map)) {
      const el = q(id);
      if (el) el.value = val || '';
    }
    const img = q('previewImg');
    const ph  = q('imgPlaceholder');
    if (img && data.imageUrl) {
      img.src = data.imageUrl;
      img.style.display = 'block';
      if (ph) ph.style.display = 'none';
    } else if (img) {
      img.style.display = 'none';
      if (ph) ph.style.display = 'block';
    }
  }

  function getFormData() {
    const wishlist = q('inputWishlist')?.checked || false;
    return {
      name:         q('inputName')?.value        || '',
      brand:        q('inputBrand')?.value       || '',
      price:        q('inputPrice')?.value       || '',
      size:         q('inputSize')?.value        || '',
      link:         q('inputLink')?.value        || '',
      imageUrl:     q('inputImgUrl')?.value      || '',
      category:     q('inputCategory')?.value    || 'Uncategorized',
      status:       wishlist ? 'wishlist' : 'owned',
      purchaseDate: wishlist ? null : new Date().toISOString().split('T')[0],
      materials:    q('inputMaterials')?.value   || '',
      description:  q('inputDescription')?.value || '',
    };
  }

  function setupHandlers() {
    q('closeBtn').addEventListener('click', () => togglePanel());
    q('scanBtn').addEventListener('click', scanPage);
    q('saveBtn').addEventListener('click', saveProduct);
    q('cancelBtn').addEventListener('click', () => { switchView('scanView'); setStatus(''); });
    q('inputImgUrl').addEventListener('input', () => {
      const url = q('inputImgUrl').value.trim();
      const img = q('previewImg');
      const ph  = q('imgPlaceholder');
      if (url) {
        img.src = url;
        img.style.display = 'block';
        if (ph) ph.style.display = 'none';
      } else {
        img.style.display = 'none';
        if (ph) ph.style.display = 'block';
      }
    });
    q('manualBtn').addEventListener('click', () => {
      populateForm({ name:'', brand:'', price:'', size:'', link: window.location.href,
                     imageUrl:'', category:'Uncategorized', materials:'', description:'' });
      switchView('formView');
      setStatus('');
    });
    q('addAnotherBtn').addEventListener('click', () => resetToScanView());
    q('loginBtn').addEventListener('click', () => {
      window.open('https://rcapsule.com/login', '_blank', 'noopener');
    });

    // Keyboard shortcuts inside the shadow root
    root.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!q('formView').classList.contains('hidden')) {
          e.preventDefault();
          saveProduct();
        }
      }
      if (e.key === 'Escape') {
        if (!q('formView').classList.contains('hidden')) {
          e.preventDefault();
          switchView('scanView');
          setStatus('');
        }
      }
    });
  }

  // ── Scan ──────────────────────────────────────────────────────────────────────

  function isProductPage() {
    const path = window.location.pathname;
    const href = window.location.href;
    return (
      path.includes('/product') ||
      path.includes('/p/') ||
      path.includes('/item') ||
      path.includes('/dp/') ||
      href.includes('pdp') ||
      !!document.querySelector('[data-testid*="product"]') ||
      !!document.querySelector('script[type="application/ld+json"]')
    );
  }

  function showManualBtn() {
    const btn = q('manualBtn');
    if (btn) btn.classList.remove('hidden');
  }

  function resetToScanView() {
    const manualBtn    = q('manualBtn');
    const addAnotherBtn = q('addAnotherBtn');
    const viewInAppBtn = q('viewInAppBtn');
    const loginBtn     = q('loginBtn');
    const saveBtn      = q('saveBtn');
    const cancelBtn    = q('cancelBtn');
    if (manualBtn)     manualBtn.classList.add('hidden');
    if (addAnotherBtn) addAnotherBtn.classList.add('hidden');
    if (viewInAppBtn)  viewInAppBtn.classList.add('hidden');
    if (loginBtn)      loginBtn.classList.add('hidden');
    if (saveBtn)       { saveBtn.disabled = false; saveBtn.textContent = 'Add to Wardrobe'; saveBtn.classList.remove('hidden'); }
    if (cancelBtn)     cancelBtn.classList.remove('hidden');
    switchView('scanView');
    setStatus('');
  }

  async function scanPage() {
    setStatus('Scanning...', 'loading');
    const manualBtn = q('manualBtn');
    if (manualBtn) manualBtn.classList.add('hidden');

    const hostname = window.location.hostname;
    if (isUnsupported(hostname)) {
      setStatus("This doesn't look like a clothing store.", 'error');
      showManualBtn();
      return;
    }

    // Check cache first
    const cached = await Store.getCached(window.location.href);
    if (cached) {
      const s = sanitize(cached);
      s.category = detectCategory(s.name);
      if (ACCESSORIES.includes(s.category.toLowerCase())) s.size = 'O/S';
      populateForm(s);
      switchView('formView');
      setStatus('Loaded from cache.', 'success');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    try {
      const data = await extractProductData();

      if (!data?.name) {
        setStatus('Could not find product details.', 'error');
        showManualBtn();
        return;
      }

      const s = sanitize(data);
      s.category = detectCategory(s.name);
      if (ACCESSORIES.includes(s.category.toLowerCase())) s.size = 'O/S';

      await Store.saveRecent(s);
      populateForm(s);
      switchView('formView');
      setStatus('');
    } catch (err) {
      console.error('Rcapsule scan error:', err);
      setStatus('Error scanning page.', 'error');
      showManualBtn();
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  async function saveProduct() {
    const btn = q('saveBtn');
    if (!btn) return;
    btn.disabled    = true;
    btn.textContent = 'Saving...';
    setStatus('', '');

    const data = getFormData();

    if (!navigator.onLine) {
      await Store.queueOffline(data);
      setStatus('Saved offline. Will sync when online.', 'success');
      btn.textContent = 'Saved Offline';
      return;
    }

    const rate = await Store.checkRate();
    if (!rate.allowed) {
      const wait = Math.ceil((rate.resetTime - Date.now()) / 1000);
      setStatus(`Rate limit reached. Try again in ${wait}s.`, 'error');
      btn.disabled    = false;
      btn.textContent = 'Add to Wardrobe';
      return;
    }

    try {
      await Store.recordRequest();

      // Relay through background service worker (avoids CORS issues)
      const result = await chrome.runtime.sendMessage({ action: 'API_IMPORT', data });

      if (result.ok) {
        setStatus('Saved to wardrobe.', 'success');
        btn.textContent = 'Saved ✓';
        btn.classList.add('hidden');
        q('cancelBtn')?.classList.add('hidden');
        q('addAnotherBtn')?.classList.remove('hidden');
        q('viewInAppBtn')?.classList.remove('hidden');
      } else if (result.status === 401) {
        setStatus('Not logged in.', 'error');
        btn.disabled    = false;
        btn.textContent = 'Add to Wardrobe';
        q('loginBtn')?.classList.remove('hidden');
      } else {
        throw new Error(result.body?.message || result.body?.error || 'Save failed');
      }
    } catch (err) {
      if (!navigator.onLine) {
        await Store.queueOffline(data);
        setStatus('Saved offline. Will sync when online.', 'success');
        btn.textContent = 'Saved Offline';
        return;
      }
      setStatus(`Error: ${err.message}`, 'error');
      btn.disabled    = false;
      btn.textContent = 'Add to Wardrobe';
    }
  }

  // ── Offline queue ─────────────────────────────────────────────────────────────

  async function processOfflineQueue() {
    if (!navigator.onLine) return;
    const queue = await Store.getOffline();
    if (!queue.length) return;

    for (const item of queue) {
      try {
        const result = await chrome.runtime.sendMessage({ action: 'API_IMPORT', data: item.data });
        if (!result.ok) break;
      } catch { break; }
    }
    await Store.clearOffline();
  }

  // ── Online/offline monitor ────────────────────────────────────────────────────

  function setupOfflineMonitor() {
    const badge = q('offlineBadge');
    const update = () => {
      if (!badge) return;
      badge.style.display = navigator.onLine ? 'none' : 'inline';
    };
    window.addEventListener('online',  () => { update(); processOfflineQueue(); });
    window.addEventListener('offline', update);
    update();
  }

  // ── Toggle visibility ─────────────────────────────────────────────────────────

  function togglePanel() {
    if (!host) {
      createPanel();
      visible = true;
      // Auto-scan if this looks like a product page
      if (isProductPage()) setTimeout(scanPage, 100);
    } else {
      visible = !visible;
      host.style.display = visible ? 'block' : 'none';
    }
  }

  // ── Product data extraction ───────────────────────────────────────────────────
  // Runs directly in the content script — no executeScript needed.

  async function extractProductData() {
    const data = {
      name: '', brand: '', price: '', imageUrl: '',
      link: window.location.href, size: '', materials: '', description: '',
    };

    const hostname = window.location.hostname;

    // JSON-LD
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const json = JSON.parse(script.textContent);
        const list = Array.isArray(json) ? json : [json];
        const prod = list.find((p) => p['@type'] === 'Product');
        if (prod) {
          if (prod.name)  data.name  = prod.name;
          if (prod.brand) data.brand = typeof prod.brand === 'object' ? prod.brand.name : prod.brand;
          if (prod.offers) {
            const o = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
            if (o?.price) data.price = String(o.price);
          }
        }
      } catch {}
    }

    // Nike
    if (hostname.includes('nike')) {
      const t = document.querySelector('meta[property="og:title"]');
      if (t) data.name = t.content.trim();
      const s = document.querySelector('[data-testid="pdp-grid-selector-item-selected"] input');
      if (s?.value) data.size = s.value;
    }

    // The RealReal
    if (hostname.includes('therealreal')) {
      const p = document.querySelector('[data-testid="product-price/final"]');
      if (p) data.price = p.textContent.replace(/- Price:\s*/i, '').replace(/[^0-9.]/g, '').trim();
      const s = document.querySelector('[data-testid="product-size"]');
      if (s) data.size = s.textContent.replace(/^Size:\s*/i, '').trim();
      const i = document.querySelector('img[data-zoom]');
      if (i?.dataset.zoom) data.imageUrl = i.dataset.zoom;
    }

    // Grailed
    if (hostname.includes('grailed')) {
      const m = document.querySelector('p[class*="Details_metadata"]');
      if (m?.firstChild) data.size = m.firstChild.textContent.trim();
    }

    // Uniqlo
    if (hostname.includes('uniqlo')) {
      const t = document.querySelector('meta[property="og:title"]');
      if (t) data.name = t.content.trim();
      const c = document.querySelector('.size-chip-selected');
      if (c) data.size = c.textContent.trim();
    }

    // H&M
    if (hostname.includes('hm')) {
      const n = document.querySelector('h1[data-testid="product-name"]');
      if (n) {
        data.name = n.textContent.trim();
      } else {
        const t = document.querySelector('meta[property="og:title"]');
        data.name = t ? t.content.trim() : document.title.split('|')[0].trim();
      }
      const rp = document.querySelector('[data-testid="red-price"]');
      const wp = document.querySelector('[data-testid="white-price"]');
      data.price = (rp || wp)?.textContent.trim().replace(/[^0-9.]/g, '') || '';
      const ss = document.querySelector('[id^="sizeButton"][aria-checked="true"]');
      if (ss) data.size = ss.textContent.trim();
      const img = document.querySelector('img[alt^="View larger image"][alt$=" 5"]')
                || document.querySelector('img[alt^="View larger image"]');
      if (img) {
        let u = img.currentSrc || img.src;
        if (u.includes('imwidth=')) u = u.replace(/imwidth=\d+/, 'imwidth=2160');
        data.imageUrl = u;
      }
    }

    // Aritzia
    if (hostname.includes('aritzia')) {
      // Name — data-testid="product-name-text" is the actual h1 testid
      if (!data.name) {
        const pn = document.querySelector('[data-testid="product-name-text"]')
                || document.querySelector('h1');
        if (pn) data.name = pn.textContent.trim().split('\n')[0].trim();
      }

      // Brand — "Aritzia" or sub-brand label above the name
      if (!data.brand) {
        const pb = document.querySelector('[data-testid="product-brand-text"]');
        if (pb) data.brand = pb.textContent.trim();
      }

      // Price — list price element
      if (!data.price) {
        const pp = document.querySelector('[data-testid="product-list-price-text"]')
                || document.querySelector('[data-testid="product-price-text"] p');
        if (pp) data.price = pp.textContent.replace(/[^0-9.]/g, '').trim();
      }

      // Description
      const dc = document.querySelector('[data-testid="product-description"]');
      if (dc) {
        const ps = Array.from(dc.querySelectorAll('p'))
          .filter((p) => !p.closest('button'))
          .map((p) => p.textContent.trim())
          .filter(Boolean);
        if (ps.length) {
          data.description = ps.join('\n\n');
        } else {
          const clone = dc.cloneNode(true);
          clone.querySelectorAll('button').forEach((b) => b.remove());
          data.description = clone.textContent.trim();
        }
      }

      // Materials — click "Details" accordion if present
      const detBtn = document.querySelector('button[data-testid="details-link"]');
      if (detBtn) {
        detBtn.click();
        await wait(500);
        const ml = document.querySelector('ul[data-testid="materials-and-care-copy"]');
        if (ml) {
          const ci = Array.from(ml.querySelectorAll('li')).find((li) => li.textContent.includes('Content:'));
          if (ci) data.materials = ci.textContent.replace('Content:', '').trim();
        }
      }

      // Size — custom dropdown: button#dropdown inside pdp-size-dropdown shows selected size
      if (!data.size) {
        const sizeBtn = document.querySelector('[data-testid="pdp-size-dropdown"] button[aria-haspopup="true"] p');
        if (sizeBtn) {
          data.size = sizeBtn.textContent.replace(/^Size\s*/i, '').trim();
        }
      }
      // Fallback: old size-palette pattern
      if (!data.size) {
        const sb = document.querySelector('div[data-testid="size-palette"] button[aria-checked="true"]');
        if (sb) data.size = sb.textContent.trim();
      }

      // Color — aria-pressed="true" on color swatch button; aria-label is the colour name
      const selectedSwatch = document.querySelector(
        '[data-testid="pdp-colour-swatches"] button[aria-pressed="true"]'
      );
      const colorName = selectedSwatch?.getAttribute('aria-label')?.trim();
      if (colorName && data.name && !data.name.toLowerCase().includes(colorName.toLowerCase())) {
        // Convert "LIGHT BIRCH" → "Light Birch" for nicer display
        const pretty = colorName.charAt(0) + colorName.slice(1).toLowerCase();
        data.name = `${data.name} — ${pretty}`;
      }
    }

    // Lululemon
    if (hostname.includes('lululemon')) {
      const h1 = document.querySelector('h1');
      if (h1) data.name = h1.innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (!data.name) data.name = document.title.split('|')[0].trim();
      const mls = document.querySelectorAll('dl[class*="material-and-care"]');
      if (mls.length) {
        data.materials = Array.from(mls).map((dl) => {
          const label = dl.querySelector('dt')?.textContent.trim() || '';
          const vals  = Array.from(dl.querySelectorAll('dd')).map((d) => d.textContent.trim()).join(' ');
          return `${label} ${vals}`;
        }).join('; ').trim();
      }
    }

    // Generic name fallback — h1, then og:title, then document.title
    if (!data.name) {
      const h1 = document.querySelector('h1');
      if (h1) data.name = h1.innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (!data.name) {
      const og = document.querySelector('meta[property="og:title"]');
      if (og) data.name = og.content.split('|')[0].split('-')[0].trim();
    }
    if (!data.name) {
      data.name = document.title.split('|')[0].split('-')[0].trim();
    }

    // Generic brand fallback
    if (!data.brand) {
      const sn = document.querySelector('meta[property="og:site_name"]')?.content;
      data.brand = sn || hostname.replace('www.', '').split('.')[0];
      data.brand = data.brand.charAt(0).toUpperCase() + data.brand.slice(1);
    }

    // Generic price fallback — layered from most to least reliable
    if (!data.price) {
      // 1. Open Graph / Facebook meta tags
      const ogp = document.querySelector('meta[property="og:price:amount"]')
               || document.querySelector('meta[property="product:price:amount"]');
      if (ogp) data.price = ogp.content.replace(/[^0-9.]/g, '');
    }
    if (!data.price) {
      // 2. Schema.org itemprop — prefer content attribute over text
      const ip = document.querySelector('[itemprop="price"]');
      if (ip) {
        const raw = ip.getAttribute('content') || ip.textContent;
        const m   = raw?.match(/[\d,]+\.?\d*/);
        if (m) data.price = m[0].replace(/,/g, '');
      }
    }
    if (!data.price) {
      // 3. data-price attribute
      const dp = document.querySelector('[data-price]');
      if (dp) {
        const m = dp.getAttribute('data-price').match(/[\d,]+\.?\d*/);
        if (m) data.price = m[0].replace(/,/g, '');
      }
    }
    if (!data.price) {
      // 4. Leaf elements whose entire text matches a price pattern ($X or $X.XX)
      const priceRe = /^\$?\s*(\d{1,5}(?:[.,]\d{2})?)$/;
      const candidates = document.querySelectorAll(
        '[class*="price" i] span, [class*="price" i] p, [id*="price" i] span, [id*="price" i] p, span.money-amount__main'
      );
      for (const el of candidates) {
        const text = el.textContent.trim();
        const m    = text.match(priceRe);
        if (m) { data.price = m[1].replace(/,/g, ''); break; }
      }
    }
    if (!data.price) {
      // 5. Any element with a $XX.XX pattern as its sole content
      const priceRe = /^\$?\s*(\d{1,5}[.,]\d{2})$/;
      for (const el of document.querySelectorAll('span, p, div')) {
        if (el.children.length > 0) continue; // leaf only
        const m = el.textContent.trim().match(priceRe);
        if (m) { data.price = m[1].replace(/,/g, ''); break; }
      }
    }

    // Generic size fallback — layered from most to least reliable
    if (!data.size) {
      // 1. URL parameter
      try {
        for (const [k, v] of new URLSearchParams(window.location.search)) {
          if (/^s(ize|z)$/i.test(k) || k.toLowerCase() === 'size') {
            data.size = decodeURIComponent(v); break;
          }
        }
      } catch {}
    }
    if (!data.size) {
      // 2. Schema.org itemprop
      const ip = document.querySelector('[itemprop="size"]');
      if (ip) data.size = ip.getAttribute('content') || ip.textContent.trim();
    }
    if (!data.size) {
      // 3. Any <select> whose name/id/aria-label mentions "size"
      const sel = document.querySelector(
        'select[name*="size" i], select[id*="size" i], select[aria-label*="size" i]'
      );
      if (sel) {
        const opt = sel.options[sel.selectedIndex];
        if (opt && !opt.disabled && opt.value && opt.value !== '') {
          let t = opt.textContent.trim();
          t = t.includes('=') ? t.split('=')[1].trim() : t;
          data.size = t.split(' -')[0].trim();
        }
      }
    }
    if (!data.size) {
      // 4. Checked / selected / active button near a "Size" heading
      const sizeLabel = Array.from(document.querySelectorAll('h2,h3,h4,legend,label,span,p')).find(
        (el) => /^\s*size[s]?\s*[:/]?\s*$/i.test(el.textContent) && el.textContent.length < 20
      );
      const sizeContainer = sizeLabel?.closest('section, fieldset, div[class*="size" i], div[id*="size" i]')
                         || sizeLabel?.parentElement;
      if (sizeContainer) {
        const active = sizeContainer.querySelector(
          'button[aria-checked="true"], button[aria-selected="true"], button[aria-pressed="true"], ' +
          'input[type="radio"]:checked, .selected, .active'
        );
        if (active) data.size = (active.getAttribute('data-value') || active.textContent).trim();
      }
    }
    if (!data.size) {
      // 5. Any checked radio or aria-checked button whose value looks like a size
      const sizeRe = /^(XXS|XS|S|M|L|XL|XXL|2XL|3XL|\d{1,2}[.,]?\d{0,2}|\d{1,2}W?\s*[x\/]\s*\d{1,2}L?)$/i;
      const checked = document.querySelectorAll(
        'button[aria-checked="true"], button[aria-selected="true"], input[type="radio"]:checked'
      );
      for (const el of checked) {
        const val = (el.getAttribute('data-value') || el.getAttribute('value') || el.textContent).trim();
        if (sizeRe.test(val)) { data.size = val; break; }
      }
    }
    if (data.size) data.size = data.size.replace(/chevron|down|arrow/gi, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Generic color fallback
    if (data.name && !data.name.includes(' — ')) {
      for (const el of document.querySelectorAll('span, p, div, label')) {
        const m = el.textContent.trim().match(/^Colou?r:\s*(.+)$/i);
        if (m && m[1].length < 40 && !m[1].includes('\n')) {
          data.name = `${data.name} — ${m[1].trim()}`;
          break;
        }
      }
    }

    // Image fallback helpers
    const bestSrc = (img) => {
      if (!img) return null;
      const ss = img.srcset || img.dataset.srcset;
      if (ss) return ss.split(/,\s+/).pop().trim().split(' ')[0];
      const s = img.src || img.dataset.src;
      return s && !s.startsWith('data:') ? s : null;
    };

    if (hostname.includes('ssense') && !data.imageUrl) {
      const i = document.querySelector('img.product-detail-new') || document.querySelector('img[data-test="product-image"]');
      if (i) data.imageUrl = bestSrc(i);
    }
    if (hostname.includes('aritzia') && !data.imageUrl) {
      const ol = document.querySelector('a[href*="_off_"]');
      const oi = document.querySelector('img[src*="_off_"]');
      data.imageUrl = ol?.href || oi?.src || data.imageUrl;
    }
    if (hostname.includes('zara') && !data.imageUrl) {
      let cs = Array.from(document.querySelectorAll('.media-image__image'));
      if (!cs.length) cs = Array.from(document.querySelectorAll('img'));
      const score = (img) => {
        let s = 0;
        if ((img.alt || '').toLowerCase().includes('front view')) s += 10;
        if ((img.src || '').includes('-e1.')) s += 5;
        if ((img.src || '').includes('-p.')) s -= 2;
        if ((img.naturalWidth || 0) < 200) s -= 10;
        return s;
      };
      cs.sort((a, b) => score(b) - score(a));
      if (cs[0]) {
        data.imageUrl = cs[0].src.split('?')[0];
        if (cs[0].srcset) {
          const srcs = cs[0].srcset.split(',').map((s) => s.trim().split(' ')[0]);
          if (srcs.length) data.imageUrl = srcs[srcs.length - 1].split('?')[0];
        }
      }
    }
    if (!data.imageUrl) {
      const i = document.querySelector('.product-detail-images__image-container img')
              || document.querySelector('.media-image__image');
      if (i) data.imageUrl = bestSrc(i);
    }
    if (!data.imageUrl) {
      const large = Array.from(document.querySelectorAll('img')).find((i) => {
        return (i.naturalWidth > 300 || i.width > 300) && bestSrc(i);
      });
      if (large) data.imageUrl = bestSrc(large);
    }
    if (data.imageUrl) {
      if (data.imageUrl.startsWith('//')) data.imageUrl = 'https:' + data.imageUrl;
      if (data.imageUrl.includes(' '))   data.imageUrl = data.imageUrl.split(' ')[0];
    }

    return data;
  }

  // ── Message listener ──────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'TOGGLE_PANEL') togglePanel();
    if (msg.action === 'SCAN_PAGE'   ) { if (!visible) togglePanel(); scanPage(); }
  });

})();
