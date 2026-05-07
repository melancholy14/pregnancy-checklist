# P14: AI 생성 이미지 표시 의무 — 리뷰

> 작성일: 2026-05-06
> 상태: decided
> size: M
> 관련 스펙: [spec.md](./spec.md) (생성 후)
> 관련 디자인: [design.md](./design.md) (생성 후)
> 출처: [docs/plan/phase-4.5.md §3.1 P14](../../plan/phase-4.5.md), [docs/plan/phase-4.5.md §2.11](../../plan/phase-4.5.md)

## 1. 기능 요약

블로그 본문에 사용된 AI 생성 이미지(미드저니/DALL·E 인포그래픽)에 **표시 형태·문구·메타·적용 범위**를 정의하고, 발행된 글 2건([weekly-prenatal-checklist](../../../src/content/articles/weekly-prenatal-checklist.md), [prenatal-insurance-preparation-guide](../../../src/content/articles/prenatal-insurance-preparation-guide.md))을 마이그레이션. §2.11 묶음 L(article-prose 이미지 시스템)의 선결조건. 법적 강제 의무 가능성은 낮으나(2026-01-22 시행 AI 기본법은 사업자 대상, 운영자는 "단순 도구 이용자") AdSense·E-E-A-T 정합성을 위해 자발적 도입.

## 2. 적용 페어 + 선택 이유

- **designer × marketer** — 충돌 축: "디자인 일관성·a11y" vs "AdSense·E-E-A-T 신뢰 시그널 강도". P14 결정 (a) 표시 형태와 (b) 문구의 핵심 충돌.
- **planner × marketer** — 충돌 축: "운영자 번아웃 회피·SOP 단순성" vs "측정 락인 회피·정책 안전망". P14 결정 (c) 메타데이터와 (d) 적용 범위의 핵심 충돌.

제외한 페어:
- dev × designer: 구현 비용 충돌 약함 (next/image figure 패턴은 §2.11에 이미 기술됨).
- planner × designer: P10 SOP 통합은 협력 축 — 둘 다 단순화 선호.

## 3. 페어별 충돌

### 3.1 designer × marketer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: designer × marketer
- 이전 페어 [없음 — 첫 페어] 의 양보·합의는 이 페어에 영향 없음.
- designer, marketer 의 persona.md "희생 거부" 섹션을 다시 참조함.
  · designer 인용 후보: N1 WCAG, N4 다크 패턴 거부, §3 원칙 5 "같은 정보 중복 표시 금지"
  · marketer 인용 후보: 3.3 콘텐츠 신뢰 가스라이팅 금지, 3.5 다크 패턴 0건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[designer] 단독 입장**
- 잃는 것: 인포그래픽 시각 가독성 일부(워터마크 칩이 정보 영역 가림), article-prose 본문 흐름 깔끔함
- 희생 거부 인용: "**같은 정보 중복 표시 금지** — 진행률 카드의 분해 + 섹션 헤더의 분수가 동시에 떠 있으면 둘 중 하나는 잉여" — docs/design/persona.md §3 원칙 5. "**N4 다크 패턴 거부 — 의도적 시각 위계 왜곡**, 가짜 카운트·뱃지" — docs/design/persona.md N4
- 주장: figcaption 텍스트(`· AI 생성`) **단일안**. ① `<figcaption>`은 스크린리더가 figure와 묶어 자연스럽게 읽음(N1 충족), ② 인포그래픽 정보 영역 안 가림, ③ 디자인 토큰 추가 0(`text-muted-foreground` 그대로), ④ 캡션은 출처·면책과 동일 영역이라 "메타 정보를 모은다"는 위계 명료. 워터마크 단일안 차선. 둘 다는 거부.
- 잔재 자기검증: 이전 페어 없음 — N

