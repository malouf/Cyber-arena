import { Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MultiplayerArena } from "../components/arena/MultiplayerArena";

export const Route = createFileRoute("/multiplayer")({
  component: MultiplayerPage,
});

function MultiplayerPage() {
  const navigate = useNavigate();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono text-xs uppercase tracking-widest">
          Loading Multiplayer...
        </div>
      }
    >
      <MultiplayerArena onExit={() => navigate({ to: "/" })} />
    </Suspense>
  );
}
