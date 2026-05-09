import type { LoadoutSlot } from "../../game/types";
import type { ActiveCommand } from "./types";

type Props = {
  activeCommand: ActiveCommand;
  setActiveCommand: (cmd: ActiveCommand) => void;
  simStats: { pm: number; pa: number; mana: number };
  loadout: Array<LoadoutSlot>;
  cooldowns: Record<string, number>;
  disabled?: boolean;
};

export function CommandPanel({
  activeCommand,
  setActiveCommand,
  simStats,
  loadout,
  cooldowns,
  disabled = false,
}: Props) {
  const passiveSlots = loadout.filter((s) => s.kind === "passive");

  const getSlotLabel = (slot: LoadoutSlot, index: number) => {
    if (slot.kind === "elite") return "ELITE";
    if (slot.kind === "passive") return `P${index + 1}`;
    return `${index + 1}`;
  };

  return (
    <div className="bg-neutral-950 border border-neutral-900 p-4 flex-shrink-0">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-3 flex justify-between">
        <span>Loadout Commands</span>
        {activeCommand && !disabled && (
          <span className="text-red-500 animate-pulse">
            Waiting for target...
          </span>
        )}
      </h3>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {loadout.map((slot, index) => {
          if (slot.kind === "passive") {
            return (
              <div
                key={`passive-${slot.passive.id}`}
                className="p-2 border border-red-900/30 bg-red-900/5 text-center"
                title={slot.passive.desc}
              >
                <div className="text-[7px] text-red-600 uppercase mb-1">
                  {getSlotLabel(slot, index)}
                </div>
                <div className="text-[8px] font-bold text-red-400 truncate">
                  {slot.passive.name}
                </div>
              </div>
            );
          }

          const ability = slot.ability;
          const canAfford =
            simStats.pa >= ability.paCost && simStats.mana >= ability.manaCost;
          const isElite = slot.kind === "elite";
          const isActive =
            activeCommand?.type === "ability" &&
            activeCommand.ability.id === ability.id;
          const currentCooldown = cooldowns[ability.id] || 0;
          const canUse = !disabled && canAfford && currentCooldown === 0;

          return (
            <button
              key={ability.id}
              disabled={!canUse}
              onClick={() => setActiveCommand({ type: "ability", ability })}
              className={`p-2 border transition-all text-left relative ${isElite ? "border-red-600/50 bg-red-900/10" : "border-neutral-800 bg-neutral-900"} ${canUse ? (isActive ? "border-white bg-neutral-800" : "hover:border-neutral-500") : "opacity-40 cursor-not-allowed"}`}
              title={`${ability.name}\n${ability.desc}\nPA: ${ability.paCost} | M: ${ability.manaCost} | CD: ${ability.cooldown || 0}`}
            >
              {isElite && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
              )}
              {isActive && (
                <div className="absolute top-0 right-0 w-1 h-full bg-white" />
              )}
              <div className="text-[8px] text-neutral-500 uppercase mb-0.5">
                {getSlotLabel(slot, index)}
              </div>
              <div
                className={`text-[9px] font-bold truncate ${isElite ? "text-red-400" : "text-white"}`}
              >
                {ability.name}
              </div>
              <div className="flex justify-between mt-1">
                {currentCooldown > 0 && (
                  <span className="text-[7px] text-red-500">
                    CD:{currentCooldown}
                  </span>
                )}
                {ability.paCost > 0 && (
                  <span className="text-[7px] text-neutral-400">
                    {ability.paCost}PA
                  </span>
                )}
                {ability.manaCost > 0 && (
                  <span className="text-[7px] text-blue-500">
                    {ability.manaCost}M
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-neutral-900 pt-3">
        <button
          disabled={disabled || simStats.pm <= 0}
          onClick={() => setActiveCommand({ type: "move" })}
          className={`w-full py-2 flex justify-between px-3 items-center border transition-all uppercase tracking-widest text-[10px] font-bold mb-2 ${!disabled && simStats.pm > 0 ? (activeCommand?.type === "move" ? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-700 text-white hover:border-white") : "bg-black border-neutral-900 text-neutral-700 cursor-not-allowed"}`}
        >
          <span>Move</span>
          <span className="font-mono">PM Based</span>
        </button>

        {activeCommand && !disabled && (
          <div className="p-3 bg-neutral-900 border border-neutral-700 relative shadow-2xl">
            {activeCommand.type === "move" ? (
              <>
                <h4 className="text-[10px] font-bold text-white uppercase mb-1">
                  Move
                </h4>
                <p className="text-[9px] text-neutral-400 uppercase leading-relaxed">
                  Reposition unit. Costs PM based on distance.
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-between mb-2 pb-2 border-b border-neutral-800">
                  <span className="text-[10px] font-bold text-white uppercase">
                    {activeCommand.ability.name}
                  </span>
                  <span className="text-[8px] font-mono text-neutral-500">
                    Init: {activeCommand.ability.initiative}
                  </span>
                </div>
                <p className="text-[9px] text-neutral-400 uppercase leading-relaxed mb-2">
                  {activeCommand.ability.desc}
                </p>
                <div className="flex justify-between">
                  <span className="text-[9px] text-red-500 font-mono">
                    RNG: {activeCommand.ability.range} | DMG:{" "}
                    {activeCommand.ability.damage}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {activeCommand.ability.cooldown &&
                      `CD: ${activeCommand.ability.cooldown} `}
                    {activeCommand.ability.maxUsesPerTurn &&
                      `Max/Turn: ${activeCommand.ability.maxUsesPerTurn}`}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {passiveSlots.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-900">
          <h4 className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2">
            Active Passives
          </h4>
          <div className="flex flex-wrap gap-1">
            {passiveSlots.map((slot) => (
              <span
                key={slot.passive.id}
                className="text-[8px] px-2 py-1 bg-red-900/20 border border-red-900/30 text-red-400"
                title={slot.passive.desc}
              >
                {slot.passive.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
