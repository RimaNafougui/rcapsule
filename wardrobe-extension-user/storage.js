// ============================================================================
// STORAGE MANAGER
// Handles local storage, caching, and rate limiting
// ============================================================================

const StorageManager = {
  // Storage keys
  KEYS: {
    RECENT_SCANS: "recent_scans",
    RATE_LIMIT: "rate_limit_data",
    SETTINGS: "user_settings",
    OFFLINE_QUEUE: "offline_queue",
  },

  // Configuration
  CONFIG: {
    MAX_RECENT_SCANS: 10,
    RATE_LIMIT_WINDOW: 60000, // 1 minute in ms
    MAX_REQUESTS_PER_WINDOW: 10,
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  },

  /**
   * Save recent scan to storage
   * @param {Object} productData - Product data to cache
   */
  async saveRecentScan(productData) {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RECENT_SCANS);
      let recentScans = result[this.KEYS.RECENT_SCANS] || [];

      // Add timestamp and unique ID
      const scanEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        data: productData,
        url: productData.link,
      };

      // Add to beginning of array
      recentScans.unshift(scanEntry);

      // Keep only MAX_RECENT_SCANS
      recentScans = recentScans.slice(0, this.CONFIG.MAX_RECENT_SCANS);

      await chrome.storage.local.set({
        [this.KEYS.RECENT_SCANS]: recentScans,
      });

      return true;
    } catch (error) {
      console.error("Error saving recent scan:", error);
      return false;
    }
  },

  /**
   * Get recent scans from storage
   * @returns {Array} Array of recent scans
   */
  async getRecentScans() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RECENT_SCANS);
      return result[this.KEYS.RECENT_SCANS] || [];
    } catch (error) {
      console.error("Error getting recent scans:", error);
      return [];
    }
  },

  /**
   * Check if scan exists in cache (by URL)
   * @param {string} url - Product URL
   * @returns {Object|null} Cached product data or null
   */
  async getCachedScan(url) {
    try {
      const recentScans = await this.getRecentScans();
      const cached = recentScans.find((scan) => scan.url === url);

      if (cached) {
        // Check if cache is still valid
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

  /**
   * Clear recent scans
   */
  async clearRecentScans() {
    try {
      await chrome.storage.local.remove(this.KEYS.RECENT_SCANS);
      return true;
    } catch (error) {
      console.error("Error clearing recent scans:", error);
      return false;
    }
  },

  /**
   * Rate limiting: Check if request is allowed
   * @returns {Object} { allowed: boolean, remainingRequests: number, resetTime: number }
   */
  async checkRateLimit() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RATE_LIMIT);
      const rateLimitData = result[this.KEYS.RATE_LIMIT] || {
        requests: [],
        windowStart: Date.now(),
      };

      const now = Date.now();
      const windowStart = rateLimitData.windowStart;

      // Check if we're in a new window
      if (now - windowStart > this.CONFIG.RATE_LIMIT_WINDOW) {
        // Reset window
        rateLimitData.requests = [];
        rateLimitData.windowStart = now;
      }

      // Filter out old requests
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

      return {
        allowed,
        remainingRequests,
        resetTime,
        currentCount: requestCount,
      };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      return {
        allowed: true,
        remainingRequests: this.CONFIG.MAX_REQUESTS_PER_WINDOW,
      };
    }
  },

  /**
   * Rate limiting: Record a request
   */
  async recordRequest() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.RATE_LIMIT);
      const rateLimitData = result[this.KEYS.RATE_LIMIT] || {
        requests: [],
        windowStart: Date.now(),
      };

      rateLimitData.requests.push(Date.now());

      await chrome.storage.local.set({
        [this.KEYS.RATE_LIMIT]: rateLimitData,
      });

      return true;
    } catch (error) {
      console.error("Error recording request:", error);
      return false;
    }
  },

  /**
   * Add item to offline queue
   * @param {Object} productData - Product data to queue
   */
  async addToOfflineQueue(productData) {
    try {
      const result = await chrome.storage.local.get(this.KEYS.OFFLINE_QUEUE);
      let queue = result[this.KEYS.OFFLINE_QUEUE] || [];

      queue.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        data: productData,
      });

      await chrome.storage.local.set({
        [this.KEYS.OFFLINE_QUEUE]: queue,
      });

      return true;
    } catch (error) {
      console.error("Error adding to offline queue:", error);
      return false;
    }
  },

  /**
   * Get offline queue
   * @returns {Array} Queued items
   */
  async getOfflineQueue() {
    try {
      const result = await chrome.storage.local.get(this.KEYS.OFFLINE_QUEUE);
      return result[this.KEYS.OFFLINE_QUEUE] || [];
    } catch (error) {
      console.error("Error getting offline queue:", error);
      return [];
    }
  },

  /**
   * Clear offline queue
   */
  async clearOfflineQueue() {
    try {
      await chrome.storage.local.remove(this.KEYS.OFFLINE_QUEUE);
      return true;
    } catch (error) {
      console.error("Error clearing offline queue:", error);
      return false;
    }
  },

  /**
   * Get storage usage stats
   * @returns {Object} Storage statistics
   */
  async getStorageStats() {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      const all = await chrome.storage.local.get(null);

      return {
        bytesInUse,
        itemCount: Object.keys(all).length,
        recentScansCount: (all[this.KEYS.RECENT_SCANS] || []).length,
        offlineQueueCount: (all[this.KEYS.OFFLINE_QUEUE] || []).length,
      };
    } catch (error) {
      console.error("Error getting storage stats:", error);
      return null;
    }
  },
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageManager;
}
