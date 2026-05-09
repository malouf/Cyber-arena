import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DraftPhase } from "./DraftPhase";
import type { PlayerBuild } from "./DraftPhase";

type Props = {
  clientId: string;
  onMatchFound?: (matchId: string) => void;
};

export function MatchmakingScreen({ clientId }: Props) {
  const queueForMatch = useMutation(api.matches.queueForMatch);
  const leaveQueue = useMutation(api.matches.leaveQueue);

  const [displayName, setDisplayName] = useState("");
  const [isQueueing, setIsQueueing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<PlayerBuild | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem("arena_async_display_name");
    if (existing) {
      setDisplayName(existing);
      return;
    }
    setDisplayName(`Pilot-${clientId.slice(0, 4)}`);
  }, [clientId]);

  const normalizedName = displayName.trim() || `Pilot-${clientId.slice(0, 4)}`;

  const handleQueue = async (build: PlayerBuild) => {
    setErrorMessage(null);
    setIsQueueing(true);
    try {
      window.localStorage.setItem("arena_async_display_name", normalizedName);

      // Transform build to match Convex validator
      const slots = build.loadout.map((slot) => {
        if (slot.kind === "passive") {
          return { kind: "passive" as const, passiveId: slot.passive.id };
        } else {
          return { kind: slot.kind, abilityId: slot.ability.id };
        }
      });

      await queueForMatch({
        clientId,
        displayName: normalizedName,
        primarySoul: build.primary,
        secondarySoul: build.secondary,
        slots: slots,
        items: [],
        mode: "1v1",
        type: "casual",
      });
      setIsInQueue(true);
      setShowDraft(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to queue.",
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
        error instanceof Error ? error.message : "Unable to leave queue.",
      );
    } finally {
      setIsQueueing(false);
    }
  };

  if (showDraft) {
    return <DraftPhase onComplete={(build) => handleQueue(build)} />;
  }

  return (
    <main className="min-h-screen bg-black text-neutral-100 font-sans p-6 md:p-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              Multiplayer<span className="text-red-600">.</span>Slice
            </h1>
            <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] mt-1">
              Server-authoritative turn resolution
            </p>
          </div>
          <Link
            to="/"
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            ← Back
          </Link>
        </header>

        <section className="border border-neutral-900 bg-neutral-950 p-6 space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
              Callsign
            </label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full bg-black border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-red-600"
              maxLength={24}
              disabled={isInQueue}
            />
          </div>

          <div className="text-xs text-neutral-500 font-mono">
            Client ID: {clientId}
          </div>

          {isInQueue ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <p className="text-xs uppercase tracking-[0.2em] text-red-500">
                  Waiting for an opponent...
                </p>
              </div>
              <button
                onClick={handleLeaveQueue}
                disabled={isQueueing}
                className="w-full border border-neutral-700 py-3 text-xs uppercase tracking-[0.2em] hover:border-white disabled:opacity-50"
              >
                Leave Queue
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDraft(true)}
              disabled={isQueueing}
              className="w-full bg-white text-black py-3 text-xs font-black uppercase tracking-[0.25em] hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              {isQueueing ? "Connecting..." : "Select Soul & Find Match"}
            </button>
          )}

          {errorMessage && (
            <p className="text-xs text-red-500 border border-red-800/70 bg-red-950/30 p-3">
              {errorMessage}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
