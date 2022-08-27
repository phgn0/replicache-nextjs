import type { Executor } from "../pg.js";
export interface PokeBackend {
    initSchema(executor: Executor): Promise<void>;
    poke(spaceID: string): void;
}
export declare function getPokeBackend(): PokeBackend;
