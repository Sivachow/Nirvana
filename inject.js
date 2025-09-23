// inject.js — runs in PAGE context to intercept API calls
(() => {
  'use strict';
  
  if (window.__nirvanaTokenInterceptor) return;
  window.__nirvanaTokenInterceptor = true;

  const originalFetch = window.fetch;
  
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    
    if (url && url.includes('/api/everything')) {
      try {
        const parsedUrl = new URL(url, location.origin);
        const token = parsedUrl.searchParams.get('authtoken');
        
        if (token) {
          window.postMessage({
            source: 'nirvana-mcp',
            type: 'authtoken',
            authtoken: token
          }, '*');
        }
      } catch (error) {
        console.warn('[Nirvana MCP] Token extraction failed:', error);
      }
    }
    
    return originalFetch.apply(this, arguments);
  };
})();