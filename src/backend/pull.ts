import type { NextApiRequest } from "next";
import { transact } from "./pg.js";
import { getChangedEntries, getCookie, getLastMutationID } from "./data.js";
import { z } from "zod";
import type { PullResponse } from "replicache";
import {
  PartialSyncState,
  partialSyncStateSchema,
  PARTIAL_SYNC_STATE_KEY,
} from "../frontend/partial.js";

const cookieSchema = z.union([
  z.object({ version: z.number(), partialSync: partialSyncStateSchema }),
  z.null(),
]);
// type Cookie = z.TypeOf<typeof cookieSchema>;

const pullRequest = z.object({
  clientID: z.string(),
  cookie: cookieSchema,
});

export async function pull(
  spaceID: string,
  requestBody: NextApiRequest
): Promise<PullResponse> {
  console.log(`Processing pull`, JSON.stringify(requestBody, null, ""));

  const pull = pullRequest.parse(requestBody);
  const requestCookie = pull.cookie;

  console.log("spaceID", spaceID);
  console.log("clientID", pull.clientID);
  const t0 = Date.now();

  // get changed entries
  let [entries, lastMutationID, responseCookieVersion] = await transact(
    async (executor) => {
      return Promise.all([
        getChangedEntries(executor, spaceID, requestCookie?.version ?? 0),
        getLastMutationID(executor, pull.clientID),
        getCookie(executor, spaceID),
      ]);
    }
  );
  if (responseCookieVersion === undefined) {
    throw new Error(`Unknown space ${spaceID}`);
  }

  let partialSyncState: PartialSyncState;
  if (!requestCookie) {
    // initial pull, do not return fulltext entries
    entries = entries.filter((e) => !e[0].startsWith("text/"));

    partialSyncState = "INITIAL_SYNC";
  } else {
    // backfill fulltext entries in addition to changed entries

    partialSyncState = "PARTIAL_SYNC_COMPLETE";
    if (requestCookie.partialSync !== "PARTIAL_SYNC_COMPLETE") {
      // fetch batch of fulltext entries
      const limit = 10;
      const startKey =
        requestCookie.partialSync === "INITIAL_SYNC"
          ? ""
          : requestCookie.partialSync.endKey;

      await transact(async (executor) => {
        // TODO implement custom queries
        const allEntries = await getChangedEntries(executor, spaceID, 0);
        const fulltextEntries = allEntries.filter((e) =>
          e[0].startsWith("text/")
        );
        const incrementalEntries = fulltextEntries
          .filter((e) => e[0] > startKey)
          .slice(0, limit);
        const endSyncOrder = incrementalEntries[-1]?.[0];

        entries = [...entries, ...incrementalEntries];

        // TODO add syncOrder key

        const partialSyncDone =
          incrementalEntries.length < limit || endSyncOrder === undefined;
        if (!partialSyncDone) {
          partialSyncState = {
            endKey: endSyncOrder,
          };
        }
      });
    }
  }

  // create sync state entry to re-trigger pull in frontend
  entries.push([
    PARTIAL_SYNC_STATE_KEY,
    JSON.stringify(partialSyncState),
    false,
  ]);

  // set cookie for next pull
  const responseCookie = {
    version: responseCookieVersion,
    partialSync: partialSyncState,
  };

  console.log("lastMutationID: ", lastMutationID);
  console.log("responseCookie: ", responseCookie);
  console.log("Read all objects in", Date.now() - t0);

  const resp: PullResponse = {
    lastMutationID: lastMutationID ?? 0,
    cookie: responseCookie,
    patch: [],
  };

  for (const [key, value, deleted] of entries) {
    if (deleted) {
      resp.patch.push({
        op: "del",
        key,
      });
    } else {
      resp.patch.push({
        op: "put",
        key,
        value,
      });
    }
  }

  console.log(`Returning`, JSON.stringify(resp, null, ""));
  return resp;
}
