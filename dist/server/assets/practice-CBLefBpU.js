import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { s as soulData, A as ArenaView } from "./ArenaView-BIFbbCQh.js";
import "zustand/shallow";
import "convex/react";
import "zustand";
import "zustand/middleware/immer";
function DraftPhase({ onComplete }) {
  const [phase, setPhase] = useState(
    "primary"
  );
  const [primarySoul, setPrimarySoul] = useState(null);
  const [secondarySoul, setSecondarySoul] = useState(null);
  const [selectedLoadout, setSelectedLoadout] = useState([]);
  const handleSelectPrimary = (id) => {
    setPrimarySoul(id);
    setPhase("secondary");
  };
  const handleSelectSecondary = (id) => {
    if (id === primarySoul) return;
    setSecondarySoul(id);
    setPhase("loadout");
  };
  const availableSlots = useMemo(() => {
    if (!primarySoul || !secondarySoul) return [];
    const pSoul = soulData[primarySoul];
    const sSoul = soulData[secondarySoul];
    const slots = [];
    slots.push({ kind: "elite", ability: pSoul.ultimate });
    pSoul.actives.forEach((a) => {
      slots.push({ kind: "active", ability: a });
    });
    sSoul.actives.forEach((a) => {
      slots.push({ kind: "active", ability: a });
    });
    pSoul.passives.forEach((p) => {
      slots.push({ kind: "passive", passive: p });
    });
    sSoul.passives.forEach((p) => {
      slots.push({ kind: "passive", passive: p });
    });
    slots.push({ kind: "active", ability: pSoul.baseAttack });
    return slots;
  }, [primarySoul, secondarySoul]);
  const toggleSlot = (slotId) => {
    if (selectedLoadout.includes(slotId)) {
      setSelectedLoadout((prev) => prev.filter((x) => x !== slotId));
    } else if (selectedLoadout.length < 7) {
      setSelectedLoadout((prev) => [...prev, slotId]);
    }
  };
  const finalizeDraft = () => {
    if (!primarySoul || !secondarySoul) return;
    if (selectedLoadout.length !== 7) return;
    const loadout = [];
    loadout.push({ kind: "elite", ability: soulData[primarySoul].ultimate });
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
      loadout
    });
  };
  const canDeploy = primarySoul && secondarySoul && selectedLoadout.length === 7;
  if (phase === "primary" || phase === "secondary") {
    const isPrimary = phase === "primary";
    return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6 font-sans", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl w-full", children: [
      /* @__PURE__ */ jsxs("header", { className: "mb-12 text-center", children: [
        isPrimary ? /* @__PURE__ */ jsx(
          Link,
          {
            to: "/",
            className: "text-neutral-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-[0.2em] mb-8 inline-block",
            children: "← Abort Mission"
          }
        ) : /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setPhase("primary"),
            className: "text-neutral-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-[0.2em] mb-8 inline-block",
            children: "← Back to Primary"
          }
        ),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black uppercase tracking-tighter mb-2 text-white", children: isPrimary ? "Select Primary Soul" : "Select Secondary Soul" }),
        /* @__PURE__ */ jsx("p", { className: "text-red-600 uppercase tracking-widest text-xs font-bold", children: isPrimary ? "Determines Base Stats & Ultimate" : "Expands Skill Tree Options" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: Object.entries(soulData).map(
        ([id, soul]) => {
          const disabled = !isPrimary && id === primarySoul;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              disabled,
              onClick: () => isPrimary ? handleSelectPrimary(id) : handleSelectSecondary(id),
              className: `p-8 border bg-black group transition-all text-left relative overflow-hidden
                    ${disabled ? "border-neutral-900 opacity-30 cursor-not-allowed" : "border-neutral-800 hover:border-red-600 cursor-pointer"}
                  `,
              children: [
                !disabled && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-red-600/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" }),
                /* @__PURE__ */ jsx("h3", { className: "text-3xl font-black uppercase tracking-tighter text-white relative z-10", children: soul.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 mt-2 uppercase tracking-[0.2em] relative z-10", children: soul.role }),
                isPrimary && /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] font-mono", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                      "HP ",
                      soul.baseStats.hp
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
                      "PA ",
                      soul.baseStats.pa
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-neutral-400", children: [
                      "PM ",
                      soul.baseStats.pm
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-blue-500", children: [
                      "M ",
                      soul.baseStats.mana
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-neutral-400 font-mono mt-4 border-t border-neutral-900 pt-2", children: [
                    /* @__PURE__ */ jsx("strong", { className: "text-white", children: "ULT:" }),
                    " ",
                    soul.ultimate.name
                  ] })
                ] })
              ]
            },
            id
          );
        }
      ) })
    ] }) });
  }
  if (primarySoul && secondarySoul) {
    const pSoul = soulData[primarySoul];
    const sSoul = soulData[secondarySoul];
    const selectableSlots = availableSlots.filter((s) => s.kind !== "elite");
    const eliteSlot = availableSlots.find((s) => s.kind === "elite");
    const activeSlots = selectableSlots.filter((s) => s.kind === "active");
    const passiveSlots = selectableSlots.filter((s) => s.kind === "passive");
    return /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-black text-neutral-100 flex flex-col font-sans", children: [
      /* @__PURE__ */ jsxs("header", { className: "px-6 py-4 border-b border-neutral-900 flex justify-between items-center bg-black sticky top-0 z-50", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setPhase("secondary"),
              className: "text-neutral-500 hover:text-white uppercase font-bold text-xs tracking-[0.2em] mb-1",
              children: "← Back"
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-black uppercase tracking-tighter text-white", children: "Configure Loadout" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 mt-1", children: "8 Slots: 1 Elite (auto) + 7 Selectable" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            disabled: !canDeploy,
            onClick: finalizeDraft,
            className: `px-8 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors
              ${canDeploy ? "bg-white text-black hover:bg-red-600 hover:text-white" : "bg-neutral-900 text-neutral-600 cursor-not-allowed"}`,
            children: [
              "Deploy (",
              selectedLoadout.length,
              "/7)"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-1 border border-neutral-900 p-6 flex flex-col gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4", children: "Core Identity" }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 border border-red-600/30 bg-red-600/5", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xl font-black uppercase text-white mb-1", children: [
                pSoul.name,
                " ",
                /* @__PURE__ */ jsx("span", { className: "text-sm text-red-600", children: "(Primary)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-[10px] font-mono mt-3", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                  "HP ",
                  pSoul.baseStats.hp
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
                  "PA ",
                  pSoul.baseStats.pa
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-neutral-400", children: [
                  "PM ",
                  pSoul.baseStats.pm
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-blue-500", children: [
                  "M ",
                  pSoul.baseStats.mana
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 border border-neutral-800 mt-2 bg-neutral-950", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-black uppercase text-neutral-300 mb-1", children: [
                sSoul.name,
                " ",
                /* @__PURE__ */ jsx("span", { className: "text-sm text-neutral-500", children: "(Secondary)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-[10px] font-mono mt-3", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-red-600", children: [
                  "HP ",
                  sSoul.baseStats.hp
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
                  "PA ",
                  sSoul.baseStats.pa
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-neutral-400", children: [
                  "PM ",
                  sSoul.baseStats.pm
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-blue-500", children: [
                  "M ",
                  sSoul.baseStats.mana
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2", children: "Elite Slot (Auto)" }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 border border-red-900/50 bg-red-900/10 relative overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-red-600" }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-red-500 uppercase mb-1", children: "Ultimate" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-white", children: eliteSlot.ability.name }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono text-neutral-500 mt-1", children: eliteSlot.ability.desc }),
              /* @__PURE__ */ jsxs("div", { className: "text-[9px] font-mono text-red-500 mt-2", children: [
                "DMG: ",
                eliteSlot.ability.damage,
                " | RNG:",
                " ",
                eliteSlot.ability.range,
                " | CD: ",
                eliteSlot.ability.cooldown
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 flex flex-col gap-8", children: [
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-4", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-white uppercase tracking-[0.2em]", children: "Active Abilities" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-neutral-500", children: [
                activeSlots.filter(
                  (s) => selectedLoadout.includes(s.ability.id)
                ).length,
                " ",
                "/ 4 Selected"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: activeSlots.map((slot) => {
              const ability = slot.ability;
              const isSelected = selectedLoadout.includes(ability.id);
              const isDisabled = !isSelected && selectedLoadout.length >= 7;
              const isPrimaryAbility = pSoul.actives.some((a) => a.id === ability.id) || ability.id === pSoul.baseAttack.id;
              const isBase = ability.id === pSoul.baseAttack.id;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  disabled: isDisabled,
                  onClick: () => toggleSlot(ability.id),
                  className: `p-4 border text-left transition-all relative
                        ${isSelected ? "border-white bg-neutral-900" : "border-neutral-800 bg-black hover:border-neutral-600"}
                        ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}
                      `,
                  children: [
                    isSelected && /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 bottom-0 w-1 bg-white" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-xs uppercase tracking-widest text-white", children: ability.name }),
                      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 font-mono text-[9px]", children: [
                        ability.paCost > 0 && /* @__PURE__ */ jsxs("span", { className: "text-white", children: [
                          ability.paCost,
                          "PA"
                        ] }),
                        ability.manaCost > 0 && /* @__PURE__ */ jsxs("span", { className: "text-blue-500", children: [
                          ability.manaCost,
                          "M"
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-400 font-mono leading-relaxed mb-3", children: ability.desc }),
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-neutral-900 pt-2", children: [
                      /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-mono text-red-500", children: [
                        "DMG: ",
                        ability.damage,
                        " | RNG: ",
                        ability.range
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono text-neutral-500", children: isBase ? "(Base)" : isPrimaryAbility ? "(Primary)" : "(Secondary)" })
                    ] })
                  ]
                },
                ability.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-4", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-white uppercase tracking-[0.2em]", children: "Passive Synergies" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-neutral-500", children: [
                passiveSlots.filter(
                  (s) => selectedLoadout.includes(s.passive.id)
                ).length,
                " ",
                "/ 3 Selected"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: passiveSlots.map((slot) => {
              const passive = slot.passive;
              const isSelected = selectedLoadout.includes(passive.id);
              const isDisabled = !isSelected && selectedLoadout.length >= 7;
              const isPrimaryPassive = pSoul.passives.some(
                (p) => p.id === passive.id
              );
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  disabled: isDisabled,
                  onClick: () => toggleSlot(passive.id),
                  className: `p-4 border text-left transition-all relative
                        ${isSelected ? "border-red-600 bg-red-900/10" : "border-neutral-800 bg-black hover:border-neutral-600"}
                        ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}
                      `,
                  children: [
                    isSelected && /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 bottom-0 w-1 bg-red-600" }),
                    /* @__PURE__ */ jsx("span", { className: "block font-bold text-xs uppercase tracking-widest text-white mb-2", children: passive.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-400 font-mono leading-relaxed", children: passive.desc }),
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono text-neutral-500 mt-2 block", children: isPrimaryPassive ? "(Primary)" : "(Secondary)" })
                  ]
                },
                passive.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "border-t border-neutral-900 pt-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-white uppercase tracking-[0.2em] mb-4", children: "Current Loadout Preview" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 md:grid-cols-8 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-2 border border-red-900/50 bg-red-900/10 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[8px] text-red-500 uppercase mb-1", children: "Elite" }),
                /* @__PURE__ */ jsx("div", { className: "text-[9px] font-bold text-white truncate", children: eliteSlot.ability.name })
              ] }),
              Array.from({ length: 7 }, (_, i) => {
                const selectedSlot = selectedLoadout[i];
                let slotInfo = null;
                if (selectedSlot) {
                  const slot = availableSlots.find((s) => {
                    if (s.kind === "active" && s.ability.id === selectedSlot)
                      return true;
                    if (s.kind === "passive" && s.passive.id === selectedSlot)
                      return true;
                    return false;
                  });
                  if (slot) {
                    slotInfo = slot;
                  }
                }
                return /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: `p-2 border text-center ${slotInfo ? slotInfo.kind === "passive" ? "border-red-600/50 bg-red-900/5" : "border-neutral-700 bg-neutral-900" : "border-neutral-900 bg-black"}`,
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "text-[8px] text-neutral-600 uppercase mb-1", children: i + 1 }),
                      /* @__PURE__ */ jsx("div", { className: "text-[9px] font-bold text-neutral-500 truncate", children: slotInfo ? slotInfo.kind === "passive" ? slotInfo.passive.name : slotInfo.ability.name : "---" })
                    ]
                  },
                  i
                );
              })
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  return null;
}
function PracticeArena() {
  const [build, setBuild] = useState(null);
  const [phase, setPhase] = useState("drafting");
  if (!build || phase === "drafting") {
    return /* @__PURE__ */ jsx(DraftPhase, { onComplete: (nextBuild) => {
      setBuild(nextBuild);
      setPhase("planning");
    } });
  }
  return /* @__PURE__ */ jsx(ArenaView, { build, onPhaseChange: setPhase, onAbort: () => {
    setBuild(null);
    setPhase("drafting");
  } });
}
export {
  PracticeArena as component
};
