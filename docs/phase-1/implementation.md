# Phase 1 구현 기록

**날짜**: 2026-04-02
**브랜치**: feat/phase-0
**기준 문서**: [plan.md](../plan/plan.md) Phase 1, [phase-1/plan.md](plan.md)
**빌드 결과**: `npm run build` 성공 (10개 페이지 정적 생성)

---

## 구현 요약

Phase 1의 14개 Step 중 Step 1~9, 11~14 구현 완료. Step 10(gh-pages 실제 배포)는 워크플로우 준비 완료, main push 시 자동 실행.

| Step | 내용 | 상태 |
|------|------|------|
| 1 | 공통 레이아웃 + 네비게이션 | ✅ Phase 0 완료 |
| 2 | Due Date Store + 주차 계산 | ✅ Phase 0 완료 |
| 3 | 홈 페이지 + Due Date 입력 | ✅ 구현 |
| 4 | 체크리스트 Store + 페이지 | ✅ 구현 |
| 5 | 타임라인 Store + 페이지 | ✅ 구현 |
| 6 | 베이비페어 페이지 | ✅ 구현 |
| 7 | 체중 기록 페이지 | ✅ 구현 |
| 8 | 영상 큐레이션 페이지 | ✅ 구현 |
| 9 | 홈 대시보드 완성 | ✅ 구현 |
| 10 | gh-pages 배포 | 🔧 워크플로우 준비 완료 |
| 11 | Google Analytics 4 | ✅ 구현 |
| 12 | Google AdSense | ✅ 구현 |
| 13 | 개인정보/약관 + 의료 면책 | ✅ 구현 |
| 14 | 온보딩 플로우 | ✅ 구현 |

---

## 신규 파일 (10개)

| 파일 | 용도 |
|------|------|
| `src/components/checklist/ChecklistAddForm.tsx` | 체크리스트 커스텀 항목 추가 폼 (카테고리 선택 + 항목명) |
| `src/components/timeline/TimelineAddForm.tsx` | 타임라인 커스텀 항목 추가 폼 (주차 + 제목 + 설명) |
| `src/components/home/DueDateBanner.tsx` | 예정일 미입력 시 유도 배너 (체크리스트/타임라인 상단) |
| `src/components/ads/AdUnit.tsx` | AdSense 광고 슬롯 컴포넌트 (환경변수 없으면 미렌더링) |
| `src/components/layout/Footer.tsx` | 공통 푸터 (의료 면책 고지 + 개인정보/약관 링크) |
| `src/lib/analytics.ts` | GA4 커스텀 이벤트 전송 헬퍼 (`sendGAEvent`) |
| `src/app/privacy/page.tsx` | 개인정보처리방침 정적 페이지 |
| `src/app/terms/page.tsx` | 서비스 이용약관 정적 페이지 |
| `.github/workflows/deploy-gh-pages.yml` | gh-pages 자동 배포 GitHub Actions |
| `docs/phase-0/analysis.md` | Phase 0 적용 분석 보고서 |

---

## 수정 파일 (23개)

### 페이지

| 파일 | 변경 내용 |
|------|----------|
| `src/app/page.tsx` | 대시보드 추가 (현재 주차/D-day, 체크리스트 진행률, 이번 주 타임라인), 예정일 미입력 안내, 예정일 첫 입력 토스트 |
| `src/app/layout.tsx` | metadata 한글화, Footer 추가, Toaster 추가, GA4 `<GoogleAnalytics />` 추가 |
| `src/app/checklist/page.tsx` | DueDateBanner 추가 |
| `src/app/timeline/page.tsx` | DueDateBanner 추가 |
| `src/app/videos/page.tsx` | videos.json import + VideosContainer에 props 전달 |

### 컴포넌트

