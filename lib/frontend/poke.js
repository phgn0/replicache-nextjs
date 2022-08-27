import { getSupabaseClientConfig, } from "../backend/supabase.js";
import { createClient } from "@supabase/supabase-js";
const supabaseClientConfig = getSupabaseClientConfig();
// Returns a function that can be used to listen for pokes from the backend.
// This sample supports two different ways to do it.
export function getPokeReceiver() {
    if (supabaseClientConfig) {
        return supabaseReceiver.bind(null, supabaseClientConfig);
    }
    else {
        return sseReceiver;
    }
}
// Implements a Replicache poke using Supabase's realtime functionality.
// See: backend/poke/supabase.ts.
function supabaseReceiver(supabaseClientConfig, spaceID, onPoke) {
    if (!supabaseClientConfig) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => { };
    }
    const { url, key } = supabaseClientConfig;
    const supabase = createClient(url, key);
    const subscription = supabase
        .from(`space:id=eq.${spaceID}`)
        .on("*", async () => {
        await onPoke();
    })
        .subscribe();
    return () => {
        subscription.unsubscribe();
    };
}
// Implements a Replicache poke using Server-Sent Events.
// See: backend/poke/sse.ts.
function sseReceiver(spaceID, onPoke) {
    const ev = new EventSource(`/api/replicache/poke-sse?spaceID=${spaceID}`, {
        withCredentials: true,
    });
    ev.onmessage = async (event) => {
        if (event.data === "poke") {
            await onPoke();
        }
    };
    const close = () => {
        ev.close();
    };
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=833462
    window.addEventListener("beforeunload", close);
    return () => {
        close();
        window.removeEventListener("beforeunload", close);
    };
}
