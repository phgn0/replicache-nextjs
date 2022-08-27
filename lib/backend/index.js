import { getCookie, createSpace as createSpaceImpl } from "../backend/data.js";
import { handleRequest as handleRequestImpl } from "../endpoints/handle-request.js";
import { transact } from "../backend/pg.js";
export async function spaceExists(spaceID) {
    const cookie = await transact(async (executor) => {
        return await getCookie(executor, spaceID);
    });
    return cookie !== undefined;
}
export async function createSpace(spaceID) {
    await transact(async (executor) => {
        await createSpaceImpl(executor, spaceID);
    });
}
export async function handleRequest(req, res, mutators) {
    await handleRequestImpl(req, res, mutators);
}
