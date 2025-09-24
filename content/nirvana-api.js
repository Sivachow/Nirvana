// nirvana-api.js — Refactored, MCP-friendly updates

class NirvanaAPI {
    // ---- Constants & Utilities -------------------------------------------------
    static BASE_URL = 'https://gc-api.nirvanahq.com/api';
    static APP_ID = 'com.nirvanahq.focus';
    static APP_VERSION = '3.10.4';
    static STATE = { inbox: 0, next: 1, waiting: 2, scheduled: 3, someday: 4, trash: 6 };

    constructor() { this.authToken = null; }

    setAuthToken(token) { this.authToken = token; }

    // Private helpers
    _now() { return Math.floor(Date.now() / 1000); }
    _uuid() { return crypto.randomUUID(); }
    _requireAuth() { if (!this.authToken) throw new Error('Auth token not set'); }

    _defaultParams() {
        const ts = String(this._now());
        return {
            authtoken: this.authToken,
            appid: NirvanaAPI.APP_ID,
            appversion: NirvanaAPI.APP_VERSION,
            clienttime: ts,
            servertime: ts,
            requestid: this._uuid(),
        };
    }

    _buildUrl(endpoint, params = {}) {
        this._requireAuth();
        const url = new URL(`${NirvanaAPI.BASE_URL}/${endpoint}`);
        const all = { ...this._defaultParams(), ...params };
        for (const [k, v] of Object.entries(all)) url.searchParams.set(k, String(v));
        return url.toString();
    }

