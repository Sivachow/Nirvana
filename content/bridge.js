if (!window.__nirvanaBridge) {
  window.__nirvanaBridge = true;

  // Initialize token manager for API access
  let tokenManager = null;
  let dataManager = null;
  
  // Wait for dependencies to load
  const initTokenManager = () => {
    try {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.warn('[Nirvana MCP] Extension context invalidated, skipping token manager init');
        return;
      }

      if (window.TokenManager && !tokenManager) {
        tokenManager = new TokenManager();
        window.__nirvanaTokenManager = tokenManager;
      }
      if (window.NirvanaDataManager && tokenManager && !dataManager) {
        dataManager = new NirvanaDataManager(tokenManager);
        window.__nirvanaDataManager = dataManager;
      }
    } catch (error) {
      console.warn('[Nirvana MCP] Token manager initialization failed (likely due to page transition):', error.message);
    }
  };

  // Try immediate initialization
  initTokenManager();

  // Fallback: wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTokenManager);
  }

  chrome.runtime?.onMessage.addListener((msg) => {
    if (msg?.type === "toggle") window.__nirvanaSpotlight?.toggle();
  });

  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key === "k" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      window.__nirvanaSpotlight?.toggle();
    }
  });

  // Listen for Nirvana data updates
  document.addEventListener('nirvanadata', (event) => {
    console.log('[Nirvana MCP] Data received:', event.detail);
    // You can process the data here or pass it to other components
  });
}