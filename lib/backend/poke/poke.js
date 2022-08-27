import { getSupabaseServerConfig } from "../supabase.js";
import { SSEPokeBackend } from "./sse.js";
import { SupabasePokeBackend } from "./supabase.js";
export function getPokeBackend() {
    // The SSE impl has to keep process-wide state using the global object.
    // Otherwise the state is lost during hot reload in dev.
    const global = globalThis;
    if (!global._pokeBackend) {
        global._pokeBackend = initPokeBackend();
    }
    return global._pokeBackend;
}
function initPokeBackend() {
    const supabaseServerConfig = getSupabaseServerConfig();
    if (supabaseServerConfig) {
        console.log("Creating SupabasePokeBackend");
        return new SupabasePokeBackend();
    }
    else {
        console.log("Creating SSEPokeBackend");
        return new SSEPokeBackend();
    }
}
