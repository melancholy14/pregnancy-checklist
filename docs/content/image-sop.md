# 운영자 가이드 — 이미지 SOP (AI 생성 이미지 표시 의무)

> 작성일: 2026-05-07
> 출처: [docs/features/p14-ai-image-label/](../features/p14-ai-image-label/) (review.md / spec.md / design.md)
> 통합 위치: 본 SOP는 P10 운영자 가이드(통합 문서 미정) 발행 시 "이미지 SOP" 섹션으로 흡수될 예정. 그 전까지 단독 문서로 운영.

## 1. 표시 트리거 (1줄 룰)

MD 본문에서 AI 생성 이미지를 삽입할 때 **alt 텍스트 끝에 ` (AI 생성 이미지)` 후행 표기**만 붙이면 끝.

```md
![임신 주차별 검사 및 준비 타임라인 요약 인포그래픽 (AI 생성 이미지)](/articles/weekly-prenatal-checklist.png)
```

빌드 타임에 rehype 플러그인([src/lib/markdown/rehype-article-figure.ts](../../src/lib/markdown/rehype-article-figure.ts))이 자동으로 다음을 부착한다.

- `<figure>` 래핑 + `<img>` 그대로
- 우하단 워터마크 칩 (`Imagined with AI`, 검은 반투명 + 흰 텍스트, `aria-hidden`)
- alt 속성은 후행 마커 포함 그대로 유지(스크린리더 낭독 일관성)

표시 의무는 워터마크 칩 + alt 두 채널로 충족된다. figcaption은 캡션이 있을 때만 §1.1 규칙에 따라 자동 부착된다.

### 1.1 캡션이 필요한 경우 (선택)

원본 캡션(이미지 출처, 보조 설명 등)을 붙이고 싶으면 **markdown image title 슬롯**을 사용한다.

```md
![alt 텍스트 (AI 생성 이미지)](/path/image.png "원본 캡션 텍스트")
```

빌드 타임에 plugin이 title을 추출해 figcaption으로 옮긴다.

| alt 마커 | title (캡션) | figcaption 출력 |
|---|---|---|
| `(AI 생성 이미지)` 있음 | 있음 | `<원본 캡션> · AI 생성` |
| `(AI 생성 이미지)` 있음 | 없음 | (figcaption 미렌더 — 칩만으로 표시) |
| `(AI 생성 이미지)` 없음 | 있음 | `<원본 캡션>` |
| `(AI 생성 이미지)` 없음 | 없음 | (figcaption 미렌더) |

title 속성은 figcaption으로 옮겨진 뒤 `<img>`에서 제거되므로 브라우저 기본 tooltip과 중복되지 않는다.

## 2. 적용 대상 체크리스트

이미지를 본문에 넣기 전, 아래 분류 표로 표시 의무 여부 판단.

### 2.1 도구별 분류

| 도구 / 출처 | 분류 | 표시 의무 | 메타 자동 포함 검증 |
|---|---|---|---|
| ChatGPT (DALL·E) | 100% AI 생성 | ✅ 필수 | ✅ 검증 완료 (2026-05-06, verify.contentauthenticity.org) |
| 미드저니 (Midjourney) | 100% AI 생성 | ✅ 필수 | ⬜ 미검증 — 도입 시 §3 검증 절차 1회 |
| Stable Diffusion / SDXL | 100% AI 생성 | ✅ 필수 | ⬜ 미검증 |
| Sora (이미지) | 100% AI 생성 | ✅ 필수 | ⬜ 미검증 |
| Adobe Firefly | 100% AI 생성 | ✅ 필수 | ⬜ 미검증 |
| Lightroom AI 보정 | AI 후보정 사진 | ❌ 제외 | N/A |
| Photoshop AI 도구 (Generative Fill 등) | AI 후보정 사진 | ❌ 제외 | N/A |
| 스마트폰 AI 카메라 (갤럭시·아이폰) | AI 후보정 사진 | ❌ 제외 | N/A |
| 직접 촬영 (보정 없음) | 실사 사진 | ❌ 제외 | N/A |

