import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimelineItem } from '@/types/timeline';
import { recordMigration } from '@/lib/migration-events';

interface TimelineState {
  customItems: TimelineItem[];
  addCustomItem: (item: TimelineItem) => void;
  updateCustomItem: (id: string, updates: Partial<Omit<TimelineItem, 'id' | 'isCustom'>>) => void;
  removeCustomItem: (id: string) => void;
}

export type PersistedTimeline = { customItems: TimelineItem[] };

export const TIMELINE_STORE_VERSION = 1;

function toPersistedTimeline(raw: unknown): PersistedTimeline {
  const state = (raw ?? {}) as Partial<TimelineState>;
  return {
    customItems: Array.isArray(state.customItems) ? state.customItems : [],
  };
}

export function migrateTimelineStorage(
  persistedState: unknown,
  version: number
): PersistedTimeline {
  if (version === TIMELINE_STORE_VERSION) {
    return toPersistedTimeline(persistedState);
  }
  if (version === 0) {
    recordMigration({
      store_name: 'timeline',
      from_version: 0,
      to_version: TIMELINE_STORE_VERSION,
    });
    return toPersistedTimeline(persistedState);
  }
  recordMigration({
    store_name: 'timeline',
    failed: true,
    persisted_version: version,
    current_version: TIMELINE_STORE_VERSION,
  });
  throw new Error(`Unknown timeline storage version: ${version}`);
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      customItems: [],
      addCustomItem: (item) =>
        set((state) => ({
          customItems: [...state.customItems, { ...item, isCustom: true }],
        })),
      updateCustomItem: (id, updates) =>
        set((state) => ({
          customItems: state.customItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      removeCustomItem: (id) =>
        set((state) => ({
          customItems: state.customItems.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'timeline-storage',
      version: TIMELINE_STORE_VERSION,
      migrate: migrateTimelineStorage,
    }
  )
);
