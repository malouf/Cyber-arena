import { type UIDataTypes, type UITools } from "ai";
import type { StreamQuery, StreamQueryArgs } from "./types.js";
import { type UIMessage } from "../UIMessages.js";
/**
 * A hook that fetches streaming messages from a thread and converts them to UIMessages
 * using AI SDK's readUIMessageStream.
 * This ONLY returns streaming UIMessages. To get both full and streaming messages,
 * use `useUIMessages`.
 *
 * @param query The query to use to fetch messages.
 * It must take as arguments `{ threadId, paginationOpts, streamArgs }` and
 * return a `streams` object returned from `agent.syncStreams`.
 * @param args The arguments to pass to the query other than `paginationOpts`
 * and `streamArgs`. So `{ threadId }` at minimum, plus any other arguments that
 * you want to pass to the query.
 * @returns The streaming UIMessages.
 */
export declare function useStreamingUIMessages<METADATA = unknown, DATA_PARTS extends UIDataTypes = UIDataTypes, TOOLS extends UITools = UITools, Query extends StreamQuery<any> = StreamQuery<object>>(query: Query, args: StreamQueryArgs<Query> | "skip", options?: {
    startOrder?: number;
    skipStreamIds?: string[];
}): UIMessage<METADATA, DATA_PARTS, TOOLS>[] | undefined;
//# sourceMappingURL=useStreamingUIMessages.d.ts.map