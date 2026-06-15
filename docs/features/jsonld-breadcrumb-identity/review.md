# jsonld-breadcrumb-identity 리뷰

> 작성일: 2026-06-08
> 상태: draft
> size: M
> 관련 스펙: [spec.md](./spec.md) (생성 후)

## 1. 기능 요약

[docs/plan/update-seo-aeo-geo.md](../../plan/update-seo-aeo-geo.md) 의 PR-B (BreadcrumbList JSON-LD) + PR-E (WebSite + Person JSON-LD) 를 단일 PR 로 묶어 처리. 화면 변경 0 / GA4 이벤트 변경 0. 산후 휴면 전 3주차 (2026-06-15 주) 출시 목표 — Google 색인 효과 발현에 1~2주 필요.

## 2. 적용 페어 + 선택 이유

- **dev × marketer**: Identity signal scope (Person.sameAs 비공개·SearchAction 을 client-side 모달에 매핑·breadcrumb 라벨 SoT). JSON-LD 자체가 보이지 않는 메타이지만 어디까지 박을지가 운영자 의사결정과 SEO 신호 강도 사이에서 가장 첨예하게 충돌함.
- **dev × qa**: JSON-LD testability (17 라우트 통합 누락 회귀 차단). 화면 변경이 없어 회귀가 시각적으로 안 보이고, BreadcrumbList × 17 라우트는 다른 가드로 못 잡는 회귀 클래스라 §7.4 fs-level grep 가드 신설 검토가 필요함.

제외한 페어:
- planner × marketer: JSON-LD 는 GTM 캠페인이 아니라 일반 SEO. MVP 축소 vs 임팩트 축이 약함.
- dev × planner: 1인 개발이라 일정·기술부채 vs 스펙 범위 충돌이 자기 자신 안에 흡수됨.
- designer × *: 시각 컴포넌트 0개. 충돌 축 부재.

## 3. 페어별 충돌

### 페어 1: dev × marketer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: dev × marketer
- 이전 페어 [없음] 의 양보·합의는 이 페어에 영향 없음.
- dev, marketer 의 persona.md "희생 거부" 섹션을 다시 참조함.
  · dev 인용 후보:
    - §6.6 "새 색·radius·shadow·면책 문장·CTA 카피를 개발자가 박지 않음. 산출물 없으면 운영자에게 결정 요청. 임시 추정값으로 채우면 그게 영구가 된다."
    - §6.4 "dangerouslySetInnerHTML 을 사용자 입력에 직결 X"
    - §6.5 "E2E 빨강을 무시하고 배포 X"
  · marketer 인용 후보:
    - §3.3 "운영자가 경험하지 않은 주제를 '내 경험담'으로 위장 … 임산부 도메인에서 신뢰 = 유일한 moat"
    - §3.7 "1인 운영자에게 매일 수동 작업이 필요한 캠페인 … 1인 운영자 지속가능성 = 서비스 지속가능성"
    - §3.6 "이벤트명·파라미터 키·user_property 정의 임의 변경/삭제 … 과거 데이터 단절 = 의사결정 능력의 영구 손실"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[dev] 단독 입장 (T1)**

- 잃는 것:
  1. Person JSON-LD 의 image / description / sameAs / jobTitle 같은 필드 값들을 운영자에게 직접 받아오기 전엔 박지 못함 → "운영자 = 뿌까뽀까" 한 줄 + `url=/about` 만 박는 최소판으로 시작.
  2. WebSite.SearchAction 의 target URL — 검색이 client-side modal 이라 진입 가능한 URL 이 없으므로, 검색 결과 URL 라우트(예: `/articles?q=...`)를 새로 만들기 전엔 SearchAction 자체를 박지 못함.
  3. Breadcrumb 라벨 SoT 가 흩어지면 안 됨 — 라우트 추가 시마다 dev 가 라벨 추정해서 박는 것 거부, 운영자 합의된 단일 매핑 테이블만 사용.

- 희생 거부 인용: "새 색·radius·shadow·면책 문장·CTA 카피를 개발자가 박지 않음 … 산출물 없으면 운영자에게 결정 요청. 임시 추정값으로 채우면 그게 영구가 된다." — docs/tech/persona.md §6.6
  → Person 의 image, description, sameAs 는 운영자 카피·신원 카피 영역. 추정 박으면 영구화됨.

