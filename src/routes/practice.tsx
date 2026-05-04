/* eslint-disable import/consistent-type-specifier-style */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DraftPhase, type PlayerBuild } from "../components/arena/DraftPhase";
import { ArenaView } from "../components/arena/ArenaView";
import type { ArenaPhase } from "../components/arena/gameStore";

type PracticePhase = "drafting" | ArenaPhase;

export const Route = createFileRoute("/practice")({
  component: PracticeArena,
});

function PracticeArena() {
  const [build, setBuild] = useState<PlayerBuild | null>(null);
  const [phase, setPhase] = useState<PracticePhase>("drafting");

  if (!build || phase === "drafting") {
    return (
      <DraftPhase
        onComplete={(nextBuild) => {
          setBuild(nextBuild);
          setPhase("planning");
        }}
      />
    );
  }

  return (
    <ArenaView
      build={build}
      onPhaseChange={setPhase}
      onAbort={() => {
        setBuild(null);
        setPhase("drafting");
      }}
    />
  );
}
