# Phase 4 Step 4 — 공유 기능 Implementation

## 완료 조건 충족 여부
| 조건 | 상태 | 비고 |
|------|------|------|
| 아티클 상세 페이지에 공유 버튼 노출 (본문 상단 + 하단) | ✅ 완료 | divider 직후 우측 정렬 + 하단 RelatedContent 위 가운데 정렬 |
| 체크리스트 페이지(3종)에 공유 버튼 노출 (페이지 상단) | ✅ 완료 | `ChecklistPage.tsx` 헤더, ChecklistProgress 위 우측 정렬 |
| 타임라인 페이지에 공유 버튼 노출 (페이지 상단) | ✅ 완료 (요청 추가) | `TimelineContainer.tsx` 헤더, 현재 주차 카드 앞 우측 정렬 |
| 모바일: `navigator.share` 호출 → OS 네이티브 공유 시트 | ✅ 완료 | `matchMedia("(pointer: coarse) and (hover: none)")`로 모바일/터치 환경에서만 Web Share API 사용 |
| 데스크톱: 커스텀 모달 노출, `navigator.clipboard.writeText` 실행 | ✅ 완료 | 데스크톱은 `navigator.share` 존재 여부와 무관하게 항상 모달 fallback |
| 링크 복사 성공 시 토스트 "링크가 복사되었습니다" | ✅ 완료 | `sonner` toast.success |
| GA4 `share` 이벤트 (method, content_type, item_id) | ✅ 완료 | `web_share_api`/`clipboard` 두 경로 모두 송출 |
| 공유 데이터 = 페이지 제목 + 설명 + canonical URL | ✅ 완료 | 아티클: `article.canonical`, 체크리스트: `${BASE_URL}/checklist/${slug}` |
| OG 메타 태그로 공유 프리뷰 정상 표시 | ✅ 완료 | 기존 `generateMetadata`/`metadata`가 이미 OG title/description/url/image 설정 — 추가 보강 없음 |

## 생성/수정 파일 목록

### 신규 생성
- `src/lib/share.ts` — `triggerShare`(Web Share API + AbortError 무시) / `copyShareLink`(clipboard + toast + GA) 유틸
- `src/components/share/ShareButton.tsx` — Share2 아이콘 ghost 버튼. 클릭 시 `triggerShare`, 미지원이면 모달 open
- `src/components/share/ShareModal.tsx` — Dialog 기반 데스크톱 fallback. read-only URL input + "복사" 버튼

### 수정
- `src/components/articles/ArticleDetail.tsx` — 본문 상단(divider 뒤·authorNote 위)·하단(TimelineCTA 뒤·RelatedContent 앞) 두 곳에 ShareButton 배치
- `src/components/checklist/ChecklistPage.tsx` — h1 + PageDescription 이후, ChecklistProgress 앞에 ShareButton 우측 정렬 배치
- `src/components/timeline/TimelineContainer.tsx` — h1 + PageDescription 이후, 현재 주차 카드 앞에 ShareButton 우측 정렬 배치 (요청 추가)
- `src/lib/share.ts` — `ShareContentType`에 `"timeline"` 추가

## 주요 결정 사항

- **모바일/데스크톱 분기로 전환** — 초기엔 `navigator.share` 존재 여부만 분기 기준이었으나, 데스크톱 Chrome/Edge/Safari도 Web Share API를 지원해 PRD가 의도한 "데스크톱 모달 fallback"이 거의 노출되지 않았음. `matchMedia("(pointer: coarse) and (hover: none)")`으로 모바일/터치 디바이스만 native 시트로, 데스크톱은 항상 모달로 분기하도록 변경.
- **`navigator.share` 실패 시 자동 모달 열지 않음** — Plan에는 fallback이 명시되어 있지만 AbortError 외의 예외 상황에서 사용자가 native 시트로 닫은 직후 모달이 떠 의도와 어긋날 수 있음.
- **상단/하단 ShareButton 라벨 차별화** — 상단은 기본 "공유하기"(짧고 ghost), 하단은 "이 글 공유하기"(맥락 명확)로 구분해 동일 버튼 두 번 노출의 잡음 완화.
- **체크리스트는 한 곳에만 배치** — Plan UI가 "페이지 상단" 단일 위치를 명시. 본문이 짧고 FAB(+버튼)가 우하단에 있어 하단 추가 시 시각 충돌 우려.
- **`ShareModal`에서 description prop 미사용 처리** — Web Share API 데이터에는 text(설명)가 필요하나, 데스크톱 fallback 모달은 URL 복사가 목적이라 설명을 표시하지 않음. props에서 제거해 사용처 단순화.
- **input은 read-only + onFocus select** — 사용자가 직접 텍스트를 잡고 복사하는 fallback도 자연스럽게 동작.

## 가정 사항

- OG 메타는 기존 페이지 메타데이터로 이미 충족 → 추가 수정 없음
- `navigator.share`/`navigator.clipboard`는 클라이언트 전용 → 두 컴포넌트 모두 `"use client"` 마크, API 호출은 클릭 핸들러 안에서만
- AbortError(사용자가 native 시트 닫음)는 GA 이벤트 송출하지 않음 — 실제 공유 행동만 추적
- clipboard 미지원/실패 환경에서는 toast 에러 + 모달의 read-only input으로 수동 선택 복사 가능

## 미구현 항목 (Out of Scope)

- 타임라인 주차 카드 공유 (Plan에서 "옵션"으로 표시)
- 카카오 SDK 연동 (Plan에서 Phase 4.2로 미룸)
- 페이지별 OG 이미지 분기 (현 공통 OG_IMAGE 유지)
- 공유 횟수 통계 화면
