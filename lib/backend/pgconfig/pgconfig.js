import { getSupabaseServerConfig } from "../supabase.js";
import { PGMemConfig } from "./pgmem.js";
import { PostgresDBConfig } from "./postgres.js";
import { supabaseDBConfig } from "./supabase.js";
export function getDBConfig() {
    const dbURL = process.env.DATABASE_URL;
    if (dbURL) {
        return new PostgresDBConfig(dbURL);
    }
    const supabaseServerConfig = getSupabaseServerConfig();
    if (supabaseServerConfig) {
        return supabaseDBConfig(supabaseServerConfig);
    }
    return new PGMemConfig();
}
