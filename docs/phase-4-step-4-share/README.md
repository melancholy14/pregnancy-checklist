# Phase 4 Step 4 — 공유 기능

> 작성일: 2026-05-02 | 작성자: Claude Code

## 개요
아티클 상세·체크리스트(3종)·타임라인 페이지에 **공유 버튼**을 배치한다. 모바일/터치 디바이스는 OS 네이티브 공유 시트(카카오톡·메시지·AirDrop 등 자동 커버), 데스크톱은 커스텀 모달의 "링크 복사" 버튼으로 분기한다. 맘카페·단톡방으로 흘러가는 링크 공유가 핵심 성장 채널이라, URL 직접 복사의 마찰을 제거하는 게 목적이다.

---

## 구현 내용

### 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| 아티클 상세 페이지에 공유 버튼 노출 (본문 상단 + 하단) | ✅ 완료 | divider 직후 우측 정렬 + 하단 RelatedContent 위 가운데 정렬 |
| 체크리스트 페이지(3종)에 공유 버튼 노출 (페이지 상단) | ✅ 완료 | `ChecklistPage.tsx` 헤더, ChecklistProgress 위 우측 정렬 |
| 타임라인 페이지에 공유 버튼 노출 (페이지 상단) | ✅ 완료 (요청 추가) | `TimelineContainer.tsx` 헤더, 현재 주차 카드 앞 우측 정렬 |
| 모바일: `navigator.share` 호출 → OS 네이티브 공유 시트 | ✅ 완료 | `matchMedia("(pointer: coarse) and (hover: none)")`로 모바일/터치 환경에서만 Web Share API 사용 |
| 데스크톱: 커스텀 모달 노출, `navigator.clipboard.writeText` 실행 | ✅ 완료 | 데스크톱은 `navigator.share` 존재 여부와 무관하게 항상 모달 fallback |
| 링크 복사 성공 시 토스트 "링크가 복사되었습니다" | ✅ 완료 | `sonner` toast.success |
| GA4 `share` 이벤트 (method, content_type, item_id) | ✅ 완료 | `web_share_api`/`clipboard` 두 경로 모두 송출 |
| 공유 데이터 = 페이지 제목 + 설명 + canonical URL | ✅ 완료 | 아티클: `article.canonical`, 체크리스트: `${BASE_URL}/checklist/${slug}`, 타임라인: `${BASE_URL}/timeline` |
| OG 메타 태그로 공유 프리뷰 정상 표시 | ✅ 완료 | 기존 `generateMetadata`/`metadata`가 OG title/description/url/image 설정 |

### 생성/수정 파일
**신규 생성**
- `src/lib/share.ts` — `triggerShare`(모바일/터치 환경 + Web Share API) / `copyShareLink`(clipboard + toast + GA) 유틸. `isMobileTouchEnvironment()` 헬퍼 포함
- `src/components/share/ShareButton.tsx` — Share2 아이콘 ghost 버튼. 클릭 시 `triggerShare`, 데스크톱은 항상 모달 open
- `src/components/share/ShareModal.tsx` — Dialog 기반 데스크톱 fallback. read-only URL input + "복사" 버튼

**수정**
- `src/components/articles/ArticleDetail.tsx` — 본문 상단(divider 뒤·authorNote 위)·하단(TimelineCTA 뒤·RelatedContent 앞) 두 곳에 ShareButton 배치
- `src/components/checklist/ChecklistPage.tsx` — h1 + PageDescription 이후, ChecklistProgress 앞에 ShareButton 우측 정렬 배치
- `src/components/timeline/TimelineContainer.tsx` — h1 + PageDescription 이후, 현재 주차 카드 앞에 ShareButton 우측 정렬 배치 (요청 추가)

