declare const clientEnvVars: {
    url: string;
    key: string;
};
declare const serverEnvVars: {
    dbpass: string;
    url: string;
    key: string;
};
export declare type SupabaseClientConfig = typeof clientEnvVars;
export declare type SupabaseServerConfig = typeof serverEnvVars;
export declare function getSupabaseClientConfig(): {
    url: string;
    key: string;
} | undefined;
export declare function getSupabaseServerConfig(): {
    dbpass: string;
    url: string;
    key: string;
} | undefined;
export {};
