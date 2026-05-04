import type { WithoutSystemFields } from "convex/server";
import type { ThreadDoc } from "../validators.js";
import type { ActionCtx, AgentComponent, MutationCtx, QueryCtx } from "./types.js";
/**
 * Create a thread to store messages with an Agent.
 * @param ctx The context from a mutation or action.
 * @param component The Agent component, usually `components.agent`.
 * @param args The associated thread metadata.
 * @returns The id of the created thread.
 */
export declare function createThread(ctx: MutationCtx | ActionCtx, component: AgentComponent, args?: {
    userId?: string | null;
    title?: string;
    summary?: string;
}): Promise<string>;
/**
 * Get the metadata for a thread.
 * @param ctx A ctx object from a query, mutation, or action.
 * @param args.threadId The thread to get the metadata for.
 * @returns The metadata for the thread.
 */
export declare function getThreadMetadata(ctx: QueryCtx | MutationCtx | ActionCtx, component: AgentComponent, args: {
    threadId: string;
}): Promise<ThreadDoc>;
export declare function updateThreadMetadata(ctx: MutationCtx | ActionCtx, component: AgentComponent, args: {
    threadId: string;
    patch: Partial<WithoutSystemFields<ThreadDoc>>;
}): Promise<{
    _creationTime: number;
    _id: string;
    status: "active" | "archived";
    summary?: string;
    title?: string;
    userId?: string;
}>;
/**
 * Search for threads by title, paginated.
 * @param ctx The context passed from the query/mutation/action.
 * @returns The threads matching the search, paginated.
 */
export declare function searchThreadTitles(ctx: QueryCtx | MutationCtx | ActionCtx, component: AgentComponent, { userId, query, limit, }: {
    userId?: string | undefined;
    query: string;
    limit?: number;
}): Promise<ThreadDoc[]>;
//# sourceMappingURL=threads.d.ts.map