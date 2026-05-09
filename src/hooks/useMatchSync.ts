import { useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGameStore } from "../components/arena/gameStore";
import { useMultiplayerStore } from "../components/arena/multiplayerStore";
import { soulData } from "../game/data";
import type { LoadoutSlot, EntityState } from "../game/types";

type ServerMatchState = {
  playerState: EntityState & {
    loadout: {
      primarySoul: string;
      secondarySoul: string;
      selectedActives: Array<string>;
      selectedPassives: Array<string>;
      items: Array<string>;
    };
  };
  enemyState: EntityState & {
    loadout: {
      primarySoul: string;
      secondarySoul: string;
      selectedActives: Array<string>;
      selectedPassives: Array<string>;
      items: Array<string>;
    };
  };
  canSubmit: boolean;
  player1Submitted: boolean;
  player2Submitted: boolean;
  turnNumber: number;
  phase: string;
  status: string;
  winner?: string;
  latestEvents: Array<{
    type: string;
    [key: string]: unknown;
  }>;
};

function loadoutFromServer(serverLoadout: ServerMatchState["playerState"]["loadout"]): Array<LoadoutSlot> {
  const loadout: Array<LoadoutSlot> = [];
  
  const primary = serverLoadout.primarySoul as keyof typeof soulData;
  const secondary = serverLoadout.secondarySoul as keyof typeof soulData;
  
  if (!soulData[primary] || !soulData[secondary]) {
    return loadout;
  }
  
  const pSoul = soulData[primary];
  const sSoul = soulData[secondary];
  
  // Elite slot (primary's ultimate)
  loadout.push({ kind: "elite", ability: pSoul.ultimate });
  
  // Add selected actives
  for (const activeId of serverLoadout.selectedActives) {
    // Check primary soul actives
    const pActive = pSoul.actives.find(a => a.id === activeId);
    if (pActive) {
      loadout.push({ kind: "active", ability: pActive });
      continue;
    }
    // Check secondary soul actives
    const sActive = sSoul.actives.find(a => a.id === activeId);
    if (sActive) {
      loadout.push({ kind: "active", ability: sActive });
      continue;
    }
    // Check base attack
    if (pSoul.baseAttack.id === activeId) {
      loadout.push({ kind: "active", ability: pSoul.baseAttack });
    }
  }
  
  // Add selected passives
  for (const passiveId of serverLoadout.selectedPassives) {
    const pPassive = pSoul.passives.find(p => p.id === passiveId);
    if (pPassive) {
      loadout.push({ kind: "passive", passive: pPassive });
      continue;
    }
    const sPassive = sSoul.passives.find(p => p.id === passiveId);
    if (sPassive) {
      loadout.push({ kind: "passive", passive: sPassive });
    }
  }
  
  return loadout;
}

export function useMatchSync(matchId: string | null, clientId: string | null) {
  const initializeGame = useGameStore((s) => s.initializeGame);
  const clearQueue = useGameStore((s) => s.clearQueue);
  const setPendingSubmit = useMultiplayerStore((s) => s.setPendingSubmit);
  const setLastSyncedTurn = useMultiplayerStore((s) => s.setLastSyncedTurn);
  const lastSyncedTurn = useMultiplayerStore((s) => s.lastSyncedTurn);
  
  const matchState = useQuery(
    api.matches.getMatchState,
    matchId && clientId ? { matchId, clientId } : "skip"
  ) as ServerMatchState | undefined;
  
  const syncToStore = useCallback((state: ServerMatchState) => {
    // Convert server loadout format to local format
    const playerLoadout = loadoutFromServer(state.playerState.loadout);
    const enemyLoadout = loadoutFromServer(state.enemyState.loadout);
    
    // Create local entity states from server state
    const playerEntity: EntityState = {
      id: "player",
      hp: state.playerState.hp,
      maxHp: state.playerState.maxHp,
      pa: state.playerState.pa,
      maxPa: state.playerState.maxPa,
      pm: state.playerState.pm,
      maxPm: state.playerState.maxPm,
      mana: state.playerState.mana,
      maxMana: state.playerState.maxMana,
      pos: state.playerState.pos,
      passives: state.playerState.passives,
      loadout: playerLoadout,
      effects: state.playerState.effects || [],
    };
    
    const enemyEntity: EntityState = {
      id: "enemy",
      hp: state.enemyState.hp,
      maxHp: state.enemyState.maxHp,
      pa: state.enemyState.pa,
      maxPa: state.enemyState.maxPa,
      pm: state.enemyState.pm,
      maxPm: state.enemyState.maxPm,
      mana: state.enemyState.mana,
      maxMana: state.enemyState.maxMana,
      pos: state.enemyState.pos,
      passives: state.enemyState.passives,
      loadout: enemyLoadout,
      effects: state.enemyState.effects || [],
    };
    
    initializeGame(playerEntity, enemyEntity);
  }, [initializeGame]);
  
  useEffect(() => {
    if (!matchState) return;
    
    // Sync state to local store
    syncToStore(matchState);
    
    // Detect new turn
    if (matchState.turnNumber !== lastSyncedTurn) {
      setLastSyncedTurn(matchState.turnNumber);
      clearQueue();
      setPendingSubmit(false);
    }
  }, [matchState, syncToStore, clearQueue, setPendingSubmit, setLastSyncedTurn, lastSyncedTurn]);
  
  return {
    matchState,
    canSubmit: matchState?.canSubmit ?? false,
    turnNumber: matchState?.turnNumber ?? 0,
    phase: matchState?.phase ?? "planning",
    status: matchState?.status ?? "waiting",
    winner: matchState?.winner,
    latestEvents: matchState?.latestEvents ?? [],
    isLoading: matchState === undefined,
  };
}