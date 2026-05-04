import type { Ability, Soul } from "../../game/types";
import type { ActiveCommand } from "./gameStore";

type Props = {
  activeCommand: ActiveCommand;
  setActiveCommand: (cmd: ActiveCommand) => void;
  simStats: { pm: number; pa: number; mana: number };
  equippedAbilities: Array<Ability>;
  pSoul: Soul;
  cooldowns: Record<string, number>;
  disabled?: boolean;
};

export function CommandPanel({
  activeCommand,
  setActiveCommand,
  simStats,
  equippedAbilities,
  pSoul,
  cooldowns,
  disabled = false,
}: Props) {
  return (
    <div className="bg-neutral-950 border border-neutral-900 p-6 flex-shrink-0">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-4 flex justify-between">
        <span>Command Select</span>
        {activeCommand && !disabled && (
          <span className="text-red-500 animate-pulse">
            Waiting for target...
          </span>
        )}
      </h3>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        <button
          disabled={disabled || simStats.pm <= 0}
          onClick={() => setActiveCommand({ type: "move" })}
          className={`w-full py-3 flex justify-between px-4 items-center border transition-all uppercase tracking-widest text-[10px] font-bold
            ${
              !disabled && simStats.pm > 0
                ? activeCommand?.type === "move"
                  ? "bg-white text-black border-white"
                  : "bg-neutral-900 border-neutral-700 text-white hover:border-white"
                : "bg-black border-neutral-900 text-neutral-700 cursor-not-allowed"
            }
          `}
        >
          <span>Move</span>
          <span className="font-mono">PM Based</span>
        </button>

        <div className="pt-2 border-t border-neutral-900 space-y-2">
          {equippedAbilities.map((ability, index) => {
            const canAfford =
              simStats.pa >= ability.paCost &&
              simStats.mana >= ability.manaCost;
            const isUlt = ability.id === pSoul.ultimate.id;
            const isBase = ability.id === pSoul.baseAttack.id;
            const isActive =
              activeCommand?.type === "ability" &&
              activeCommand.ability.id === ability.id;
            const currentCooldown = cooldowns[ability.id] || 0;

            return (
              <div key={`${ability.id}-${index}`} className="relative group">
                <button
                  disabled={disabled || !canAfford || currentCooldown > 0}
                  onClick={() => setActiveCommand({ type: "ability", ability })}
                  className={`w-full py-3 flex flex-col px-4 border transition-all text-left relative overflow-hidden
                    ${
                      !disabled && canAfford && currentCooldown === 0
                        ? isActive
                          ? "bg-red-600/20 border-red-600 text-white"
                          : "bg-neutral-900 border-neutral-700 text-white hover:border-red-600"
                        : "bg-black border-neutral-900 text-neutral-700 cursor-not-allowed"
                    }
                  `}
                >
                  {isUlt && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-600" />
                  )}

                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                      {ability.name}
                      {isBase && (
                        <span className="text-[8px] text-neutral-500">
                          (Base)
                        </span>
                      )}
                      {isUlt && (
                        <span className="text-[8px] text-red-500">(Ult)</span>
                      )}
                    </span>
                    <div className="flex gap-2 font-mono text-[9px]">
                      {currentCooldown > 0 && (
                        <span className="text-red-500">
                          CD: {currentCooldown}
                        </span>
                      )}
                      {ability.paCost > 0 && <span>{ability.paCost}PA</span>}
                      {ability.manaCost > 0 && (
                        <span className="text-blue-500">
                          {ability.manaCost}M
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {activeCommand && !disabled && (
        <div className="mt-4 p-4 bg-neutral-900 border border-neutral-700 relative shadow-2xl">
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
  );
}
