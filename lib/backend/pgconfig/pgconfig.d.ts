import type { Pool } from "pg";
import type { Executor } from "../pg.js";
/**
 * We use Postgres in a few different ways: directly, via supabase,
 * emulated with pg-mem. This interface abstracts their differences.
 */
export interface PGConfig {
    initPool(): Pool;
    getSchemaVersion(executor: Executor): Promise<number>;
}
export declare function getDBConfig(): PGConfig;
