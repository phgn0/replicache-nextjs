import type { Pool } from "pg";
import type { PGConfig } from "./pgconfig.js";
export declare class PGMemConfig implements PGConfig {
    constructor();
    initPool(): Pool;
    getSchemaVersion(): Promise<number>;
}
