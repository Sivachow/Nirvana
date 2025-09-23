// nirvana-api.js - Modular Nirvana API handler
class NirvanaAPI {
    constructor() {
        this.baseUrl = 'https://gc-api.nirvanahq.com/api';
        this.authToken = null;
        this.testCounter = 1; // Counter for test tasks
    }

    /**
     * Set the authentication token
     * @param {string} token - The auth token
     */
    setAuthToken(token) {
        this.authToken = token;
    }

    /**
     * Build URL with required parameters
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Additional parameters
     * @returns {string} Complete URL
     */
    buildUrl(endpoint, params = {}) {
        if (!this.authToken) {
            throw new Error('Auth token not set');
        }

        const now = Math.floor(Date.now() / 1000);
        const url = new URL(`${this.baseUrl}/${endpoint}`);

        const defaultParams = {
            authtoken: this.authToken,
            appid: 'com.nirvanahq.focus',
            appversion: '3.10.4',
            clienttime: String(now),
            servertime: String(now),
            requestid: crypto.randomUUID()
        };

        Object.assign(defaultParams, params);

        for (const [key, value] of Object.entries(defaultParams)) {
            url.searchParams.set(key, value);
        }

        return url.toString();
    }

    /**
     * Fetch everything from Nirvana
     * @param {string} since - Timestamp to fetch from (default: '0')
     * @returns {Promise<Object>} API response data
     */
    async fetchEverything(since = '0') {
        try {
            const url = this.buildUrl('everything', {
                return: 'everything',
                since: since
            });

            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[Nirvana MCP] Fetch failed:', error);
            throw error;
        }
    }

