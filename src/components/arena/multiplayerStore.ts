import { create } from "zustand";

export type QueueAction = {
  type: "move" | "ability";
  target: { x: number; y: number };
  abilityId?: string;
};

type MultiplayerStore = {
  matchId: string | null;
  clientId: string | null;
  isQueueing: boolean;
  queue: Array<QueueAction>;
  pendingSubmit: boolean;
  lastSyncedTurn: number;
  
  setMatchContext: (matchId: string, clientId: string) => void;
  clearMatchContext: () => void;
  setQueueing: (isQueueing: boolean) => void;
  addToQueue: (action: QueueAction) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setPendingSubmit: (pending: boolean) => void;
  setLastSyncedTurn: (turn: number) => void;
};

export const useMultiplayerStore = create<MultiplayerStore>((set) => ({
  matchId: null,
  clientId: null,
  isQueueing: false,
  queue: [],
  pendingSubmit: false,
  lastSyncedTurn: 0,

  setMatchContext: (matchId, clientId) =>
    set({ matchId, clientId }),

  clearMatchContext: () =>
    set({
      matchId: null,
      clientId: null,
      queue: [],
      pendingSubmit: false,
      lastSyncedTurn: 0,
    }),

  setQueueing: (isQueueing) =>
    set({ isQueueing }),

  addToQueue: (action) =>
    set((state) => ({
      queue: [...state.queue, action],
    })),

  removeFromQueue: (index) =>
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index),
    })),

  clearQueue: () =>
    set({ queue: [] }),

  setPendingSubmit: (pending) =>
    set({ pendingSubmit: pending }),

  setLastSyncedTurn: (turn) =>
    set({ lastSyncedTurn: turn }),
}));