**[marketer] 반박 입장**
- A 발언 명시 반박: figcaption 단일안은 **캡션 미독자에게 노출 약함**. 임산부 모바일 스크롤 패턴(빠름·짧음)에서 figcaption 텍스트는 시각적으로 사라짐 — §3.3 콘텐츠 신뢰 가스라이팅 운영 측면에서 표시 의무 이행 약화. designer의 "같은 정보 중복" 프레이밍은 잘못 — 워터마크와 figcaption은 **각자 다른 사용자**(시각 스캐너 vs 캡션 독자)를 커버. 같은 메시지를 두 채널로 보내는 것이지 같은 정보 중복이 아님.
- 잃는 것: 광고 인접 영역 일부(우하단 워터마크 ↔ AdSense 충돌 위험), 본문 시각 단순성
- 희생 거부 인용: "**3.3 — AI 100% 생성 글을 사람 작성처럼 노출 금지**" — docs/marketing/persona.md §3.3. 이미지로 확장 시 동일 원칙. "**3.5 다크 패턴 0건 — 광고를 시스템 알림처럼 위장한 UI 거부**" — docs/marketing/persona.md §3.5. AI를 알 수 없는 출처처럼 위장 = 동급 다크 패턴.
- 주장: **둘 다** — 가시 워터마크 칩(우하단 `bg-foreground/60 text-white text-xs Imagined with AI`) + figcaption(`· AI 생성`) + alt에 `(AI 생성 이미지)`. AdSense AI 콘텐츠 정책 + 시행령 인센티브 + E-E-A-T 안전망 동시 충족. 인포그래픽 핵심 영역은 워터마크 위치(우하단·여백 8px) 가이드로 회피.
- 잔재 자기검증: 이전 페어 없음 — N

**T3 핵심 충돌 + 숨은 가정**
- 핵심 충돌: **표시 강도** — designer(단일 표시로 충분, 정보 위계 정직성) vs marketer(이중 + alt 메타로 안전망 완성, 캡션 미독자 커버)
- 숨은 가정: 양쪽 다 "운영자가 워터마크 위치를 매 인포그래픽마다 신경 쓸 수 있다"고 가정. 실제로는 미드저니 출력 후 워터마크 합성은 별도 후처리 — 표시 강도↑ = 운영자 부담↑. 페어 ②와 직결.

### 3.2 planner × marketer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 페어 시작: planner × marketer
- 이전 페어 [designer × marketer] 의 양보·합의는 이 페어에 영향 없음.
- planner, marketer 의 persona.md "양보 거부" 섹션을 다시 참조함.
  · planner 인용 후보: 7.5 체크리스트=본질 도구 우선, 7.6 측정 없는 기능 도입 거부, 7.4 운영자 경험 기반 발행
  · marketer 인용 후보: 3.6 측정 락인 깨기 금지, 3.7 운영자 번아웃 무시 금지, 3.3 콘텐츠 신뢰 가스라이팅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**[planner] 단독 입장**
- 잃는 것: 메타 정합성 강도(EXIF·IPTC 별도 검증 워크플로 미도입), 적용 범위 좁힘으로 회색지대(AI 후보정 사진 미표시)
- 희생 거부 인용: "**7.5 체크리스트 = 본질 도구 우선 — 콘텐츠가 늘어도 사용자 흐름은 유입(SEO) → 콘텐츠 → 체크리스트로 흘러야 한다**" — docs/content/persona.md §7.5. 이미지 SOP 부담↑ = 본질 도구 시간↓. "**7.4 운영자 경험 기반 발행 — PERSONAL EXPERIENCE 비어 있는 글은 발행 금지, 미경험 주제는 의도적 홀딩**" — docs/content/persona.md §7.4. 발행 임계↑ = 홀딩 큐만 부풀어 오름.
- 주장: 메타(c)는 **alt 속성에 `(AI 생성 이미지)` 만**. EXIF·IPTC 미도입(1인 운영 한계). 적용 범위(d)는 **인포그래픽만** — AI 후보정 사진은 회색지대 제외. SOP 위치는 P10 운영자 가이드 동일 문서 "이미지 SOP 1장" 통합 — 별도 문서 신설 거부. 표시 형태(페어 ① 의존)는 단일안 선호.
- 잔재 자기검증: 이전 페어 [designer × marketer] 영향 없음 — N — 이전 페어는 시각 표시 강도 축이고 이번 페어는 메타·범위·SOP 부담 축으로 발화 동기 분리.

