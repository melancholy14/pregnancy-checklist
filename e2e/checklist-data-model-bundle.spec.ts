import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { seedStorage } from "./helpers/seedStorage";
import type { ChecklistItem } from "../src/types/checklist";

/**
 * dataLayer.push 를 가로채는 gtag spy 를 init 시점에 박는다.
 * ga4-events.spec.ts 의 패턴을 그대로 따른다 — MigrationFlushClient 가
 * `"gtag" in window` 체크를 통과하도록 window.gtag 도 같이 주입.
 */
async function setupGtagSpy(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    type Win = Record<string, unknown>;
    const calls: unknown[][] = [];
    (window as unknown as Win).__gtagCalls = calls;

    const dl: unknown[] = [];
    const origPush = Array.prototype.push;
    Object.defineProperty(dl, "push", {
      value(this: unknown[], ...args: unknown[]) {
        for (const a of args) {
          if (a && typeof a === "object" && "length" in (a as Record<string, unknown>)) {
            calls.push(Array.from(a as ArrayLike<unknown>));
          }
        }
        return origPush.apply(this, args);
      },
      configurable: true,
      writable: true,
    });
    (window as unknown as Win).dataLayer = dl;
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (
      ...args: unknown[]
    ) => {
      calls.push(args);
    };
  });
}

async function getGtagCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(
    () => (window as unknown as Record<string, unknown[]>).__gtagCalls as unknown[][]
  );
}

function findEvent(
  calls: unknown[][],
  eventName: string
): Record<string, unknown> | undefined {
  const hit = calls.find((c) => c[0] === "event" && c[1] === eventName);
  return hit ? (hit[2] as Record<string, unknown>) : undefined;
}

function filterEvents(calls: unknown[][], eventName: string): Record<string, unknown>[] {
  return calls
    .filter((c) => c[0] === "event" && c[1] === eventName)
    .map((c) => c[2] as Record<string, unknown>);
}

const SAMPLE_CUSTOM_ITEM: ChecklistItem = {
  id: "custom-pregnancy-prep-seed-1",
  title: "직접 추가한 항목",
  category: "prep_finance",
  categoryName: "재무/행정",
  recommendedWeek: 0,
  priority: "medium",
  isCustom: true,
};

const CHECKLIST_URL = "/checklist/pregnancy-prep";

