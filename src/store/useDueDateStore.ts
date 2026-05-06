import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calcPregnancyWeek } from '@/lib/week-calculator';
import { getTodayKST, parseDateKST } from '@/lib/date-kst';

export const MIN_PREGNANCY_WEEK = 0;
export const MAX_PREGNANCY_WEEK = 42;

interface DueDateState {
  dueDate: string | null;
  currentPregnancyWeek: number | null;
  lastCalcDate: string | null;
  cohortJoinWeek: number | null;
  setDueDate: (date: string) => boolean;
  clearDueDate: () => void;
  refreshWeekIfNeeded: () => void;
}

function nowKST(): Date {
  return parseDateKST(getTodayKST());
}

export function isValidDueDate(dateString: string): boolean {
  const parsed = parseDateKST(dateString);
  if (Number.isNaN(parsed.getTime())) return false;
  const raw = calcPregnancyWeek(parsed, nowKST(), { clamp: false });
  return raw >= MIN_PREGNANCY_WEEK && raw <= MAX_PREGNANCY_WEEK;
}

export const useDueDateStore = create<DueDateState>()(
  persist(
    (set, get) => ({
      dueDate: null,
      currentPregnancyWeek: null,
      lastCalcDate: null,
      cohortJoinWeek: null,
      setDueDate: (date) => {
        if (!isValidDueDate(date)) return false;
        const week = calcPregnancyWeek(parseDateKST(date), nowKST());
        const today = getTodayKST();
        const prevCohort = get().cohortJoinWeek;
        set({
          dueDate: date,
          currentPregnancyWeek: week,
          lastCalcDate: today,
          cohortJoinWeek: prevCohort ?? week,
        });
        return true;
      },
      clearDueDate: () =>
        set({
          dueDate: null,
          currentPregnancyWeek: null,
          lastCalcDate: null,
        }),
      refreshWeekIfNeeded: () => {
        const { dueDate, lastCalcDate } = get();
        if (!dueDate) return;
        const today = getTodayKST();
        if (lastCalcDate === today) return;
        const week = calcPregnancyWeek(parseDateKST(dueDate), nowKST());
        set({ currentPregnancyWeek: week, lastCalcDate: today });
      },
    }),
    {
      name: 'due-date-storage',
      version: 1,
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<DueDateState>;
        if (version < 1) {
          const dueDate = state.dueDate ?? null;
          if (dueDate) {
            const week = calcPregnancyWeek(parseDateKST(dueDate), nowKST());
            return {
              dueDate,
              currentPregnancyWeek: week,
              lastCalcDate: getTodayKST(),
              cohortJoinWeek: week,
            } satisfies Partial<DueDateState>;
          }
          return {
            dueDate: null,
            currentPregnancyWeek: null,
            lastCalcDate: null,
            cohortJoinWeek: null,
          } satisfies Partial<DueDateState>;
        }
        return state;
      },
    }
  )
);
