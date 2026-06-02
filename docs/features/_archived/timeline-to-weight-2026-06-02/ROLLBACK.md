---
name: timeline-to-weight-rollback
status: rolled_back
rolled_back_at: 2026-06-02
original_decision: phase-4.6.md §2 T1=A (체중관리로 흡수, 2026-05-26 확정)
---

# ⛔ ROLLED BACK 2026-06-02

본 feature 폴더의 모든 문서 (spec·design·review·ga4·qa·meta + Addendum) 는 **2026-06-02 운영자 결정으로 폐기**됨. 흡수 코드는 commit 전 stash 처리 (`stash@{0}` "timeline-to-weight 흡수 작업분 (분리 결정으로 폐기 2026-06-02)") 후 `/timeline` 라우트 원상 복귀.

## 분리 결정 사유

1. **사용자 직관 (운영자 본인)**: 보강안 (카드 카피 정정 + `/weight` 안 "전체 주차 보기" 토글) 구현 후에도 어색함 잔존. 정체 = **두 의도(체중 도구 + 주차 가이드)가 한 페이지에 동거하는 것 자체**. 카피·노출 위계로 해소 안 됨 → 본질적 정보구조 결정의 오류 신호
2. **AdSense 4축 등식 무효**: phase-4.6 §1.123-127 의 "T1=A → 4축 정돈 → AdSense 통과" 등식이 운영자의 추측이었음 (2026-06-02 정책 원문 재확인). 실제 AdSense Program Policies 는:
   - 명확한 탐색 구조 (4축이든 5축이든 OK)
   - 콘텐츠 평가 (고유 가치·관련성·독창성, IA 무관)
   - 광고와 탐색 메뉴 거리 (실제 강제 항목)
   → 탭 개수는 IA 디자인 결정이지 AdSense 강제 X. T1=A 결정의 가장 큰 기둥 붕괴
3. **콘텐츠 가치 squash**: `timeline_items.json` 36 항목 × 5 type 의 풍부한 콘텐츠를 weight 페이지의 "현재 주차 1줄 + 보조 토글" 로 squash 하는 것이 콘텐츠 가치 대비 부적합

## 폐기된 결정 (참고)

- 결정 1 (B): zustand `persist.migrate` pure 함수 추출 — **무효**. timeline·weight 별도 store 유지
- 결정 2 (B): GA4 `weight_*`·`timeline_*` 4주 grace dual-fire — **무효**. timeline_* 단일 namespace 유지
- 결정 3 (C 변형): /weight 상단 1줄 컨텍스트 — **무효**. /weight 는 체중 도구 단일 정체성
- 결정 4 (Addendum): ChecklistHub 카드 카피 "체중과 주차별 가이드" — **무효**. "주차별 타임라인" 그대로
- 결정 5 (Addendum): /weight 안 "전체 40주 미리 보기" 토글 — **무효**. /timeline 라우트가 그 역할

## 도미노로 흔들리는 phase-4.6 결정

- **H1=A** (4축 허브) — T1=A 자연 도출이라 박혀 있음 ([phase-4.6.md:129](../../../plan/phase-4.6.md#L129)). T1 무효되면 재검토 대상
- **N1=A** (BottomNav 4탭) — H1=A 자연 도출 ([phase-4.6.md:130](../../../plan/phase-4.6.md#L130)). 5탭 또는 4탭 + More 메뉴 재검토 대상

위 두 결정의 재검토는 별도 phase 또는 hotfix 에서 처리. 본 rollback 은 T1 한정.

## 복원·재현 안내

stash 에 남은 흡수 작업분을 다시 살리고 싶다면:

```bash
git stash list  # stash@{0} 확인
git stash show -p stash@{0}  # diff 미리보기
git stash apply stash@{0}  # 적용 (pop 아닌 apply 로 stash 보존)
```

단 본 rollback 의 사유가 유효한 동안에는 stash 적용 비추천. 일부 코드 (예: WeightContainer 의 weight 도구 개선 부분) 만 cherry-pick 으로 살릴 수 있음.

## 관련 commit

- 65a11aa (2026-05-31) — feature-plan 6 문서 최초 머지
- c39f703 (2026-06-01) — 본 Addendum 6 문서 머지
- (rollback commit, 2026-06-02) — 본 ROLLBACK.md + archive 이동 + phase-4.6.md 주석
