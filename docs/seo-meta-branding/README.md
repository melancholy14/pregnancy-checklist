# Phase 2.5 Step 11: SEO 메타 태그 브랜딩

## 요약

검색 결과에서 다른 출산 정보 사이트와 차별화되도록 전체 페이지의 title, description, og 태그를 브랜딩 톤으로 통일했습니다.

## 변경 사항

### 루트 (홈)

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| title | 출산 준비 체크리스트 - 임신 주차별 준비 가이드 | **출산 준비 체크리스트 - 초산 개발자가 직접 만든 임신 주차별 가이드** |
| description | 임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요. | **답답해서 직접 만들었습니다. 임신 주차별 체크리스트, 입원가방, 베이비페어, 체중관리까지.** |

### 서브 페이지

| 페이지 | AS-IS description | TO-BE description |
|--------|-------------------|-------------------|
| `/about` | 출산 준비 체크리스트 서비스를 소개합니다. | **초산 임신 중인 개발자가 답답해서 만든 출산 준비 체크리스트입니다.** |
| `/contact` | 출산 준비 체크리스트 서비스 문의 및 연락처입니다. | **혼자 만들다 보니 놓치는 것도 많아요. 의견을 들려주세요.** |
| `/timeline` | 4주부터 40주까지, 주차별로 준비해야 할 항목을... | **주차별로 뭘 해야 하는지 한눈에. 직접 써보며 만든 체크리스트.** |
| `/baby-fair` | 전국 베이비페어 일정, 장소, 공식 링크를... | **전국 베이비페어 일정을 한곳에 모았습니다. 날짜·장소·링크까지.** |

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/layout.tsx` | 루트 metadata title, description, og 태그 |
| `src/app/page.tsx` | 홈 페이지 metadata (layout 오버라이드) |
| `src/app/about/page.tsx` | description, og:description |
| `src/app/contact/page.tsx` | description, og:description |
| `src/app/timeline/page.tsx` | description, og:description |
| `src/app/baby-fair/page.tsx` | description, og:description |
| `e2e/seo-meta.spec.ts` | E2E 테스트 7개 케이스 |

## 코드 리뷰

Critical/Warning 이슈 없음. 리팩토링 불필요.

## E2E 테스트

파일: `e2e/seo-meta.spec.ts`

| 테스트 | 설명 |
|--------|------|
| 홈 title | "초산 개발자가 직접 만든" 포함 확인 |
| 홈 description | "답답해서 직접 만들었습니다" 포함 확인 |
| 홈 og:description | description과 동기화 확인 |
| /about | "답답해서 만든" 포함 확인 |
| /contact | "의견을 들려주세요" 포함 확인 |
| /timeline | "직접 써보며 만든" 포함 확인 |
| /baby-fair | "한곳에 모았습니다" 포함 확인 |

결과: **7/7 통과** (3.0s)
