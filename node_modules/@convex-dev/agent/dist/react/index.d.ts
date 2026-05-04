export { toUIMessages, type UIMessage } from "../UIMessages.js";
export { optimisticallySendMessage } from "./optimisticallySendMessage.js";
export { useSmoothText } from "./useSmoothText.js";
export { SmoothText } from "./SmoothText.js";
export { type ThreadMessagesQuery, useThreadMessages, useStreamingThreadMessages, } from "./useThreadMessages.js";
export { type UIMessagesQuery, useUIMessages } from "./useUIMessages.js";
export { useStreamingUIMessages } from "./useStreamingUIMessages.js";
/**
 * @deprecated use useThreadMessages or useStreamingThreadMessages instead
 * Use this hook to stream text from a server action, using the
 * toTextStreamResponse or equivalent HTTP streaming endpoint returning text.
 * @param url The URL of the server action to stream text from.
 *   e.g. https://....convex.site/yourendpoint
 * @param threadId The ID of the thread to stream text from.
 * @param token The auth token to use for the request.
 *   e.g. useAuthToken() from @convex-dev/auth/react
 * @returns A tuple containing the {text, loading, error} and a function to call the endpoint
 * with a given prompt, passing up { prompt, threadId } as the body in JSON.
 */
export declare function useStreamingText(url: string, threadId: string | null, token?: string): readonly [{
    readonly text: string;
    readonly loading: boolean;
    readonly error: Error | null;
}, (prompt: string) => Promise<void>];
//# sourceMappingURL=index.d.ts.map