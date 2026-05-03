import type { StreamQuery, StreamQueryArgs } from "./types.js";
import type { StreamDelta, StreamMessage } from "../validators.js";
export declare function useDeltaStreams<Query extends StreamQuery<any> = StreamQuery<object>>(query: Query, args: StreamQueryArgs<Query> | "skip", options?: {
    startOrder?: number;
    skipStreamIds?: string[];
}): {
    streamMessage: StreamMessage;
    deltas: StreamDelta[];
}[] | undefined;
//# sourceMappingURL=useDeltaStreams.d.ts.map