**[marketer] 반박 입장**
- A 발언 명시 반박 1: alt만으로 메타 충분하다는 주장은 §3.6 측정 락인 깨기 회피 관점에서 약함. IPTC `DigitalSourceType: trainedAlgorithmicMedia`는 향후 표준이 될 전망 — **미드저니/DALL·E 출력은 IPTC 자동 포함 가능성 있어 운영자 작업 0** — 미리 박지 않으면 1년 뒤 전체 글 재처리 = 더 큰 번아웃(§3.7 자기 모순).
- A 발언 명시 반박 2: "**'인포그래픽만'은 §3.3 콘텐츠 신뢰 가스라이팅 회색지대로 회귀**" — 실사풍 AI 사진(인포그래픽 아님)을 빼면 의도 무력화. 명확 분류 축은 '**100% AI 생성 vs AI 보조 후처리**' — 전자(미드저니/DALL·E/Stable Diffusion)는 표시, 후자(Lightroom·Photoshop AI 도구)는 보정으로 분류.
- 잃는 것: 운영 부담 절약, SOP 1장 통합 깔끔함, P10 가이드 행 수
- 희생 거부 인용: "**3.6 측정 락인 깨기 금지 — 신규는 추가만, 삭제는 사실상 금지**" — docs/marketing/persona.md §3.6. 메타 스키마에 동일 원칙. "**3.3 — AI 100% 생성 글을 사람 작성처럼 노출 금지**" — §3.3. "**3.7 운영자 번아웃 무시 금지**" — 인정하지만 후속 재처리 비용이 더 큼.
- 주장: 메타(c)는 **alt + IPTC `DigitalSourceType` 자동 포함 검증** 1회. EXIF 미도입 동의. 적용 범위(d)는 "**100% AI 생성 이미지(인포 + 실사풍 AI 사진)**" 명시. AI 후보정 사진은 회색지대 제외. SOP 위치는 P10 통합 OK, 단 **이미지 섹션 별도 헤더 + 체크리스트화** 의무 — 산문 한 단락 거부.
- 잔재 자기검증: 이전 페어 [designer × marketer] 영향 없음 — N — 표시 강도 축은 페어 ①에서 별도 결정 중. 이번 페어는 메타·범위·SOP 형식에 한정.

**T3 핵심 충돌 + 숨은 가정**
- 핵심 충돌: **운영 부담 최소화** (planner: alt만 + 인포그래픽만 + SOP 산문 1장) vs **측정·정책 안전망** (marketer: alt + IPTC 검증 + 100% AI 전체 + SOP 체크리스트화)
- 숨은 가정: 양쪽 다 "운영자가 미드저니/DALL·E 외 다른 도구를 거의 안 쓴다"고 가정. Sora·Runway·Adobe Firefly 확장 시 분류 룰 흔들림 — SOP에 "도구별 분류 표"를 빈 칸으로 미리 둬야 락인 회피.

## 4. 미해결 트레이드오프

### 4.1 표시 형태 (P14-a)
- [x] **결정**: **옵션 C (CSS/DOM 오버레이 전제)** — figcaption(`· AI 생성`) + 우하단 워터마크 칩(CSS absolute, `bg-foreground/60 text-white text-xs`) + alt에 `(AI 생성 이미지)`
- 보조 결정: 워터마크는 **이미지 본체에 합성하지 않고** figure 컴포넌트에서 DOM 오버레이로 렌더. 이유: ① 1인 운영 부담 0(이미지 원본 그대로 사용), ② 정책·디자인 변경 시 컴포넌트만 수정으로 전체 글 일관 적용, ③ §2.11 묶음 L과 자연 통합. 외부 공유 시 워터마크 손실은 alt + figcaption + IPTC 메타 3중 보완으로 커버.
- 옵션별 비용은 페어 ① T3 참조.

### 4.2 표시 문구 (P14-b)
- [x] **결정**: **옵션 C — `Imagined with AI`** (영문, Meta 라벨 차용 / C2PA·IPTC 표준 호환)
- figcaption 한글 표기는 `· AI 생성`(짧음·간결)으로 별도 운용. 워터마크 칩만 영문 표준 따름.

