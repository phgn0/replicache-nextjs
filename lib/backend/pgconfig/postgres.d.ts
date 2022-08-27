import pg from "pg";
import type { Executor } from "../pg.js";
import type { PGConfig } from "./pgconfig.js";
/**
 * Implements PGConfig over a basic Postgres connection.
 */
export declare class PostgresDBConfig implements PGConfig {
    private _url;
    constructor(url: string);
    initPool(): pg.Pool;
    getSchemaVersion(executor: Executor): Promise<number>;
}