- 주장:
  - Person JSON-LD: 최소판 (`{name, url=/about}`) 으로 시작. 운영자가 별도로 image URL / SNS 링크 / 한 줄 자기소개 카피를 확정해주면 그때 보강.
  - WebSite.SearchAction: 이 PR 에서는 스킵. 검색 결과 URL 라우트가 추가되면 그 PR 과 함께 박음.
  - Breadcrumb 라벨: `src/lib/breadcrumb-labels.ts` 같은 단일 파일에 라우트→라벨 매핑을 못 박고, 신규 라우트 시 lint 으로 누락 감지.

- 잔재 자기검증: 이전 페어 없음 — N

**[marketer] 반박 입장 (T2)**

- dev 발언에 대한 명시 반박:
  1. "Person 최소판으로 시작" 에 반박 — Person JSON-LD 의 SEO·E-E-A-T 신호 강도는 sameAs 가 들어있을 때 vs 비어있을 때 격차가 큼. sameAs 없는 Person 은 사실상 Author 노이즈 마크업에 가깝고, 검색 신뢰 신호로 활용 안 됨. "이름 + url" 만으로는 plan 문서가 약속한 "사이트링크 검색박스 노출, E-E-A-T 의 Identity 신호" 효과가 거의 달성 안 됨 → PR-E 의 정체성 신호 절반(E) 이 무의미해짐.
  2. "SearchAction 스킵" 에 반박 — 사이트링크 검색박스(Google 검색결과 페이지 안에서 사이트 내 검색을 바로 칠 수 있는 UI)는 SearchAction 이 박혀야 노출 후보가 됨. plan 문서가 PR-E 효과로 명시한 항목이고, 박지 않으면 PR-E 의 SEO 효과 핵심이 빠짐.
  3. "라벨 단일 파일에 못 박기" 에는 동의하지만 — dev 가 매핑 추정으로 박지 말라는 룰만 강조하면, **결과적으로 라벨 결정이 운영자에게 모두 떠넘겨지고 그 결정 비용이 운영자 번아웃 트리거**가 됨. 라벨 후보를 marketer/planner 가 미리 제안하고 운영자는 승인/수정만 하는 흐름이 필요.

- 잃는 것:
  1. Person 을 최소판으로 박으면 PR-E 의 SEO 효과 측정이 사실상 불가 — 향후 sameAs 보강 시 효과 분리 측정이 어려워짐.
  2. SearchAction 을 스킵하면 사이트링크 검색박스 노출 후보에서 영구 제외 (Google 이 모르는 페이지에는 노출 안 함).
  3. 라벨 매핑을 운영자에게 한 줄도 추정 없이 떠넘기면 라벨 결정만 N개 라우트만큼 누적.

- 희생 거부 인용: "1인 운영자에게 매일 수동 작업이 필요한 캠페인, 정형화 안 된 반복 노동 … 1인 운영자 지속가능성 = 서비스 지속가능성. 본인 임신·출산 시즌에는 더더욱." — docs/marketing/persona.md §3.7
  → 산후 휴면 들어가기 전 dev 가 라벨·sameAs·SearchAction target 을 운영자 결정으로 전부 미루면 운영자는 산전에 SEO 결정 N개를 처리해야 함. 마케터가 후보 + 디폴트를 제안하지 않는 건 운영자 번아웃 가속.

- 주장:
  - Person: sameAs 가 정말 없으면 박지 말고 차라리 Person JSON-LD 자체를 보류. "최소판이라도 박자" 는 의미 없는 절충 — 검색엔진은 sameAs 없는 Person 을 Identity 신호로 안 잡아줌.
  - SearchAction: 운영자에게 "검색 결과 URL 라우트(`/articles?q=...`)를 만들지" 의사결정을 명시적으로 묻고, 만든다면 PR 범위에 포함, 안 만든다면 SearchAction 도 스킵. 어중간한 modal trigger 는 박지 말 것.
  - Breadcrumb 라벨: 라벨 후보안 + 디폴트값을 spec.md 에 미리 박아두고, 운영자는 그걸 봐서 OK / 수정만. dev 가 "운영자 결정 받기 전엔 안 박음" 으로 던지지 말고 후보를 propose.

- 잔재 자기검증: 이전 페어 없음 — N

**핵심 충돌 (T3)**