| 파일 | 변경 내용 |
|------|----------|
| `src/components/checklist/ChecklistContainer.tsx` | 커스텀 항목 추가/삭제, 현재 주차 하이라이트, ChecklistAddForm 연동, FAB 버튼 |
| `src/components/checklist/ChecklistItem.tsx` | priority 배지 (높음/보통/낮음), 커스텀 항목 삭제 버튼, 주차 하이라이트 표시 |
| `src/components/timeline/TimelineContainer.tsx` | JSON 전체 항목 표시 (마일스톤 5개 → 30+ 카드), 커스텀 항목 합산/정렬, 현재 주차 자동 스크롤, TimelineAddForm 연동, FAB 버튼 |
| `src/components/timeline/TimelineCard.tsx` | 개별 TimelineItem 카드 (지난/현재/예정 시각 구분, 커스텀 삭제 버튼, 내 항목 배지) |
| `src/components/babyfair/BabyfairContainer.tsx` | 도시 필터, 연도 필터, upcoming/ended 탭 (Tabs 컴포넌트), 필터별 empty state |
| `src/components/babyfair/BabyfairCard.tsx` | (기존 유지) |
| `src/components/weight/WeightChart.tsx` | 권장 체중 증가 참조선 (ReferenceLine), 출처 명시 (대한산부인과학회), 의료 면책 고지 |
| `src/components/weight/WeightContainer.tsx` | baseWeight prop 전달 (첫 기록 기준) |
| `src/components/videos/VideosContainer.tsx` | items prop 수신, VideoItem 타입 사용, 카테고리 Map 기반 분류, empty state |
| `src/components/videos/VideoCard.tsx` | VideoItem 타입 사용, YouTube 썸네일 URL 자동 생성, YouTube 링크 연결 |

### 기타

| 파일 | 변경 내용 |
|------|----------|
| `docs/plan/plan.md` | Phase 1에 1-12(홈 대시보드), 1-13(온보딩), 1-14(gh-pages 배포) 추가 |
| `package.json` | `deploy` 스크립트 추가, `@next/third-parties`, `gh-pages` 의존성 추가 |

---

## 기능별 상세

### 체크리스트 개선

- **커스텀 항목 추가**: FAB(+) 버튼 → ChecklistAddForm (카테고리 선택 + 항목명)
- **커스텀 항목 삭제**: `isCustom` 항목에만 Trash2 아이콘 표시
- **기본 항목 보호**: 기본 항목(123개)에는 삭제 버튼 없음
- **Priority 배지**: 높음(분홍), 보통(노랑), 낮음(초록) 3단계
- **현재 주차 하이라이트**: `recommendedWeek ± 1` 범위 항목에 노란색 배경 + 안내 텍스트

### 타임라인 개선

- **전체 항목 표시**: 마일스톤 5개 → JSON 기반 30+ 항목 카드 리스트
- **시각 구분**: 지난 주차(opacity 60%) / 현재 주차(ring 강조, 확대) / 예정 주차(기본)
- **자동 스크롤**: 현재 주차 카드로 smooth scroll
- **커스텀 항목**: 주차 선택(1~40) + 제목 + 설명 → 해당 주차에 삽입
- **type별 색상**: prep(분홍), shopping(피치), admin(노랑), education(보라), wellbeing(민트)

### 베이비페어 필터

- **도시 필터**: 전체 / 서울 / 부산 / 대구 / 인천 / 경기 / 광주 / 대전
- **연도 필터**: 연도가 2개 이상일 때 드롭다운 표시
- **탭 구분**: 예정 행사 / 지난 행사 (오늘 날짜 기준)
- **empty state**: 필터 결과 없을 때 안내 메시지

### 체중 차트 개선

- **권장 범위 참조선**: 정상 BMI 기준 +11.5~16kg (첫 기록 기준)
- **출처 명시**: 대한산부인과학회 임신 중 체중 관리 가이드라인
- **의료 면책**: "본 정보는 참고용이며 의료적 조언이 아닙니다"

### 영상 페이지 전환

- **데이터 소스**: 하드코딩 → `src/data/videos.json` import
- **타입 안전**: `VideoItem` 타입 사용 (`youtube_id`, `category`, `description`)
- **empty state**: videos.json이 빈 배열일 때 안내 메시지
- **YouTube 연동**: 썸네일 자동 생성 (`img.youtube.com/vi/{id}/mqdefault.jpg`), 클릭 시 YouTube 이동

### 홈 대시보드

- **예정일 입력 시**: 현재 주차 + D-day, 체크리스트 진행률 바, 이번 주 타임라인 미리보기 (최대 3개)
- **예정일 미입력 시**: 입력 유도 카드 표시
- **토스트**: 예정일 첫 입력 시 "데이터는 이 브라우저에만 저장됩니다" 안내

