import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DueDateState {
  dueDate: string | null;
  setDueDate: (date: string) => void;
  clearDueDate: () => void;
}

export const useDueDateStore = create<DueDateState>()(
  persist(
    (set) => ({
      dueDate: null,
      setDueDate: (date) => set({ dueDate: date }),
      clearDueDate: () => set({ dueDate: null }),
    }),
    { name: 'due-date-storage' }
  )
);
