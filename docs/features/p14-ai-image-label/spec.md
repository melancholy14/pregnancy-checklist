# P14: AI 생성 이미지 표시 의무 — 기획서

> 작성일: 2026-05-06  size: M
> 관련 리뷰: [review.md](./review.md)
> 관련 디자인: [design.md](./design.md)
> 출처: [docs/plan/phase-4.5.md §3.1 P14, §2.11](../../plan/phase-4.5.md)

## review.md 결정사항 참조

본 스펙은 review.md §5 + §5.1 + §5.2 결정에 일관되게 따른다. 결정 본문이 어긋날 시 review.md를 우선한다.

- **표시 형태(4.1)**: 우하단 DOM 오버레이 워터마크 칩 + alt 속성 + (캡션 있을 때만) figcaption. 워터마크는 이미지 본체에 합성하지 않고 article-prose figure 컴포넌트의 CSS absolute로 렌더.
- **표시 문구(4.2)**: 워터마크 칩 영문 `Imagined with AI`(Meta·C2PA 호환). figcaption은 원본 캡션이 있을 때만 렌더되며 AI 이미지면 `<원본 캡션> · AI 생성`, AI 아니면 `<원본 캡션>` 단독. 캡션 없으면 figcaption 자체 미렌더(§5.2 절충안).
- **메타데이터(4.3)**: alt 속성 `(AI 생성 이미지)` + IPTC `DigitalSourceType` 자동 포함. ChatGPT/DALL·E 출력은 검증 완료, 다른 도구 도입 시 1회 검증.
- **적용 범위(4.4)**: 100% AI 생성 이미지 전체(텍스트→이미지 도구 출력). AI 후보정 사진 제외.
- **캡션 컨벤션(§5.2)**: markdown image title 슬롯 `![alt](src "원본 캡션")` 사용. plugin이 title을 figcaption으로 옮기고 img에서 제거.

## 1. 배경·목적

- **운영자 관점**: 발행된 글 2건에 AI 생성 인포그래픽 사용 중이나 표시 없음. AdSense 신청 직전 정합성 확보 + E-E-A-T 신뢰 시그널 보강. 이후 이미지 SOP 1장이 신규 글마다 자동 적용되도록 컴포넌트 레벨 자동화.
- **사용자 관점**: 의료·임신 도메인에서 정보 출처·이미지 진위 투명성은 신뢰 결정 변수. AI 생성 여부를 시각·캡션·메타 3중으로 명시 → "이 사이트는 AI를 숨기지 않는다"는 신뢰 시그널.
- **측정 관점**: GA4 신규 이벤트 없음(P14는 측정 변경 아님). 단 §1.5 `article_view` 이후 AdSense 정책 위반 신호(`ad_serving_lost` 류 — 미정)에 영향이 있을 수 있어, 발행 후 1주 모니터.

## 2. 사용자 시나리오

- **시나리오 1 (모바일 스크롤 독자)**: 아티클 본문 스크롤 중 인포그래픽 진입 → 이미지 우하단 검은 반투명 칩(`Imagined with AI`)이 시각 스캔에 자연 진입 → 사용자는 AI 생성임을 즉시 인지하고 인포 정보 신뢰도 자체 보정. figcaption은 시간 여유 있는 독자에게 추가 설명(`· AI 생성`).
- **시나리오 2 (스크린리더 독자)**: 이미지 진입 시 alt 텍스트 `<원본 alt> (AI 생성 이미지)` 낭독 → AI 생성 인지. figcaption은 figure와 묶여 "캡션: …" 컨텍스트로 추가 낭독.
- **시나리오 3 (이미지 외부 공유)**: 사용자가 이미지를 길게 눌러 저장·공유 → 이미지 본체에는 워터마크 없으나 IPTC 메타에 `DigitalSourceType=trainedAlgorithmicMedia` 포함 → C2PA 검증 도구·인스타그램 등이 자동 라벨 표시.
- **시나리오 4 (AdSense 봇)**: 페이지 크롤 → `<figure>` + `<figcaption>` + alt 메타 인식 → AI 생성 콘텐츠 정책 평가에 명시 시그널 제공.
- **시나리오 5 (운영자 신규 글 발행)**: MD에 `![원본 alt](path)` 한 줄 작성 → 빌드 타임 remark/rehype 플러그인이 자동으로 `<figure>` + 워터마크 칩 + figcaption 래핑(아래 §3 must의 "AI 표시 명시 옵션" 룰) → 운영자 후처리 0.

## 3. 기능 요구사항

### must

