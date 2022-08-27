// Implements the poke backend using Supabase's realtime features.
export class SupabasePokeBackend {
    async initSchema(executor) {
        await executor(`alter publication supabase_realtime add table space`);
        await executor(`alter publication supabase_realtime set
        (publish = 'insert, update, delete');`);
    }
    poke() {
        // No need to poke, this is handled internally by the supabase realtime stuff.
    }
}
