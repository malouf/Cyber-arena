import { validateVectorDimension } from "../component/vector/tables.js";
import { vMessageWithMetadata, } from "../validators.js";
import { serializeMessage } from "../mapping.js";
import { toUIMessages } from "../UIMessages.js";
import { parse } from "convex-helpers/validators";
/**
 * List messages from a thread.
 * @param ctx A ctx object from a query, mutation, or action.
 * @param component The agent component, usually `components.agent`.
 * @param args.threadId The thread to list messages from.
 * @param args.paginationOpts Pagination options (e.g. via usePaginatedQuery).
 * @param args.excludeToolMessages Whether to exclude tool messages.
 *   False by default.
 * @param args.statuses What statuses to include. All by default.
 * @returns The MessageDoc's in a format compatible with usePaginatedQuery.
 */
export async function listMessages(ctx, component, { threadId, paginationOpts, excludeToolMessages, statuses, }) {
    if (paginationOpts.numItems === 0) {
        return {
            page: [],
            isDone: true,
            continueCursor: paginationOpts.cursor ?? "",
        };
    }
    return ctx.runQuery(component.messages.listMessagesByThreadId, {
        order: "desc",
        threadId,
        paginationOpts,
        excludeToolMessages,
        statuses,
    });
}
export async function listUIMessages(ctx, component, args) {
    const result = await listMessages(ctx, component, args);
    return { ...result, page: toUIMessages(result.page) };
}
/**
 * Explicitly save messages associated with the thread (& user if provided)
 */
export async function saveMessages(ctx, component, args) {
    let embeddings;
    if (args.embeddings) {
        const dimension = args.embeddings.vectors.find((v) => v !== null)?.length;
        if (dimension) {
            validateVectorDimension(dimension);
            embeddings = {
                model: args.embeddings.model,
                dimension,
                vectors: args.embeddings.vectors,
            };
        }
    }
    const result = await ctx.runMutation(component.messages.addMessages, {
        threadId: args.threadId,
        userId: args.userId ?? undefined,
        agentName: args.agentName,
        promptMessageId: args.promptMessageId,
        pendingMessageId: args.pendingMessageId,
        embeddings,
        messages: await Promise.all(args.messages.map(async (m, i) => {
            const { message, fileIds } = await serializeMessage(ctx, component, m);
            const base = args.metadata?.[i];
            const allFileIds = [...(base?.fileIds ?? [])];
            if (fileIds)
                allFileIds.push(...fileIds);
            return parse(vMessageWithMetadata, {
                ...base,
                message,
                ...(allFileIds.length > 0 ? { fileIds: allFileIds } : {}),
            });
        })),
        failPendingSteps: args.failPendingSteps ?? false,
    });
    return { messages: result.messages };
}
/**
 * Save a message to the thread.
 * @param ctx A ctx object from a mutation or action.
 * @param args The message and what to associate it with (user / thread)
 * You can pass extra metadata alongside the message, e.g. associated fileIds.
 * @returns The messageId of the saved message.
 */
export async function saveMessage(ctx, component, args) {
    let embeddings;
    if (args.embedding && args.embedding.vector) {
        embeddings = {
            model: args.embedding.model,
            vectors: [args.embedding.vector],
        };
    }
    const { messages } = await saveMessages(ctx, component, {
        threadId: args.threadId,
        userId: args.userId ?? undefined,
        agentName: args.agentName,
        promptMessageId: args.promptMessageId,
        pendingMessageId: args.pendingMessageId,
        messages: args.prompt !== undefined
            ? [{ role: "user", content: args.prompt }]
            : [args.message],
        metadata: args.metadata ? [args.metadata] : undefined,
        embeddings,
    });
    const message = messages.at(-1);
    return { messageId: message._id, message };
}
//# sourceMappingURL=messages.js.map