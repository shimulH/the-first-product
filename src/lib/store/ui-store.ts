import { create } from "zustand";

type QueueView = "all" | "assigned_to_me" | "unassigned";

interface UiState {
  queueView: QueueView;
  selectedEntityId: string | null;
  setQueueView: (view: QueueView) => void;
  setSelectedEntityId: (entityId: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  queueView: "all",
  selectedEntityId: null,
  setQueueView: (view) => set({ queueView: view }),
  setSelectedEntityId: (entityId) => set({ selectedEntityId: entityId }),
}));