### 4.3 메타데이터 병행 (P14-c)
- [x] **결정**: **옵션 B — alt + IPTC `DigitalSourceType` 자동 포함 (검증 완료)**
- 검증 결과 (2026-05-06, 운영자 직접 확인): 발행된 글 2건의 AI 이미지 모두 https://verify.contentauthenticity.org 에서 **C2PA 콘텐츠 자격증명 표시 확인**. ChatGPT(DALL·E) 출력은 자격증명 + IPTC `DigitalSourceType` 자동 포함 가정 성립 → **운영자 추가 작업 0**.
- SOP 룰: 신규 이미지 생성 시 동일 도구(ChatGPT/DALL·E) 사용 시 자동 포함 그대로 인정. **다른 도구(미드저니·SD·SDXL·Sora·Firefly 등) 도입 시 1회 검증 의무** — verify.contentauthenticity.org 또는 `exiftool -a -G1 image.png | grep -iE "DigitalSourceType|trainedAlgorithmicMedia"`. 자동 포함 X면 `exiftool -IPTC:DigitalSourceType="trainedAlgorithmicMedia" image.png` 1줄로 박음.

### 4.4 적용 범위 (P14-d)
- [x] **결정**: **옵션 B — 100% AI 생성 이미지 전체 (인포그래픽 + 실사풍 AI 사진)**
- 분류 룰: "**100% AI 생성 vs AI 보조 후처리**" 축. 전자(ChatGPT/DALL·E/미드저니/SD/SDXL/Sora/Firefly 등 텍스트→이미지 출력)는 표시 의무. 후자(Lightroom/Photoshop의 AI 도구로 보정한 실제 촬영본)는 보정으로 분류 — 표시 의무 없음.
- SOP에 "도구별 분류 표" 빈 칸으로 미리 둠 — 신규 도구 도입 시 이 표에 추가만 하면 락인 회피.

## 5. 결정

운영자 결정 완료 (2026-05-06):

- **4.1 표시 형태**: 옵션 C — figcaption(`· AI 생성`) + 우하단 워터마크 칩(CSS DOM 오버레이, 이미지 본체 합성 X) + alt 속성(`(AI 생성 이미지)`)
- **4.2 표시 문구**: 옵션 C — 워터마크 칩은 영문 `Imagined with AI`(Meta·C2PA 표준 호환), figcaption 한글 표기는 `· AI 생성`
- **4.3 메타데이터 병행**: 옵션 B — alt + IPTC `DigitalSourceType` 자동 포함. ChatGPT(DALL·E) 출력은 자격증명 자동 포함 검증 완료(verify.contentauthenticity.org). 다른 도구 도입 시 1회 검증 의무.
- **4.4 적용 범위**: 옵션 B — 100% AI 생성 이미지 전체. AI 후보정 사진은 제외. 도구별 분류 표는 SOP에 빈 칸 유지.

## 5.1 후속 결정 (cross-check 단계)

- **AI 표시 트리거 컨벤션**: alt 컨벤션 채택 (2026-05-07). MD 본문 alt 텍스트 끝에 `(AI 생성 이미지)` 후행. rehype 플러그인이 alt 마커 감지로 워터마크 칩 + figcaption AI 라벨 자동 부착. 이유: 1인 운영 부담 최소, 발행 글 2건 마이그레이션 한 줄, 구현 단순. 향후 메타 확장 필요 시(라이선스·C2PA 자격증명 등) frontmatter로 이전 재논의.

## 6. 우선순위 영향

- **§2.11 묶음 L (article-prose 이미지 시스템)** — IM-4 형태가 이 결정에 직접 종속. 결정 후 즉시 unblock.
- **P10 운영자 가이드** — 이미지 SOP 통합 위치(별도 헤더+체크리스트화 vs 산문 1장)가 4.4 결정의 부속 결정으로 따라옴.
- **§3.2 P11 콘텐츠 매트릭스** — 인포그래픽 비중에 따라 표시 부담 달라짐. P11 산출 시 도구별 분류 표 빈 칸 미리 둘지 결정도 영향.
- **신규 글 작성 가이드** — 결정 미루면 신규 글 발행 시마다 임시 룰로 표시 → 일관성 깨짐.
