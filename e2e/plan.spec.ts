import { test, expect } from "@playwright/test";

test.describe("Phase 1.5: 타임라인 + 체크리스트 통합", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timeline");
  });

  test.describe("Happy Path", () => {
    test("통합 페이지 기본 UI가 렌더링된다", async ({ page }) => {
      // 무엇을: 타임라인 제목, 설명, 전체 진행률이 보이는지
      // 왜: 통합 페이지의 정상 진입 확인
      await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
      await expect(page.getByText("주차별 일정과 체크리스트를 한눈에 확인하세요")).toBeVisible();
      await expect(page.getByText("전체 진행률")).toBeVisible();
    });

    test("타임라인 카드에 체크리스트 아코디언이 포함된다", async ({ page }) => {
      // 무엇을: 타임라인 카드에 "체크리스트 N개" 표시가 있는지
      // 왜: 통합 페이지의 핵심 — 타임라인 카드 안에 체크리스트가 내장
      await expect(page.getByText(/체크리스트 \d+개/).first()).toBeVisible();
    });

    test("아코디언 클릭 시 체크리스트가 펼쳐진다", async ({ page }) => {
      // 무엇을: 접힌 아코디언 클릭 시 체크리스트 항목이 보이는지
      // 왜: 아코디언 토글이 통합 페이지의 핵심 인터랙션
      const accordionTrigger = page.getByText(/체크리스트 \d+개/).first();
      await accordionTrigger.click();

      // 체크리스트 항목이 펼쳐져 보여야 함
      const expandedSection = page.locator('[data-slot="collapsible-content"]').first();
      await expect(expandedSection).toBeVisible();
      // 진행률 바가 보여야 함
      await expect(expandedSection.getByText("진행률")).toBeVisible();
    });

    test("체크리스트 항목을 체크/해제할 수 있다", async ({ page }) => {
      // 무엇을: 통합 페이지에서 체크박스 토글이 동작하는지
      // 왜: 체크리스트의 핵심 인터랙션이 통합 후에도 동작해야 함

      // 아코디언 펼치기
      const accordionTrigger = page.getByText(/체크리스트 \d+개/).first();
      await accordionTrigger.click();

      // 첫 번째 체크박스 클릭
      const checkbox = page.locator('[data-slot="collapsible-content"]').first().locator('button[role="checkbox"]').first();
      await checkbox.click();

      // 체크 상태 확인
      await expect(checkbox).toHaveAttribute("data-state", "checked");

      // 다시 클릭하여 해제
      await checkbox.click();
      await expect(checkbox).toHaveAttribute("data-state", "unchecked");
    });

    test("전체 진행률이 체크 상태에 따라 변한다", async ({ page }) => {
      // 무엇을: 체크 시 상단 전체 진행률 숫자가 변하는지
      // 왜: 진행률 실시간 반영은 핵심 피드백
      const progressCard = page.getByText("전체 진행률").locator("..");
      const before = await progressCard.textContent();

      // 아코디언 펼치고 체크
      const accordionTrigger = page.getByText(/체크리스트 \d+개/).first();
      await accordionTrigger.click();
      const checkbox = page.locator('[data-slot="collapsible-content"]').first().locator('button[role="checkbox"]').first();
      await checkbox.click();

      const after = await progressCard.textContent();
      expect(before).not.toEqual(after);
    });

    test("카테고리 필터가 동작한다", async ({ page }) => {
      // 무엇을: 카테고리 필터 칩 클릭 시 해당 카테고리만 표시되는지
      // 왜: 카테고리별 뷰는 Phase 1의 탭 기능을 대체
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByRole("button", { name: "병원 준비" })).toBeVisible();

      // "병원 준비" 필터 클릭
      await page.getByRole("button", { name: "병원 준비" }).click();

      // 필터된 상태에서 병원 준비 카테고리 항목이 포함된 주차만 표시
      // "전체" 다시 클릭하면 원래대로
      await page.getByRole("button", { name: "전체" }).click();
    });

    test("통합 폼으로 체크리스트를 추가할 수 있다", async ({ page }) => {
      // 무엇을: FAB → 통합 폼 → 할 일 추가 전체 흐름
      // 왜: 통합 폼이 체크리스트/타임라인 모두 커버하는지 확인
      await page.locator('button[aria-label="항목 추가"]').click();

      // 폼 표시 확인
      await expect(page.getByText("새 항목 추가")).toBeVisible();

      // "할 일 (체크리스트)" 라디오가 기본 선택됨
      const checklistRadio = page.locator('input[value="checklist"]');
      await expect(checklistRadio).toBeChecked();

      // 주차 28 (기존 타임라인 카드가 있는 주차), 제목 입력
      await page.locator('input[type="number"]').fill("28");
      await page.getByPlaceholder("할 일을 입력하세요").fill("테스트 체크리스트 항목");

      await page.getByRole("button", { name: "추가하기" }).click();

      // 28주차 아코디언 펼쳐서 추가된 항목 확인
      const weekCard = page.locator('[id="timeline-week-28"]');
      await weekCard.getByText(/체크리스트/).click();
      await expect(weekCard.getByText("테스트 체크리스트 항목")).toBeVisible();
    });

    test("통합 폼으로 타임라인 일정을 추가할 수 있다", async ({ page }) => {
      // 무엇을: 통합 폼에서 "일정" 유형 선택 후 타임라인 카드 추가
      // 왜: 두 유형 모두 통합 폼에서 동작해야 함
      await page.locator('button[aria-label="항목 추가"]').click();

      // "일정 (타임라인)" 라디오 선택
      await page.locator('input[value="timeline"]').click();

      // 설명 필드가 노출되는지
      await expect(page.getByPlaceholder("상세 설명을 입력하세요")).toBeVisible();

      // 주차, 제목, 설명 입력
      await page.locator('input[type="number"]').fill("20");
      await page.getByPlaceholder("일정을 입력하세요").fill("테스트 타임라인 일정");
      await page.getByPlaceholder("상세 설명을 입력하세요").fill("테스트 설명");

      await page.getByRole("button", { name: "추가하기" }).click();

      // 추가된 타임라인 항목 확인
      await expect(page.getByText("테스트 타임라인 일정")).toBeVisible();
      await expect(page.getByText("내 항목")).toBeVisible();
    });

    test("커스텀 타임라인 항목을 수정할 수 있다", async ({ page }) => {
      // 무엇을: 커스텀 타임라인 항목의 편집 아이콘 → 인라인 편집 → 저장
      // 왜: Phase 1.5 신규 기능 — 커스텀 항목 수정
      // 먼저 커스텀 항목 추가
      await page.locator('button[aria-label="항목 추가"]').click();
      await page.locator('input[value="timeline"]').click();
      await page.locator('input[type="number"]').fill("7");
      await page.getByPlaceholder("일정을 입력하세요").fill("수정 전 타임라인");
      await page.getByRole("button", { name: "추가하기" }).click();
      await expect(page.getByText("수정 전 타임라인")).toBeVisible();

      // 수정 아이콘 클릭 — 유일한 7주차 카드
      const weekCard = page.locator('[id="timeline-week-7"]');
      await weekCard.locator('button[aria-label="수정"]').click();

      // 인라인 편집 모드 확인 + 제목 수정
      const titleInput = weekCard.locator('input[type="text"]').first();
      await titleInput.clear();
      await titleInput.fill("수정 후 타임라인");
      await weekCard.getByRole("button", { name: "저장" }).click();

      // 수정 반영 확인
      await expect(page.getByText("수정 후 타임라인")).toBeVisible();
      await expect(page.getByText("수정 전 타임라인")).not.toBeVisible();
    });

    test("커스텀 체크리스트 항목을 수정할 수 있다", async ({ page }) => {
      // 무엇을: 체크리스트 커스텀 항목의 인라인 편집
      // 왜: Phase 1.5 신규 기능
      // 체크리스트 항목 추가 (28주에 기존 타임라인 카드가 있음)
      await page.locator('button[aria-label="항목 추가"]').click();
      await page.locator('input[type="number"]').fill("28");
      await page.getByPlaceholder("할 일을 입력하세요").fill("수정 전 체크리스트");
      await page.getByRole("button", { name: "추가하기" }).click();

      // 28주차 아코디언 펼치기
      const weekCard = page.locator('[id="timeline-week-28"]');
      await weekCard.getByText(/체크리스트/).click();

      // 수정 아이콘 클릭 (커스텀 체크리스트 항목)
      const expandedSection = weekCard.locator('[data-slot="collapsible-content"]');
      await expandedSection.locator('button[aria-label="수정"]').click();

      // 제목 수정
      const editInput = expandedSection.locator('input[type="text"]');
      await editInput.clear();
      await editInput.fill("수정 후 체크리스트");
      await expandedSection.getByRole("button", { name: "저장" }).click();

      await expect(page.getByText("수정 후 체크리스트")).toBeVisible();
    });

    test("커스텀 항목을 삭제할 수 있다", async ({ page }) => {
      // 무엇을: 커스텀 타임라인 항목 삭제
      // 왜: 기존 삭제 기능이 통합 후에도 동작하는지
      await page.locator('button[aria-label="항목 추가"]').click();
      await page.locator('input[value="timeline"]').click();
      await page.locator('input[type="number"]').fill("15");
      await page.getByPlaceholder("일정을 입력하세요").fill("삭제 테스트 항목");
      await page.getByRole("button", { name: "추가하기" }).click();

      await expect(page.getByText("삭제 테스트 항목")).toBeVisible();

      const card = page.locator('[data-slot="card"]').filter({ hasText: "삭제 테스트 항목" });
      await card.locator('button[aria-label="삭제"]').click();

      await expect(page.getByText("삭제 테스트 항목")).not.toBeVisible();
    });

    test("마지막에 40주 메시지가 보인다", async ({ page }) => {
      // 무엇을: 최하단 40주 안내
      // 왜: 타임라인 끝점 확인
      await expect(page.getByText(/40주차/)).toBeVisible();
    });
  });

  test.describe("Error / Validation", () => {
    test("빈 제목으로는 추가할 수 없다", async ({ page }) => {
      // 무엇을: 제목 없이 추가 버튼이 비활성화되는지
      // 왜: 빈 항목 방지
      await page.locator('button[aria-label="항목 추가"]').click();
      const addButton = page.getByRole("button", { name: "추가하기" });
      await expect(addButton).toBeDisabled();
    });

    test("기본 항목에는 수정/삭제 버튼이 없다", async ({ page }) => {
      // 무엇을: JSON 기본 타임라인 항목에 수정/삭제 아이콘이 없는지
      // 왜: 기본 데이터 보호
      const firstCard = page.getByText("임신 확인 후 기본 일정 잡기").locator("..").locator("..");
      await expect(firstCard.locator('button[aria-label="수정"]')).not.toBeVisible();
      await expect(firstCard.locator('button[aria-label="삭제"]')).not.toBeVisible();
    });

    test("체크리스트 없는 주차는 아코디언 비활성화", async ({ page }) => {
      // 무엇을: 체크리스트가 없는 주차 카드에 "준비 항목 없음" 텍스트가 보이는지
      // 왜: 빈 아코디언 클릭 방지
      await expect(page.getByText("준비 항목 없음").first()).toBeVisible();
    });

    test("유형 전환 시 폼 필드가 올바르게 변경된다", async ({ page }) => {
      // 무엇을: 일정↔할 일 전환 시 카테고리/설명 필드 노출 제어
      // 왜: 유형별 필수/선택 필드가 정확해야 함
      await page.locator('button[aria-label="항목 추가"]').click();

      // 기본: 체크리스트 → 카테고리 보임, 설명 안 보임
      await expect(page.getByText("카테고리")).toBeVisible();
      await expect(page.getByPlaceholder("상세 설명을 입력하세요")).not.toBeVisible();

      // 일정으로 전환 → 설명 보임, 카테고리 안 보임
      await page.locator('input[value="timeline"]').click();
      await expect(page.getByPlaceholder("상세 설명을 입력하세요")).toBeVisible();
    });
  });

  test.describe("리다이렉트 / 네비게이션", () => {
    test("/checklist 접근 시 /timeline으로 리다이렉트된다", async ({ page }) => {
      // 무엇을: /checklist → /timeline 리다이렉트
      // 왜: Phase 1 북마크/외부 링크 호환
      await page.goto("/checklist");
      await expect(page).toHaveURL(/\/timeline/);
    });

    test("하단 네비게이션이 4개 탭이다", async ({ page }) => {
      // 무엇을: 홈/타임라인/체중/더보기 4개 탭만 표시되는지
      // 왜: 체크리스트 탭 제거, 통합 페이지로 대체
      const nav = page.locator("nav");
      await expect(nav.getByText("홈")).toBeVisible();
      await expect(nav.getByText("타임라인")).toBeVisible();
      await expect(nav.getByText("체중")).toBeVisible();
      await expect(nav.getByText("더보기")).toBeVisible();
      await expect(nav.getByText("체크리스트")).not.toBeVisible();
    });

    test("온보딩 배너: 예정일 미입력 시 DueDateBanner 표시", async ({ page }) => {
      // 무엇을: 예정일 없이 타임라인 진입 시 배너가 보이는지
      // 왜: 예정일 입력 유도 (현재 주차 자동 펼침에 필요)
      await expect(page.getByText("예정일을 입력하면 나에게 맞는 정보를 볼 수 있어요")).toBeVisible();
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 통합 페이지 핵심 UI가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 제목, 필터 칩, 타임라인 카드, FAB가 보이는지
      // 왜: 주요 타겟 기기 — 임산부 모바일 사용자
      await expect(page.getByRole("heading", { name: "임신 타임라인" })).toBeVisible();
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByText("임신 확인 후 기본 일정 잡기")).toBeVisible();
      await expect(page.locator('button[aria-label="항목 추가"]')).toBeVisible();
    });

    test("모바일: 아코디언 펼치고 체크가 가능하다", async ({ page }) => {
      // 무엇을: 모바일 뷰에서 아코디언 + 체크 인터랙션이 동작하는지
      // 왜: 좁은 화면에서도 핵심 기능이 동작해야 함
      const accordionTrigger = page.getByText(/체크리스트 \d+개/).first();
      await accordionTrigger.click();

      const expandedSection = page.locator('[data-slot="collapsible-content"]').first();
      await expect(expandedSection).toBeVisible();

      const checkbox = expandedSection.locator('button[role="checkbox"]').first();
      await checkbox.click();
      await expect(checkbox).toHaveAttribute("data-state", "checked");
    });

    test("모바일: 카테고리 필터 칩이 스크롤 가능하다", async ({ page }) => {
      // 무엇을: 필터 칩이 가로 스크롤로 모두 접근 가능한지
      // 왜: 375px에서 6개 필터 칩이 한 줄에 안 들어감
      await expect(page.getByRole("button", { name: "전체" })).toBeVisible();
      await expect(page.getByRole("button", { name: "병원 준비" })).toBeVisible();
    });
  });
});
