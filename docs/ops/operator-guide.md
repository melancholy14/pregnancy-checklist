# 운영자 통합 가이드 (P10)

> 작성일: 2026-07-30 · 상태: **정본 (published)** — §1.4 삭제 정책 확정 + image-sop.md 흡수 완료(2026-07-30)
> 출처 통합: [image-sop.md](../content/image-sop.md) 전체 · [checklist-recommendation-semantics](../features/checklist-recommendation-semantics/spec.md) 시맨틱 · [blog-writer-persona.md §6.5](../content/blog-writer-persona.md) alt 룰 · phase-4.5 §3 P10
> 근거 계보: [phase-5.md S1 P10](../plan/phase-5.md) — "체크리스트 데이터 변경 사고 예방 + 신규 글 작성 SOP + AI 이미지 SOP 합본"

## 이 문서의 목적

1인 운영에서 **3개월 산후 휴면(2026-08~11)을 사이에 두고도 사고 없이 재진입**하기 위한 단일 참조점. 셋으로 흩어진 운영 룰을 한 곳에 합본한다.

| 영역 | 핵심 사고 시나리오 | 방어선 |
|---|---|---|
| §1 체크리스트 데이터 | 항목 ID 재사용/삭제 → 사용자 localStorage 체크가 엉뚱한 항목으로 옮겨가거나 사라짐 | ID 불변 룰 + deprecated 플래그 |
| §2 신규 글 작성 | `reviewed_by: ""` 노출, alt 정보 손실 → E-E-A-T·접근성 감점 | 발행 SOP 체크리스트 |
| §3 AI 이미지 | AI 생성 이미지 미표시 → AI 기본법·AdSense 정책·E-E-A-T 리스크 | alt 마커 1줄 룰 + 워터마크 자동 부착 |

> **SoT 관계**: 본 문서 정본화 시 [image-sop.md](../content/image-sop.md)는 §3으로 흡수되고 pointer만 남긴다. alt 작성 룰의 SoT는 [blog-writer-persona.md §6.5](../content/blog-writer-persona.md)(draft 단계 자동 적용)이며 여기서는 요약·참조한다.

---

## 1. 체크리스트 데이터 변경 룰

체크리스트 항목은 [src/data/](../../src/data/)의 4개 JSON에 있다.

| 파일 | 슬러그 축 |
|---|---|
| [checklist_items.json](../../src/data/checklist_items.json) | 기본 체크리스트 (`recommendedWeek` 주차 매칭 대상) |
| [hospital_bag_checklist.json](../../src/data/hospital_bag_checklist.json) | 출산 가방 (주차 무관) |
| [partner_prep_checklist.json](../../src/data/partner_prep_checklist.json) | 배우자 준비 (주차 무관) |
| [pregnancy_prep_checklist.json](../../src/data/pregnancy_prep_checklist.json) | 임신 준비 (주차 무관) |

### 1.1 왜 위험한가 — dangling reference

[createChecklistStore.ts](../../src/store/createChecklistStore.ts)는 사용자가 체크한 항목을 **`checkedIds: string[]`(항목 ID 배열)로 localStorage에 저장**한다. 표시 텍스트가 아니라 **ID로 참조**하므로:

- **ID를 재사용**(다른 항목에 옛 ID 부여)하면 → 사용자가 A에 한 체크가 B에 붙는다. **가장 위험한 silent 오작동**.
- **ID를 삭제**하면 → 사용자의 체크가 조용히 사라진다(dangling → 무시).
- **ID를 바꾸면**(rename) → 삭제 + 신규 추가와 동일. 기존 체크 전부 유실.

