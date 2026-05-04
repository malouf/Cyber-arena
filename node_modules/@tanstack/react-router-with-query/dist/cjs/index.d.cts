import { AnyRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
type AdditionalOptions = {
    WrapProvider?: (props: {
        children: any;
    }) => React.JSX.Element;
    /**
     * If `true`, the QueryClient will handle errors thrown by `redirect()` inside of mutations and queries.
     *
     * @default true
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/api/router/redirectFunction)
     */
    handleRedirects?: boolean;
};
export type ValidateRouter<TRouter extends AnyRouter> = NonNullable<TRouter['options']['context']> extends {
    queryClient: QueryClient;
} ? TRouter : never;
export declare function routerWithQueryClient<TRouter extends AnyRouter>(router: ValidateRouter<TRouter>, queryClient: QueryClient, additionalOpts?: AdditionalOptions): TRouter;
export {};