### 주요 결정 사항
- **모바일/데스크톱 분기로 전환** — 초기엔 `navigator.share` 존재 여부만 분기 기준이었으나, 데스크톱 Chrome/Edge/Safari도 Web Share API를 지원해 PRD가 의도한 "데스크톱 모달 fallback"이 거의 노출되지 않았음. `matchMedia("(pointer: coarse) and (hover: none)")`로 모바일/터치 디바이스만 native 시트로, 데스크톱은 항상 모달로 분기.
- **`navigator.share` 실패 시 자동 모달 열지 않음** — AbortError 외의 예외 상황에서 사용자가 native 시트로 닫은 직후 모달이 떠 의도와 어긋날 수 있음. 묵음 처리.
- **상단/하단 ShareButton 라벨 차별화** — 상단은 "공유하기"(짧고 ghost), 하단은 "이 글 공유하기"(맥락 명확).
- **체크리스트·타임라인은 한 곳에만 배치** — Plan UI가 "페이지 상단" 단일 위치 명시. 본문 짧고 FAB가 우하단에 있어 충돌 우려.
- **`ShareModal`에서 description prop 미사용 처리** — 데스크톱 fallback은 URL 복사 목적이라 설명 비표시.
- **input은 read-only + onFocus select** — clipboard 실패 시 사용자가 직접 잡고 복사하는 fallback 자연스럽게 동작.

### 가정 사항 및 미구현 항목
**가정 사항**
- OG 메타는 기존 페이지 메타데이터로 이미 충족 → 추가 수정 없음
- `navigator.share`/`navigator.clipboard`는 클라이언트 전용 → 두 컴포넌트 모두 `"use client"` 마크, API 호출은 클릭 핸들러 안에서만
- AbortError(사용자가 native 시트 닫음)는 GA 이벤트 송출하지 않음 — 실제 공유 행동만 추적
- clipboard 미지원/실패 환경에서는 toast 에러 + 모달의 read-only input으로 수동 선택 복사 가능

**미구현 (Out of Scope)**
- 타임라인 주차 카드 단위 공유 (Plan에서 "옵션"으로 표시, 페이지 단위로 대체)
- 카카오 SDK 연동 (Plan에서 Phase 4.2로 미룸)
- 페이지별 OG 이미지 분기 (현 공통 OG_IMAGE 유지)
- 공유 횟수 통계 화면

---

## 코드 리뷰 결과

### Critical 이슈
없음.

### Warning
없음.

### Suggestion (3건)
1. `triggerShare`의 catch가 모든 에러를 동일하게 무시 — AbortError 외 일시 오류 시 사용자 피드백 부재. 분기해 toast 에러 표시 가능.
2. clipboard 미지원과 실제 실패가 같은 토스트 메시지로 처리됨. 분리하면 사용자가 원인 파악하기 쉬움.
3. ShareModal이 복사 실패 시에도 닫힘. boolean 반환 후 성공일 때만 close하면 사용자가 텍스트 직접 선택 가능.

### 추가 변경 (리뷰 후)
- 모바일/데스크톱 분기 도입 (위 "주요 결정 사항" 참조). e2e 스펙도 `hasTouch: true` 추가 + 데스크톱 케이스 보강으로 동시 갱신.

### 전체 요약
| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 3건 |

---

## 리팩토링 내용

### 작업 목록
없음 — Warning 0건, 추가 판단 결과 모든 신규 파일이 70줄 이하·단일 책임·중복 로직 없음·메모이제이션 남용 없음.

### 변경 전/후 구조
변경 없음.

---

## E2E 테스트 결과

테스트 파일: `e2e/phase-4-step-4-share.spec.ts`

| 시나리오 | 결과 |
|----------|------|
| Happy Path (7개) | ✅ 7 passed (3개 페이지 노출, 데스크톱 모달 + URL, 데스크톱 복사 + 토스트, navigator.share 있어도 모달 우선, 타임라인 데스크톱 모달) |
| Error/Validation (1개) | ✅ 1 passed (clipboard 미지원 에러 토스트) |
| 권한/인증 (1개) | ⏭️ 1 skipped (정적 공개 사이트) |
| 반응형 Mobile 375px (2개) | ✅ 2 passed (`hasTouch: true`로 진짜 모바일 환경 emulate, Web Share 위임 검증) |
| **전체** | **10 passed / 1 skipped / 0 failed (~7s)** |

📊 상세 리포트: `playwright-report/index.html`

---

## 누락된 문서
- `docs/refactor/phase-4-step-4-share-refactor.md` — 리팩토링 작업이 0건이라 미작성.
