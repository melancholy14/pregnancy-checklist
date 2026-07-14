# design-bundle-g-pastel-remap

> 상태: 구현✅ 리뷰✅ 리팩토링· | 최종 갱신 2026-05-09
> plan: [spec](../../features/design-bundle-g-pastel-remap/spec.md)

<!-- STEP:impl -->
## 구현

> 구현일: 2026-05-09
> spec: [docs/features/design-bundle-g-pastel-remap/spec.md](../../features/design-bundle-g-pastel-remap/spec.md)

### 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| 변경 3곳에서 `#E0F0FF` 0건 (`grep -rn "#E0F0FF" src/`) | ✅ 완료 | grep 결과 0 라인 |
| 각 위치가 `globals.css` 5-pastel 토큰 hex와 일치 (`#E4D6F0` 또는 `#FFE0CC`) | ✅ 완료 | globals.css 17행 `--pastel-lavender: #E4D6F0`, 19행 `--pastel-peach: #FFE0CC` 검증 |
| `npm run build` 통과 | ✅ 완료 | TypeScript / 정적 생성 32페이지 모두 성공 |

### 생성/수정 파일 목록

#### 신규 생성
- 없음

#### 수정
- [src/components/home/HomeContent.tsx:355](../../../src/components/home/HomeContent.tsx#L355) — 정보 & 가이드 미니카드 `color` prop `#E0F0FF` → `#E4D6F0` (`--pastel-lavender`)
- [src/lib/constants.ts:42](../../../src/lib/constants.ts#L42) — `TIMELINE_TYPE_CONFIG.admin.color` `#E0F0FF` → `#FFE0CC` (`--pastel-peach`)
- [src/components/babyfair/BabyfairCard.tsx:26](../../../src/components/babyfair/BabyfairCard.tsx#L26) — `SCALE_CONFIG.small.color` `#E0F0FF` → `#E4D6F0` (`--pastel-lavender`)

### 주요 결정 사항

- **토큰명 주석을 추가하지 않음**: spec §2 must는 토큰 주석을 "권장"으로 표기했으나, 동일 객체 내 다른 색 항목들(`prep`, `shopping`, `education`, `wellbeing` / `large`, `medium` 등)에 토큰 주석이 없어 일관성 위반이 된다. 한 항목만 주석을 다는 것은 가독성 손해라 판단해 모두 주석 없이 hex만 정정. 토큰 매칭 정보는 본 impl 문서와 spec에서 추적 가능.
- **plan 파일 부재 처리**: `docs/plan/design-bundle-g-pastel-remap-plan.md`가 없음. spec.md가 size: S로 파일·라인·hex·토큰까지 명시되어 있어 spec을 plan 대용으로 사용. 별도 plan 작성 단계 생략.

### 가정 사항

- 변경된 hex가 `globals.css`의 토큰 hex와 정확히 일치한다는 spec의 요구는 "값의 일치"이지 "변수 참조로의 치환"이 아니다 (Cross-4는 won't 항목으로 명시).
- 베이비페어 `CITY_COLORS`, timeline `prep=#FFD4DE`, baby-fair `large=#FFD4DE`는 본 라운드 범위 외 (spec won't).

### 미구현 항목

- spec won't 4개 항목 (Cross-4 인라인→토큰 클래스, pink role 충돌, CITY_COLORS, GA4) — 모두 의도적으로 본 라운드 범위 밖.

---

<!-- STEP:review -->
## 코드 리뷰

> 리뷰일: 2026-05-09
> spec: [docs/features/design-bundle-g-pastel-remap/spec.md](../../features/design-bundle-g-pastel-remap/spec.md)
> impl: [docs/implementation/design-bundle-g-pastel-remap-impl.md](#구현)

### 리뷰 대상 파일

- `src/components/home/HomeContent.tsx` (1줄, line 355)
- `src/lib/constants.ts` (1줄, line 42)
- `src/components/babyfair/BabyfairCard.tsx` (1줄, line 26)

각 파일은 hex 리터럴 1개씩 교체. 새 import·새 객체·새 함수·새 분기 없음.

---

### Critical 이슈 (즉시 수정 완료)

없음.

---

### Warning (수정 권장)

없음.

근거:
- **타입 안전성**: 3개 변경 모두 string literal 교체. `TIMELINE_TYPE_CONFIG`는 `as const`(line 45)로 literal type 유지, `SCALE_CONFIG`는 `Record<string, { label: string; color: string }>` 타입과 일치. `DashboardCard.color: string` prop 시그니처 만족. `any`/`as` 단언/nullable 접근 추가 없음.
- **성능**: 모듈 스코프 상수의 값 변경. 렌더 함수 내 객체·함수 신규 생성 없음. 번들 사이즈·리렌더 패턴 영향 없음.
- **보안**: 정적 디자인 토큰 hex 문자열만 다룸. 사용자 입력·외부 값·`dangerouslySetInnerHTML`·동적 코드 실행 없음.
- **접근성**:
  - 홈 정보 카드의 아이콘 박스는 장식용 배경(emoji "📝" 뒤). 카드 전체는 `<Link href="/info">`로 "정보 & 가이드" 텍스트 라벨링. 색만 바뀜.
  - 타임라인 행정 배지는 `<span aria-hidden="true">📋</span> 행정` — 이모지 hidden, 텍스트 "행정"이 스크린리더 라벨.
  - 베이비페어 소형 배지는 `<Badge>소형</Badge>` 단순 텍스트.
  - 새 hex(`#E4D6F0`, `#FFE0CC`)는 light pastel + `text-foreground`(어두운 회색) 조합. 동일 객체 내 다른 token(`prep #FFD4DE`, `education #E4D6F0` 등)이 이미 같은 패턴으로 운영 중이라 새 대비 위험 도입 없음.

---

### Suggestion (개선 아이디어)

#### 1. 토큰명 인라인 주석 (impl에 이미 기록됨)
spec §2 must의 "토큰명 주석 1줄 권장"은 채택하지 않았다. 이유는 impl 문서 "주요 결정 사항" 1번에 기록 — 동일 객체 내 다른 색 항목들이 주석을 갖지 않아 한 항목만 다는 것이 일관성 손해. 본 리뷰에서도 동일 판단 유지.

#### 2. Cross-4 (인라인 hex → 토큰 변수/클래스 전환)
spec §2 won't 1번에 명시된 별도 라운드 작업. 본 라운드는 "값 정정"만 하고 "참조 변환"은 하지 않는다. 향후 Cross-4 라운드에서 `style={{ backgroundColor: var(--pastel-lavender) }}` 또는 Tailwind `bg-pastel-lavender` 클래스로 전환하면 토큰 hex 변경 시 자동 반영되어 본 종류의 회귀가 구조적으로 차단된다. 현재 라운드 액션 아님.

---

### 요약

| 구분 | 건수 |
|------|------|
| Critical | 0건 |
| Warning | 0건 |
| Suggestion | 2건 |
| 빌드 | 미실행 (Critical 수정 없음) |

리뷰 결론: 변경 범위가 정확히 spec의 must 3건과 일치하며, 4관점 어디에서도 새 위험을 도입하지 않았다. Refactor 단계로 넘길 Warning 항목 없음.
