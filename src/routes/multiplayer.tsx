import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MultiplayerArena } from "../components/arena/MultiplayerArena";

export const Route = createFileRoute("/multiplayer")({
  component: MultiplayerPage,
});

function MultiplayerPage() {
  const navigate = useNavigate();
  
  return (
    <MultiplayerArena onExit={() => navigate({ to: "/" })} />
  );
}