    async _fetchJSON(url, options = {}) {
        const res = await fetch(url, options);
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${res.statusText}${body ? ` | ${body}` : ''}`);
        }
        return res.json();
    }

    async _postCommands(commands, since) {
        const url = this._buildUrl('everything', {
            return: 'everything',
            since: String(since ?? this._now() - 1),
        });
        return this._fetchJSON(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commands),
        });
    }

    _findTask(results, id) {
        for (const r of results || []) if (r.task?.id === id) return r.task;
        return null;
    }

    async _loadTask(id) {
        const data = await this.fetchEverything('0');
        const existing = this._findTask(data.results, id);
        if (!existing) throw new Error(`Task not found: ${id}`);
        return existing;
    }

    // ---- Public API ------------------------------------------------------------
    async fetchEverything(since = '0') {
        const url = this._buildUrl('everything', { return: 'everything', since });
        return this._fetchJSON(url, { method: 'GET' });
    }

    // Leave addTask behavior as-is per request
    async addTask(name, note = '', list = 'next', focus = false, _taskId /* compat */) {
        if (!name) throw new Error('Task name is required');
        const state = NirvanaAPI.STATE[(list || 'next').toLowerCase()] ?? NirvanaAPI.STATE.next;

        const payload = [{
            method: 'task.save',
            id: this._uuid(),
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

        return this._postCommands(payload);
    }

    // ---- MCP-friendly small, explicit ops -------------------------------------
    /** Move to a list/state. Adds state + _state timestamp. */
    async setState(id, listOrState) {
        const existing = await this._loadTask(id);
        const now = this._now();
        const state = typeof listOrState === 'number'
            ? listOrState
            : (NirvanaAPI.STATE[String(listOrState).toLowerCase()]);
        if (state === undefined) throw new Error('Unknown state/list');

        const cmd = this._mergeForSave(existing, { state, _state: now }, now);
        return this._postCommands([cmd]);
    }

    /** Update name and/or note. Stamps _name/_note when changed. */
    async setNameNote(id, { name, note }) {
        const existing = await this._loadTask(id);
        const now = this._now();
        const patch = {};
        if (name !== undefined && name !== existing.name) { patch.name = name; patch._name = now; }
        if (note !== undefined && note !== existing.note) { patch.note = note; patch._note = now; }
        if (!Object.keys(patch).length) return { ok: true, message: 'No changes' };
        const cmd = this._mergeForSave(existing, patch, now);
        return this._postCommands([cmd]);
    }

    /** Complete a task: sets completed to now (epoch seconds). */
    async complete(id) {
        const existing = await this._loadTask(id);
        const now = this._now();
        const cmd = this._mergeForSave(existing, { completed: now }, now);
        return this._postCommands([cmd]);
    }

    /** Convenience wrappers */
    async moveTo(list) { return this.setState.bind(this)(...arguments); }
    async trash(id) { return this.setState(id, NirvanaAPI.STATE.trash); }

    /** General update with automatic stamping for state/name/note as requested. */
    async updateTask({ id, name, note, list, parentid, state, duedate }) {
        if (!id) throw new Error('Task ID is required for update');
        const existing = await this._loadTask(id);
        const now = this._now();

        // Resolve state from list/state
        let resolvedState = state ?? existing.state;
        if (list) {
            const mapped = NirvanaAPI.STATE[list.toLowerCase()];
            if (mapped !== undefined) resolvedState = mapped;
        }

        const patch = {};
        if (name !== undefined && name !== existing.name) { patch.name = name; patch._name = now; }
        if (note !== undefined && note !== existing.note) { patch.note = note; patch._note = now; }
        if (resolvedState !== undefined && resolvedState !== existing.state) { patch.state = resolvedState; patch._state = now; }
        if (duedate !== undefined && duedate !== existing.duedate) { patch.duedate = duedate; }
        if (parentid !== undefined && parentid !== existing.parentid) { patch.parentid = parentid; }

        const cmd = this._mergeForSave(existing, patch, now);
        return this._postCommands([cmd]);
    }

    async deleteTask(id) {
        if (!id) throw new Error('Task ID is required for delete');
        const existing = await this._loadTask(id);
        const now = this._now();
        const cmd = this._mergeForSave(existing, { state: NirvanaAPI.STATE.trash, _state: now }, now);
        return this._postCommands([cmd]);
    }

    async focusTask(id) {
        if (!id) throw new Error('Task ID is required for focus');
        const existing = await this._loadTask(id);
        const now = this._now();
        const cmd = this._mergeForSave(existing, { seqt: now, _seqt: now }, now);
    }

    async addTestTask() {
        const fixedId = '0a5b6c01-2b9f-48c5-84ff-8f22c1686209';
        const data = await this.fetchEverything();
        const exists = !!this._findTask(data.results, fixedId);
        if (exists) return this.focusTask(fixedId);
        return { ok: true, message: 'Fixed test task not found; nothing to delete.' };
    }

    async getTaskById(id) {
        if (!id) return null;
        try {
            const data = await this.fetchEverything('0');
            return this._findTask(data.results, id);
        } catch (e) {
            console.warn('[Nirvana MCP] getTaskById failed:', e);
            return null;
        }
    }

    async request(endpoint, params = {}, options = {}) {
        const url = this._buildUrl(endpoint, params);
        return this._fetchJSON(url, { method: 'GET', ...options });
    }

    // ---- Merge helper to keep payload shape consistent ------------------------
    _mergeForSave(existing, patch, now = this._now()) {
        return {
            method: 'task.save',
            id: existing.id,
            type: existing.type ?? 0,
            cancelled: existing.cancelled ?? false,
            completed: existing.completed ?? false,
            deleted: existing.deleted ?? false,

            name: patch.name ?? existing.name ?? 'Unnamed Task',
            note: patch.note ?? existing.note ?? '',
            duedate: patch.duedate ?? existing.duedate ?? '',
            energy: existing.energy ?? 0,
            etime: existing.etime ?? 0,
            ps: existing.ps ?? 0,
            startdate: existing.startdate ?? '',
            waitingfor: existing.waitingfor ?? '',
            parentid: patch.parentid ?? existing.parentid ?? '',
            state: patch.state ?? existing.state ?? NirvanaAPI.STATE.next,
            recurring: existing.recurring ?? '',

            seq: existing.seq ?? 0,
            seqp: existing.seqp ?? 0,
            seqt: existing.seqt ?? 0,

            ...(patch._name ? { _name: patch._name } : {}),
            ...(patch._note ? { _note: patch._note } : {}),
            ...(patch._state ? { _state: patch._state } : {}),
        };
    }
}

    // Export
window.NirvanaAPI = NirvanaAPI;
