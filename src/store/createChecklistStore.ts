import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChecklistCategory, ChecklistItem } from '@/types/checklist';
import { recordMigration } from '@/lib/migration-events';

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

const VALID_PRIORITIES: ReadonlySet<ChecklistItem['priority']> = new Set([
  'high',
  'medium',
  'low',
]);

const VALID_CATEGORIES: ReadonlySet<ChecklistCategory> = new Set<ChecklistCategory>([
  'hospital',
  'hospital_bag',
  'baby_items',
  'postpartum',
  'admin',
  'bag_mom',
  'bag_baby',
  'bag_docs',
  'partner_before',
  'partner_day',
  'partner_after',
  'prep_health',
  'prep_nutrition',
  'prep_checkup',
  'prep_finance',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeCustomItems(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  const normalized: ChecklistItem[] = [];
  for (const raw of value) {
    const item = (raw ?? {}) as Partial<ChecklistItem>;
    // 손상된 데이터는 그 행 자체를 drop — render 시점에 빈 텍스트·고아 행 노출 회피.
    if (!isNonEmptyString(item.id)) continue;
    if (!isNonEmptyString(item.title)) continue;
    if (!VALID_CATEGORIES.has(item.category as ChecklistCategory)) continue;
    const priority = VALID_PRIORITIES.has(item.priority as ChecklistItem['priority'])
      ? (item.priority as ChecklistItem['priority'])
      : 'medium';
    normalized.push({ ...item, priority, isCustom: true } as ChecklistItem);
  }
  return normalized;
}

export type PersistedChecklist = {
  checkedIds: string[];
  customItems: ChecklistItem[];
};

function toPersistedShape(raw: unknown): PersistedChecklist {
  const state = (raw ?? {}) as Partial<ChecklistState>;
  return {
    checkedIds: Array.isArray(state.checkedIds) ? state.checkedIds : [],
    customItems: normalizeCustomItems(state.customItems),
  };
}

export const CHECKLIST_STORE_VERSION = 1;

export function migrateChecklistStorage(
  persistedState: unknown,
  version: number
): PersistedChecklist {
  if (version === CHECKLIST_STORE_VERSION) {
    return toPersistedShape(persistedState);
  }
  if (version === 0) {
    // v0 → v1 identity migrate. priority enum 외부 값은 'medium'으로 silent normalize.
    recordMigration({
      store_name: 'checklist',
      from_version: 0,
      to_version: CHECKLIST_STORE_VERSION,
    });
    return toPersistedShape(persistedState);
  }
  // 미지의 버전: failure 기록 + throw → onRehydrateStorage error 분기로 진입.
  recordMigration({
    store_name: 'checklist',
    failed: true,
    persisted_version: version,
    current_version: CHECKLIST_STORE_VERSION,
  });
  throw new Error(`Unknown checklist storage version: ${version}`);
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
        version: CHECKLIST_STORE_VERSION,
        partialize: (state) => ({
          checkedIds: state.checkedIds,
          customItems: state.customItems,
        }),
        migrate: migrateChecklistStorage,
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
