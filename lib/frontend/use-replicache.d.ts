import { MutatorDefs, Replicache, ReplicacheOptions } from "replicache";
export interface UseReplicacheOptions<M extends MutatorDefs> extends Omit<ReplicacheOptions<M>, "licenseKey" | "name"> {
    name?: string;
    apiHost?: string;
}
/**
 * Returns a Replicache instance with the given configuration.
 * If name is undefined, returns null.
 * If any of the values of the options change (by way of JS equals), a new
 * Replicache instance is created and the old one is closed.
 * Thus it is fine to say `useReplicache({name, mutators})`, as long as name
 * and mutators are stable.
 */
export declare function useReplicache<M extends MutatorDefs>({ name, ...options }: UseReplicacheOptions<M>): Replicache<M> | null;