    /**
     * Add a task to Nirvana
     * @param {string} name - Task name/description
     * @param {string} note - Task notes (optional)
     * @param {string} list - List to add to: 'inbox', 'next', 'waiting', 'scheduled', 'someday' (default: 'next')
     * @param {boolean} focus - Whether to add to Focus (default: false)
     * @returns {Promise<Object>} API response data
     */
    async addTask(name, note = '', list = 'next', focus = false, taskId) {
        if (!name) throw new Error('Task name is required');

        const now = Math.floor(Date.now() / 1000);

        const stateMap = { inbox: 0, next: 1, waiting: 2, scheduled: 3, someday: 4 };
        const normalizedList = (list || 'next').toLowerCase();
        const state = stateMap[normalizedList] ?? 1; // Default to 'next'

        const taskPayload = [{
            method: 'task.save',
            id: taskId || crypto.randomUUID(),
            type: 0,
            cancelled: false,
            completed: false,
            deleted: false,
            duedate: '',
            energy: 0,
            etime: 0,
            name,
            note,
            parentid: '',
            ps: 0,
            seq: 1,
            seqp: 0,
            seqt: 0,
            startdate: '',
            state,
            waitingfor: ''
        }];

        try {
            const url = this.buildUrl('everything', {
                return: 'everything',
                since: String(now - 1)
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskPayload)
            });
            console.log(response);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('[Nirvana MCP] Task added:', name);
            return result;
        } catch (error) {
            console.error('[Nirvana MCP] Add task failed:', error);
            throw error;
        }
    }

    /**
     * Add a project to Nirvana
     * @param {string} name - Project name
     * @param {string} note - Project notes (optional)
     * @param {string} tags - Project tags (optional, comma-separated)
     * @param {string} parentid - Parent project ID (optional)
     * @param {number} state - Project state (default: 11 for active)
     * @returns {Promise<Object>} API response data
     */
    async addProject(name, note = '', parentid = '', state = 11) {
        if (!name) throw new Error('Project name is required');

        const now = Math.floor(Date.now() / 1000);
        const projectId = crypto.randomUUID();
        const projectPayload = [{
            method: 'task.save',
            id: projectId,
            type: 1,
            parentid: parentid || '',
            cancelled: false,
            completed: false,
            deleted: false,
            state, // single authoritative state property
            duedate: '',
            energy: 0,
            etime: 0,
            name,
            note,
            ps: 0,
            seq: 1,
            seqp: 0,
            seqt: 0,
            startdate: '',
            waitingfor: ''
        }];

        try {
            const url = this.buildUrl('everything', {
                return: 'everything',
                since: String(now - 1)
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectPayload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('[Nirvana MCP] Add project failed:', error);
            throw error;
        }
    }

    /**
     * Update an existing task in Nirvana
     * @param {string} id - Task ID (required)
     * @param {string} name - Task name/description
     * @param {string} note - Task notes (optional)
     * @param {string} list - List to move to: 'inbox', 'next', 'waiting', 'scheduled', 'someday' (optional)
     * @param {string} tags - Task tags (optional, comma-separated)
     * @returns {Promise<Object>} API response data
     */
    async updateTask({ id, name, note, list, parentid, state, duedate }) {
        if (!id) throw new Error('Task ID is required for update');
        const now = Math.floor(Date.now() / 1000);
        const stateMap = { inbox: 0, next: 1, waiting: 2, scheduled: 3, someday: 4 };

        if (!existingTask) {
            console.warn('[Nirvana MCP] updateTask: Task not found locally, proceeding with minimal payload. ID=', id);
        }

        let resolvedState = state !== undefined ? state : existingTask?.state;
        if (list) {
            const mapped = stateMap[list.toLowerCase()];
            if (mapped === undefined) {
                console.warn('[Nirvana MCP] Unknown list provided to updateTask:', list);
            } else {
                resolvedState = mapped;
            }
        }
        if (resolvedState === undefined) resolvedState = 1; // fallback to 'next'

        // Merge fields (prefer explicit args over existing task values)
        const merged = {
            method: 'task.save',
            id,
            type: existingTask?.type ?? 0,
            cancelled: existingTask?.cancelled ?? false,
            completed: existingTask?.completed ?? false,
            deleted: existingTask?.deleted ?? false,
            name: name !== undefined ? name : (existingTask?.name || 'Unnamed Task'),
            note: note !== undefined ? note : (existingTask?.note || ''),
            duedate: duedate !== undefined ? duedate : (existingTask?.duedate || ''),
            energy: existingTask?.energy ?? 0,
            etime: existingTask?.etime ?? 0,
            ps: existingTask?.ps ?? 0,
            seq: existingTask?.seq ?? 1,
            seqp: existingTask?.seqp ?? 0,
            seqt: existingTask?.seqt ?? 0,
            startdate: existingTask?.startdate || '',
            waitingfor: existingTask?.waitingfor || '',
            parentid: parentid !== undefined ? parentid : (existingTask?.parentid || ''),
            state: resolvedState,
            recurring: existingTask?.recurring || ''
        };

        const taskPayload = [merged];
        console.debug('[Nirvana MCP] updateTask payload:', JSON.parse(JSON.stringify(taskPayload))); // clone for safe logging

        try {
            const url = this.buildUrl('everything', { return: 'everything', since: String(now - 1) });
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskPayload)
            });
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status}: ${response.statusText} Body: ${text}`);
            }
            const result = await response.json();
            console.log('[Nirvana MCP] Task updated:', id, 'Result keys:', Object.keys(result || {}));
            return result;
        } catch (error) {
            console.error('[Nirvana MCP] Update task failed:', error);
            throw error;
        }
    }

    /**
     * Add a test task with auto-incrementing counter
     * @returns {Promise<Object>} API response data
     */
    async addTestTask() {
        try {
            // Test scenario: try updating a known task ID first; if it doesn't exist, create it.
            const fixedId = '0a5b6c01-2b9f-48c5-84ff-8f22c1686209';
            const data = await this.fetchEverything();
            console.log(data);
            const existing = data.results.some(r => r.task?.id === "0a5b6c01-2b9f-48c5-84ff-8f22c1686209");
            if (existing) {
                const newName = `Updated Test Task #${this.testCounter}`;
                console.log('[Nirvana MCP] addTestTask: Updating existing test task', fixedId);
                const result = await this.updateTask({ id: fixedId, name: newName, note: 'Updated via Spotlight test harness' });
                this.testCounter++;
                return result;
            }
        } catch (error) {
            console.error('[Nirvana MCP] Test task add/update failed:', error);
            throw error;
        }
    }

    /**
     * Fetch a single task by ID (pulls everything and searches). Lightweight helper for dev/testing.
     * NOTE: Could be optimized by caching / reusing last fetch if needed.
     * @param {string} id
     * @returns {Promise<Object|null>} Task object or null if not found
     */
    async getTaskById(id) {
        if (!id) return null;
        try {
            const data = await this.fetchEverything('0');
            const allTasks = ([]).concat(data.tasks || [], data.task || []);
            return allTasks.find(t => t.id === id) || null;
        } catch (e) {
            console.warn('[Nirvana MCP] getTaskById failed:', e);
            return null;
        }
    }

    /**
     * Generic API request method
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response data
     */
    async request(endpoint, params = {}, options = {}) {
        try {
            const url = this.buildUrl(endpoint, params);
            const response = await fetch(url, { method: 'GET', ...options });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[Nirvana MCP] Request to ${endpoint} failed:`, error);
            throw error;
        }
    }
}

// Export for use in other modules
window.NirvanaAPI = NirvanaAPI;