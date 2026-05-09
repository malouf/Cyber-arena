import { jsx, jsxs } from "react/jsx-runtime";
import { createRootRouteWithContext, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
const appCss = "/assets/app-4p8WRKkc.css";
const Route$3 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "App"
      }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" }
    ]
  }),
  notFoundComponent: () => /* @__PURE__ */ jsx("div", { children: "Route not found" }),
  component: RootComponent
});
function RootComponent() {
  return /* @__PURE__ */ jsx(RootDocument, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$2 = () => import("./practice-CBLefBpU.js");
const Route$2 = createFileRoute("/practice")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./multiplayer-D7H_xuR3.js");
const Route$1 = createFileRoute("/multiplayer")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-Bjee5NO1.js");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const PracticeRoute = Route$2.update({
  id: "/practice",
  path: "/practice",
  getParentRoute: () => Route$3
});
const MultiplayerRoute = Route$1.update({
  id: "/multiplayer",
  path: "/multiplayer",
  getParentRoute: () => Route$3
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$3
});
const rootRouteChildren = {
  IndexRoute,
  MultiplayerRoute,
  PracticeRoute
};
const routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const CONVEX_URL = void 0;
  {
    console.error("missing envar CONVEX_URL");
  }
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5e3
      }
    }
  });
  convexQueryClient.connect(queryClient);
  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: "intent",
      context: { queryClient },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      // Let React Query handle all caching
      defaultErrorComponent: (err) => /* @__PURE__ */ jsx("p", { children: err.error.stack }),
      defaultNotFoundComponent: () => /* @__PURE__ */ jsx("p", { children: "not found" }),
      Wrap: ({ children }) => /* @__PURE__ */ jsx(ConvexProvider, { client: convexQueryClient.convexClient, children })
    }),
    queryClient
  );
  return router;
}
export {
  getRouter
};
