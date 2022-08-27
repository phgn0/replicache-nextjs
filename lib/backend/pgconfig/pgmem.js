import { newDb } from "pg-mem";
export class PGMemConfig {
    constructor() {
        console.log("Creating PGMemConfig");
    }
    initPool() {
        return new (newDb().adapters.createPg().Pool)();
    }
    async getSchemaVersion() {
        // pg-mem lacks the system tables we normally use to introspect our
        // version. Luckily since pg-mem is in memory, we know that everytime we
        // start, we're starting fresh :).
        return 0;
    }
}
