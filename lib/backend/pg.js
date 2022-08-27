// Low-level config and utilities for Postgres.
import { createDatabase } from "./schema.js";
import { getDBConfig } from "./pgconfig/pgconfig.js";
const pool = getPool();
async function getPool() {
    const global = globalThis;
    if (!global._pool) {
        global._pool = await initPool();
    }
    return global._pool;
}
async function initPool() {
    console.log("creating global pool");
    const dbConfig = getDBConfig();
    const pool = dbConfig.initPool();
    // the pool will emit an error on behalf of any idle clients
    // it contains if a backend error or network partition happens
    pool.on("error", (err) => {
        console.error("Unexpected error on idle client", err);
        process.exit(-1);
    });
    pool.on("connect", async (client) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        client.query("SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE");
    });
    await withExecutorAndPool(async (executor) => {
        await transactWithExecutor(executor, async (executor) => {
            await createDatabase(executor, dbConfig);
        });
    }, pool);
    return pool;
}
export async function withExecutor(f) {
    const p = await pool;
    return withExecutorAndPool(f, p);
}
async function withExecutorAndPool(f, p) {
    const client = await p.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const executor = async (sql, params) => {
        try {
            return await client.query(sql, params);
        }
        catch (e) {
            throw new Error(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            `Error executing SQL: ${sql}: ${e.toString()}`);
        }
    };
    try {
        return await f(executor);
    }
    finally {
        client.release();
    }
}
/**
 * Invokes a supplied function within a transaction.
 * @param body Function to invoke. If this throws, the transaction will be rolled
 * back. The thrown error will be re-thrown.
 */
export async function transact(body) {
    return await withExecutor(async (executor) => {
        return await transactWithExecutor(executor, body);
    });
}
async function transactWithExecutor(executor, body) {
    for (let i = 0; i < 10; i++) {
        try {
            await executor("begin");
            try {
                const r = await body(executor);
                await executor("commit");
                return r;
            }
            catch (e) {
                console.log("caught error", e, "rolling back");
                await executor("rollback");
                throw e;
            }
        }
        catch (e) {
            if (shouldRetryTransaction(e)) {
                console.log(`Retrying transaction due to error ${e} - attempt number ${i}`);
                continue;
            }
            throw e;
        }
    }
    throw new Error("Tried to execute transacation too many times. Giving up.");
}
//stackoverflow.com/questions/60339223/node-js-transaction-coflicts-in-postgresql-optimistic-concurrency-control-and
function shouldRetryTransaction(err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = typeof err === "object" ? String(err.code) : null;
    return code === "40001" || code === "40P01";
}
