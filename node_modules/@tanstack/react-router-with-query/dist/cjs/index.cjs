"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const react = require("react");
const reactQuery = require("@tanstack/react-query");
const routerCore = require("@tanstack/router-core");
require("@tanstack/router-core/ssr/client");
function routerWithQueryClient(router, queryClient, additionalOpts) {
  const ogOptions = router.options;
  router.options = {
    ...router.options,
    context: {
      ...ogOptions.context,
      // Pass the query client to the context, so we can access it in loaders
      queryClient
    },
    // Wrap the app in a QueryClientProvider
    Wrap: ({ children }) => {
      const OuterWrapper = (additionalOpts == null ? void 0 : additionalOpts.WrapProvider) || react.Fragment;
      const OGWrap = ogOptions.Wrap || react.Fragment;
      return /* @__PURE__ */ jsxRuntime.jsx(OuterWrapper, { children: /* @__PURE__ */ jsxRuntime.jsx(reactQuery.QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntime.jsx(OGWrap, { children }) }) });
    }
  };
  if (router.isServer) {
    const queryStream = createPushableStream();
    router.options.dehydrate = async () => {
      var _a;
      const ogDehydrated = await ((_a = ogOptions.dehydrate) == null ? void 0 : _a.call(ogOptions));
      const dehydratedQueryClient = reactQuery.dehydrate(queryClient);
      router.serverSsr.onRenderFinished(() => queryStream.close());
      const dehydratedRouter = {
        ...ogDehydrated,
        // When critical data is dehydrated, we also dehydrate the query client
        dehydratedQueryClient,
        // prepare the stream for queries coming up during rendering
        queryStream: queryStream.stream
      };
      return dehydratedRouter;
    };
    const ogClientOptions = queryClient.getDefaultOptions();
    queryClient.setDefaultOptions({
      ...ogClientOptions,
      dehydrate: {
        shouldDehydrateQuery: () => true,
        ...ogClientOptions.dehydrate
      }
    });
    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "added") {
        if (!router.serverSsr.isDehydrated()) {
          return;
        }
        if (queryStream.isClosed()) {
          console.warn(
            `tried to stream query ${event.query.queryHash} after stream was already closed`
          );
          return;
        }
        queryStream.enqueue(
          reactQuery.dehydrate(queryClient, {
            shouldDehydrateQuery: (query) => {
              var _a, _b;
              if (query.queryHash === event.query.queryHash) {
                return ((_b = (_a = ogClientOptions.dehydrate) == null ? void 0 : _a.shouldDehydrateQuery) == null ? void 0 : _b.call(_a, query)) ?? true;
              }
              return false;
            }
          })
        );
      }
    });
  } else {
    router.options.hydrate = async (dehydrated) => {
      var _a;
      await ((_a = ogOptions.hydrate) == null ? void 0 : _a.call(ogOptions, dehydrated));
      reactQuery.hydrate(queryClient, dehydrated.dehydratedQueryClient);
      const reader = dehydrated.queryStream.getReader();
      reader.read().then(async function handle({ done, value }) {
        reactQuery.hydrate(queryClient, value);
        if (done) {
          return;
        }
        const result = await reader.read();
        return handle(result);
      }).catch((err) => {
        console.error("Error reading query stream:", err);
      });
    };
    if ((additionalOpts == null ? void 0 : additionalOpts.handleRedirects) ?? true) {
      const ogMutationCacheConfig = queryClient.getMutationCache().config;
      queryClient.getMutationCache().config = {
        ...ogMutationCacheConfig,
        onError: (error, _variables, _context, _mutation) => {
          var _a;
          if (routerCore.isRedirect(error)) {
            error.options._fromLocation = router.state.location;
            return router.navigate(router.resolveRedirect(error).options);
          }
          return (_a = ogMutationCacheConfig.onError) == null ? void 0 : _a.call(
            ogMutationCacheConfig,
            error,
            _variables,
            _context,
            _mutation
          );
        }
      };
      const ogQueryCacheConfig = queryClient.getQueryCache().config;
      queryClient.getQueryCache().config = {
        ...ogQueryCacheConfig,
        onError: (error, _query) => {
          var _a;
          if (routerCore.isRedirect(error)) {
            error.options._fromLocation = router.state.location;
            return router.navigate(router.resolveRedirect(error).options);
          }
          return (_a = ogQueryCacheConfig.onError) == null ? void 0 : _a.call(ogQueryCacheConfig, error, _query);
        }
      };
    }
  }
  return router;
}
function createPushableStream() {
  let controllerRef;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    }
  });
  let _isClosed = false;
  return {
    stream,
    enqueue: (chunk) => controllerRef.enqueue(chunk),
    close: () => {
      controllerRef.close();
      _isClosed = true;
    },
    isClosed: () => _isClosed,
    error: (err) => controllerRef.error(err)
  };
}
exports.routerWithQueryClient = routerWithQueryClient;
//# sourceMappingURL=index.cjs.map