- **렌더링**: 아티클 본문(`.article-prose`)의 모든 이미지를 `<figure>` 패턴으로 래핑(next/image + figcaption + 워터마크 칩 absolute).
- **AI 표시 트리거**: MD 본문 alt 텍스트 끝에 `(AI 생성 이미지)` 후행 표기. rehype 플러그인이 alt에서 이 마커를 감지해 ① 워터마크 칩 렌더, ② figcaption에 `· AI 생성` 후행 부착, ③ alt 자체는 마커 포함 그대로 유지(스크린리더 낭독 일관성). 채택 이유는 docs/features/p14-ai-image-label/review.md cross-check 후속 결정 참조 — 1인 운영 부담 최소·마이그레이션 한 줄·구현 단순.
- **워터마크 칩 컴포넌트**: 이미지 우하단 absolute 위치, `bg-foreground/60 text-white text-xs px-2 py-1 rounded`, 텍스트 `Imagined with AI`. 광고 슬롯과 인접 시 위치 충돌 방지(여백 8px 이상).
- **figcaption**: 원본 캡션(이미지에 의도적으로 붙은 설명)이 있을 때만 렌더(§5.2 절충안). 캡션 + AI 마커 → `<원본 캡션> · AI 생성`, 캡션 + AI 마커 없음 → `<원본 캡션>` 단독, 캡션 없으면 figcaption 자체 미렌더(워터마크 칩 + alt 두 채널로 표시 의무 충족).
- **캡션 입력**: markdown image title 슬롯 `![alt](src "원본 캡션")`. plugin이 빌드 타임에 title을 추출해 figcaption으로 옮기고 img에서 title 속성 제거(브라우저 기본 tooltip 중복 방지).
- **alt 속성**: `(AI 생성 이미지)` 후행. 스크린리더가 원본 의미 낭독 직후 AI 표시 인지 가능.
- **마이그레이션**: 발행된 글 2건([weekly-prenatal-checklist](../../../src/content/articles/weekly-prenatal-checklist.md), [prenatal-insurance-preparation-guide](../../../src/content/articles/prenatal-insurance-preparation-guide.md))의 이미지에 위 컨벤션 반영. 본문 텍스트는 손대지 않음.
- **운영자 SOP 통합**: P10 운영자 가이드에 "이미지 SOP" 섹션 별도 헤더 + 체크리스트화. 도구별 분류 표(자동 포함 검증 완료/미검증) 빈 칸 유지.

### should

- **dev 안전망**: rehype 플러그인이 alt에 `(AI 생성 이미지)`가 있는데 워터마크 칩이 누락되면 빌드 경고. 반대도 동일.
- **광고 슬롯 충돌 검사**: 워터마크 칩과 광고 슬롯이 시각적으로 겹치면 SOP 체크리스트에서 운영자가 이미지 위치를 다시 검토.

### won't (이번 범위 밖)

- AI 생성 텍스트 본문 표시 — 본문은 운영자가 검수·편집해 발행하므로 표시 의무 대상 아님(§3.1 P14 결론).
- AI 후보정 사진(Lightroom/Photoshop AI 도구 보정)에 대한 표시 — 회색지대 의도적 제외.
- EXIF 명시 플래그 — 1인 운영 한계로 미도입(IPTC 자동 포함이 상한선).
- 동영상·오디오 AI 생성 표시 — 본 사이트 현재 미사용. 향후 도입 시 별도 결정 항목으로 분리.
- 신규 GA4 이벤트 — 본 기능은 측정 변경 아님.

## 4. 예외·엣지 케이스

- **이미지 로딩 실패**: 워터마크 칩은 이미지 영역 안에 absolute로 박혀 있으므로 이미지가 안 뜨면 같이 사라짐. figcaption은 그대로 노출 → AI 표시 의도 일부 보존. broken image 시각도 alt 텍스트 폴백 표시(`(AI 생성 이미지)` 노출됨).
- **alt 누락**: rehype 플러그인이 빌드 타임에 모든 이미지에 alt 존재 검증. 누락 시 빌드 실패(기존 a11y 정책 강화).
- **광고 슬롯과 워터마크 충돌**: 광고가 figure 우하단 가까이 들어가면 워터마크가 시각적으로 묻힘. 운영자 SOP 체크리스트에 "이미지 + 광고 인접 시 광고를 figure 외부로 이동" 룰 명시.
- **외부 이미지(`http://`/`https://` 절대 URL)**: 본 사이트 정책상 외부 호스팅 이미지 비권장이지만 발생 시 IPTC 메타 통제 불가 → SOP에 "외부 이미지 사용 금지" 룰 추가, 빌드 타임 경고.
- **localStorage 손실**: 본 기능은 localStorage 의존 없음 — 영향 없음.

## 5. 성공 기준

- **기능 동작**:
  - 발행된 글 2건의 인포그래픽이 `<figure>` + 워터마크 칩(우하단) + figcaption(`· AI 생성`) + alt(`(AI 생성 이미지)`)로 렌더.
  - 신규 글 작성 시 alt 또는 frontmatter 컨벤션만 따르면 후처리 0으로 동일 표시 적용.
  - 운영자 SOP 1장이 P10 가이드에 통합돼 신규 도구 도입 시 분류 표만 갱신.
- **측정 지표**: 신규 GA4 이벤트 없음. 1주 모니터 — `article_view` 발사율·페이지 체류 변화 ±10% 이내(이미지 시각 변화 영향 noise 한계).
- **사용자 경험**: design.md §3 상태별 시안 충족. WCAG AA 색 대비(워터마크 칩 검은 반투명 + 흰 텍스트 자체 통과). 키보드 흐름 변화 없음(이미지는 인터랙티브 아님).
- **법·정책 정합성**: AdSense 정책 검토 시 명시 표시 + 메타 시그널 동시 제공. C2PA 표준 호환(verify.contentauthenticity.org에서 신규 글 발행 후 1회 재검증).
