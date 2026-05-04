import { obstacles } from "../../game/data";
import { useGameStore } from "./gameStore";

type Props = {
  buildPassives: Array<string>;
};

export function GridRenderer({ buildPassives }: Props) {
  const playerPos = useGameStore((s) => s.server.player.pos);
  const enemyPos = useGameStore((s) => s.server.enemy.pos);
  const actionQueue = useGameStore((s) => s.server.actionQueue);
  const activeCommand = useGameStore((s) => s.ui.activeCommand);
  const simStats = useGameStore((s) => s.getSimulatedResources());
  const flowStateRange = useGameStore(
    (s) => s.server.persistentBuffs.flowStateRange,
  );
  const hoveredCell = useGameStore((s) => s.ui.hoveredCell);
  const visualEffects = useGameStore((s) => s.ui.visualEffects);
  const isResolving = useGameStore((s) => s.isResolving());

  const setHoveredCell = useGameStore((s) => s.setHoveredCell);
  const handleCellClick = useGameStore((s) => s.handleCellClick);

  const gridSize = 16;
  const visionRange = 6;
  const rows = Array.from({ length: gridSize }, (_, i) => i);
  const cols = Array.from({ length: gridSize }, (_, i) => i);

  const getDistance = (
    c1: { x: number; y: number },
    c2: { x: number; y: number },
  ) => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
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
              const isWall = obstacles.some((o) => o.x === x && o.y === y);
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
                  distance > 0 && distance <= simStats.pm && !isWall;
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
                  (!isWall || activeCommand.ability.type === "buff");
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
                    ${!isVisible ? "bg-neutral-950 opacity-40" : isWall ? "bg-neutral-800" : "bg-neutral-900"}
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
                  {isWall && isVisible && (
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
