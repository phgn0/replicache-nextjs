import type { PokeBackend } from "./poke.js";
export declare class SSEPokeBackend implements PokeBackend {
    private _listeners;
    constructor();
    initSchema(): Promise<void>;
    addListener(spaceID: string, listener: () => void): () => void;
    poke(spaceID: string): void;
    private _removeListener;
}
