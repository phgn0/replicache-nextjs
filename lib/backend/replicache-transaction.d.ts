import { JSONValue, ScanOptions, WriteTransaction } from "replicache";
import type { Executor } from "./pg.js";
/**
 * Implements Replicache's WriteTransaction interface in terms of a Postgres
 * transaction.
 */
export declare class ReplicacheTransaction implements WriteTransaction {
    private _spaceID;
    private _clientID;
    private _version;
    private _executor;
    private _cache;
    constructor(executor: Executor, spaceID: string, clientID: string, version: number);
    get clientID(): string;
    put(key: string, value: JSONValue): Promise<void>;
    del(key: string): Promise<boolean>;
    get(key: string): Promise<JSONValue | undefined>;
    has(key: string): Promise<boolean>;
    isEmpty(): Promise<boolean>;
    scan(options?: ScanOptions): import("replicache").ScanResult<string, JSONValue>;
    flush(): Promise<void>;
}
