import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChecklistItem } from '@/types/checklist';

export interface ChecklistState {
  checkedIds: string[];
  customItems: ChecklistItem[];
  toggle: (id: string) => void;
  addCustomItem: (item: ChecklistItem) => void;
  updateCustomItem: (id: string, updates: Partial<Omit<ChecklistItem, 'id' | 'isCustom'>>) => void;
  removeCustomItem: (id: string) => void;
  initFromLocalStorage: () => void;
}

export function createChecklistStore(storageKey: string) {
  return create<ChecklistState>()(
    persist(
      (set) => ({
        checkedIds: [],
        customItems: [],
        toggle: (id) =>
          set((state) => ({
            checkedIds: state.checkedIds.includes(id)
              ? state.checkedIds.filter((i) => i !== id)
              : [...state.checkedIds, id],
          })),
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
            checkedIds: state.checkedIds.filter((i) => i !== id),
          })),
        initFromLocalStorage: () => {
          // hydration은 persist middleware가 자동으로 처리
        },
      }),
      { name: storageKey }
    )
  );
}

export const useHospitalBagStore = createChecklistStore('hospital-bag-storage');
export const usePartnerPrepStore = createChecklistStore('partner-prep-storage');
export const usePregnancyPrepStore = createChecklistStore('pregnancy-prep-storage');

export const CHECKLIST_STORE_BY_SLUG = {
  'hospital-bag': useHospitalBagStore,
  'partner-prep': usePartnerPrepStore,
  'pregnancy-prep': usePregnancyPrepStore,
} as const;

export type ChecklistStoreSlug = keyof typeof CHECKLIST_STORE_BY_SLUG;
