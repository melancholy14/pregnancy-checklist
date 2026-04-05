import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimelineItem } from '@/types/timeline';

interface TimelineState {
  customItems: TimelineItem[];
  addCustomItem: (item: TimelineItem) => void;
  updateCustomItem: (id: string, updates: Partial<Omit<TimelineItem, 'id' | 'isCustom'>>) => void;
  removeCustomItem: (id: string) => void;
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
    { name: 'timeline-storage' }
  )
);
