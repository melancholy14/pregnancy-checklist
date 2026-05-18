import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChecklistItem } from '@/types/checklist';

export interface ChecklistState {
  checkedIds: string[];
  customItems: ChecklistItem[];
  migrationLostFlag: boolean;
  toggle: (id: string) => void;
  addCustomItem: (item: ChecklistItem) => void;
  updateCustomItem: (id: string, updates: Partial<Omit<ChecklistItem, 'id' | 'isCustom'>>) => void;
  removeCustomItem: (id: string) => void;
  clearMigrationLost: () => void;
  initFromLocalStorage: () => void;
}

export function createChecklistStore(storageKey: string) {
  const store = create<ChecklistState>()(
    persist(
      (set) => ({
        checkedIds: [],
        customItems: [],
        migrationLostFlag: false,
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
        clearMigrationLost: () => set({ migrationLostFlag: false }),
        initFromLocalStorage: () => {
          // hydration은 persist middleware가 자동으로 처리
        },
      }),
      {
        name: storageKey,
        partialize: (state) => ({
          checkedIds: state.checkedIds,
          customItems: state.customItems,
        }),
        onRehydrateStorage: () => (_state, error) => {
          if (!error) return;
          // hydration 실패 시 default state로 재초기화 + 폴백 카피 플래그 켬.
          // 실패 분기에서는 finishHydration이 호출되지 않으므로, setState가 partialize를
          // 통해 정상 JSON을 storage에 덮어쓴 뒤 rehydrate()로 hasHydrated=true 보장.
          queueMicrotask(() => {
            store.setState({
              checkedIds: [],
              customItems: [],
              migrationLostFlag: true,
            });
            void store.persist.rehydrate();
          });
        },
      }
    )
  );

  return store;
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
