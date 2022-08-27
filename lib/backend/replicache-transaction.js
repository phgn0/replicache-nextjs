import { isScanIndexOptions, makeScanResult, mergeAsyncIterables, filterAsyncIterable, } from "replicache";
import { delEntry, getEntries, getEntry, putEntry } from "./data.js";
/**
 * Implements Replicache's WriteTransaction interface in terms of a Postgres
 * transaction.
 */
export class ReplicacheTransaction {
    _spaceID;
    _clientID;
    _version;
    _executor;
    _cache = new Map();
    constructor(executor, spaceID, clientID, version) {
        this._spaceID = spaceID;
        this._clientID = clientID;
        this._version = version;
        this._executor = executor;
    }
    get clientID() {
        return this._clientID;
    }
    async put(key, value) {
        this._cache.set(key, { value, dirty: true });
    }
    async del(key) {
        const had = await this.has(key);
        this._cache.set(key, { value: undefined, dirty: true });
        return had;
    }
    async get(key) {
        const entry = this._cache.get(key);
        if (entry) {
            return entry.value;
        }
        const value = await getEntry(this._executor, this._spaceID, key);
        this._cache.set(key, { value, dirty: false });
        return value;
    }
    async has(key) {
        const val = await this.get(key);
        return val !== undefined;
    }
    async isEmpty() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of this.scan()) {
            return false;
        }
        return true;
    }
    scan(options = {}) {
        if (isScanIndexOptions(options)) {
            throw new Error("not implemented");
        }
        const { _executor: executor, _spaceID: spaceID, _cache: cache } = this;
        return makeScanResult(options, (fromKey) => {
            const source = getEntries(executor, spaceID, fromKey);
            const pending = getCacheEntries(cache, fromKey);
            const merged = mergeAsyncIterables(source, pending, entryCompare);
            const filtered = filterAsyncIterable(merged, (entry) => entry[1] !== undefined);
            return filtered;
        });
    }
    async flush() {
        await Promise.all([...this._cache.entries()]
            .filter(([, { dirty }]) => dirty)
            .map(([k, { value }]) => {
            if (value === undefined) {
                return delEntry(this._executor, this._spaceID, k, this._version);
            }
            else {
                return putEntry(this._executor, this._spaceID, k, value, this._version);
            }
        }));
    }
}
function getCacheEntries(cache, fromKey) {
    const entries = [];
    for (const [key, { value, dirty }] of cache) {
        if (dirty && stringCompare(key, fromKey) >= 0) {
            entries.push([key, value]);
        }
    }
    entries.sort((a, b) => stringCompare(a[0], b[0]));
    return entries;
}
function stringCompare(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
}
function entryCompare(a, b) {
    return stringCompare(a[0], b[0]);
}