### 온보딩

- **DueDateBanner**: 체크리스트/타임라인 페이지 상단에 예정일 입력 유도 배너
- **비차단**: 예정일 없이도 전체 항목 열람 가능
- **자동 숨김**: 예정일 입력 후 배너 사라짐

### GA4 + AdSense

- **GA4**: `@next/third-parties` `<GoogleAnalytics />`, 환경변수 없으면 미로드
- **analytics.ts**: `sendGAEvent()` 헬퍼 (이벤트 전송 코드 삽입은 추후)
- **AdSense**: `AdUnit` 컴포넌트, `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 없으면 미렌더링

### Footer + 법적 페이지

- **Footer**: 의료 면책 고지 + 개인정보처리방침/서비스 약관 링크
- **`/privacy`**: GA4, AdSense, LocalStorage 관련 개인정보 처리 안내
- **`/terms`**: 의료 면책, 데이터 소실 고지, 외부 링크 면책

### gh-pages 배포

- **`npm run deploy`**: `gh-pages -d out` 스크립트
- **GitHub Actions**: main push 시 자동 빌드 + gh-pages 배포
- **환경변수**: `NEXT_PUBLIC_BASE_PATH=/pregnancy-checklist`, GA4 측정 ID (Secrets)

---

## 빌드 결과

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /baby-fair
├ ○ /checklist
├ ○ /privacy
├ ○ /terms
├ ○ /timeline
├ ○ /videos
└ ○ /weight

○  (Static)  prerendered as static content
```

10개 페이지 정적 생성 완료. Phase 0 대비 `/privacy`, `/terms` 2개 페이지 추가.

---

## 검증 체크리스트 (plan.md Verification Criteria 기준)

### Functional — 구현 완료

- [x] 출산 예정일 입력 → 임신 주차 정확히 계산
- [x] 예정일/체크상태/커스텀항목/체중기록이 LocalStorage에 저장
- [x] 체크리스트 123개 항목이 5개 카테고리 탭으로 표시
- [x] 체크리스트에 커스텀 항목 추가 → 해당 카테고리에 표시
- [x] 커스텀 항목 삭제 → 목록에서 제거. 기본 항목 삭제 버튼 없음
- [x] 체크 토글 → 진행률(%) 즉시 반영
- [x] 현재 주차 기준 하이라이트
- [x] 타임라인 30+ 항목이 주차순으로 표시, 현재 주차로 자동 스크롤
- [x] 지난/현재/예정 주차 시각적 구분
- [x] 타임라인에 커스텀 항목 추가(주차 지정) → 해당 주차에 삽입
- [x] 커스텀 타임라인 항목 삭제. 기본 항목 삭제 버튼 없음
- [x] 베이비페어 필터(도시, upcoming/ended) 정상 동작
- [x] 영상 페이지 empty state 정상 표시
- [x] 체중 입력 → 차트에 즉시 반영
- [x] AdSense 슬롯 컴포넌트 준비 (환경변수 없으면 미렌더링)
- [x] `/privacy`, `/terms` 페이지 접속 가능
- [x] 모든 페이지 하단 Footer에 면책 문구 + 약관/개인정보 링크 표시
- [x] 예정일 첫 입력 시 토스트 표시
- [x] 예정일 미입력 시 홈에 입력 유도 화면 표시
- [x] 체크리스트/타임라인 진입 시 예정일 미입력이면 배너 표시

### Technical — 빌드 검증 완료

- [x] `npm run build` — `out/` 디렉토리 생성 (static export)
- [x] TypeScript 에러 없음 (빌드 중 타입 체크 통과)
- [x] `out/` 빌드에 `/privacy`, `/terms` HTML 포함

### 미완료 (추후)

- [ ] GA4 Realtime에서 이벤트 수신 확인 (배포 후 검증)
- [ ] `npx tsc --noEmit` 별도 실행
- [ ] `npm run lint` 별도 실행
- [ ] E2E 테스트 업데이트 (기존 32개 → Phase 1 기능 반영)
- [ ] 모바일 레이아웃 검증 (375px)
- [ ] gh-pages 배포 후 basePath URL 검증
