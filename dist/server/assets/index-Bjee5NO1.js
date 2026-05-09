import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
function Dashboard() {
  const modes = [{
    id: "strategic",
    name: "Mode Stratégique",
    desc: "1v1 Duel. Server-resolved simultaneous turns (multiplayer slice).",
    status: "Playable",
    locked: false,
    link: "/multiplayer"
  }, {
    id: "chaos",
    name: "Mode Chaos",
    desc: "Drop-in/Drop-out with AI takeover. Fast-paced.",
    status: "Coming Soon",
    locked: true,
    link: "#"
  }, {
    id: "practice",
    name: "Offline Practice",
    desc: "Test your builds and practice against an AI bot.",
    status: "Playable",
    locked: false,
    link: "/practice"
  }];
  return /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-black text-neutral-100 flex flex-col font-sans overflow-hidden relative", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" }),
    /* @__PURE__ */ jsxs("header", { className: "px-12 py-10 border-b border-neutral-900", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-6xl font-black tracking-tighter text-white uppercase mb-2", children: [
        "Arena",
        /* @__PURE__ */ jsx("span", { className: "text-red-600", children: "." }),
        "Async"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-neutral-500 font-mono text-xs tracking-[0.3em] uppercase", children: "Tactical Duel • V1.0.0" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-4xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-12 text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-red-600 uppercase tracking-[0.3em] mb-2", children: "Select Game Mode" }),
        /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-xs uppercase tracking-widest", children: "Connect to the simulation network" })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: modes.map((mode) => mode.locked ? /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800/50 p-8 flex flex-col gap-6 relative bg-neutral-950/50 opacity-50 grayscale cursor-not-allowed", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-black uppercase tracking-tighter text-white mb-2", children: mode.name }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500", children: mode.status })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-neutral-400 text-sm font-mono leading-relaxed mt-auto", children: mode.desc })
      ] }, mode.id) : /* @__PURE__ */ jsxs(Link, { to: mode.link, className: "border border-neutral-700 p-8 flex flex-col gap-6 relative group transition-all hover:border-red-600 bg-black cursor-pointer hover:scale-[1.02]", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-red-600 rounded-full animate-pulse" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-3xl font-black uppercase tracking-tighter text-white mb-2", children: mode.name }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 animate-pulse", children: mode.status })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-neutral-400 text-sm font-mono leading-relaxed mt-auto group-hover:text-neutral-300 transition-colors", children: mode.desc }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-1", children: [
          /* @__PURE__ */ jsx("div", { className: "w-full h-1 bg-red-600/20 group-hover:bg-red-600 transition-colors" }),
          /* @__PURE__ */ jsx("div", { className: "w-1/3 h-1 bg-red-600/20 group-hover:bg-red-600 transition-colors" })
        ] })
      ] }, mode.id)) })
    ] }) }),
    /* @__PURE__ */ jsxs("footer", { className: "p-6 border-t border-neutral-900 font-mono text-xs text-neutral-600 uppercase tracking-widest flex justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-red-600 mr-2", children: "■" }),
        " System Status: Online"
      ] }),
      /* @__PURE__ */ jsx("div", { children: "Awaiting Input" })
    ] })
  ] });
}
export {
  Dashboard as component
};
