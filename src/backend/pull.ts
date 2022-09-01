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

  // get changed entries
  const t0 = Date.now();
  let [entries, lastMutationID, responseCookieVersion] = await transact(
    async (executor) => {
      return Promise.all([
        getChangedEntries(executor, spaceID, requestCookie?.version ?? 0),
        getLastMutationID(executor, pull.clientID),
        getCookie(executor, spaceID),
      ]);
    }
  );
  console.log(`Read changed entries in ${Date.now() - t0}ms`);
  if (responseCookieVersion === undefined) {
    throw new Error(`Unknown space ${spaceID}`);
  }

  const t1 = Date.now();
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
        const endSyncOrder =
          incrementalEntries[incrementalEntries.length - 1]?.[0];
        console.log(
          `Returning ${incrementalEntries.length} partial entries from ${startKey} to ${endSyncOrder}`
        );

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
  console.log(`Processed partial sync in ${Date.now() - t1}ms`);

  // create sync state entry to re-trigger pull in frontend
  if (requestCookie?.partialSync !== partialSyncState) {
    entries.push([
      PARTIAL_SYNC_STATE_KEY,
      JSON.stringify(partialSyncState),
      false,
    ]);
  }

  // set cookie for next pull
  const responseCookie = {
    version: responseCookieVersion,
    partialSync: partialSyncState,
  };

  console.log("lastMutationID: ", lastMutationID);
  console.log("responseCookie: ", responseCookie);

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

  console.log(`Returning ${resp.patch.length} entries\n`);
  return resp;
}
