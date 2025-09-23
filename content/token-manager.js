// token-manager.js - Token capture and management
class TokenManager {
  constructor() {
    this.api = new NirvanaAPI();
    this.isInjected = false;
    this.init();
  }

  /**
   * Initialize the token manager
   */
  init() {
    this.injectScript();
    this.setupMessageListener();
    this.loadStoredToken();
  }

  /**
   * Inject the token interceptor script into the page
   */
  injectScript() {
    if (this.isInjected) return;
    
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('inject.js');
      (document.documentElement || document.head).appendChild(script);
      script.remove(); // Clean up after injection
      this.isInjected = true;
    } catch (error) {
      console.error('[Nirvana MCP] Script injection failed:', error);
    }
  }

  /**
   * Set up message listener for token capture
   */
  setupMessageListener() {
    window.addEventListener('message', async (event) => {
      if (event.data?.source !== 'nirvana-mcp' || 
          event.data?.type !== 'authtoken' || 
          !event.data.authtoken) {
        return;
      }

      await this.handleTokenReceived(event.data.authtoken);
    }, false);
  }

  /**
   * Handle received auth token
   * @param {string} token - The captured auth token
   */
  async handleTokenReceived(token) {
    try {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.warn('[Nirvana MCP] Extension context invalidated, skipping token handling');
        return;
      }

      // Store token with timeout to prevent hanging
      const storagePromise = chrome.storage.local.set({ authtoken: token });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Storage timeout')), 5000)
      );
      
      await Promise.race([storagePromise, timeoutPromise]);
      this.api.setAuthToken(token);
      
      console.log('[Nirvana MCP] Token captured and stored');
      
      // Fetch initial data only if context is still valid
      if (chrome.runtime?.id) {
        await this.fetchData();
      }
    } catch (error) {
      // Don't log extension context errors as they're expected during page transitions
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('Storage timeout')) {
        console.warn('[Nirvana MCP] Context invalidated during token handling (normal during page refresh)');
      } else {
        console.error('[Nirvana MCP] Token handling failed:', error);
      }
    }
  }

  /**
   * Load previously stored token
   */
  async loadStoredToken() {
    try {
      // Check if extension context is valid before accessing storage
      if (!chrome.runtime?.id) {
        console.warn('[Nirvana MCP] Extension context not available for token loading');
        return;
      }

      const result = await chrome.storage.local.get(['authtoken']);
      if (result.authtoken) {
        this.api.setAuthToken(result.authtoken);
        console.log('[Nirvana MCP] Stored token loaded');
      }
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.warn('[Nirvana MCP] Context invalidated during token loading (normal during page refresh)');
      } else {
        console.error('[Nirvana MCP] Failed to load stored token:', error);
      }
    }
  }

  /**
   * Fetch data from Nirvana API
   * @param {string} since - Optional timestamp to fetch from
   */
  async fetchData(since = '0') {
    try {
      const data = await this.api.fetchEverything(since);

      // Dispatch custom event with the data
      const event = new CustomEvent('nirvanadata', { detail: data });
      document.dispatchEvent(event);
      
      return data;
    } catch (error) {
      console.error('[Nirvana MCP] Data fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get current auth token
   * @returns {string|null} Current auth token
   */
  getAuthToken() {
    return this.api.authToken;
  }

  /**
   * Clear stored token
   */
  async clearToken() {
    try {
      // Check if extension context is valid
      if (!chrome.runtime?.id) {
        console.warn('[Nirvana MCP] Extension context not available for token clearing');
        return;
      }

      await chrome.storage.local.remove(['authtoken']);
      this.api.setAuthToken(null);
      console.log('[Nirvana MCP] Token cleared');
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.warn('[Nirvana MCP] Context invalidated during token clearing');
      } else {
        console.error('[Nirvana MCP] Failed to clear token:', error);
      }
    }
  }
}

// Make available globally
window.TokenManager = TokenManager;