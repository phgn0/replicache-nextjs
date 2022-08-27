import type { SupabaseServerConfig } from "../supabase.js";
import { PostgresDBConfig } from "./postgres.js";
/**
 * Gets a PGConfig for Supabase. Supabase is postgres, just the way to get the
 * Database URL is different. The reason to not just use DATABASE_URL is
 * because the Supabase integration for Vercel sets the NEXT_PUBLIC_SUPABASE_URL
 * env var automatically. We prefer to derive the database URL from that plus
 * the password to reduce setup work the user would have to do (going and
 * finding the config vars would otherwise be a minor pain).
 */
export declare function supabaseDBConfig(config: SupabaseServerConfig): PostgresDBConfig;
