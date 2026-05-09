import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { soulData } from "../../game/data";
import type { LoadoutSlot, Soul, SoulId } from "../../game/types";

export type PlayerBuild = {
  primary: SoulId;
  secondary: SoulId;
  loadout: Array<LoadoutSlot>;
};

type Props = {
  onComplete: (build: PlayerBuild) => void;
};

export function DraftPhase({ onComplete }: Props) {
  const [phase, setPhase] = useState<"primary" | "secondary" | "loadout">(
    "primary",
  );
  const [primarySoul, setPrimarySoul] = useState<SoulId | null>(null);
  const [secondarySoul, setSecondarySoul] = useState<SoulId | null>(null);

  // Loadout selection: 8 slots
  // Slot 0: Elite (Primary's Ultimate) - auto-selected
  // Slots 1-7: 7 selectable abilities/passives from both souls
  const [selectedLoadout, setSelectedLoadout] = useState<Array<string>>([]);

  const handleSelectPrimary = (id: SoulId) => {
    setPrimarySoul(id);
    setPhase("secondary");
  };

  const handleSelectSecondary = (id: SoulId) => {
    // Cannot be the same as primary
    if (id === primarySoul) return;
    setSecondarySoul(id);
    setPhase("loadout");
  };

  // Get available abilities and passives from both souls
  const availableSlots = useMemo(() => {
    if (!primarySoul || !secondarySoul) return [];

    const pSoul = soulData[primarySoul];
    const sSoul = soulData[secondarySoul];

    const slots: Array<LoadoutSlot> = [];

    // Slot 0: Elite (primary's ultimate) - auto included
    slots.push({ kind: "elite", ability: pSoul.ultimate });

    // Actives from both souls
    pSoul.actives.forEach((a) => {
      slots.push({ kind: "active", ability: a });
    });
    sSoul.actives.forEach((a) => {
      slots.push({ kind: "active", ability: a });
    });

    // Passives from both souls
    pSoul.passives.forEach((p) => {
      slots.push({ kind: "passive", passive: p });
    });
    sSoul.passives.forEach((p) => {
      slots.push({ kind: "passive", passive: p });
    });

    // Base attack from primary (always available)
    slots.push({ kind: "active", ability: pSoul.baseAttack });

    return slots;
  }, [primarySoul, secondarySoul]);

  const toggleSlot = (slotId: string) => {
    if (selectedLoadout.includes(slotId)) {
      setSelectedLoadout((prev) => prev.filter((x) => x !== slotId));
    } else if (selectedLoadout.length < 7) {
      // 7 selectable slots (slot 0 is elite)
      setSelectedLoadout((prev) => [...prev, slotId]);
    }
  };

  const finalizeDraft = () => {
    if (!primarySoul || !secondarySoul) return;
    if (selectedLoadout.length !== 7) return;

    // Build the loadout array
    const loadout: Array<LoadoutSlot> = [];

    // Add elite slot first
    loadout.push({ kind: "elite", ability: soulData[primarySoul].ultimate });

    // Add selected slots
    for (const slotId of selectedLoadout) {
      const slot = availableSlots.find((s) => {
        if (s.kind === "elite") return false;
        if (s.kind === "active" && s.ability.id === slotId) return true;
        if (s.kind === "passive" && s.passive.id === slotId) return true;
        return false;
      });
      if (slot) loadout.push(slot);
    }

    onComplete({
      primary: primarySoul,
      secondary: secondarySoul,
      loadout,
    });
  };

  const canDeploy =
    primarySoul &&
    secondarySoul &&
    selectedLoadout.length === 7;

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

    // Separate elite from selectable options
    const selectableSlots = availableSlots.filter((s) => s.kind !== "elite");

    // Group by type for display
    const eliteSlot = availableSlots.find((s) => s.kind === "elite")!;
    const activeSlots = selectableSlots.filter((s) => s.kind === "active");
    const passiveSlots = selectableSlots.filter((s) => s.kind === "passive");

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
              Configure Loadout
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              8 Slots: 1 Elite (auto) + 7 Selectable
            </p>
          </div>
          <button
            disabled={!canDeploy}
            onClick={finalizeDraft}
            className={`px-8 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors
              ${canDeploy ? "bg-white text-black hover:bg-red-600 hover:text-white" : "bg-neutral-900 text-neutral-600 cursor-not-allowed"}`}
          >
            Deploy ({selectedLoadout.length}/7)
          </button>
        </header>

        <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Core Identity */}
          <div className="lg:col-span-1 border border-neutral-900 p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">
                Core Identity
              </h2>
              <div className="p-4 border border-red-600/30 bg-red-600/5">
                <h3 className="text-xl font-black uppercase text-white mb-1">
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
              <div className="p-4 border border-neutral-800 mt-2 bg-neutral-950">
                <h3 className="text-lg font-black uppercase text-neutral-300 mb-1">
                  {sSoul.name}{" "}
                  <span className="text-sm text-neutral-500">(Secondary)</span>
                </h3>
                <div className="flex gap-4 text-[10px] font-mono mt-3">
                  <span className="text-red-600">HP {sSoul.baseStats.hp}</span>
                  <span className="text-white">PA {sSoul.baseStats.pa}</span>
                  <span className="text-neutral-400">
                    PM {sSoul.baseStats.pm}
                  </span>
                  <span className="text-blue-500">
                    M {sSoul.baseStats.mana}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                Elite Slot (Auto)
              </h3>
              <div className="p-3 border border-red-900/50 bg-red-900/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                <div className="text-[10px] font-bold text-red-500 uppercase mb-1">
                  Ultimate
                </div>
                <div className="text-xs font-bold text-white">
                  {eliteSlot.ability.name}
                </div>
                <div className="text-[10px] font-mono text-neutral-500 mt-1">
                  {eliteSlot.ability.desc}
                </div>
                <div className="text-[9px] font-mono text-red-500 mt-2">
                  DMG: {eliteSlot.ability.damage} | RNG: {eliteSlot.ability.range} |
                  CD: {eliteSlot.ability.cooldown}
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns: Selectable Slots */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Actives Section */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
                  Active Abilities
                </h2>
                <span className="text-[10px] font-mono text-neutral-500">
                  {activeSlots.filter(s => 
                    s.kind === "active" && selectedLoadout.includes(s.ability.id)
                  ).length} / 4 Selected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSlots.map((slot) => {
                  const ability = slot.ability;
                  const isSelected = selectedLoadout.includes(ability.id);
                  const isDisabled = !isSelected && selectedLoadout.length >= 7;
                  const isPrimaryAbility = pSoul.actives.some(a => a.id === ability.id) || ability.id === pSoul.baseAttack.id;
                  const isBase = ability.id === pSoul.baseAttack.id;

                  return (
                    <button
                      key={ability.id}
                      disabled={isDisabled}
                      onClick={() => toggleSlot(ability.id)}
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
                          {isBase ? "(Base)" : isPrimaryAbility ? "(Primary)" : "(Secondary)"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Passives Section */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
                  Passive Synergies
                </h2>
                <span className="text-[10px] font-mono text-neutral-500">
                  {passiveSlots.filter(s => 
                    s.kind === "passive" && selectedLoadout.includes(s.passive.id)
                  ).length} / 3 Selected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {passiveSlots.map((slot) => {
                  const passive = slot.passive;
                  const isSelected = selectedLoadout.includes(passive.id);
                  const isDisabled = !isSelected && selectedLoadout.length >= 7;
                  const isPrimaryPassive = pSoul.passives.some(p => p.id === passive.id);

                  return (
                    <button
                      key={passive.id}
                      disabled={isDisabled}
                      onClick={() => toggleSlot(passive.id)}
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
                      <span className="text-[9px] font-mono text-neutral-500 mt-2 block">
                        {isPrimaryPassive ? "(Primary)" : "(Secondary)"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Current Loadout Preview */}
            <section className="border-t border-neutral-900 pt-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-4">
                Current Loadout Preview
              </h2>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {/* Slot 0: Elite */}
                <div className="p-2 border border-red-900/50 bg-red-900/10 text-center">
                  <div className="text-[8px] text-red-500 uppercase mb-1">Elite</div>
                  <div className="text-[9px] font-bold text-white truncate">
                    {eliteSlot.ability.name}
                  </div>
                </div>
                {/* Slots 1-7: Selected */}
                {Array.from({ length: 7 }, (_, i) => {
                  const selectedSlot = selectedLoadout[i];
                  let slotInfo = null;
                  
                  if (selectedSlot) {
                    const slot = availableSlots.find(s => {
                      if (s.kind === "active" && s.ability.id === selectedSlot) return true;
                      if (s.kind === "passive" && s.passive.id === selectedSlot) return true;
                      return false;
                    });
                    if (slot) {
                      slotInfo = slot;
                    }
                  }
                  
                  return (
                    <div
                      key={i}
                      className={`p-2 border text-center ${
                        slotInfo
                          ? slotInfo.kind === "passive"
                            ? "border-red-600/50 bg-red-900/5"
                            : "border-neutral-700 bg-neutral-900"
                          : "border-neutral-900 bg-black"
                      }`}
                    >
                      <div className="text-[8px] text-neutral-600 uppercase mb-1">
                        {i + 1}
                      </div>
                      <div className="text-[9px] font-bold text-neutral-500 truncate">
                        {slotInfo
                          ? slotInfo.kind === "passive"
                            ? slotInfo.passive.name
                            : slotInfo.ability.name
                          : "---"}
                      </div>
                    </div>
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