마이그레이션은 `checkedIds`의 유효성을 검사하지 않는다([createChecklistStore.ts:78](../../src/store/createChecklistStore.ts#L78) `migrateChecklistStorage`는 shape만 정규화). 즉 **데이터 파일이 ID 규율을 지키는 것이 유일한 방어선**이다.

### 1.2 불변 룰 (지금 확정)

1. **ID는 불변(immutable)이다.** `item_NNN` 형식. 한번 발행된 ID는 텍스트·주차·카테고리가 바뀌어도 **재사용·재배치·삭제하지 않는다**.
2. **추가는 자유.** 새 항목 ID = **`max(라이브 항목 ∪ 은퇴 ID 원장 §1.4.2) + 1`**. 중간 빈 번호를 메우지 않고, 물리 삭제된 번호도 재사용하지 않는다(과거·현재 삭제분 모두 재사용 금지).
3. **텍스트/주차/우선순위 수정은 자유.** ID만 그대로면 사용자 체크 상태는 보존된다.
4. **카테고리(`category`) enum은 [types/checklist.ts](../../src/types/checklist.ts)에 정의된 값만.** 새 카테고리는 타입 먼저 추가 후 데이터에 사용(빌드 검증 통과).

### 1.3 `recommendedWeek` 시맨틱 (확정)

- **양수(1~42)**: 해당 주차에 챙길 항목 — P2 "이번 주 추천" 마이크로 라벨 매칭 대상.
- **`0`**: **미정/주차 무관 → P2 매칭 대상이 아님.** 라벨 노출 X. 신규 3종 슬러그는 슬러그 자체가 컨텍스트라 일괄 `0`.
- 근거·JSDoc: [types/checklist.ts `ChecklistItem.recommendedWeek`](../../src/types/checklist.ts). `getChecklistByWeek`가 0을 매칭에서 제외하는 규칙과 일치.

> 주의: 주차 무관 항목을 `0` 대신 임의 주차로 넣으면 엉뚱한 주에 추천 라벨이 뜬다. 주차 무관이면 반드시 `0`.

### 1.4 삭제 정책 (확정, 2026-07-30)

| 결정 | 내용 |
|---|---|
| **삭제 절차** | `deprecated: true` 플래그로 UI에서만 숨기고 데이터·ID는 유지 → **≥12주 경과 후 물리 삭제**. 12주 = 한 임신 분기 이상 회귀 사용자 보호. `deprecated` 필드는 phase-5 **P5 schema versioning**과 함께 도입. |
| **dangling checkedIds** | **무시(현행 유지).** migrate에서 능동 제거하지 않는다 — 능동 제거 시 사용자가 "숨김 해제"를 요구해도 복구 불가하기 때문. dangling ID는 렌더링에서 자동 무시되므로 사고로 이어지지 않음. |

> **순서 주의**: `deprecated` 필드가 없는 현재(P5 이전)에는 12주 시계를 시작할 수 없다 → **P5 도입 전까지 실제 물리 삭제는 발생하지 않는다.** 그전에 걷어내야 할 항목이 생기면 `deprecated` 개념을 임시 주석/PR 설명으로만 표시하고 데이터는 그대로 둔다.

#### 1.4.1 물리 삭제 절차 (12주 경과 후)

물리 삭제 자체는 JSON 배열에서 객체를 지우는 것이지만, **"새 ID = 최대 +1" 규칙을 라이브 데이터에서만 계산하면 물리 삭제된 최대 번호가 재발급되어 §1.1 dangling 충돌이 재현된다**(사용자의 옛 체크가 무관한 새 항목에 붙음). 아래 순서로 ID를 영구 예약한다.

1. **전제 확인**: 해당 항목이 `deprecated: true`로 **≥12주 경과** (git blame으로 플래그 커밋 날짜 확인).
2. JSON 배열에서 항목 객체 제거.
3. **ID 영구 예약**: 은퇴한 ID를 §1.4.2 은퇴 ID 원장에 한 줄 기록 (ID + 은퇴일).
4. 신규 ID 규칙은 §1.2.2대로 `max(라이브 ∪ 원장) + 1` 이므로, 원장에 기록된 순간 그 번호는 두 번 다시 발급되지 않는다.
5. `npm run test:unit` (createChecklistStore 검증) 통과 후 커밋.

#### 1.4.2 은퇴 ID 원장 (graveyard)

물리 삭제된 ID를 여기 기록해 재사용을 영구 차단한다. 신규 ID 계산 시 이 표의 최대 번호도 함께 본다.

| 은퇴 ID | 원래 항목(참고) | 은퇴일 | deprecated 시작일 |
|---|---|---|---|
| _(아직 없음 — P5 이전이라 물리 삭제 미발생)_ | — | — | — |

### 1.5 데이터 변경 발행 전 체크

- [ ] 수정한 항목의 **ID를 바꾸지 않았다** (텍스트만 바뀜)
- [ ] 새 항목 ID = **기존 최대 +1** (빈 번호 재사용 X)
- [ ] 주차 무관 항목의 `recommendedWeek === 0`
- [ ] `category` 값이 타입 enum에 존재
- [ ] `npm run test:unit` — createChecklistStore 검증 통과

---

## 2. 신규 글 작성 SOP

파이프라인은 skill로 자동화돼 있다. **본 절은 자동화가 강제하지 못하는 운영자 판단·발행 게이트만** 다룬다.

### 2.1 파이프라인 흐름

| 단계 | skill | 운영자 개입 |
|---|---|---|
| 기획 → 초안 | `/blog-pipeline-1` (또는 `/blog-plan` → `/blog-draft`) | 토픽 제공. draft는 [src/content/draft/](../../src/content/draft/)에 저장 |
| **PERSONAL EXPERIENCE 교체** | (수동) | **운영자 실경험으로 교체** — AI가 채운 자리표시자를 본인 경험으로 |
| 검증 → 발행 | `/blog-pipeline-2` (`/blog-validate` → `/blog-publish`) | 새 세션에서 실행 |
| (선택) 전문가 검수 | `/blog-expert-review` → `-single` → `-merge` | E-E-A-T 보강 필요 시 |

> draft 저장 위치는 **`src/content/draft/`(단수형)** — Obsidian vault `20-content/drafts/` 아님. 발행본은 [src/content/articles/](../../src/content/articles/).

### 2.2 `reviewed_by` 룰 (YMYL 신뢰도)

frontmatter의 `reviewed_by`는 **빈 문자열 금지**. 임신·출산은 YMYL 도메인이라 검수자 표기 부재가 신뢰도 마이너스.

```yaml
# ❌ 금지
reviewed_by: ""
```

허용 패턴 3종 중 택1:

| 케이스 | 패턴 | 예시 |
|---|---|---|
| 검수 미받음 | **필드 자체 제거** (key 없음) | (frontmatter에 `reviewed_by` 없음) |
| 실제 검수자 | 이름·자격 명시 | `reviewed_by: "산부인과 전문의 OOO (◯◯병원)"` |
| AI 페르소나 검수만 | 페르소나·역할 + AI 표기 | `reviewed_by: "산부인과 전문의 (AI 페르소나 검수)"` |

- 발행 전 `grep -l 'reviewed_by: ""' src/content/articles/*.md` → **0건 확인**.
- 위반 발견 시 [phase-4.5.md §4.2 D-C2](../plan/phase-4.5.md)를 ⚠️ 회귀로 갱신 + 즉시 정정.

### 2.3 alt 작성 룰 (접근성, IM-6)

SoT는 [blog-writer-persona.md §6.5](../content/blog-writer-persona.md) (draft 단계 자동 적용). 요약:

| 이미지 유형 | alt 룰 | 예시 |
|---|---|---|
| 인포그래픽/차트/표 | **데이터 핵심 수치 + 결론 포함** | "임신 16~20주 평균 체중 증가 1.5~2kg + 균형 식단 5분류" |
| AI 생성 이미지 | 위 룰 + 끝에 `(AI 생성 이미지)` 마커 | "임신 주차별 검진 항목 표 (AI 생성 이미지)" |
| 단순 장식 | `alt=""` (스크린리더 스킵) | 구분선·배경 패턴 |

- ❌ 안티패턴: 인포그래픽인데 "임신 정보 인포그래픽" 같은 추상 묘사 / 핵심 표인데 alt 누락 / "이미지·그림·사진"으로만 끝.
- 검증: `/blog-validate`가 인포그래픽 인접 alt 길이 < 20자면 경고.

### 2.4 면책 문구 — 주제에 맞게

의학 글이 아니면 **의학 면책을 쓰지 않는다**. 글 주제에 맞는 전문가 안내로:

- 보험·재무·정책 글 → 재무·정책 관련 안내 (예: "정확한 금액·시행일은 고용보험·고용노동부 1차 소스 확인")
- 의학·건강 글 → 의학 면책 + 산부인과 상담 안내

### 2.5 본문 강조 박스 이모지 룰

본문 중간 강조 박스에 **⚠️ 금지** — 빌드가 disclaimer로 오인 추출한다. 💡 / 📌 / 🔔 를 쓴다.

### 2.6 톤

"옆집 언니" 톤. "동료심사 출판 단계"·"경향성으로 참고" 같은 학술 표현 금지 — 풀어쓴다.

---

## 3. AI 이미지 SOP

> 이 절이 AI 이미지 표시 의무의 **SoT**. (구 [image-sop.md](../content/image-sop.md)는 본 절로 흡수, pointer만 남김.) 원 출처: [p14-ai-image-label](../features/p14-ai-image-label/) (review/spec/design).

### 3.1 표시 트리거 (1줄 룰)

AI 생성 이미지 삽입 시 **alt 끝에 ` (AI 생성 이미지)` 후행 표기**만 붙이면 끝.

```md
![임신 주차별 검사 타임라인 요약 인포그래픽 (AI 생성 이미지)](/articles/weekly-prenatal-checklist.webp "원본 캡션")
```

빌드 타임에 [rehype-article-figure.ts](../../src/lib/markdown/rehype-article-figure.ts)가 자동으로:
- `<figure>` 래핑 + 우하단 워터마크 칩(`Imagined with AI`, 검은 반투명 + 흰 텍스트, `aria-hidden`)
- alt는 마커 포함 그대로 유지 (스크린리더 낭독 일관성)
- title 슬롯(캡션)이 있으면 figcaption으로 이동. 표시 의무는 워터마크 칩 + alt 두 채널로 충족.

**캡션(figcaption) 규칙** — markdown image title 슬롯(`![alt](src "캡션")`)으로 원본 출처·보조 설명을 붙일 수 있다.

| alt 마커 | title(캡션) | figcaption 출력 |
|---|---|---|
| `(AI 생성 이미지)` 있음 | 있음 | `<원본 캡션> · AI 생성` |
| `(AI 생성 이미지)` 있음 | 없음 | (미렌더 — 칩만으로 표시) |
| `(AI 생성 이미지)` 없음 | 있음 | `<원본 캡션>` |
| `(AI 생성 이미지)` 없음 | 없음 | (미렌더) |

title은 figcaption으로 옮겨진 뒤 `<img>`에서 제거되어 브라우저 tooltip과 중복되지 않는다.

### 3.2 표시 의무 판단

| 출처 | 분류 | 표시 | 메타 검증 |
|---|---|---|---|
| ChatGPT(DALL·E) | 100% AI 생성 | ✅ 필수 | ✅ 검증 완료 (2026-05-06) |
| 미드저니 / SDXL / Sora / Adobe Firefly | 100% AI 생성 | ✅ 필수 | ⬜ 도입 시 §3.3 1회 검증 |
| Lightroom / Photoshop AI 보정·스마트폰 AI 카메라 | AI 후보정 사진 | ❌ 미부착 (오라벨링 방지) | N/A |
| 직접 촬영(보정 없음) | 실사 | ❌ | N/A |

- 분류 축은 **"100% AI 생성(텍스트→이미지) vs AI 보조 후처리"**. 신규 도구는 행만 추가.
- **회색지대**: AI 초안 → Figma/Photoshop에서 30%+ 재가공 → 여전히 100% AI(원본이 AI). alt에 `(AI 생성 후 직접 가공)` 명시 추천. 스톡 사진 위 AI 합성 → 합성 결과물은 표시 대상.
- 외부 절대 URL(`https://…`) 이미지 **사용 금지** — `public/articles/` 하위로 이동 후 상대 경로. (빌드 타임 rehype 플러그인이 외부 이미지 콘솔 경고.)

### 3.3 신규 AI 이미지 도구 도입 시 1회 검증

ChatGPT/DALL·E 외 도구 첫 사용 시 IPTC 메타 자동 포함 여부를 1회 검증한다.

1. 새 도구로 이미지 생성 후 다운로드
2. <https://verify.contentauthenticity.org> 에 업로드
3. **"콘텐츠 자격증명(Content Credentials)"** 또는 **`DigitalSourceType: trainedAlgorithmicMedia`** 표시 확인
4. 표시되면 → §3.2 표에 `✅ 검증 완료 (날짜)` 기재 / 안 되면 → 아래 수동 부착

```bash
# 자동 포함 안 되는 도구는 수동 IPTC 부착 (mac: brew install exiftool)
exiftool -IPTC:DigitalSourceType="trainedAlgorithmicMedia" image.png
exiftool -a -G1 image.png | grep -iE "DigitalSourceType|trainedAlgorithmicMedia"   # 검증
```

수동 부착이 매번 필요한 도구는 §3.2 표에 `⚠️ 수동 부착 필요` 표시 + 운영 부담 평가 후 도구 교체 검토.

### 3.4 레이아웃 회피 (광고 슬롯·우상단 아이콘)

- **광고 슬롯**: figure 직후 즉시 광고 배치 금지(워터마크 칩 ↔ 광고 인접 시 칩이 묻힘). figure와 광고 사이 한 단락 이상 텍스트, 안 되면 광고를 figure 외부로.
- **우상단 아이콘 회피**: figcaption(title 슬롯)을 비우면 figure 우상단 약 100×100px에 ExternalLink 아이콘(원본 새 탭)이 뜬다. **인포그래픽 핵심 수치·텍스트를 우상단에 배치하지 말 것.** title 슬롯을 채우면 아이콘이 figcaption(`· 원본 보기`)으로 대체되어 회피 불필요.
- **권장**: 신규 글은 `![alt](src "캡션")` 형식으로 title 슬롯을 채운다 — 시각 캡션 + 우상단 아이콘 회피 둘 다 충족.

### 3.5 법적 배경 (요약)

- AI 기본법(2026-01-22 시행) 의무 주체는 **"AI 사업자"** — 미드저니·DALL·E를 **도구로 이용**하는 블로거는 강제 표시 의무 대상 아닐 가능성 높음. 위반 시(사업자에 한해) 시정명령 → 최대 3,000만원 과태료(1년+ 계도기간).
- **그럼에도 자발적 표시**: (1) AdSense·Google AI 콘텐츠 정책 정합 (2) E-E-A-T 신뢰도 (3) 향후 사업자성 인정 대비 안전망. → **이미지에만 적용하면 충분**(텍스트 본문은 운영자 검수·편집 거치므로 표시 불필요).

### 3.6 배포 후 시각 점검 (1회)

모바일 320px/375px에서 발행된 글의 인포그래픽 우하단을 직접 확인:
- 워터마크 칩이 핵심 수치·텍스트를 가리지 않는가
- 칩 텍스트 명도 대비 ≥ 4.5:1 (배경 명도 변동 시 axe-core 또는 수동 확인)
- figcaption(`· AI 생성`)이 본문 흐름과 자연스럽게 이어지는가

문제 시 → 도구 프롬프트로 우하단 8px 영역에 핵심 정보가 안 오게 조정 또는 디자인 토큰 재논의([design.md](../features/p14-ai-image-label/design.md)).

---

## 4. 통합 발행 전 체크리스트

신규 글 1편 발행 시 한 번에 확인.

**콘텐츠**
- [ ] `reviewed_by` 빈 문자열 없음 (`grep` 0건)
- [ ] 면책 문구가 글 주제와 일치 (의학 아닌데 의학 면책 X)
- [ ] 본문 강조 박스에 ⚠️ 없음 (💡/📌/🔔)
- [ ] PERSONAL EXPERIENCE = 운영자 실경험으로 교체됨

**이미지**
- [ ] 모든 이미지 alt 작성 (인포그래픽은 수치+결론 포함)
- [ ] AI 생성 이미지에 ` (AI 생성 이미지)` 마커
- [ ] AI 후보정 사진에는 마커 **미부착**
- [ ] 외부 절대 URL 이미지 없음
- [ ] 이미지 직후 광고 슬롯 인접 없음

**데이터 변경을 동반한 경우 (§1.5)**
- [ ] 항목 ID 불변 / 새 ID = 최대 +1 / 주차 무관 = `0` / `npm run test:unit` 통과

---

## 5. 운영 런북 (주간 리포트 · 대시보드 · 배포)

> 산후 3개월 휴면 후 재진입 시 "이게 어떻게 돌아갔지"를 복구하는 절. 시크릿 **값은 절대 이 문서·git에 쓰지 않는다** — 변수명으로만 참조하고 실값은 plist / [github-secrets.md](github-secrets.md) / `~/.config/pregnancy-checklist/`.

### 5.1 주간 리포트 (launchd)

GA4 주간 지표를 뽑아 요약문을 만드는 자동 작업. **OpenAI primary**(`ANTHROPIC_API_KEY` 빈 값은 의도 — 비용 절감, Claude 비활성).

| 항목 | 값 |
|---|---|
| 스케줄 | 매주 **월요일 09:00** (launchd `StartCalendarInterval`) |
| Label | `com.melancholy14.pregnancy-checklist.weekly-report` |
| plist 위치 | `~/Library/LaunchAgents/<label>.plist` (git 미포함, 로컬 전용) |
| 스크립트 | [scripts/weekly-report/index.ts](../../scripts/weekly-report/index.ts) = `npm run report:weekly` |
| 로그 | `~/Library/Logs/pregnancy-checklist-report.log` (stdout+stderr) |
| 시크릿 저장소 | **repo 루트 `.env.local`** (git ignore, `chmod 600`). 스크립트가 `WorkingDirectory`(repo 루트) 기준으로 로드. 키: `GA4_PROPERTY_ID`·`GA4_SA_KEY_PATH`(→ `~/.config/pregnancy-checklist/ga4-sa.json`)·`OPENAI_API_KEY`·`ANTHROPIC_API_KEY`(빈 값) |
| plist env | **`PATH`·`HOME`만** (2026-07-30 secret 4종 → `.env.local` 이관, 평문 노출 제거). `WorkingDirectory` = repo 루트 |

**상태 확인 / 수동 실행**

```bash
launchctl list | grep pregnancy-checklist                    # 등록 여부 + 마지막 exit code (0 정상)
tail -n 50 ~/Library/Logs/pregnancy-checklist-report.log     # 최근 실행 로그
npm run report:weekly:dry-run                                # 발송 없이 수동 dry-run
```

**휴면 후 재등록** (launchd가 언로드됐으면):

```bash
launchctl unload ~/Library/LaunchAgents/com.melancholy14.pregnancy-checklist.weekly-report.plist 2>/dev/null
launchctl load   ~/Library/LaunchAgents/com.melancholy14.pregnancy-checklist.weekly-report.plist
```

> **모집단 주의**: 트래픽 표본이 작을 때(직전 카운트 <10) 모든 이벤트가 -100%로 찍히는 noise 신호가 날 수 있다(W24 incident). 진단 전 [weekly-report-improvement.md Wave 2](../plan/weekly-report-improvement.md) 임계값 가드부터 확인.
>
> **🔐 보안 (2026-07-30, 완료)**: plist 평문 secret 4종 → `.env.local`(0600) 이관 + `WorkingDirectory` 추가로 로드. plist엔 PATH·HOME만. 노출됐던 `OPENAI_API_KEY`는 콘솔에서 **rotate 완료**(새 키 유효 200 / 옛 키 폐기 401 검증). 향후 시크릿은 plist가 아니라 반드시 `.env.local`에만.

### 5.2 대시보드

| 대시보드 | URL | 용도 |
|---|---|---|
| Search Console | <https://search.google.com/search-console> (property `pregnancy-checklist.com`) | 색인 상태·검색 유입·미색인 사유 |
| GA4 | <https://analytics.google.com> (property `GA4_PROPERTY_ID`) | 이벤트·funnel·모집단 |
| AdSense | <https://www.google.com/adsense> | 승인 상태·정책 위반 |

> ⚠️ **AdSense는 산후 복귀 전 재신청·콘솔 조작 금지** (phase-4.8 R4 — 3차는 복귀 후만). GA4 internal traffic filter는 pre-launch 동안 **Active 금지**(본인 dogfooding이 트래픽 전부라 표준 리포트가 통째로 빔).

### 5.3 배포 흐름

- **트리거**: `main` 브랜치 push (보통 PR merge). PR 단계에서는 build-test만, 배포는 main push에서만.
- **CI**: [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — `build-test`(tsc → lint(soft, continue-on-error) → build → Playwright) → `deploy`(main push 한정).
- **배포 대상**: `peaceiris/actions-gh-pages` → `gh-pages` 브랜치 → **<https://pregnancy-checklist.com>** (cname). deploy 중 Lighthouse SEO 체크는 continue-on-error.
- **시크릿**: [github-secrets.md](github-secrets.md) — `GA_MEASUREMENT_ID`·`ADSENSE_CLIENT_ID`·`FEEDBACK_FORM_URL`·`SITE_URL` (없으면 CI fail-fast).
- **로컬 확인**: `npm run build` → 정적 산출물 `out/`. `npx serve out`로 배포본 미리보기.

---

## 부록 — 정본화 이력

- [x] §1.4 삭제 정책 2건 확정 (2026-07-30 — deprecated 12주 후 물리 삭제 + dangling 무시)
- [x] [image-sop.md](../content/image-sop.md) → §3 흡수 + 원본은 pointer stub으로 축소 (2026-07-30)
- [x] [phase-4.5.md P10](../plan/phase-4.5.md)·[phase-5.md S1 P10](../plan/phase-5.md) 상태 ✅ 완료로 갱신
- [x] 실사용 문서 리포인트: [blog-writer-persona.md](../content/blog-writer-persona.md)(§3.1/§3.4/§2.2)·[adsense-application-checklist.md](adsense-application-checklist.md)·[docs/README.md](../README.md) 인덱스
- 미이관(역사 기록으로 보존): feature spec/review·`tech/builds/*` build 문서의 image-sop 참조 — 당시 사실이라 그대로 둠

### 향후 트리거

- **phase-5 P5(schema versioning)** 도입 시: `deprecated` 필드를 [types/checklist.ts](../../src/types/checklist.ts)에 추가 → §1.4 삭제 절차 실제 발동 가능 (그전까지 물리 삭제 미발생)
