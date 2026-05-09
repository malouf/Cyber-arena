import { jsx, jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { a as api, u as useMultiplayerStore, A as ArenaView } from "./ArenaView-BIFbbCQh.js";
import { useMutation } from "convex/react";
import "zustand/shallow";
import "zustand";
import "zustand/middleware/immer";
function MatchmakingScreen({ clientId }) {
  const queueForMatch = useMutation(api.matches.queueForMatch);
  const leaveQueue = useMutation(api.matches.leaveQueue);
  const [displayName, setDisplayName] = useState("");
  const [isQueueing, setIsQueueing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isInQueue, setIsInQueue] = useState(false);
  useEffect(() => {
    const existing = window.localStorage.getItem("arena_async_display_name");
    if (existing) {
      setDisplayName(existing);
      return;
    }
    setDisplayName(`Pilot-${clientId.slice(0, 4)}`);
  }, [clientId]);
  const normalizedName = displayName.trim() || `Pilot-${clientId.slice(0, 4)}`;
  const handleQueue = async () => {
    setErrorMessage(null);
    setIsQueueing(true);
    try {
      window.localStorage.setItem("arena_async_display_name", normalizedName);
      await queueForMatch({
        clientId,
        displayName: normalizedName,
        primarySoul: "onde",
        secondarySoul: "fury",
        selectedActives: ["impulse", "stasis", "leap"],
        selectedPassives: ["drain_force", "masochism"],
        items: [],
        mode: "1v1",
        type: "casual"
      });
      setIsInQueue(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to queue."
      );
    } finally {
      setIsQueueing(false);
    }
  };
  const handleLeaveQueue = async () => {
    setErrorMessage(null);
    setIsQueueing(true);
    try {
      await leaveQueue({ clientId });
      setIsInQueue(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to leave queue."
      );
    } finally {
      setIsQueueing(false);
    }
  };
  return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-black text-neutral-100 font-sans p-6 md:p-10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-3xl space-y-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between border-b border-neutral-900 pb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-black uppercase tracking-tight", children: [
          "Multiplayer",
          /* @__PURE__ */ jsx("span", { className: "text-red-600", children: "." }),
          "Slice"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 uppercase tracking-[0.2em] mt-1", children: "Server-authoritative turn resolution" })
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "text-xs uppercase tracking-widest text-neutral-500 hover:text-white",
          children: "← Back"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "border border-neutral-900 bg-neutral-950 p-6 space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2", children: "Callsign" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: displayName,
            onChange: (event) => setDisplayName(event.target.value),
            className: "w-full bg-black border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-red-600",
            maxLength: 24,
            disabled: isInQueue
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-neutral-500 font-mono", children: [
        "Client ID: ",
        clientId
      ] }),
      isInQueue ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-red-600 rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-red-500", children: "Waiting for an opponent..." })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleLeaveQueue,
            disabled: isQueueing,
            className: "w-full border border-neutral-700 py-3 text-xs uppercase tracking-[0.2em] hover:border-white disabled:opacity-50",
            children: "Leave Queue"
          }
        )
      ] }) : /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleQueue,
          disabled: isQueueing,
          className: "w-full bg-white text-black py-3 text-xs font-black uppercase tracking-[0.25em] hover:bg-red-600 hover:text-white disabled:opacity-50",
          children: isQueueing ? "Connecting..." : "Find Match"
        }
      ),
      errorMessage && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 border border-red-800/70 bg-red-950/30 p-3", children: errorMessage })
    ] })
  ] }) });
}
function MultiplayerArena({ onExit }) {
  const [clientId, setClientId] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [phase, setPhase] = useState("matchmaking");
  const setMatchContext = useMultiplayerStore((s) => s.setMatchContext);
  const clearMatchContext = useMultiplayerStore((s) => s.clearMatchContext);
  useEffect(() => {
    const storageKey = "arena_async_client_id";
    const existingId = window.localStorage.getItem(storageKey);
    if (existingId) {
      setClientId(existingId);
      return;
    }
    const generatedId = typeof window.crypto.randomUUID === "function" ? window.crypto.randomUUID() : `client-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    window.localStorage.setItem(storageKey, generatedId);
    setClientId(generatedId);
  }, []);
  useEffect(() => {
    if (clientId && matchId) {
      setMatchContext(matchId, clientId);
    }
  }, [clientId, matchId, setMatchContext]);
  const lobbyStateResult = useQuery(
    clientId ? convexQuery(api.matches.getLobbyState, { clientId }) : "skip"
  );
  const lobbyState = lobbyStateResult?.data;
  useEffect(() => {
    if (lobbyState?.matchId) {
      setMatchId(lobbyState.matchId);
      setPhase("arena");
    }
  }, [lobbyState?.matchId]);
  const handleMatchFound = (foundMatchId) => {
    setMatchId(foundMatchId);
    setPhase("arena");
  };
  const handleExitArena = () => {
    clearMatchContext();
    setMatchId(null);
    setPhase("matchmaking");
    onExit();
  };
  if (!clientId) {
    return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-black text-white flex items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-neutral-400 uppercase tracking-[0.2em] text-xs", children: "Initializing client..." }) });
  }
  if (phase === "matchmaking" || !matchId) {
    return /* @__PURE__ */ jsx(
      MatchmakingScreen,
      {
        clientId,
        onMatchFound: handleMatchFound
      }
    );
  }
  return /* @__PURE__ */ jsx(
    MultiplayerArenaView,
    {
      matchId,
      clientId,
      onExit: handleExitArena
    }
  );
}
function MultiplayerArenaView({ matchId, clientId, onExit }) {
  return /* @__PURE__ */ jsx(
    ArenaView,
    {
      matchMode: { matchId, clientId },
      onAbort: onExit
    }
  );
}
function MultiplayerPage() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsx(MultiplayerArena, { onExit: () => navigate({
    to: "/"
  }) });
}
export {
  MultiplayerPage as component
};
