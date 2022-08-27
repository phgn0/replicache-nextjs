import { ZodType } from "zod";
import type { MutatorDefs, ReadonlyJSONValue } from "replicache";
export declare function parseIfDebug<T>(schema: ZodType<T>, val: ReadonlyJSONValue): T;
export declare type Error = "SpaceNotFound";
export declare function push<M extends MutatorDefs>(spaceID: string, requestBody: any, mutators: M): Promise<void>;