Person JSON-LD 와 SearchAction 을 "효과 약해도 일단 박고 나중에 보강" vs "효과 없으면 박지 말고 전부 보류"
- dev: 최소판으로 박되 카피·sameAs 는 운영자 확정 전엔 비움 (§6.6).
- marketer: 효과 거의 없을 신호는 박는 것 자체가 비용 — sameAs/SearchAction target 이 정해지기 전엔 PR-E 자체를 보류하거나, 운영자가 결정해야 할 항목들의 후보·디폴트를 spec 에 미리 박아 결정 비용을 줄여야 함 (§3.7).

**숨은 가정**

Google 이 "최소 정보 Person" 을 Identity 신호로 활용한다는 dev 의 암묵 가정, 그리고 "사이트링크 검색박스" 가 SearchAction 만 박으면 노출된다는 marketer 의 암묵 가정 — 둘 다 검증되지 않은 SEO 통념.

**가정 검증 결과 (2026-06-08, WebSearch + Google Search Central 공식 doc 확인)**

| 가정 | 결과 | 근거 |
|---|---|---|
| marketer: WebSite + SearchAction → 사이트링크 검색박스 노출 | ❌ **무효 (deprecated)** | Google이 2024-10-21 공지, 2024-11-21 글로벌 retire. 18개월+ 경과. 공식: "SearchAction markup ... should be removed since it no longer serves a functional purpose." ([Google Search Central Blog](https://developers.google.com/search/blog/2024/10/sitelinks-search-box)) |
| dev: 최소 정보 Person (name + url) 도 Identity 신호 | ❌ **거의 무효** | Schema.org Person required는 `name`뿐, 그러나 sameAs는 "highest-leverage field". Google Knowledge Graph / E-E-A-T identity 매칭은 sameAs로 외부 검증 가능한 신원(Wikipedia/Wikidata/LinkedIn/SNS)이 묶여야 작동. sameAs 없는 Person은 cargo cult markup에 가까움. ([Google ProfilePage docs](https://developers.google.com/search/docs/appearance/structured-data/profile-page)) |
| 보조 발견: WebSite 자체는 살아있는가? | ✅ **여전히 유효** | site name 표시용으로 `name` + `url` + `alternateName` 3필드는 SERP 사이트 이름 결정에 활용됨. ([Google Site names docs](https://developers.google.com/search/docs/appearance/site-names)) |

**파장**: plan 문서가 18개월 전 deprecated 된 feature를 PR-E 의 핵심 효과로 추천하고 있음. 결정 옵션이 가정 기반이었으므로 §4 항목 1·2 갱신 필요.

---

### 페어 2: dev × qa

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: dev × qa
- 이전 페어 [dev × marketer] 의 양보·합의는 이 페어에 영향 없음.
- dev, qa 의 persona.md "희생 거부" 섹션을 다시 참조함.
  · dev 인용 후보:
    - §6.5 "E2E 빨강을 무시하고 배포 X. 빨강이면 원인 찾는다."
    - §6.4 "dangerouslySetInnerHTML 을 사용자 입력에 직결 X"
    - §6.6 "임시 추정값으로 채우면 그게 영구가 된다"
  · qa 인용 후보:
    - §7.4 "fs-level grep 가드는 다른 테스트가 못 잡는 회귀를 막는다. 절대 삭제 X."
    - §7.2 "toBe('정확한 문구') → toBeTruthy() 같은 약화 금지"
    - §7.1 "skip 사용 시 제거 조건과 deadline 같이 명시한 TODO 코멘트 필수"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[dev] 단독 입장 (T1)**

- 잃는 것:
  1. 17 라우트 × BreadcrumbList × 라벨/URL/position 까지 단언하는 E2E 케이스를 쓰면 추가되는 테스트 분량이 PR 본문보다 큼. 라벨 SoT 함수(`getBreadcrumbForPath`) 같은 pure function 1개의 unit test 로 갈음하고, E2E 는 article 1개 + checklist 1개 + 정적 1개 샘플만 가드.
  2. WebSite/Person JSON-LD 는 layout 1회 주입이라 모든 페이지에 동일하게 박힘. 모든 페이지에서 단언할 필요 없음 — root `/` 한 페이지만 가드.
  3. Schema.org 공식 validator 호출 같은 외부 의존 테스트는 도입 안 함. JSON 파싱 가능 + 필수 필드 존재 정도면 충분.

- 희생 거부 인용: "E2E 빨강을 무시하고 배포 X. 빨강이면 원인 찾는다." — docs/tech/persona.md §6.5
  → 빨강을 만들지 말자가 아니라 빨강을 가리지 말자. 가드 수는 적되 빨강일 때 원인이 명확한 케이스만 가드함.

- 주장:
  - Unit: `getBreadcrumbForPath(pathname, articleMeta?): BreadcrumbItem[]` 라벨 매핑 + edge case (slug 누락, unknown route fallback) 단위로 가드.
  - E2E: article 1개 / checklist 1개 / 정적 1개 / 루트 1개 — 4개만 작성. 각 페이지에서 ld+json script 파싱 → @type 확인 → position 1~N 의 name 만 단언.
  - fs-level grep 가드: 현재 `design-bundle-cleanup-round.spec.ts` 가 잡고 있는 패턴에 BreadcrumbList 페이지가 새로 끼어들 가능성이 없으므로 추가 가드 만들지 말 것.

- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — 이전 페어에서 Person/SearchAction 보류 여부는 결정되지 않았고 이 페어 발언은 그 결정과 무관한 "testing strategy" 축에서만 작성됨

**[qa] 반박 입장 (T2)**

- dev 발언에 대한 명시 반박:
  1. "샘플 라우트 4개만 E2E 가드" 에 반박 — BreadcrumbList 의 회귀 가능성은 **라벨 매핑 함수 자체보다 페이지 통합 누락**(컴포넌트 import 만 했는데 props 안 넘긴 케이스, 새 라우트 추가했는데 매핑 갱신 안 한 케이스)에서 더 자주 발생. 샘플만 가드하면 라우트 17개 중 13개에 BreadcrumbList 가 빠져 있는 회귀를 못 잡음 → 디자인 테스트가 아니라 모든 라우트에서 ld+json 존재 여부만 grep 하는 fs-level 가드로 잡아야 함.
  2. "Unit 으로 갈음" 부분 동의하지만 — `getBreadcrumbForPath` 의 시그니처가 pathname → items 로 깔끔하면 mock 0 으로 unit test 됨. 다만 라벨 SoT 가 `src/data/*.json` 이나 article frontmatter 를 참조하면 mock 3개 이상 필요 → unit 후보가 아니게 됨. 이 결정은 dev 가 함수 시그니처를 어떻게 짜느냐에 따라 unit/E2E 분배가 바뀌므로 spec 단계에서 명시되어야 함 (§7.3 today 주입 가능 여부 같은 결).
  3. "Schema.org validator 도입 안 함" 동의 — 외부 의존 + 1인 운영이라 ROI 깨짐. 다만 dev 의 "필수 필드 존재 정도면 충분" 은 §7.2 단언 약화로 갈 수 있음. position·item.@id·item.name 3개는 strict 단언 필수, name 의 정확 문자열은 라벨 매핑 unit 에 떠넘기고 E2E 는 키 존재 + position 순서만 strict 단언.

- 잃는 것:
  1. 모든 라우트에서 ld+json grep 하는 fs-level 가드를 만들면 라우트 추가 시 그 가드 입력도 갱신해야 함 (운영 비용 +).
  2. WebSite/Person 을 루트만 가드하면 ConsentGatedScripts·CookieConsentBanner 같은 동의 게이트가 JSON-LD 위치를 바꾸는 회귀를 못 잡음.
  3. 라벨 매핑이 frontmatter/json 데이터에 의존하면 unit 가능성 자체가 사라지고 E2E 의존도가 커짐.

- 희생 거부 인용: "fs-level grep 가드는 다른 테스트가 못 잡는 회귀를 막는다. 절대 삭제 X." — docs/qa/persona.md §7.4
  → BreadcrumbList × 17 라우트 통합 누락 회귀는 다른 어떤 E2E·unit 으로도 못 잡음 (각 라우트마다 페이지 spec 을 쓰는 건 §3.3 ROI 위반). fs-level grep 가드 1개로 "build 출력의 모든 페이지 HTML 에 BreadcrumbList ld+json 1개 이상 포함" 을 검증해야 회귀 차단.

- 주장:
  - Unit: `getBreadcrumbForPath` 시그니처를 pathname + articleMeta 주입형으로 고정. 라벨 SoT 는 dependency-free 한 상수 객체(`BREADCRUMB_LABELS`)로 두고, article 라벨은 article meta 를 unit 입력으로 받음 (mock 0).
  - E2E: 샘플 페이지 4개 (article/checklist/정적/루트) 풀 단언 + fs-level grep 가드 1개로 "next build 결과의 모든 .html 에 `@type":"BreadcrumbList"` 가 1번 이상 등장" 검증.
  - WebSite/Person: 루트 + 1개 article 페이지 두 곳에서 layout 주입이 그대로 상속되는지 확인.
  - skip 후보 (SearchAction 동작 확인 e2e): 검색 모달은 페이지 navigation 이 없어서 SearchAction.target 클릭 e2e 가 자연 어색함. 도입 시 §7.1 룰로 "skip 후 제거 조건 + deadline" 필수.

- 잔재 자기검증: 이전 페어 [dev × marketer] 영향 없음 — N — Person 보류 vs 박기 결정과 무관하게 이 페어는 가드 강도·테스트 분배만 다룸. 단 marketer 페어가 "SearchAction 보류" 로 결정되면 그 케이스의 skip 룰만 자동 해제됨 (테스트 자체가 작성 안 됨)

**핵심 충돌 (T3)**

Breadcrumb·Identity 의 통합 누락 회귀를 "샘플 E2E 4개 + unit" 으로 막을 것인가 vs "샘플 E2E 4개 + unit + fs-level grep 가드 1개" 로 막을 것인가
- dev: 5번째 fs-level 가드는 유지비 + 라우트 추가마다 또 갱신 → ROI 부정.
- qa: 17 라우트 통합 누락은 다른 어떤 가드로도 못 잡음. fs-level grep 1개가 §7.4 "다른 테스트가 못 잡는 회귀" 정확한 정의에 해당.

**숨은 가정**

- dev: "BreadcrumbList 통합은 한 번 박으면 안 빠진다" — 실제론 라우트 추가 작업자가 dev 본인이고, plan 문서가 산후 휴면 직전이라 작성자가 미래 자신을 신뢰하지 못해야 함.
- qa: "fs-level grep 가드가 의도 위반을 신뢰성 있게 잡는다" — 라우트 추가 시 그 가드도 자동 갱신되지 않으므로, 가드 자체가 stale 되는 risk 있음 (다만 grep `@type":"BreadcrumbList"` 자체는 라우트 추가에 영향 안 받으므로 stale 리스크 적음).

---

## 4. 미해결 트레이드오프

- [ ] **항목 1: Person JSON-LD 를 어떤 범위로 박을 것인가?** (2026-06-08 가정 검증 결과 반영)
  - ~~옵션 A — 최소판 박기 (`{name, url=/about}` 만)~~ ❌ **권장 안 함**
    - 가정 검증으로 가치 거의 0 임이 확정. Google ProfilePage / E-E-A-T 매칭은 sameAs 없으면 작동 안 함.
    - 박는 비용은 0이지만 cargo cult markup — 향후 sameAs 보강 시 효과 분리 측정도 불가.
  - 옵션 B — Person 자체 보류 (WebSite 만 박음, Person 은 별도 PR)
    - 즉시 비용: PR-E 의 절반(Person)이 빠짐. WebSite 만 layout에 박음.
    - 나중 비용: 운영자가 SNS 공개 / image / 한 줄 자기소개를 확정하는 시점에 후속 PR 1개. 산후 휴면이라 그 PR은 2026 Q4 이후 가능성.
  - 옵션 C — 운영자가 sameAs (SNS URL) 1~2개 + image URL + 한 줄 자기소개를 즉석 제공 → 풀판 박기
    - 즉시 비용: 운영자에게 SNS·이미지·소개 카피 결정 요청. marketer §3.1 (PII 보호) 점검 필요 — 운영자 본인 SNS 공개가 PII 노출 트레이드오프인지 확인.
    - 나중 비용: 가장 좋은 신호 강도. 한 번에 끝남.
  - **결정:** A

- [x] **항목 2: WebSite.SearchAction 을 박을 것인가?** ⚠️ **2026-06-08 가정 검증으로 결정 자동화됨**
  - 결정: **SearchAction 박지 말 것. WebSite 만 박되 `name` + `url` + `alternateName` 3필드로 한정.**
  - 근거: Google이 2024-11-21 Sitelinks Search Box 글로벌 retire. 18개월+ 경과. Google 공식 권고가 "remove" — SearchAction은 박아도 SERP에 아무 시각 효과 없고, ld+json 길이만 늘림.
  - 대안 검증: WebSite 자체는 site name 표시용으로 여전히 유효. `name="출산 준비 체크리스트"`, `url=BASE_URL`, `alternateName` 후보(예: "뿌까뽀까 출산 준비") 박는 안만 살아 있음.
  - 폐기된 옵션: 검색 결과 URL 라우트 (`/articles?q=...`) 신설은 이 PR과 무관 — SearchAction이 obsolete이므로 라우트 신설 동기가 사라짐. 사이트 내 검색 UX 개선이 필요하면 완전 별도 PR로 분리.

- [ ] **항목 3: Breadcrumb 라벨 SoT 와 디폴트 결정 방식?**
  - 옵션 A — 운영자가 17 라우트 라벨을 모두 명시 확정 후 dev 가 매핑 작성
    - 즉시 비용: 라벨 결정 17개 운영자 부담 (§3.7 트리거).
    - 나중 비용: 라벨 정확도 ↑.
  - 옵션 B — spec.md 에 디폴트 라벨 후보 제안 (sitemap priority + StickyHeader 메뉴 텍스트 + breadcrumb 관행 근거로) → 운영자는 OK/수정만
    - 즉시 비용: spec 작성 비용 +. propose 가 임시 추정값(§6.6)이 되지 않게 근거 명시.
    - 나중 비용: 라벨 변경 시 운영자 + dev 협의.
  - 옵션 C — 코드에서 페이지 metadata.title 첫 단어를 자동 추출
    - 즉시 비용: 자동 추출 함수 작성.
    - 나중 비용: title 카피 변경 시 breadcrumb 라벨도 같이 바뀜 (의도 결합 — 의도 안 맞을 수도).
  - **결정:** B

- [ ] **항목 4: BreadcrumbList E2E 가드 강도 — fs-level grep 가드 추가 여부?**
  - 옵션 A — 샘플 페이지 4개 E2E + unit 만 (fs-level 가드 X)
    - 즉시 비용: 작음.
    - 나중 비용: 라우트 추가 시 BreadcrumbList 통합 누락 가능. 누락 발견 시점이 색인 후일 수 있음.
  - 옵션 B — 샘플 4개 E2E + unit + fs-level grep 가드 1개 (next build 출력의 모든 `.html` 에 `@type":"BreadcrumbList"` 등장 검증)
    - 즉시 비용: 가드 1개 작성. next build 의존성 (CI build 단계 의존).
    - 나중 비용: 라우트 추가 시 누락 즉시 감지.
  - **결정:** B

## 5. 결정

> 페이즈 4 휴먼 게이트에서 사용자가 채우는 영역. Claude 추측 금지.

(비어 있음 — 사용자가 직접 채워야 함)

## 6. 우선순위 영향

- [docs/plan/update-seo-aeo-geo.md](../../plan/update-seo-aeo-geo.md) 의 3주차 (2026-06-15 주) 일정. PR-A·C·D 가 6월 1·2주차 완료된 후 마무리 단계. PR-F (llms.txt + AI 크롤러 정책) 가 4주차로 뒤따름.
- 항목 1 옵션 B (Person 보류) 를 선택하면 후속 PR 1개가 산후 휴면 이후 (2026 Q4 추정) 로 미뤄짐. 이는 [user_pregnancy_status.md](../../../../../.claude/projects/-Users-msgoh-Documents-melancholy14-pregnancy-checklist/memory/user_pregnancy_status.md) 의 휴면 일정과 정합.
- 항목 2 (SearchAction) 자동 결정으로 PR 범위 감소: layout 에 박는 ld+json 이 WebSite 3필드만 → size 는 M 유지 (L 상승 위험 사라짐).

### 6.1 plan 문서 stale 발견 (2026-06-08)

[docs/plan/update-seo-aeo-geo.md:96](../../plan/update-seo-aeo-geo.md#L96) (PR-E 효과 문구 "사이트링크 검색박스 노출. E-E-A-T의 'Identity' 신호.") 는 plan 작성 시점(2026-06-03)에 이미 18개월 전 deprecated 된 feature 를 추천하고 있음. Google 이 2024-11-21 글로벌 retire 완료.

**후속 권장 작업 (이 PR 범위 밖)**:
- plan 문서 PR-E 섹션 갱신: "사이트링크 검색박스 노출" 효과 제거, "site name 표시 (WebSite name+url+alternateName)" 로 교체. SearchAction 작업 항목 삭제.
- 같은 plan 문서의 다른 PR (이미 머지된 PR-A·C·D, 진행 예정 PR-F) 에서도 deprecated SEO 통념 재확인 권장.
