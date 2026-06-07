import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recordMigration } from '@/lib/migration-events';

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
}

interface WeightState {
  logs: WeightLog[];
  addLog: (log: WeightLog) => void;
  removeLog: (id: string) => void;
}

export type PersistedWeight = { logs: WeightLog[] };

export const WEIGHT_STORE_VERSION = 1;

function toPersistedWeight(raw: unknown): PersistedWeight {
  const state = (raw ?? {}) as Partial<WeightState>;
  return {
    logs: Array.isArray(state.logs) ? state.logs : [],
  };
}

export function migrateWeightStorage(
  persistedState: unknown,
  version: number
): PersistedWeight {
  if (version === WEIGHT_STORE_VERSION) {
    return toPersistedWeight(persistedState);
  }
  if (version === 0) {
    recordMigration({
      store_name: 'weight',
      from_version: 0,
      to_version: WEIGHT_STORE_VERSION,
    });
    return toPersistedWeight(persistedState);
  }
  recordMigration({
    store_name: 'weight',
    failed: true,
    persisted_version: version,
    current_version: WEIGHT_STORE_VERSION,
  });
  throw new Error(`Unknown weight storage version: ${version}`);
}

export const useWeightStore = create<WeightState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) =>
        set((state) => ({
          logs: [...state.logs, log].sort((a, b) =>
            a.date.localeCompare(b.date)
          ),
        })),
      removeLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((log) => log.id !== id),
        })),
    }),
    {
      name: 'weight-storage',
      version: WEIGHT_STORE_VERSION,
      migrate: migrateWeightStorage,
    }
  )
);
