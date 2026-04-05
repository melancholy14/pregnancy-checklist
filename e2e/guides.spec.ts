import { test, expect } from "@playwright/test";

test.describe("가이드 페이지 (리다이렉트)", () => {
  test.describe("출산 가방 가이드", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/articles/hospital-bag");
    });

    test("제목과 본문이 렌더링된다", async ({ page }) => {
      // 무엇을: 출산 가방 가이드 페이지 기본 UI
      // 왜: MD 기반 정보글로 변환 후 정상 표시 확인
      await expect(
        page.getByRole("heading", { name: "출산 가방 필수 준비물 총정리" })
      ).toBeVisible();
    });

    test("산모용 필수 준비물 섹션이 보인다", async ({ page }) => {
      // 무엇을: 핵심 콘텐츠 섹션 표시
      // 왜: 가이드의 메인 콘텐츠 존재 확인
      await expect(
        page.getByRole("heading", { name: "산모용 필수 준비물" })
      ).toBeVisible();
      await expect(page.getByText(/산모용 잠옷/)).toBeVisible();
    });

    test("아기용 준비물 섹션이 보인다", async ({ page }) => {
      // 무엇을: 아기 용품 섹션 표시
      // 왜: 퇴원 필수 준비물 안내 확인
      await expect(
        page.getByRole("heading", { name: "아기용 준비물" })
      ).toBeVisible();
    });

    test("서류 및 필수품 섹션이 보인다", async ({ page }) => {
      // 무엇을: 서류 섹션 표시
      // 왜: 입원 수속 필수 서류 안내
      await expect(
        page.getByRole("heading", { name: "서류 및 필수품" })
      ).toBeVisible();
    });

    test("타임라인 링크가 동작한다", async ({ page }) => {
      // 무엇을: 타임라인 페이지로의 내부 링크
      // 왜: 가이드 → 타임라인 상호 연결 확인
      const link = page.getByRole("link", { name: /주차별 타임라인에서 전체 준비 일정 확인/ });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/timeline/);
    });

    test("의료 면책 고지가 표시된다", async ({ page }) => {
      // 무엇을: 가이드 하단 의료 면책 문구
      // 왜: 의료 정보 면책 요구사항
      await expect(page.getByText(/담당 의료진과 상담하시기 바랍니다/)).toBeVisible();
    });
  });

  test.describe("주차별 준비 가이드", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/articles/weekly-prep");
    });

    test("제목과 본문이 렌더링된다", async ({ page }) => {
      // 무엇을: 주차별 가이드 페이지 기본 UI
      // 왜: MD 기반 정보글로 변환 후 정상 표시 확인
      await expect(
        page.getByRole("heading", { name: "임신 주차별 검사 & 준비 가이드" })
      ).toBeVisible();
    });

    test("4개 시기별 섹션이 모두 표시된다", async ({ page }) => {
      // 무엇을: 임신 초기/중기/후기/만삭 섹션이 모두 있는지
      // 왜: 가이드의 전체 콘텐츠 구조 확인
      await expect(page.getByRole("heading", { name: /임신 초기/ })).toBeVisible();
      await expect(page.getByRole("heading", { name: /임신 중기/ })).toBeVisible();
      await expect(page.getByRole("heading", { name: /임신 후기/ })).toBeVisible();
      await expect(page.getByRole("heading", { name: /만삭/ })).toBeVisible();
    });

    test("주요 검사 항목이 언급된다", async ({ page }) => {
      // 무엇을: 핵심 검사 항목이 콘텐츠에 포함되는지
      // 왜: 가이드의 정보 정확성 확인
      await expect(page.getByText("1차 기형아 검사")).toBeVisible();
      await expect(page.getByText(/임신성 당뇨 검사/)).toBeVisible();
      await expect(page.getByText("GBS 검사")).toBeVisible();
    });

    test("출산 가방 가이드 링크가 동작한다", async ({ page }) => {
      // 무엇을: hospital-bag 가이드로의 내부 링크
      // 왜: 가이드 간 상호 연결 확인
      const link = page.getByRole("link", { name: "출산 가방 가이드" });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/articles\/hospital-bag/);
    });

    test("타임라인 페이지 링크가 동작한다", async ({ page }) => {
      // 무엇을: 타임라인 페이지로의 내부 링크
      // 왜: 가이드 → 타임라인 상호 연결 확인
      const link = page.getByRole("link", { name: /나에게 맞는 할 일 확인/ });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/timeline/);
    });

    test("의료 면책 고지가 표시된다", async ({ page }) => {
      // 무엇을: 가이드 하단 의료 면책 문구
      // 왜: 의료 정보 면책 요구사항
      await expect(page.getByText(/담당 의료진과 상담하시기 바랍니다/).last()).toBeVisible();
    });
  });

  test.describe("리다이렉트", () => {
    test("/guides/hospital-bag → /articles/hospital-bag 리다이렉트", async ({ page }) => {
      // 무엇을: 기존 가이드 URL 호환성
      // 왜: Phase 1.75 북마크/외부 링크 유지
      await page.goto("/guides/hospital-bag");
      await expect(page).toHaveURL(/\/articles\/hospital-bag/);
    });

    test("/guides/weekly-prep → /articles/weekly-prep 리다이렉트", async ({ page }) => {
      // 무엇을: 기존 가이드 URL 호환성
      // 왜: Phase 1.75 북마크/외부 링크 유지
      await page.goto("/guides/weekly-prep");
      await expect(page).toHaveURL(/\/articles\/weekly-prep/);
    });
  });

  test.describe("반응형 (Mobile 375px)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("모바일: 출산 가방 가이드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 가이드 페이지 표시
      // 왜: 주요 타겟 기기
      await page.goto("/articles/hospital-bag");
      await expect(
        page.getByRole("heading", { name: "출산 가방 필수 준비물 총정리" })
      ).toBeVisible();
    });

    test("모바일: 주차별 가이드가 정상 렌더링된다", async ({ page }) => {
      // 무엇을: 375px에서 주차별 가이드 표시
      // 왜: 주요 타겟 기기
      await page.goto("/articles/weekly-prep");
      await expect(
        page.getByRole("heading", { name: "임신 주차별 검사 & 준비 가이드" })
      ).toBeVisible();
    });
  });
});
