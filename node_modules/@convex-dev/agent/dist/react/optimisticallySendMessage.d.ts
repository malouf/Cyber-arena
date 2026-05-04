import type { MessageDoc, StreamArgs } from "../validators.js";
import type { OptimisticLocalStore } from "convex/browser";
import type { UIMessage } from "../UIMessages.js";
import type { FunctionReference, PaginationOptions, PaginationResult } from "convex/server";
import type { SyncStreamsReturnValue } from "@convex-dev/agent";
/**
 * Adds a sent message to the end of a list of messages, so it shows up until
 * the message is saved on the server and arrives in the query.
 * It generates a message with fields that match both MessageDoc and UIMessage,
 * for convenience. It will not include any other fields you might have in your
 * regular query, however.
 *
 * @param query The query used to fetch messages, typically with
 * useThreadMessages or useUIMessages.
 * @returns A function that can be used to optimistically send a message.
 * If your mutation takes different arguments than { threadId, prompt }, you can
 * use it as a helper function in your optimistic update:
 * ```ts
 * const sendMessage = useMutation(
 *   api.chatStreaming.streamStoryAsynchronously,
 * ).withOptimisticUpdate(
 *   (store, args) => {
 *     optimisticallySendMessage(api.chatStreaming.listThreadMessages)(store, {
 *       threadId:
 *       prompt: whatever you would have passed to the mutation,
 *     })
 *   }
 * );
 * ```
 */
export declare function optimisticallySendMessage(query: FunctionReference<"query", "public", {
    threadId: string;
    paginationOpts: PaginationOptions;
    streamArgs?: StreamArgs;
}, PaginationResult<MessageDoc | UIMessage> & {
    streams?: SyncStreamsReturnValue;
}>): (store: OptimisticLocalStore, args: {
    threadId: string;
    prompt: string;
}) => void;
export declare function randomUUID(): string;
//# sourceMappingURL=optimisticallySendMessage.d.ts.map