// Implements the poke backend using server-sent events.
export class SSEPokeBackend {
    _listeners;
    constructor() {
        this._listeners = new Map();
    }
    async initSchema() {
        // No schema support necessary for SSE poke.
    }
    addListener(spaceID, listener) {
        let set = this._listeners.get(spaceID);
        if (!set) {
            set = new Set();
            this._listeners.set(spaceID, set);
        }
        set.add(listener);
        return () => this._removeListener(spaceID, listener);
    }
    poke(spaceID) {
        const set = this._listeners.get(spaceID);
        if (!set) {
            return;
        }
        for (const listener of set) {
            try {
                listener();
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    _removeListener(spaceID, listener) {
        const set = this._listeners.get(spaceID);
        if (!set) {
            return;
        }
        set.delete(listener);
    }
}
