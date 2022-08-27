import type { Executor } from "../pg.js";
import type { PokeBackend } from "./poke.js";
export declare class SupabasePokeBackend implements PokeBackend {
    initSchema(executor: Executor): Promise<void>;
    poke(): void;
}
