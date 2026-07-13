# weekly-report-wave2 리팩토링

> 리팩토링일: 2026-06-18
> 입력: [docs/tech/review/weekly-report-wave2-review.md](../review/weekly-report-wave2-review.md) Warning 3건
> 추가 판단: 0건 (UI 없음 — 컴포넌트 분리·useMemo·custom hook 추출 대상 N/A)

## 리팩토링한 파일 목록

- `scripts/weekly-report/__fixtures__/anonymize.ts`
- `scripts/weekly-report/prompt-shared.ts`

총 2개 파일, 3개 작업.

---

## 작업별 내용

### 1. anonymize.ts — `URL.pathname` → `fileURLToPath`

- **출처**: Warning W1
- **위치**: [scripts/weekly-report/__fixtures__/anonymize.ts:7,30](../../../scripts/weekly-report/__fixtures__/anonymize.ts#L7)
- **무엇을**: `new URL(import.meta.url).pathname` 을 `fileURLToPath(import.meta.url)` 로 교체. `node:url` 모듈에서 `fileURLToPath` import 추가.
- **왜**: `URL.pathname` 은 URL-encoded 라 path 에 spaces 같은 특수 문자 있으면 `fs.writeFileSync` 가 실패. `fileURLToPath` 가 OS-native path 로 디코딩. 운영자 현재 경로엔 spaces 없어 동작했지만, 다른 머신 이전 시 1회 깨질 위험 제거.
- **동작 변경**: 없음 (운영자 환경에선 두 방식 모두 동일 경로 반환).

### 2. prompt-shared.ts::extractSection — 헤더 line 다음 줄부터 body 시작

- **출처**: Warning W2
- **위치**: [scripts/weekly-report/prompt-shared.ts:167-181](../../../scripts/weekly-report/prompt-shared.ts#L167-L181)
- **무엇을**: `extractSection` 의 `afterHeader` 위치에서 다음 `\n` 까지를 추가로 건너뛰어 `bodyStart` 를 헤더 line 의 다음 줄 시작으로 이동. `## 6. 유입 채널 (sessionDefaultChannelGroup TOP)` 같은 헤더 부속 텍스트가 body 첫 줄로 섞이지 않음.
- **왜**: 리뷰 W2 — 이전 구현은 "empty body" 분기 실질 도달 불가, "no data row" 만 트리거. 의미적으로 정확한 메시지("empty body" vs "no data row")를 분기하려면 헤더 부속 텍스트를 body 에서 제외해야 함.
- **동작 변경**: invalid 판정 결과(`valid: false`)는 동일. 단 issue 메시지가 케이스에 맞게 정확해짐 — body 가 진짜 비어 있으면 "empty body", 빈 줄은 아니지만 데이터 행 없으면 "no data row".

### 3. prompt-shared.ts::validateSchema — `hasRow` 계산 단순화

- **출처**: Warning W3
- **위치**: [scripts/weekly-report/prompt-shared.ts:223-227](../../../scripts/weekly-report/prompt-shared.ts#L223-L227)
- **무엇을**: `lines.join("\n").slice(...).split("\n").slice(0, body.split("\n").length).some(...)` 5단계 체인을 `body.split("\n").some(...)` 1단계로 축약. `lines` 변수는 placeholder 검출용 (앞쪽 `normalized.split("\n")`) 에서만 사용되도록 유지.
- **왜**: 리뷰 W3 — `lines.join("\n")` 은 `normalized` 와 동일, 이후 slice 한 결과의 첫 N 줄은 `body.split("\n")` 과 동일. 4단계 우회로가 같은 결과 산출. 가독성 ↑, 코드량 ↓.
- **동작 변경**: 없음 (수학적으로 동일 결과).

---

## 변경 전/후 구조 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 수 | 10개 (구현 + 리뷰까지) | 10개 (동일) |
| `validateSchema` LOC | 75줄 | 71줄 (체인 단순화 4줄 절감) |
| `extractSection` LOC | 11줄 | 13줄 (정확성 위해 headerLineEnd skip 2줄 추가) |
| `anonymize.ts` import | 3개 (`fs`/`os`/`path`) | 4개 (+`fileURLToPath`) |
| 동작 변경 | — | 0건 (issue 메시지 정확도만 향상) |
| 단위 테스트 통과 | 47/47 | 47/47 (회귀 0) |

---

## 빌드 결과

- `npm run build`: ✓ Compiled successfully in 3.5s, static pages 37/37 in 763ms (1회 시도, 성공)
- `npm run test:unit -- scripts/weekly-report/__tests__/`: 47/47 passed in 334ms (회귀 0)

본 PR 의 unit 매트릭스가 "두 메시지 모두 허용" 방식으로 작성돼 있어 W2 의 메시지 정확화 변경이 회귀 없이 통과. 향후 명확화 시 테스트도 "empty body" / "no data row" 를 분기해 적기 가능.
