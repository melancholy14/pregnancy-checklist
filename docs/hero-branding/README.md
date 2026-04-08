# Phase 2.5 Step 10: 히어로 카피 & 톤 리뉴얼

## 요약

홈 히어로 영역의 카피를 범용 병원 브로셔 톤에서 "당사자가 만든 도구"라는 브랜드 정체성을 전달하는 톤으로 전환했습니다. 출산 후 Phase 전환을 위한 상수 구조도 함께 설계했습니다.

## 변경 사항

| 위치 | AS-IS | TO-BE |
|------|-------|-------|
| 히어로 타이틀 | "출산 준비 체크리스트" | 유지 (SEO 앵커) |
| 히어로 서브 | "소중한 아기를 위한 완벽한 준비" | **"답답해서 직접 만들었습니다"** |
| 히어로 캡션 (신규) | — | **"초산 임신 중인 개발자의 출산 준비 기록"** |
| 하단 모티베이션 | "출산은 인생에서 가장 특별한 순간입니다" | **"같이 준비하면 덜 막막하니까요"** |

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/constants.ts` | `BrandPhase` 타입, `BRAND_PHASE`, `BRAND_COPY` 상수 추가 |
| `src/components/home/HomeContent.tsx` | 히어로 서브/캡션/모티베이션을 `BRAND_COPY[BRAND_PHASE]`로 참조 |
| `e2e/home.spec.ts` | 기존 히어로 카피 레퍼런스 업데이트 |
| `e2e/hero-branding.spec.ts` | E2E 테스트 5개 케이스 신규 작성 |

## 구현 상세

### Phase 분기 구조

```ts
export type BrandPhase = "pregnancy" | "postpartum" | "parenting";
export const BRAND_PHASE: BrandPhase = "pregnancy";

export const BRAND_COPY = {
  pregnancy: {
    heroSub: "답답해서 직접 만들었습니다",
    heroCaption: "초산 임신 중인 개발자의 출산 준비 기록",
    motivation: "같이 준비하면 덜 막막하니까요",
  },
  // postpartum, parenting도 동일 구조
} as const;
```

향후 Phase 전환 시 `BRAND_PHASE` 값 한 줄만 변경하면 히어로, About, 온보딩 카피가 모두 전환됩니다.

## 코드 리뷰

Critical/Warning 이슈 없음. 리팩토링 불필요.

## E2E 테스트

파일: `e2e/hero-branding.spec.ts`

| 테스트 | 설명 |
|--------|------|
| SEO 앵커 유지 | h1 "출산 준비 체크리스트" 변경 없음 확인 |
| 서브 카피 | "답답해서 직접 만들었습니다" 표시 |
| 캡션 | "초산 임신 중인 개발자의 출산 준비 기록" 표시 |
| 모티베이션 | 기존 클리셰 제거, 새 카피 표시 |
| 모바일 반응형 | 375px에서 전체 요소 정상 표시 |

결과: **5/5 통과** (2.9s)