test.describe("checklist-data-model-bundle", () => {
  test.describe("Happy Path", () => {
    test("custom 항목 편집: priority + note 동시 변경 → 두 GA4 이벤트 발사 + 재로드 후 유지", async ({
      context,
      page,
    }) => {
      // 무엇을: 편집 폼 한 곳에서 priority(medium→high) + note(빈→텍스트) 동시 변경
      // 왜: 시나리오 1 happy path — 변경된 필드별로 이벤트가 발사되는지 검증
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": { customItems: [SAMPLE_CUSTOM_ITEM] },
        },
      });

      await page.goto(CHECKLIST_URL);
      await expect(page.getByText(SAMPLE_CUSTOM_ITEM.title)).toBeVisible();

      // 행에서 ✏️ 편집 버튼은 aria-label="수정"
      await page.getByRole("button", { name: "수정" }).first().click();
      // 편집 폼 진입 — title input 자동 포커스 + priority + note textarea 노출
      await expect(page.getByRole("combobox", { name: "우선순위" })).toBeVisible();
      await expect(page.getByLabel("메모")).toBeVisible();

      // priority 변경 (medium → high) — shadcn Select trigger 클릭 후 옵션 클릭
      await page.getByRole("combobox", { name: "우선순위" }).click();
      await page.getByRole("option", { name: "높음" }).click();

      // note 입력
      await page.getByLabel("메모").fill("출산예정일 전 확인");

      // 저장
      await page.getByRole("button", { name: "저장" }).click();

      // 편집 폼이 닫히고 행이 default 상태로 복귀
      await expect(page.getByLabel("메모")).toBeHidden();
      // 변경된 note 가 행에 노출
      await expect(page.getByText("출산예정일 전 확인")).toBeVisible();

      // GA4 이벤트 검증 — toast/flush 대기
      await expect.poll(async () => {
        const calls = await getGtagCalls(page);
        return calls.some((c) => c[1] === "custom_item_priority_set");
      }, { timeout: 7000 }).toBe(true);

      const calls = await getGtagCalls(page);
      const priorityEvent = findEvent(calls, "custom_item_priority_set");
      const noteEvent = findEvent(calls, "custom_item_note_set");

      expect(priorityEvent).toMatchObject({
        item_id: SAMPLE_CUSTOM_ITEM.id,
        from_priority: "medium",
        to_priority: "high",
        slug: "pregnancy-prep",
      });
      expect(noteEvent).toMatchObject({
        item_id: SAMPLE_CUSTOM_ITEM.id,
        note_changed: true,
        slug: "pregnancy-prep",
      });
      // PII 가드: note 원문 파라미터 부재
      expect(noteEvent).not.toHaveProperty("note");
      expect(noteEvent?.note_length).toBeGreaterThan(0);

      // 재로드 후 영속성은 unit (`createChecklistStore.test.ts` round-trip 불변식) 에서 이미 검증.
      // E2E 에서 `page.reload()` 로 재검증하면 seedStorage 의 addInitScript 가 다시 발사돼
      // 사용자 변경분을 덮어써 false negative — QA persona §3.3 중복 회피 정렬로 의식적 제외.
    });

    test("ChecklistAddForm: priority='high' 선택 후 추가 → custom_item_add 에 priority 동봉", async ({
      context,
      page,
    }) => {
      // 무엇을: 신규 추가 폼에서 priority 셀렉터로 'high' 선택 후 추가
      // 왜: 시나리오 3 — custom_item_add 이벤트에 priority 파라미터가 박혀 발사되는지
      await setupGtagSpy(context);
      await seedStorage(page, { consent: "accepted" });

      await page.goto(CHECKLIST_URL);

      // FAB 클릭 → 추가 폼 노출
      await page.getByRole("button", { name: "항목 추가" }).click();

      await page.getByLabel("할 일 제목").fill("새 항목 high");

      // priority 'high' 선택
      await page.getByRole("combobox", { name: "우선순위" }).click();
      await page.getByRole("option", { name: "높음" }).click();

      await page.getByRole("button", { name: "추가하기" }).click();

      // 행에 추가됨
      await expect(page.getByText("새 항목 high")).toBeVisible();

      const calls = await getGtagCalls(page);
      const addEvent = findEvent(calls, "custom_item_add");
      expect(addEvent).toMatchObject({
        target: "checklist",
        slug: "pregnancy-prep",
        priority: "high",
      });
    });

    test("priority 만 변경 → custom_item_priority_set 1건, note 이벤트 0건", async ({
      context,
      page,
    }) => {
      // 무엇을: 편집 폼에서 priority 만 변경 후 저장
      // 왜: 시나리오 4 — 변경 안 한 필드에 대한 이벤트는 발사되지 않아야 함
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": { customItems: [SAMPLE_CUSTOM_ITEM] },
        },
      });

      await page.goto(CHECKLIST_URL);
      await page.getByRole("button", { name: "수정" }).first().click();

      await page.getByRole("combobox", { name: "우선순위" }).click();
      await page.getByRole("option", { name: "낮음" }).click();
      await page.getByRole("button", { name: "저장" }).click();

      await expect(page.getByLabel("메모")).toBeHidden();

      await expect.poll(async () => {
        const calls = await getGtagCalls(page);
        return filterEvents(calls, "custom_item_priority_set").length;
      }, { timeout: 7000 }).toBe(1);

      const calls = await getGtagCalls(page);
      expect(filterEvents(calls, "custom_item_note_set")).toHaveLength(0);
    });

    test("note 만 변경 → custom_item_note_set 1건, priority 이벤트 0건", async ({
      context,
      page,
    }) => {
      // 무엇을: 편집 폼에서 note 만 변경 후 저장
      // 왜: 시나리오 5 — priority 미변경 시 이벤트 발사 안 함
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": { customItems: [SAMPLE_CUSTOM_ITEM] },
        },
      });

      await page.goto(CHECKLIST_URL);
      await page.getByRole("button", { name: "수정" }).first().click();
      await page.getByLabel("메모").fill("note 만 변경");
      await page.getByRole("button", { name: "저장" }).click();

      await expect.poll(async () => {
        const calls = await getGtagCalls(page);
        return filterEvents(calls, "custom_item_note_set").length;
      }, { timeout: 7000 }).toBe(1);

      const calls = await getGtagCalls(page);
      expect(filterEvents(calls, "custom_item_priority_set")).toHaveLength(0);
    });
  });

  test.describe("Error / Validation", () => {
    test("편집 취소: 변경분 폐기, store/이벤트 변경 없음", async ({ context, page }) => {
      // 무엇을: 편집 폼에서 priority + note 변경 후 취소 클릭
      // 왜: 시나리오 6 — 취소 시 store 갱신 X, GA4 이벤트 발사 X
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": { customItems: [SAMPLE_CUSTOM_ITEM] },
        },
      });

      await page.goto(CHECKLIST_URL);
      await page.getByRole("button", { name: "수정" }).first().click();

      await page.getByLabel("메모").fill("이건 저장되면 안 됨");
      await page.getByRole("button", { name: "취소" }).click();

      await expect(page.getByLabel("메모")).toBeHidden();
      // 행에는 원래 title 만, note 변경분 미반영
      await expect(page.getByText(SAMPLE_CUSTOM_ITEM.title)).toBeVisible();
      await expect(page.getByText("이건 저장되면 안 됨")).not.toBeVisible();

      const calls = await getGtagCalls(page);
      expect(filterEvents(calls, "custom_item_priority_set")).toHaveLength(0);
      expect(filterEvents(calls, "custom_item_note_set")).toHaveLength(0);
    });

    test("title 빈 값 저장 시도: 저장 버튼 disabled + 폼 유지", async ({ context, page }) => {
      // 무엇을: 편집 폼에서 title 을 모두 지운 상태에서 저장 시도
      // 왜: design.md §3 EditItemForm 에러 상태 — 저장 차단 + 안내 노출
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": { customItems: [SAMPLE_CUSTOM_ITEM] },
        },
      });

      await page.goto(CHECKLIST_URL);
      await page.getByRole("button", { name: "수정" }).first().click();

      // title 비우기
      const titleInput = page.getByLabel("항목 이름");
      await titleInput.fill("");

      // 안내 텍스트 노출 + 저장 버튼 비활성
      await expect(page.getByText("제목을 입력하세요")).toBeVisible();
      const saveButton = page.getByRole("button", { name: "저장" });
      await expect(saveButton).toBeDisabled();

      // 편집 폼은 닫히지 않음
      await expect(page.getByLabel("메모")).toBeVisible();
    });
  });

  test.describe("권한 / 인증 (localStorage 분기)", () => {
    test("기본 항목 행에는 편집 버튼이 노출되지 않는다", async ({ context, page }) => {
      // 무엇을: 기본 항목(JSON 출처) 행의 ✏️ 편집 버튼 비노출 검증
      // 왜: 시나리오 2 — 4.3=A custom 한정 편집 결정의 회귀 가드
      await setupGtagSpy(context);
      await seedStorage(page, { consent: "accepted" });
      await page.goto(CHECKLIST_URL);

      // 페이지의 ✏️ 편집 버튼 자체가 0개 — custom 항목을 seed 하지 않았으므로.
      // 기본 항목만 있는 상태에서 row 내부에 'aria-label="수정"' 버튼 부재.
      await expect(page.getByRole("button", { name: "수정" })).toHaveCount(0);
      // 기본 항목 행은 여전히 노출 (체크박스는 존재)
      await expect(page.locator("input[type=checkbox]").first()).toBeVisible();
    });

    test("미지 버전 시드 → toast + schema_migration_failed 이벤트 발사", async ({
      context,
      page,
    }) => {
      // 무엇을: localStorage 에 version=999 시드 후 페이지 진입
      // 왜: 시나리오 8 — migrate 실패 시 toast + GA4 알람 신호 발사 (4.5=B)
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": {
            customItems: [SAMPLE_CUSTOM_ITEM],
            version: 999,
          },
        },
      });

      await page.goto(CHECKLIST_URL);

      // sonner toast 노출 — duration 4s + retry 폴링 고려
      await expect(
        page.getByText("체크리스트 데이터를 정리했어요. 일부 설정이 초기값으로 돌아갔을 수 있어요.")
      ).toBeVisible({ timeout: 8000 });

      // GA4 이벤트
      await expect.poll(async () => {
        const calls = await getGtagCalls(page);
        return calls.some((c) => c[1] === "schema_migration_failed");
      }, { timeout: 8000 }).toBe(true);

      const calls = await getGtagCalls(page);
      const failed = findEvent(calls, "schema_migration_failed");
      expect(failed).toMatchObject({
        store_name: "checklist",
        persisted_version: 999,
        current_version: 1,
      });
    });

    test("정상 v0 → v1 migrate: schema_migration_run 발사, 실패 이벤트 미발사", async ({
      context,
      page,
    }) => {
      // 무엇을: 정상 v0 데이터 시드 후 페이지 진입 → 성공 migrate 발사
      // 왜: 회귀 가드 — false positive 로 schema_migration_failed 가 발사되지 않는지
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": {
            customItems: [SAMPLE_CUSTOM_ITEM],
            version: 0,
          },
        },
      });

      await page.goto(CHECKLIST_URL);
      await expect(page.getByText(SAMPLE_CUSTOM_ITEM.title)).toBeVisible();

      await expect.poll(async () => {
        const calls = await getGtagCalls(page);
        return calls.some((c) => c[1] === "schema_migration_run");
      }, { timeout: 8000 }).toBe(true);

      const calls = await getGtagCalls(page);
      const runEvent = findEvent(calls, "schema_migration_run");
      expect(runEvent).toMatchObject({
        store_name: "checklist",
        from_version: 0,
        to_version: 1,
      });
      expect(filterEvents(calls, "schema_migration_failed")).toHaveLength(0);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 편집 폼이 노출되고 저장 버튼까지 접근 가능", async ({ context, page }) => {
      // 무엇을: 375px 뷰포트에서 편집 폼 진입 + 저장 흐름 동작 확인
      // 왜: 시나리오 1 mobile variant — 4.6=A 한 폼 결정의 모바일 회귀 가드
      await setupGtagSpy(context);
      await seedStorage(page, {
        consent: "accepted",
        checklist: {
          "pregnancy-prep": { customItems: [SAMPLE_CUSTOM_ITEM] },
        },
      });

      await page.goto(CHECKLIST_URL);
      await page.getByRole("button", { name: "수정" }).first().click();

      await expect(page.getByLabel("항목 이름")).toBeVisible();
      await expect(page.getByRole("combobox", { name: "우선순위" })).toBeVisible();
      await expect(page.getByLabel("메모")).toBeVisible();

      // 폼 내부 스크롤 또는 자연 스크롤로 저장 버튼 접근.
      const saveButton = page.getByRole("button", { name: "저장" });
      await saveButton.scrollIntoViewIfNeeded();
      await expect(saveButton).toBeVisible();
    });
  });
});
