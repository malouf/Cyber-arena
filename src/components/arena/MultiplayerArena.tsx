import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { useMultiplayerStore } from "./multiplayerStore";
import { MatchmakingScreen } from "./MatchmakingScreen";
import { ArenaView } from "./ArenaView";

type MatchmakingState = {
  matchId: string | null;
  waiting: boolean;
};

type Props = {
  onExit: () => void;
};

export function MultiplayerArena({ onExit }: Props) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"matchmaking" | "arena">("matchmaking");

  const setMatchContext = useMultiplayerStore((s) => s.setMatchContext);
  const clearMatchContext = useMultiplayerStore((s) => s.clearMatchContext);

  // Initialize client ID
  useEffect(() => {
    const storageKey = "arena_async_client_id";
    const existingId = window.localStorage.getItem(storageKey);
    if (existingId) {
      setClientId(existingId);
      return;
    }

    const generatedId =
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `client-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    window.localStorage.setItem(storageKey, generatedId);
    setClientId(generatedId);
  }, []);

  // Set match context when matchId is available
  useEffect(() => {
    if (clientId && matchId) {
      setMatchContext(matchId, clientId);
    }
  }, [clientId, matchId, setMatchContext]);

  // Query lobby state to detect match
  const lobbyStateResult = useQuery({
    ...convexQuery(api.matches.getLobbyState, { clientId: clientId ?? "" }),
    enabled: !!clientId,
  });
  const lobbyState = lobbyStateResult.data as MatchmakingState | undefined;

  // Watch for match found
  useEffect(() => {
    if (lobbyState?.matchId) {
      setMatchId(lobbyState.matchId);
      setPhase("arena");
    }
  }, [lobbyState?.matchId]);

  const handleMatchFound = (foundMatchId: string) => {
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
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-neutral-400 uppercase tracking-[0.2em] text-xs">
          Initializing client...
        </p>
      </main>
    );
  }

  if (phase === "matchmaking" || !matchId) {
    return (
      <MatchmakingScreen clientId={clientId} onMatchFound={handleMatchFound} />
    );
  }

  return (
    <MultiplayerArenaView
      matchId={matchId}
      clientId={clientId}
      onExit={handleExitArena}
    />
  );
}

type ArenaViewProps = {
  matchId: string;
  clientId: string;
  onExit: () => void;
};

function MultiplayerArenaView({ matchId, clientId, onExit }: ArenaViewProps) {
  return <ArenaView matchMode={{ matchId, clientId }} onAbort={onExit} />;
}
