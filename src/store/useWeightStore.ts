import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useWeightStore = create<WeightState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) =>
        set((state) => ({
          logs: [...state.logs, log].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        })),
      removeLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((log) => log.id !== id),
        })),
    }),
    { name: 'weight-storage' }
  )
);
