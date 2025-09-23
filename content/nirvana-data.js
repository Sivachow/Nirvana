// nirvana-data.js - Data caching and query utilities
class NirvanaDataManager {
  constructor(tokenManager) {
    this.tokenManager = tokenManager || window.__nirvanaTokenManager;
    this.cache = null;
    this.lastFetch = 0;
    this.ttlMs = 5 * 60 * 1000; // 5 minutes
  }

  async getData(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cache && (now - this.lastFetch) < this.ttlMs) {
      return this.cache;
    }
    if (!this.tokenManager?.api?.authToken) {
      throw new Error('Auth token not available');
    }
    const data = await this.tokenManager.fetchData('0');
    this.cache = data;
    this.lastFetch = now;
    return data;
  }

  clearCache() { this.cache = null; this.lastFetch = 0; }

  getDataByType(type) {
    if (!this.cache) return [];
    return (this.cache[type + 's'] || []).concat(this.cache[type] || []);
  }

  searchTasks(query) {
    if (!query) return [];
    const tasks = this.getDataByType('task');
    const q = query.toLowerCase();
    return tasks.filter(t => (t.name || '').toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q));
  }

  getTasksByState(stateName) {
    const map = { inbox:0, next:1, waiting:2, scheduled:3, someday:4, active:1 };
    const target = map[stateName?.toLowerCase()];
    if (target === undefined) return [];
    return this.getDataByType('task').filter(t => t.state === target);
  }
}

window.NirvanaDataManager = NirvanaDataManager;