# Claude Code 운영방식 (육아휴직 대응)

**결정일** 2026-05-08
**다음 재평가** 집중 개발 기간 진입 직전 (≈ 2026-07-15, 휴가 시작일 확정 시 갱신) 또는 아래 트리거 중 하나 발동 시

## 결정

| 항목 | 결정 |
|---|---|
| 도구 조합 | **Claude Pro 단일** (옵션 A) |
| 보조 도구 | Codex, graphify 모두 **보류** |
| Max 5x 단발 업그레이드 | 집중 개발 기간 시작 시점에 한도 압력 실측 후 재판단 |
| 하네스 보완 | 신규 4종을 집중 개발 기간 진입 전 완성 (아래 우선순위 참조) |

## 컨텍스트 — 사용량 분포

| 시점 | 강도 | Pro 한도 압력 |
|---|---|---|
| 지금 ~ 집중 개발 기간 (≈ 5/9 ~ 7/15) | 평소 (하루 2~3시간) | 낮음 |
| 집중 개발 기간 (≈ 7/15 ~ 8/13, 약 4주) | 5시간 윈도우당 3~4시간 | **높음 — 막힐 가능성** |
| 산후 3개월 (≈ 8/13 ~ 11/13) | 거의 안 씀 | 없음 |
| 산후 3개월 이후 | 하루 2시간 | 낮음 |

→ 한도 압력은 **약 4주짜리 spike 이벤트**. spike 외 기간은 Pro로 충분. 휴가 시작일 미정 — 7월 중순 기준 추정이며 확정 시 이 표 갱신.

## 대안 비교 (왜 옵션 A인가)

| 옵션 | 1년 비용 | 도구 마찰 | 기존 자산 활용 | 판정 |
|---|---|---|---|---|
| **A. Pro 고정** | $240 | 0 | 100% | **채택** |
| B. Pro + ChatGPT Plus(Codex) | $480 | 큼 | 일부 무력화 | 기각 |
| C. Pro + 집중 개발 달만 Max 5x | $320 | 0 | 100% | spike 실측 후 검토 |
| D. Pro + 집중 개발 달만 Max 20x | $420 | 0 | 100% | C가 부족할 때 fallback |

기각 사유:
- **B (Codex 추가)** — 기존 7개 modular skill + `/feature-pipeline` orchestrator의 implementation 책임을 Codex로 옮기면 자체 자산 무력화. AGENTS.md ↔ CLAUDE.md 직무 분리 패턴은 자기모순(`/ai/core/*` 단일 진실 주장과 충돌). 셋업/sync 마찰이 집중 개발 기간 직전에 부담됨.
- **graphify** — Next.js 모노레포(50x 절약 사례)와 PoC 규모(< 100파일) ROI 차이가 superlinear. PoC 규모에서는 셋업 비용 + graph staleness 비용 > 절약 토큰. `docs/tech/implementation/<name>-impl.md`가 사실상 수동 knowledge graph 역할 중.

## 재평가 트리거

다음 중 하나라도 발동하면 옵션 재검토:

1. PoC 코드베이스 100파일 초과
2. Pro 한도가 한 달 누적 5회 이상 닿음 (집중 개발 기간 외)
3. 집중 개발 기간 진입 후 Max 5x로도 부족 → Max 20x 단발 전환
4. 휴직 복귀 시점 (미정) 작업 강도 재평가
5. 휴가 시작일 확정 시 timeline·일정 표 갱신

## 하네스 보완 — 우선순위 4종

ChatGPT 권고 중 **자산 충돌 없는 것만** 채택. AGENTS.md vs CLAUDE.md 직무 분리, `/ai/core/*` 정책 트리 풀세팅, adversarial persona 모든 ticket 강제 — 셋 다 박지 않음.

| # | 산출물 | 상태 | 갭 |
|---|---|---|---|
| 1 | `/feature-plan` orchestrator | 거의 끝 | 마무리 |
| 2 | `.claude/skills/token-discipline/` | **없음** | **최우선** |
| 3 | `/feature-pipeline` 종료 시 "다음 진입자용 5줄 요약" 강제 | 없음 | hook 또는 skill 끝줄 |
| 4 | `CLAUDE.md` 정비 | 현재 AGENTS.md import만 | 제품 원칙·금지·기술 스택 1페이지 |

### Token-discipline 룰 후보 (skill 초안용)

7개 룰 중 PoC 규모에 맞는 것만 50줄 이내로 압축:

1. Directory-first, file-second — `view <dir>` 또는 grep으로 후보 좁힌 뒤 파일 read
2. `view_range` 강제 — 200줄 초과 파일은 통째 read 금지
3. Read-once — 같은 파일 한 세션에서 두 번 read 금지, 첫 read 결과는 `-impl.md`에 요약
4. Grep before view — 함수/변수 위치 특정 후 ±20줄만 view_range
5. Context clear — unrelated task 사이 `/clear` 강제
6. Ticket scope lock — 1 ticket = 파일 변경 최대 5개, 초과 시 stop-and-report
7. `-impl.md` 캐시 활용 — 이전 세션 컨텍스트는 원본 코드 재탐색 대신 `-impl.md`에서 읽기

### Session resumption 강제

3개월 휴면 → 하루 2시간 모드 재진입 시 ramp-up 30분 넘어가면 그날 작업 의미 없음. `/feature-pipeline` 또는 `/implement-feature` 종료 시 `-impl.md` 끝에 다음 항목 강제:

- 마지막으로 건드린 파일 + 변경 의도
- 다음 ticket 진입점 (파일 + 함수)
- 미해결 결정사항 1~3줄
- 재시작 명령 (예: `/feature-pipeline --from=3 <name>`)

## 백캐스팅 일정

집중 개발 기간 진입 ≈ 2026-07-15 (휴가 시작일 미정, 확정 시 갱신). 출산 예정일 2026-08-13.

| 주차 | 기간 | 작업 |
|---|---|---|
| W1 | 5/9 ~ 5/16 | 운영방식 의사결정 박제 (이 문서), `token-discipline` skill 초안 |
| W2 | 5/16 ~ 5/23 | 7개 skill에 token-discipline 참조 inject, `/feature-plan` 마무리 |
| W3 | 5/23 ~ 5/30 | session resumption hook, PoC 1~2 ticket으로 토큰 사용량 실측·튜닝 |
| W4 | 5/30 ~ 6/6 | `CLAUDE.md` 정비, 잔여 갭 마감 |
| W5~W9 | 6/6 ~ 7/15 (≈ 5.5주) | MVP 본 작업 (셋업 만지지 않기) |
| **집중 개발** | **7/15 ~ 8/13 (≈ 4주)** | **MVP push 전용. 새 도구·룰 도입 절대 금지** |

## 박지 않을 것 (over-engineering 트랩)

- AGENTS.md vs CLAUDE.md 직무 분리 — 현재 자산 충돌
- `/ai/core/*` 정책 트리 풀세팅 — 1인 PoC 규모 mismatch
- graphify 셋업 — PoC < 100파일 구간에서 ROI 약함
- 모든 ticket에 4-persona adversarial review — S size에서는 skip 옵션 필수
- AGENTS.md를 Codex 호환 포맷으로 재작성 — Codex 안 씀

## 출처

- ChatGPT 논의: 2026-05-08 (옵션 비교, 하네스 framing 일부 채택)
- Claude 검증 논의: 2026-05-08 (옵션 C 도출, graphify ROI 분석, token-discipline 룰 후보)
