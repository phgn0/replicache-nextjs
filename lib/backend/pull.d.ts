import type { NextApiRequest } from "next";
import type { PullResponse } from "replicache";
export declare function pull(spaceID: string, requestBody: NextApiRequest): Promise<PullResponse>;
