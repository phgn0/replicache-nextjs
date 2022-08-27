import type { NextApiRequest, NextApiResponse } from "next";
import type { MutatorDefs } from "replicache";
export declare function handleRequest<M extends MutatorDefs>(req: NextApiRequest, res: NextApiResponse, mutators: M): Promise<void>;
