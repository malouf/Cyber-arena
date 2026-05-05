import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { soulData } from "../../game/data";
import type { Soul, SoulId } from "../../game/types";

export type PlayerBuild = {
  primary: SoulId;
  secondary: SoulId;
  actives: Array<string>;
  passives: Array<string>;
};

type Props = {
  onComplete: (build: PlayerBuild) => void;
};

export function DraftPhase({ onComplete }: Props) {
  const [phase, setPhase] = useState<"primary" | "secondary" | "skills">(
    "primary",
  );
  const [primarySoul, setPrimarySoul] = useState<SoulId | null>(null);
  const [secondarySoul, setSecondarySoul] = useState<SoulId | null>(null);

  const [selectedActives, setSelectedActives] = useState<Array<string>>([]);
  const [selectedPassives, setSelectedPassives] = useState<Array<string>>([]);

  const handleSelectPrimary = (id: SoulId) => {
    setPrimarySoul(id);
    setPhase("secondary");
  };

  const handleSelectSecondary = (id: SoulId) => {
    setSecondarySoul(id);
    setPhase("skills");
  };

  const toggleActive = (id: string) => {
    if (selectedActives.includes(id))
      setSelectedActives((prev) => prev.filter((x) => x !== id));
    else if (selectedActives.length < 3)
      setSelectedActives((prev) => [...prev, id]);
  };

  const togglePassive = (id: string) => {
    if (selectedPassives.includes(id))
      setSelectedPassives((prev) => prev.filter((x) => x !== id));
    else if (selectedPassives.length < 2)
      setSelectedPassives((prev) => [...prev, id]);
  };

  const finalizeDraft = () => {
    if (!primarySoul || !secondarySoul) return;
    onComplete({
      primary: primarySoul,
      secondary: secondarySoul,
      actives: selectedActives,
      passives: selectedPassives,
    });
  };

  if (phase === "primary" || phase === "secondary") {
    const isPrimary = phase === "primary";
    return (
      <main className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-5xl w-full">
          <header className="mb-12 text-center">
            {isPrimary ? (
              <Link
                to="/"
                className="text-neutral-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-[0.2em] mb-8 inline-block"
              >
                ← Abort Mission
              </Link>
            ) : (
              <button
                onClick={() => setPhase("primary")}
                className="text-neutral-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-[0.2em] mb-8 inline-block"
              >
                ← Back to Primary
              </button>
            )}
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-white">
              {isPrimary ? "Select Primary Soul" : "Select Secondary Soul"}
            </h1>
            <p className="text-red-600 uppercase tracking-widest text-xs font-bold">
              {isPrimary
                ? "Determines Base Stats & Ultimate"
                : "Expands Skill Tree Options"}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.entries(soulData) as Array<[SoulId, Soul]>).map(
              ([id, soul]) => {
                const disabled = !isPrimary && id === primarySoul;
                return (
                  <button
                    key={id}
                    disabled={disabled}
                    onClick={() =>
                      isPrimary
                        ? handleSelectPrimary(id)
                        : handleSelectSecondary(id)
                    }
                    className={`p-8 border bg-black group transition-all text-left relative overflow-hidden
                    ${disabled ? "border-neutral-900 opacity-30 cursor-not-allowed" : "border-neutral-800 hover:border-red-600 cursor-pointer"}
                  `}
                  >
                    {!disabled && (
                      <div className="absolute inset-0 bg-red-600/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                    )}
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white relative z-10">
                      {soul.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-2 uppercase tracking-[0.2em] relative z-10">
                      {soul.role}
                    </p>

                    {isPrimary && (
                      <div className="mt-6 space-y-2 relative z-10">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-red-600">
                            HP {soul.baseStats.hp}
                          </span>
                          <span className="text-white">
                            PA {soul.baseStats.pa}
                          </span>
                          <span className="text-neutral-400">
                            PM {soul.baseStats.pm}
                          </span>
                          <span className="text-blue-500">
                            M {soul.baseStats.mana}
                          </span>
                        </div>
                        <p className="text-[9px] text-neutral-400 font-mono mt-4 border-t border-neutral-900 pt-2">
                          <strong className="text-white">ULT:</strong>{" "}
                          {soul.ultimate.name}
                        </p>
                      </div>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </main>
    );
  }

  if (primarySoul && secondarySoul) {
    const pSoul = soulData[primarySoul];
    const sSoul = soulData[secondarySoul];
    const availableActives = [...pSoul.actives, ...sSoul.actives];
    const availablePassives = [...pSoul.passives, ...sSoul.passives];

    const canDeploy =
      selectedActives.length === 3 && selectedPassives.length === 2;

    return (
      <main className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans">
        <header className="px-6 py-4 border-b border-neutral-900 flex justify-between items-center bg-black sticky top-0 z-50">
          <div>
            <button
              onClick={() => setPhase("secondary")}
              className="text-neutral-500 hover:text-white uppercase font-bold text-xs tracking-[0.2em] mb-1"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
              Skill Configuration
            </h1>
          </div>
          <button
            disabled={!canDeploy}
            onClick={finalizeDraft}
            className={`px-8 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors
              ${canDeploy ? "bg-white text-black hover:bg-red-600 hover:text-white" : "bg-neutral-900 text-neutral-600 cursor-not-allowed"}`}
          >
            Deploy
          </button>
        </header>

        <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 border border-neutral-900 p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">
                Core Identity
              </h2>
              <div className="p-4 border border-red-600/30 bg-red-600/5">
                <h3 className="text-2xl font-black uppercase text-white mb-1">
                  {pSoul.name}{" "}
                  <span className="text-sm text-red-600">(Primary)</span>
                </h3>
                <div className="flex gap-4 text-[10px] font-mono mt-3">
                  <span className="text-red-600">HP {pSoul.baseStats.hp}</span>
                  <span className="text-white">PA {pSoul.baseStats.pa}</span>
                  <span className="text-neutral-400">
                    PM {pSoul.baseStats.pm}
                  </span>
                  <span className="text-blue-500">
                    M {pSoul.baseStats.mana}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                Locked Abilities
              </h3>
              <div className="space-y-2">
                <div className="p-3 border border-neutral-800 bg-neutral-950">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">
                    Base Attack
                  </div>
                  <div className="text-xs font-bold text-white">
                    {pSoul.baseAttack.name}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-1">
                    {pSoul.baseAttack.desc}
                  </div>
                  <div className="text-[9px] font-mono text-red-500 mt-2">
                    DMG: {pSoul.baseAttack.damage} | RNG:{" "}
                    {pSoul.baseAttack.range}
                  </div>
                </div>
                <div className="p-3 border border-red-900/50 bg-red-900/10 relative overflow-hidden">
                  <div className="text-[10px] font-bold text-red-500 uppercase mb-1">
                    Ultimate
                  </div>
                  <div className="text-xs font-bold text-white">
                    {pSoul.ultimate.name}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-1">
                    {pSoul.ultimate.desc}
                  </div>
                  <div className="text-[9px] font-mono text-red-500 mt-2">
                    DMG: {pSoul.ultimate.damage} | RNG: {pSoul.ultimate.range} |
                    CD: {pSoul.ultimate.cooldown}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
                  Active Skills
                </h2>
                <span className="text-[10px] font-mono text-neutral-500">
                  {selectedActives.length} / 3 Selected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableActives.map((ability) => {
                  const isSelected = selectedActives.includes(ability.id);
                  const isDisabled = !isSelected && selectedActives.length >= 3;
                  return (
                    <button
                      key={ability.id}
                      disabled={isDisabled}
                      onClick={() => toggleActive(ability.id)}
                      className={`p-4 border text-left transition-all relative
                        ${isSelected ? "border-white bg-neutral-900" : "border-neutral-800 bg-black hover:border-neutral-600"}
                        ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                      )}
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-xs uppercase tracking-widest text-white">
                          {ability.name}
                        </span>
                        <div className="flex gap-2 font-mono text-[9px]">
                          {ability.paCost > 0 && (
                            <span className="text-white">
                              {ability.paCost}PA
                            </span>
                          )}
                          {ability.manaCost > 0 && (
                            <span className="text-blue-500">
                              {ability.manaCost}M
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-mono leading-relaxed mb-3">
                        {ability.desc}
                      </p>
                      <div className="flex justify-between items-center border-t border-neutral-900 pt-2">
                        <span className="text-[9px] font-mono text-red-500">
                          DMG: {ability.damage} | RNG: {ability.range}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500">
                          INIT: {ability.initiative}{" "}
                          {ability.cooldown ? `| CD: ${ability.cooldown}` : ""}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
                  Passive Synergies
                </h2>
                <span className="text-[10px] font-mono text-neutral-500">
                  {selectedPassives.length} / 2 Selected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePassives.map((passive) => {
                  const isSelected = selectedPassives.includes(passive.id);
                  const isDisabled =
                    !isSelected && selectedPassives.length >= 2;
                  return (
                    <button
                      key={passive.id}
                      disabled={isDisabled}
                      onClick={() => togglePassive(passive.id)}
                      className={`p-4 border text-left transition-all relative
                        ${isSelected ? "border-red-600 bg-red-900/10" : "border-neutral-800 bg-black hover:border-neutral-600"}
                        ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
                      )}
                      <span className="block font-bold text-xs uppercase tracking-widest text-white mb-2">
                        {passive.name}
                      </span>
                      <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                        {passive.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
