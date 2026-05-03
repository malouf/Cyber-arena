/**
 * Create a thread to store messages with an Agent.
 * @param ctx The context from a mutation or action.
 * @param component The Agent component, usually `components.agent`.
 * @param args The associated thread metadata.
 * @returns The id of the created thread.
 */
export async function createThread(ctx, component, args) {
    const { _id: threadId } = await ctx.runMutation(component.threads.createThread, {
        userId: args?.userId ?? undefined,
        title: args?.title,
        summary: args?.summary,
    });
    return threadId;
}
/**
 * Get the metadata for a thread.
 * @param ctx A ctx object from a query, mutation, or action.
 * @param args.threadId The thread to get the metadata for.
 * @returns The metadata for the thread.
 */
export async function getThreadMetadata(ctx, component, args) {
    const thread = await ctx.runQuery(component.threads.getThread, {
        threadId: args.threadId,
    });
    if (!thread) {
        throw new Error("Thread not found");
    }
    return thread;
}
export async function updateThreadMetadata(ctx, component, args) {
    return ctx.runMutation(component.threads.updateThread, {
        threadId: args.threadId,
        patch: args.patch,
    });
}
/**
 * Search for threads by title, paginated.
 * @param ctx The context passed from the query/mutation/action.
 * @returns The threads matching the search, paginated.
 */
export async function searchThreadTitles(ctx, component, { userId, query, limit, }) {
    return ctx.runQuery(component.threads.searchThreadTitles, {
        userId,
        query,
        limit: limit ?? 10,
    });
}
//# sourceMappingURL=threads.js.map