신규 도구 도입 시 위 표에 행만 추가. 분류 축은 **"100% AI 생성(텍스트→이미지) vs AI 보조 후처리"**.

### 2.2 회색지대 처리

- AI로 초안 생성 → 직접 그래픽 툴(Figma·Photoshop)에서 30% 이상 재가공 → 100% AI 분류 유지(원본이 AI). 대신 alt에 가공 정도 명시 추천 (`(AI 생성 후 직접 가공)`).
- 스톡 사진 위 AI 텍스트·아이콘 합성 → 합성 결과물 자체는 표시 대상. 단 alt는 합성 의도에 맞춰 작성.

## 3. 신규 AI 이미지 도구 도입 시 1회 검증

ChatGPT/DALL·E 외 도구 첫 사용 시 IPTC 메타 자동 포함 여부를 1회 검증한다.

### 3.1 verify.contentauthenticity.org

1. 새 도구로 이미지 생성 후 다운로드
2. https://verify.contentauthenticity.org 접속
3. 이미지 업로드
4. **"콘텐츠 자격증명(Content Credentials)" 표시** 또는 **`DigitalSourceType: trainedAlgorithmicMedia`** 항목 확인
5. 표시되면 → 본 SOP 표 §2.1 행에 `✅ 검증 완료 (날짜)` 기재
6. 표시 안 되면 → §3.2 수동 부착

### 3.2 수동 IPTC 부착 (자동 포함 안 되는 도구)

```bash
# exiftool 설치 (mac): brew install exiftool
exiftool -IPTC:DigitalSourceType="trainedAlgorithmicMedia" image.png

# 검증
exiftool -a -G1 image.png | grep -iE "DigitalSourceType|trainedAlgorithmicMedia"
```

수동 부착이 매번 필요한 도구는 §2.1 표 메모에 `⚠️ 수동 부착 필요` 표시 + 운영 부담 평가 후 도구 교체 검토.

## 4. 광고 슬롯 충돌 방지

워터마크 칩 위치는 우하단 8px 안쪽. 광고 슬롯이 이미지 직후 또는 figure 우측에 인접하면 시각적으로 묻힐 수 있다.

- ✅ 권장: 이미지 본문 안에서 광고 슬롯과 figure 사이에 한 단락 이상 텍스트 배치
- ❌ 금지: figure 직후 즉시 광고 슬롯 (워터마크 칩 ↔ 광고 인접)
- 이미지 + 광고 인접 발생 시 → 광고를 figure 외부로 이동(레이아웃 재검토)

## 4.1 인포그래픽 우상단 영역 회피 (디자인 §2 라운드 결정, 2026-05-09)

본문 이미지에 figcaption(markdown title 슬롯)을 비우면 figure 우상단(이미지 폭 720 기준 약 100×100px)에 ExternalLink 아이콘이 표시된다(원본 새 탭 열기 시각 마커). 인포그래픽 핵심 텍스트·수치를 우상단에 배치하지 말 것. figcaption을 채우면 아이콘은 figcaption 텍스트(`· 원본 보기`)로 대체되어 우상단 회피 불필요.

### 4.2 markdown title 슬롯 권장

신규 글 작성 시 `![alt](src "caption")` 형식으로 title 슬롯에 캡션을 채우는 것을 권장 — 시각 캡션 + 우상단 아이콘 회피 둘 다 충족. title 슬롯이 비어 있으면 figcaption 미렌더 + 우상단 ExternalLink 아이콘 분기로 전환된다.

## 5. 외부 이미지 정책

`http://` / `https://` 절대 URL 이미지는 IPTC 메타 통제 불가 + CDN·캐시 정합성 문제. **사용 금지** 원칙.

빌드 타임에 rehype 플러그인이 외부 이미지 사용 시 콘솔 경고 출력. 경고 발생 시 이미지를 `public/articles/` 하위로 이동 후 상대 경로 사용.

## 6. 발행 체크리스트

신규 글 발행 전 아래 6개 항목 통과 확인.

