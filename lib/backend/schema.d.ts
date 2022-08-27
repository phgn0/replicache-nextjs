import type { PGConfig } from "./pgconfig/pgconfig.js";
import type { Executor } from "./pg.js";
export declare function createDatabase(executor: Executor, dbConfig: PGConfig): Promise<void>;
export declare function createSchemaVersion1(executor: Executor): Promise<void>;
