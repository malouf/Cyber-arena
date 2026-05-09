import { useShallow } from "zustand/shallow";
import { useGameStore } from "./gameStore";
import { getDistance, getSimulatedResources, isCellWall } from "./selectors";
import type { Interactable } from "../../game/types";

type Props = {
  buildPassives: Array<string>;
  interactables?: Array<Interactable>;
};

export function GridRenderer({ buildPassives, interactables = [] }: Props) {
  const playerPos = useGameStore((s) => s.server.player.pos);
  const enemyPos = useGameStore((s) => s.server.enemy.pos);

  const { actionQueue, flowStateRange } = useGameStore(
    useShallow((s) => ({
      actionQueue: s.server.actionQueue,
      flowStateRange: s.server.persistentBuffs.flowStateRange,
    })),
  );

  const { activeCommand, hoveredCell, visualEffects, phase } = useGameStore(
    useShallow((s) => ({
      activeCommand: s.ui.activeCommand,
      hoveredCell: s.ui.hoveredCell,
      visualEffects: s.ui.visualEffects,
      phase: s.ui.phase,
    })),
  );

  const simStats = useGameStore(useShallow(getSimulatedResources));

  const isResolving = phase !== "planning";

  const setHoveredCell = useGameStore((s) => s.setHoveredCell);
  const handleCellClick = useGameStore((s) => s.handleCellClick);

  const gridSize = 16;
  const visionRange = 6;
  const rows = Array.from({ length: gridSize }, (_, i) => i);
  const cols = Array.from({ length: gridSize }, (_, i) => i);

  // Helper to check if a cell has an interactable
  const getInteractableAt = (x: number, y: number) => {
    return interactables.find((i) => i.pos.x === x && i.pos.y === y);
  };

  // Check if cell is a dynamic wall
  const isDynamicWall = (x: number, y: number) => {
    const int = getInteractableAt(x, y);
    return int?.type === "wall";
  };

  // Check if cell is a mana well
  const isManaWell = (x: number, y: number) => {
    const int = getInteractableAt(x, y);
    return int?.type === "mana_well";
  };

  return (
    <div className="flex-1 bg-neutral-950 border border-neutral-900 relative overflow-auto scroll-smooth flex p-4 touch-pan-x touch-pan-y cursor-grab active:cursor-grabbing">
      <div className="flex flex-col gap-1 items-center m-auto relative min-w-[800px] lg:min-w-[1000px] pb-12">
        {rows.map((y) => (
          <div
            key={y}
            className="flex gap-1 justify-center relative"
            style={{
              transform: `translateX(${y % 2 !== 0 ? "2.2%" : "-2.2%"})`,
            }}
          >
            {cols.map((x) => {
              const cell = { x, y };
              const isUnit = playerPos.x === x && playerPos.y === y;
              const isEnemyRaw = enemyPos.x === x && enemyPos.y === y;
              const isWall = isCellWall(cell);
              const isDynamicWallCell = isDynamicWall(x, y);
              const manaWell = isManaWell(x, y);
              const distFromPlayer = getDistance(playerPos, cell);
              const isVisible = distFromPlayer <= visionRange;

              const isEnemy = isEnemyRaw && isVisible;

              // Active Command Range Highlighting
              const lastPos = actionQueue.reduce((pos, action) => {
                if (action.type === "move") return action.target;
                const ability = action.ability;

                if (ability && ability.type === "move_attack")
                  return action.target;
                return pos;
              }, playerPos);
              const distance = getDistance(lastPos, cell);

              let inValidRange = false;
              if (activeCommand?.type === "move") {
                inValidRange =
                  distance > 0 &&
                  distance <= simStats.pm &&
                  !isWall &&
                  !isDynamicWallCell &&
                  !isEnemyRaw;
              } else if (activeCommand?.type === "ability") {
                let effectiveRange = activeCommand.ability.range;
                if (
                  buildPassives.includes("flow_state") &&
                  flowStateRange > 0
                ) {
                  effectiveRange += flowStateRange;
                }
                inValidRange =
                  distance <= effectiveRange &&
                  (!isWall && !isDynamicWallCell || activeCommand.ability.type === "buff");
              }

              const isHoveredValid =
                hoveredCell &&
                hoveredCell.x === x &&
                hoveredCell.y === y &&
                inValidRange;

              // Shape logic: CSS polygon for hexagon
              const hexStyle = {
                clipPath:
                  "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                width: "clamp(2rem, 4.5vw, 4rem)",
                aspectRatio: "1 / 0.866",
              };

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(cell, buildPassives)}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={hexStyle}
                  className={`
                    relative group transition-all duration-300 flex items-center justify-center
                    ${inValidRange ? "cursor-pointer" : ""}
                    ${!isVisible ? "bg-neutral-950 opacity-40" : isWall || isDynamicWallCell ? "bg-neutral-800" : "bg-neutral-900"}
                    ${isHoveredValid && isVisible ? "bg-red-600/30" : ""}
                    ${inValidRange && !isHoveredValid && isVisible ? "bg-white/10" : ""}
                  `}
                >
                  {/* Visual Effects */}
                  {visualEffects
                    .filter((e) => e.x === x && e.y === y)
                    .map((effect) => (
                      <div
                        key={effect.id}
                        className={`absolute z-50 animate-bounce font-black text-lg ${effect.color}`}
                        style={{ textShadow: "0 0 4px black" }}
                      >
                        {effect.text}
                      </div>
                    ))}

                  {/* Mana Well Indicator */}
                  {manaWell && isVisible && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className="w-3/5 h-3/5 rounded-full bg-blue-500/30 animate-pulse" />
                      <div className="absolute w-2/5 h-2/5 rounded-full bg-blue-500/50" />
                    </div>
                  )}

                  {/* Dynamic Wall Indicator (from abilities) */}
                  {isDynamicWallCell && isVisible && (
                    <div className="absolute inset-0 z-20 pointer-events-none">
                      <div className="w-full h-full bg-red-900/40 border border-red-700/50" />
                    </div>
                  )}

                  {/* Coordinates */}
                  <span className="absolute top-[20%] text-[5px] font-mono opacity-20 pointer-events-none text-white">
                    {x},{y}
                  </span>

                  {/* Inner border to simulate hex grid lines */}
                  <div
                    className="absolute inset-[1px] bg-black"
                    style={{ clipPath: hexStyle.clipPath, zIndex: 1 }}
                  />

                  {/* Fog of war overlay */}
                  {!isVisible && (
                    <div
                      className="absolute inset-0 bg-black/60 z-[2]"
                      style={{ clipPath: hexStyle.clipPath }}
                    />
                  )}

                  {/* Wall overlay */}
                  {(isWall || isDynamicWallCell) && isVisible && (
                    <div
                      className="absolute inset-1 bg-neutral-800 z-[2]"
                      style={{ clipPath: hexStyle.clipPath }}
                    />
                  )}

                  {/* Grid overlay for valid range */}
                  {inValidRange && !isHoveredValid && isVisible && (
                    <div
                      className="absolute inset-0 bg-white/5 z-10 pointer-events-none"
                      style={{ clipPath: hexStyle.clipPath }}
                    />
                  )}
                  {isHoveredValid && isVisible && (
                    <div
                      className="absolute inset-0 bg-red-600/20 z-10 pointer-events-none"
                      style={{ clipPath: hexStyle.clipPath }}
                    />
                  )}

                  {/* Player Marker */}
                  {isUnit && (
                    <div
                      className={`absolute z-30 w-[40%] h-[40%] rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] ${isResolving ? "animate-pulse" : ""}`}
                    />
                  )}

                  {/* Enemy Marker */}
                  {isEnemy && (
                    <div className="absolute z-30 w-[40%] h-[40%] bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)] flex items-center justify-center">
                      <div className="w-1/2 h-[2px] bg-black rotate-45" />
                      <div className="w-1/2 h-[2px] bg-black -rotate-45 absolute" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}