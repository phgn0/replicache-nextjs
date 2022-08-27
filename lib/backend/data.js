import { z } from "zod";
export async function getEntry(executor, spaceid, key) {
    const { rows } = await executor("select value from entry where spaceid = $1 and key = $2 and deleted = false", [spaceid, key]);
    const value = rows[0]?.value;
    if (value === undefined) {
        return undefined;
    }
    return JSON.parse(value);
}
export async function putEntry(executor, spaceID, key, value, version) {
    await executor(`
    insert into entry (spaceid, key, value, deleted, version, lastmodified)
    values ($1, $2, $3, false, $4, now())
      on conflict (spaceid, key) do update set
        value = $3, deleted = false, version = $4, lastmodified = now()
    `, [spaceID, key, JSON.stringify(value), version]);
}
export async function delEntry(executor, spaceID, key, version) {
    await executor(`update entry set deleted = true, version = $3 where spaceid = $1 and key = $2`, [spaceID, key, version]);
}
export async function* getEntries(executor, spaceID, fromKey) {
    const { rows } = await executor(`select key, value from entry where spaceid = $1 and key >= $2 and deleted = false order by key`, [spaceID, fromKey]);
    for (const row of rows) {
        yield [row.key, JSON.parse(row.value)];
    }
}
export async function getChangedEntries(executor, spaceID, prevVersion) {
    const { rows } = await executor(`select key, value, deleted from entry where spaceid = $1 and version > $2`, [spaceID, prevVersion]);
    return rows.map((row) => [row.key, JSON.parse(row.value), row.deleted]);
}
export async function createSpace(executor, spaceID) {
    console.log("creating space", spaceID);
    await executor(`insert into space (id, version, lastmodified) values ($1, 0, now())`, [spaceID]);
}
export async function getCookie(executor, spaceID) {
    const { rows } = await executor(`select version from space where id = $1`, [
        spaceID,
    ]);
    const value = rows[0]?.version;
    if (value === undefined) {
        return undefined;
    }
    return z.number().parse(value);
}
export async function setCookie(executor, spaceID, version) {
    await executor(`update space set version = $2, lastmodified = now() where id = $1`, [spaceID, version]);
}
export async function getLastMutationID(executor, clientID) {
    const { rows } = await executor(`select lastmutationid from client where id = $1`, [clientID]);
    const value = rows[0]?.lastmutationid;
    if (value === undefined) {
        return undefined;
    }
    return z.number().parse(value);
}
export async function setLastMutationID(executor, clientID, lastMutationID) {
    await executor(`
    insert into client (id, lastmutationid, lastmodified)
    values ($1, $2, now())
      on conflict (id) do update set lastmutationid = $2, lastmodified = now()
    `, [clientID, lastMutationID]);
}