- [ ] 본문 모든 이미지에 alt 작성 (빌드 타임에 누락 시 경고)
- [ ] AI 생성 이미지에 ` (AI 생성 이미지)` 후행 표기
- [ ] AI 후보정 사진에는 위 마커 **미부착** (오라벨링 방지)
- [ ] 이미지 직후 광고 슬롯 인접 없음
- [ ] 외부 절대 URL 이미지 없음 (사용 시 사유 기록)
- [ ] frontmatter `reviewed_by` 룰 적용 (§9 참조 — 빈 문자열 `""` 금지)

## 7. 운영자 시각 점검 (배포 후 1회)

배포 후 모바일 320px / 375px 두 사이즈에서 발행된 글의 인포그래픽 우하단을 직접 확인.

- 워터마크 칩이 인포그래픽 핵심 영역(수치·텍스트)을 가리지 않는가
- 칩 텍스트 명도 대비 ≥ 4.5:1 (배경 명도 변동 시 axe-core 또는 수동 확인)
- figcaption(`· AI 생성`)이 본문 흐름과 자연스럽게 이어지는가

문제 발견 시 → 도구별 출력 비율 조정(우하단 8px 영역에 핵심 정보가 안 오도록 미드저니 프롬프트 가이드) 또는 디자인 토큰 재논의 ([docs/features/p14-ai-image-label/design.md](../features/p14-ai-image-label/design.md)).

## 8. 체크리스트 데이터 변경 룰 (시맨틱 한 줄)

체크리스트 항목 JSON 편집 시 `recommendedWeek` 의미 — `0` 은 **미정/주차 무관**으로 P2 "이번 주 추천" 매칭 대상이 아니다 (출처: [docs/features/checklist-recommendation-semantics/](../features/checklist-recommendation-semantics/)). 본격 데이터 변경 룰(ID 재사용 금지, 삭제 deprecated 플래그 등)은 P10 통합 운영자 가이드 발행 시 합본.

## 9. frontmatter `reviewed_by` 룰 (YMYL 신뢰도)

> 출처: phase-4.5 §4.2 D-C2 (Phase 3-0e 잔존 → 2026-05-13 마감).

블로그 글 frontmatter의 `reviewed_by` 필드는 다음 룰을 따른다.

### 9.1 금지 패턴

```yaml
# ❌ 금지 — 빈 문자열
reviewed_by: ""
```

**이유**: 빈 값 노출은 "리뷰받지 않았다"를 명시적으로 선언하는 것과 같음. 임신·출산은 YMYL(Your Money or Your Life) 도메인이라 검수자 표기 부재가 신뢰도에 마이너스로 작용 (Google Quality Rater Guidelines E-E-A-T 정합).

### 9.2 허용 패턴 (3종 중 택1)

| 케이스 | 패턴 | 예시 |
|---|---|---|
| 검수자 부재 | **필드 자체 제거** | (frontmatter에 `reviewed_by` 키 없음) |
| 실제 검수자 받음 | 이름·자격 명시 | `reviewed_by: "산부인과 전문의 OOO (서울대병원)"` |
| AI 페르소나 검수만 받음 | 페르소나·역할 명시 + AI 표기 | `reviewed_by: "산부인과 전문의, 가족·복지정책 전문가 (AI 페르소나 검수)"` |

AI 페르소나 검수 패턴은 [early-pregnancy-tests.md](../../src/content/articles/early-pregnancy-tests.md) 사례 참조 — "AI 페르소나 검수" 명시로 투명성 확보 + E-E-A-T 정합.

### 9.3 신규 글 발행 SOP

- 검수 미받음 → `reviewed_by` 필드 자체 작성 금지 (key 없으면 frontmatter 파서가 undefined로 처리)
- 검수 받은 뒤 추가 → 9.2 표 패턴 그대로 명시
- 신규 글 작성 후 발행 전 `grep -l 'reviewed_by: ""' src/content/articles/*.md` 1회 실행, 결과 0건 확인

### 9.4 위반 시 SoT 정정

- 사이트 전체 빈 `reviewed_by: ""` 상태 = phase-4.5 §4.2 D-C2 회귀
- 발견 시 phase-4.5.md §4.2 D-C2 상태를 ⚠️ 회귀로 갱신 + 즉시 정정 라운드
