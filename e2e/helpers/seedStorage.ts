import type { Page } from "@playwright/test";
import type { ChecklistItem } from "../../src/types/checklist";
import type { TimelineItem } from "../../src/types/timeline";
import type { WeightLog } from "../../src/store/useWeightStore";

const CURRENT_CHECKLIST_VERSION = 1;
const CURRENT_TIMELINE_VERSION = 1;
const CURRENT_WEIGHT_VERSION = 1;
const CURRENT_DUE_DATE_VERSION = 1;

export interface ChecklistSeed {
  checkedIds?: string[];
  customItems?: ChecklistItem[];
  /** zustand persist version. default = current (1). 미지 버전 시드는 명시값. */
  version?: number;
}

export interface DueDateSeed {
  dueDate: string;
  currentPregnancyWeek?: number | null;
  lastCalcDate?: string | null;
  cohortJoinWeek?: number | null;
  version?: number;
}

export interface TimelineSeed {
  customItems?: TimelineItem[];
  version?: number;
}

export interface WeightSeed {
  logs?: WeightLog[];
  version?: number;
}

export interface SeedStorageInput {
  consent?: "accepted" | "rejected";
  dueDate?: DueDateSeed;
  /** key = checklist slug (e.g. "pregnancy-prep"). 내부적으로 `${slug}-storage` 키에 저장. */
  checklist?: Record<string, ChecklistSeed>;
  timeline?: TimelineSeed;
  weight?: WeightSeed;
}

interface SerializedPayload {
  key: string;
  value: string;
}

interface SeedPayload {
  consent: "accepted" | "rejected" | null;
  storages: SerializedPayload[];
}

function buildPayload(input: SeedStorageInput): SeedPayload {
  const storages: SerializedPayload[] = [];

  if (input.dueDate) {
    const {
      dueDate,
      currentPregnancyWeek = null,
      lastCalcDate = null,
      cohortJoinWeek = null,
      version = CURRENT_DUE_DATE_VERSION,
    } = input.dueDate;
    storages.push({
      key: "due-date-storage",
      value: JSON.stringify({
        state: {
          dueDate,
          currentPregnancyWeek,
          lastCalcDate,
          cohortJoinWeek,
        },
        version,
      }),
    });
  }

  if (input.checklist) {
    for (const [slug, seed] of Object.entries(input.checklist)) {
      const {
        checkedIds = [],
        customItems = [],
        version = CURRENT_CHECKLIST_VERSION,
      } = seed;
      storages.push({
        key: `${slug}-storage`,
        value: JSON.stringify({
          state: { checkedIds, customItems },
          version,
        }),
      });
    }
  }

  if (input.timeline) {
    const { customItems = [], version = CURRENT_TIMELINE_VERSION } = input.timeline;
    storages.push({
      key: "timeline-storage",
      value: JSON.stringify({
        state: { customItems },
        version,
      }),
    });
  }

  if (input.weight) {
    const { logs = [], version = CURRENT_WEIGHT_VERSION } = input.weight;
    storages.push({
      key: "weight-storage",
      value: JSON.stringify({
        state: { logs },
        version,
      }),
    });
  }

  return {
    consent: input.consent ?? null,
    storages,
  };
}

/**
 * Playwright 페이지의 navigate 이전에 호출하면 localStorage 시드.
 * 다음 schema 버전 변경 시 본 헬퍼 한 곳만 갱신하면 모든 spec이 따라간다.
 */
export async function seedStorage(page: Page, input: SeedStorageInput): Promise<void> {
  const payload = buildPayload(input);
  await page.addInitScript((serialized: SeedPayload) => {
    try {
      if (serialized.consent) {
        window.localStorage.setItem("cookie-consent", serialized.consent);
      }
      for (const entry of serialized.storages) {
        window.localStorage.setItem(entry.key, entry.value);
      }
    } catch {
      // localStorage 접근 실패는 spec에서 따로 검증할 일이 아님.
    }
  }, payload);
}
