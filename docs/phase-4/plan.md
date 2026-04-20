# Phase 4: 사용자 경험 심화 + 콘텐츠 네트워크 강화 — Development Plan

> Phase 3 기록: [../phase-3/plan.md](../phase-3/plan.md)
> Date: 2026-04-20
> 목표 완료: 2026-05-15
> Status: 📋 기획

---

## Overview

Phase 3에서 AdSense 인프라 + 누락 기능을 보완했으나,
**사용자 체류 시간 확대, 콘텐츠 간 유기적 연결, 바이럴 성장 채널**이 부재하다.

Phase 4는 **도구 고도화(체중 차트) + 콘텐츠 네트워크(관련 추천 + 크로스링크 확장) + 공유 기능 + 자동화 스크립트**에 집중한다.

### 왜 지금 해야 하는가

| 이유 | 설명 |
|------|------|
| **세션 체류 시간 부족** | 단일 페이지 방문 후 이탈. 콘텐츠 간 연결이 약해 추가 탐색이 일어나지 않음 |
| **체중 도구 활용도 낮음** | 단순 기록만 제공 — "내가 정상 범위인가?"라는 핵심 질문에 답하지 못함 |
| **바이럴 채널 없음** | 공유 기능이 전무하여 맘카페/단톡방 등 임산부 커뮤니티로의 자연 확산 불가 |
| **크로스링크 수동 관리 한계** | 콘텐츠가 15개+로 증가하면 수동 매핑은 유지 불가능 |
| **AdSense 수익 극대화** | 내부 링크 밀도 ↑ → 페이지뷰 ↑ → 광고 노출 ↑ |

### 현재 상태 (AS-IS) vs 목표 (TO-BE)

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 체중 차트 | 단순 라인 차트, BMI 참조선 하드코딩 | 영역 그래프 + BMI별 권장 범위 + Tooltip + 요약 통계 |
| 관련 콘텐츠 추천 | 아티클 상세 하단에 추천 없음 | 태그 기반 관련 아티클 3개 + 타임라인/영상 크로스 추천 |
| 공유 기능 | 없음 | URL 복사 + Web Share API + 카카오톡 (fallback) |
| 크로스링크 범위 | 타임라인↔아티클, 타임라인→영상, 체중→아티클 | 모든 모듈 간 양방향 연결 (베이비페어 포함) |
| 크로스링크 관리 | 수동 (JSON/front matter 직접 편집) | 자동 생성 스크립트 (주 1회) + 수동 오버라이드 보호 |

---

## Scope

**In scope:**

- 체중 기록 페이지 차트 시각화 강화 (BMI별 권장 범위, 영역 그래프, 요약 통계)
- 아티클 상세 하단 관련 콘텐츠 추천 (글 + 타임라인 + 영상)
- 공유 기능 (Clipboard API + Web Share API + 카카오톡 SDK)
- 크로스링크 영역 확장 (영상↔타임라인/블로그, 베이비페어↔타임라인/블로그)
- 크로스링크 자동 생성 스크립트

**Out of scope:**

- 서버 사이드 추천 엔진 (AI/ML 기반)
- 사용자 행동 기반 개인화 추천
- 회원가입 / 로그인
- PWA / 푸시 알림

---

## 실행 순서 및 의존성

```
Phase 4 실행 흐름 (의존성 기반)

[독립 — 즉시 착수 가능]
├── Step 1. 체중 차트 시각화 강화
├── Step 3. 공유 기능
└── Step 5. 크로스링크 자동 생성 스크립트 (기반)

[Step 5 기반 완료 후]
├── Step 2. 관련 콘텐츠 추천 (매칭 로직 공유)
└── Step 4. 크로스링크 영역 확장 (스크립트로 매핑 생성)
```

### 추천 실행 순서

| 순위 | Step | 이유 |
|------|------|------|
| 1 | Step 2. 관련 콘텐츠 추천 | AdSense 페이지뷰 직접 영향. 구현 비용 낮음 |
| 2 | Step 5. 크로스링크 스크립트 | Step 2·4의 매핑을 자동화하는 기반 |
| 3 | Step 3. 공유 기능 | 바이럴 성장 채널. 다른 기능과 의존성 없음 |
| 4 | Step 4. 크로스링크 확장 | 스크립트 없이 수동 확장은 유지 불가능 |
| 5 | Step 1. 체중 차트 강화 | 법적 프레임워크 확보 필요. 구현 비용 높음 |

---

## Step 1. 체중 기록 페이지 차트 시각화 강화

### 1-1. 문제 분석

현재 체중 차트는 단순 라인 그래프에 BMI 정상 범위(11.5~16kg) 참조선만 하드코딩되어 있다.
사용자가 "내 체중 증가가 정상 범위인가?"를 직관적으로 파악할 수 없다.

**현재 구현:**
- `src/components/weight/WeightChart.tsx`: Recharts 라인 차트, 240px 높이
- `src/store/useWeightStore.ts`: `{ id, date, weight }` 구조, 임신 전 체중/키 없음
- `src/components/weight/WeightForm.tsx`: 30~200kg 범위 검증

### 1-2. 설계

#### 데이터 모델 변경

```ts
// useWeightStore 확장
type WeightProfile = {
  height?: number;           // cm (140~200 범위)
  prePregnancyWeight?: number; // kg (30~200 범위)
};

// BMI 자동 계산
const bmi = prePregnancyWeight / ((height / 100) ** 2);
```

#### BMI별 권장 체중 증가 범위 (IOM 2009 기준)

| BMI 분류 | BMI 범위 | 권장 총 증가 (kg) | 2·3분기 주당 증가 (kg) |
|----------|---------|------------------|---------------------|
| 저체중 | < 18.5 | 12.5 ~ 18.0 | 0.44 ~ 0.58 |
| 정상 | 18.5 ~ 24.9 | 11.5 ~ 16.0 | 0.35 ~ 0.50 |
| 과체중 | 25.0 ~ 29.9 | 7.0 ~ 11.5 | 0.23 ~ 0.33 |
| 비만 | >= 30.0 | 5.0 ~ 9.0 | 0.17 ~ 0.27 |

> 출처: Institute of Medicine (IOM), "Weight Gain During Pregnancy: Reexamining the Guidelines", 2009

#### 차트 시각화 변경

```
현재: 단순 라인 차트 + 참조선
목표:
┌──────────────────────────────────────┐
│  kg                                  │
│  80 ┤                          ●──●  │
│     │                     ●──●       │
│  75 ┤              ●──●──●    ░░░░░░ │ ← 권장 범위 상한
│     │         ●──●          ░░░░░░░░ │ ← 영역 그래프 (권장 범위)
│  70 ┤    ●──●               ░░░░░░░░ │
│     │ ●──●                   ░░░░░░░ │ ← 권장 범위 하한
│  65 ┤──────────────────────────────── │ ← 임신 전 체중 기준선
│     ├──┬──┬──┬──┬──┬──┬──┬──┬──┬──┤  │
│       4  8  12 16 20 24 28 32 36 40  │
│                    주차               │
├──────────────────────────────────────┤
│  BMI: 22.1 (정상) | 현재 +8.5kg     │
│  권장 범위: +11.5~16.0kg            │
│  남은 여유: +3.0~7.5kg              │
├──────────────────────────────────────┤
│  ⓘ IOM 2009 가이드라인 기준.         │
│    의학적 조언을 대체하지 않습니다.    │
│    정확한 체중 관리는 담당 의료진과    │
│    상담하세요.                        │
└──────────────────────────────────────┘
```

**변경 요소:**
- `LineChart` → `ComposedChart` (Line + Area 조합)
- `ReferenceArea`로 권장 범위 영역 표시 (반투명 초록)
- `ReferenceLine`으로 임신 전 체중 기준선 표시
- 커스텀 `Tooltip`: 날짜 + 체중 + 임신 전 대비 증가량 + 권장 범위 내 여부
- 하단 요약 통계 카드: BMI 분류, 현재 증가량, 권장 범위, 남은 여유

#### 임신 전 정보 입력 UI

```
┌──────────────────────────────────────┐
│  📏 임신 전 정보 (선택)               │
│                                      │
│  키: [___] cm    몸무게: [___] kg     │
│                                      │
│  BMI: 22.1 (정상체중)                 │
│  권장 체중 증가: 11.5 ~ 16.0 kg      │
│                          [저장]       │
└──────────────────────────────────────┘
```

- 입력하지 않아도 기존 단순 차트는 그대로 동작 (점진적 강화)
- 입력 시에만 BMI 계산 + 권장 범위 영역 표시 활성화
- localStorage에 저장, 한 번 입력하면 유지

### 1-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 사용자 가치 | 단순 기록 → 개인 맞춤 분석으로 도구 성격 전환. "내가 정상 범위인가?"에 답할 수 있음 |
| 리텐션 | 권장 범위 대비 위치가 보이면 주기적 재방문 동기 부여. 기록 누적 시 이탈 비용 상승 |
| AdSense 가치 | "가치 있는 도구 콘텐츠" 평가 — 단순 위젯 대비 승인 확률 상승 |
| SEO | "임신 BMI 체중 계산기" 키워드 진입 가능. 도구형 콘텐츠는 백링크 획득에 유리 |
| 차별화 | 대부분의 경쟁 앱은 단순 기록만 제공. 영역 그래프 + 권장 범위 시각화는 의료급 느낌 부여 |

#### 단점 / 리스크

| 관점 | 내용 |
|------|------|
| 개발 복잡도 | BMI 분류별 권장 범위 4벌 데이터 + 쌍둥이 임신은 별도 기준 필요 |
| 데이터 모델 변경 | `useWeightStore`에 `height`, `prePregnancyWeight` 추가 → 기존 사용자 마이그레이션 |
| 차트 복잡도 | Recharts Area + ReferenceLine + Tooltip 커스텀 → 모바일 터치 인터랙션 이슈 빈발 |
| 오류 해석 | 사용자가 "범위 밖" 시각적 피드백을 의학적 진단으로 오인할 수 있음 |

### 1-4. 법제/보안 이슈 — CRITICAL

| 이슈 | 심각도 | 상세 | 대응 |
|------|--------|------|------|
| **YMYL 의료정보 규제** | HIGH | BMI별 권장 체중 증가 범위는 의료 정보(YMYL). IOM/WHO 가이드라인 출처 명시 필수 | 차트 영역에 "IOM 2009 가이드라인 기준" + "의학적 조언을 대체하지 않습니다" 디스클레이머 직접 배치 |
| **개인 건강정보 처리** | HIGH | 키, 체중, BMI는 민감 건강정보. 현재 localStorage 전용이나 개인정보처리방침에 명시 필요 | 개인정보처리방침에 "건강 정보(키, 체중)는 사용자 기기에만 저장되며 서버로 전송되지 않습니다" 추가 |
| **의료기기법 저촉** | MEDIUM | "위험", "경고" 등 판단성 문구 사용 시 의료기기/건강관리 앱 규제 적용 가능 | "참고 범위"라는 중립적 표현 사용. 빨간색 경고 UI 회피 |
| **데이터 정확성 면책** | MEDIUM | 잘못된 키/체중 입력 → 잘못된 BMI → 잘못된 권장 범위 표시 | 입력값 범위 검증 강화 + "입력 정확도에 대한 책임은 사용자에게 있습니다" 면책 |

### 1-5. 선행 조건

- [ ] 의료 면책 프레임워크 확립: `MedicalDisclaimer.tsx` 확장하여 도구 페이지 전용 면책 문구 추가
- [ ] 개인정보처리방침 업데이트: 건강 정보 저장 관련 조항 추가
- [ ] IOM 2009 가이드라인 데이터 정리 (4분류 × 주차별 기대 범위)

### 1-6. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/store/useWeightStore.ts` | `WeightProfile` (height, prePregnancyWeight) 추가 + 마이그레이션 로직 |
| `src/lib/weight-guidelines.ts` | IOM 2009 BMI별 권장 범위 데이터 + BMI 계산 유틸 (신규) |
| `src/components/weight/WeightProfileForm.tsx` | 임신 전 키/체중 입력 폼 (신규) |
| `src/components/weight/WeightChart.tsx` | LineChart → ComposedChart, ReferenceArea 권장 범위, 커스텀 Tooltip |
| `src/components/weight/WeightSummary.tsx` | 요약 통계 카드 (BMI, 현재 증가량, 권장 범위, 남은 여유) (신규) |
| `src/components/weight/WeightDisclaimer.tsx` | 도구 전용 의료 면책 문구 (신규) |
| `src/components/weight/WeightContainer.tsx` | WeightProfileForm + WeightSummary + WeightDisclaimer 배치 |
| `src/app/privacy/page.tsx` | 건강 정보 저장 관련 조항 추가 |

### 1-7. 완료 조건

- [ ] 임신 전 키/체중 미입력 시 기존 단순 차트 동작 (하위 호환)
- [ ] 임신 전 정보 입력 시 BMI 자동 계산 + 분류 표시
- [ ] 차트에 BMI별 권장 범위 영역(Area) 표시
- [ ] 임신 전 체중 기준선(ReferenceLine) 표시
- [ ] Tooltip에 날짜 + 체중 + 증가량 + 범위 내 여부 표시
- [ ] 요약 통계 카드: BMI 분류, 현재 증가량, 권장 범위
- [ ] 의료 면책 문구가 차트 하단에 직접 표시
- [ ] 개인정보처리방침에 건강 정보 조항 추가
- [ ] 모바일에서 터치 인터랙션 정상 동작

---

## Step 2. 아티클 하단 관련 콘텐츠 추천

### 2-1. 문제 분석

아티클 상세 페이지(`/articles/[slug]`) 하단이 이탈 지점이다.
관련 콘텐츠 추천이 없어 사용자가 글을 다 읽은 후 서비스를 떠난다.

**현재 구현:**
- `ArticleDetail.tsx`: 본문 + MedicalDisclaimer + TimelineCTA만 존재
- 아티클 메타에 `tags: string[]` 필드 존재 → 태그 기반 매칭 가능
- `getAllArticles()`로 전체 아티클 접근 가능
- 현재 7개 아티클, 목표 15개+

### 2-2. 설계

#### 추천 알고리즘

```ts
function getRelatedContent(currentArticle: ArticleMeta, allArticles: ArticleMeta[]): RelatedItem[] {
  // 1. 태그 겹침 기반 점수 계산 (Jaccard 유사도)
  const scored = allArticles
    .filter(a => a.slug !== currentArticle.slug)
    .map(a => ({
      article: a,
      score: intersect(currentArticle.tags, a.tags).length / union(currentArticle.tags, a.tags).length,
    }))
    .sort((a, b) => b.score - a.score);

  // 2. 태그 겹침 1개 이상인 글 우선
  const related = scored.filter(s => s.score > 0).slice(0, 3);

  // 3. 부족하면 최신 글로 보충
  if (related.length < 3) {
    const remaining = allArticles
      .filter(a => a.slug !== currentArticle.slug && !related.find(r => r.article.slug === a.slug))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    related.push(...remaining.slice(0, 3 - related.length).map(a => ({ article: a, score: 0 })));
  }

  return related.map(r => r.article);
}
```

#### 크로스 모듈 추천 (Phase 4.2에서 확장)

현재 `linked_timeline_weeks`와 `linked_video_ids`를 활용한 역방향 참조:
- 아티클의 `linked_timeline_weeks` → 해당 주차 타임라인 카드 추천
- 타임라인에서 같은 `linked_article_slugs`를 공유하는 영상 → 관련 영상 추천

#### UI 레이아웃

```
┌─────────────────────────────────────────┐
│  📰 관련 콘텐츠                          │
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 출산 가방 │ │ 산후조리 │ │ 임신 검사 │ │
│  │ 준비물   │ │ 가이드   │ │ 일정     │ │
│  │ 총정리   │ │          │ │          │ │
│  │          │ │          │ │          │ │
│  │ #출산준비│ │ #산후조리│ │ #검사    │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                         │
│  📅 관련 타임라인                        │
│  ├─ 32주: 입원 가방 준비 시작 →          │
│                                         │
│  🎬 관련 영상                            │
│  ├─ [영상 제목] →                        │
└─────────────────────────────────────────┘
```

### 2-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 페이지뷰 증가 | 글 하단 이탈 지점에 관련 콘텐츠 → 평균 2~3 추가 페이지뷰 기대. AdSense 수익 직결 |
| 탐색 흐름 유지 | "출산 가방" 글 → 관련 영상 → 타임라인 32주 → 체크리스트 완성. 자연스러운 여정 |
| 크로스 모듈 연결 | 글뿐 아니라 타임라인/영상까지 추천하면 서비스 전체 인지도 상승 |
| AdSense 품질 신호 | 내부 링크 밀도 ↑ = 심사봇이 "잘 구조화된 사이트"로 판단 |
| 구현 단순성 | `getAllArticles()`로 전체 접근 가능, 태그 겹침 계산은 순수 연산. 별도 API/DB 불필요 |

#### 단점 / 리스크

| 관점 | 내용 |
|------|------|
| 콘텐츠 양 부족 | 현재 7개 아티클. 같은 태그 공유 글이 2개 이하인 경우 다수 → 최신 글 fallback 의존 |
| 타임라인/영상 매칭 | 아티클 태그 ↔ 타임라인/영상 매칭 기준 불명확. 수동 매핑 또는 키워드 매칭 필요 |
| UX 잡음 | 관련도 낮은 콘텐츠 추천 시 오히려 신뢰도 저하 |

### 2-4. 법제/보안 이슈

| 이슈 | 심각도 | 상세 |
|------|--------|------|
| 추적 우려 | LOW | 추천 로직이 태그 기반(정적). 사용자 행동 데이터 미사용. 개인정보 이슈 없음 |
| 콘텐츠 책임 | LOW | 자사 콘텐츠 간 연결. 외부 링크 문제 없음 |

### 2-5. 단계적 구현 전략

**Phase 4.1 (즉시):**
- 같은 모듈 (글→글) 태그 기반 추천. `min 1 tag overlap || 최신 2개 보충`
- `RelatedArticles` 컴포넌트

**Phase 4.2 (콘텐츠 15개+ 이후):**
- 크로스 모듈 (글→영상, 글→타임라인) 추천 추가
- `linked_timeline_weeks` 역방향 참조 활용
- `RelatedContent` 컴포넌트 (아티클 + 타임라인 + 영상 통합)

### 2-6. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/related-content.ts` | 태그 기반 관련 콘텐츠 추천 로직 (신규) |
| `src/components/articles/RelatedArticles.tsx` | 관련 글 카드 3개 리스트 (신규) |
| `src/components/articles/RelatedContent.tsx` | 관련 타임라인 + 영상 링크 (Phase 4.2, 신규) |
| `src/components/articles/ArticleDetail.tsx` | 하단에 RelatedArticles 배치 |
| `src/app/articles/[slug]/page.tsx` | `allArticles` 전달 |

### 2-7. 완료 조건

- [ ] 아티클 상세 하단에 관련 글 최대 3개 표시
- [ ] 태그 겹침 1개+ 글 우선, 부족 시 최신 글 보충
- [ ] 현재 글은 추천 목록에서 제외
- [ ] 카드 클릭 시 해당 아티클로 정상 이동
- [ ] 아티클이 1개일 때도 에러 없이 빈 상태 처리
- [ ] (Phase 4.2) 관련 타임라인/영상 링크 표시

---

## Step 3. 공유 기능

### 3-1. 문제 분석

공유 기능이 전무하다. `navigator.share`, `navigator.clipboard` 사용 흔적 없음.
임산부 커뮤니티(맘카페, 단톡방)에서의 링크 공유가 핵심 성장 채널인데, 공유 버튼 없이 URL 직접 복사는 마찰이 크다.

### 3-2. 설계

#### 공유 전략: 디바이스별 분기

```ts
function handleShare(data: ShareData) {
  // 1순위: Web Share API (모바일 네이티브 시트)
  if (navigator.share) {
    navigator.share(data);
    return;
  }
  // 2순위: 커스텀 공유 모달 (데스크톱 fallback)
  openShareModal(data);
}
```

#### Web Share API (모바일 우선)

- iOS Safari, Android Chrome 완전 지원
- OS 네이티브 공유 시트 → 카카오톡, 메시지, AirDrop 등 모든 채널 자동 커버
- 추가 SDK 없이 동작

```ts
await navigator.share({
  title: article.title,
  text: article.description,
  url: `https://pregnancy-checklist.com/articles/${article.slug}`,
});
```

#### 커스텀 공유 모달 (데스크톱 fallback)

```
┌──────────────────────────────┐
│  공유하기                 ✕  │
│                              │
│  🔗 링크 복사                │
│  💬 카카오톡으로 공유         │
│                              │
└──────────────────────────────┘
```

**링크 복사:**
```ts
await navigator.clipboard.writeText(url);
// 토스트: "링크가 복사되었습니다"
```

**카카오톡 공유 (데스크톱 전용 fallback):**
- Kakao JavaScript SDK 로드 (조건부 — 데스크톱이면서 Web Share API 미지원 시만)
- `Kakao.Share.sendDefault()` 호출
- OG 메타 태그 기반 프리뷰 자동 생성

#### 공유 버튼 배치 위치

| 페이지 | 위치 | 공유 데이터 |
|--------|------|-----------|
| 아티클 상세 | 본문 상단 + 하단 (플로팅 또는 인라인) | 아티클 제목 + 설명 + URL |
| 타임라인 | 개별 주차 카드 (옵션) | "임신 N주 준비 체크리스트" + URL |
| 체중 차트 | 요약 통계 옆 (Phase 4.2) | "임신 체중 관리 도구" + URL |

#### GA4 이벤트

```ts
sendGAEvent('share', {
  method: 'web_share_api' | 'clipboard' | 'kakao',
  content_type: 'article' | 'timeline' | 'weight',
  item_id: slug,
});
```

#### OG 메타 태그 정비

```tsx
// src/app/articles/[slug]/page.tsx — generateMetadata
export async function generateMetadata({ params }) {
  const article = getArticleBySlug(params.slug);
  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://pregnancy-checklist.com/articles/${article.slug}`,
      type: 'article',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  };
}
```

### 3-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 바이럴 성장 | 맘카페/단톡방 링크 공유 = 핵심 성장 채널. 공유 버튼이 마찰을 제거 |
| 트래픽 소스 다변화 | 카카오톡 공유 → 리퍼럴 트래픽 → AdSense 노출 증가 |
| 신뢰도 | "친구가 보내준 링크"는 검색 유입 대비 전환/체류 2~3배 |
| Web Share API | 모바일에서 OS 네이티브 시트 → 모든 채널 한 번에 커버 |
| 구현 난이도 | Web Share API + Clipboard API 조합으로 비교적 단순 |

#### 단점 / 리스크

| 관점 | 내용 |
|------|------|
| 카카오 SDK 의존성 | ~100KB, 성능 영향 + 카카오 개발자 등록 필요 |
| OG 태그 정비 | 공유 프리뷰가 제대로 나오려면 각 페이지별 OG 메타 설정 필요 |
| Web Share API 호환성 | 데스크톱 Chrome 부분 지원. fallback UI 필수 |
| UX 분기 | 디바이스별 다른 UI 노출 → 테스트 매트릭스 증가 |

### 3-4. 법제/보안 이슈

| 이슈 | 심각도 | 상세 | 대응 |
|------|--------|------|------|
| **카카오 SDK 개인정보** | MEDIUM | 카카오 SDK가 기기 정보를 수집할 수 있음 | `ConsentGatedScripts.tsx`에 카카오 SDK 포함 여부 검토. 또는 Web Share API로 대체하여 SDK 의존성 제거 |
| **카카오 개발자 약관** | LOW | 앱 등록 + 도메인 등록 필요. 상업적 이용 시 정책 확인 | 카카오 Developer 약관 검토 후 등록 |
| **Clipboard API 권한** | LOW | 사용자 제스처(클릭) 컨텍스트에서만 동작. 보안 이슈 없음 | 클릭 핸들러 내에서만 호출 |

### 3-5. 단계적 구현 전략

1. **즉시**: `navigator.clipboard` URL 복사 + 토스트 알림 (의존성 없음)
2. **즉시**: `navigator.share` Web Share API (모바일 네이티브 시트)
3. **OG 태그 정비 후**: 카카오 SDK 연동 (데스크톱 fallback)

> 실질적으로 모바일 사용자가 80%+이므로, Web Share API만으로 카카오톡/메시지/기타 앱 공유 모두 가능.
> 카카오 SDK는 데스크톱 사용자를 위한 보조 수단으로 후순위.

### 3-6. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/share/ShareButton.tsx` | 공유 버튼 (Web Share API → Clipboard fallback) (신규) |
| `src/components/share/ShareModal.tsx` | 데스크톱용 공유 모달 (링크 복사 + 카카오) (신규) |
| `src/lib/share.ts` | 공유 유틸 함수 + GA4 이벤트 (신규) |
| `src/components/articles/ArticleDetail.tsx` | ShareButton 배치 |
| `src/app/articles/[slug]/page.tsx` | OG 메타 태그 보강 (generateMetadata) |
| `src/app/layout.tsx` | 카카오 SDK 조건부 로드 (Phase 4.2) |

### 3-7. 완료 조건

- [ ] 아티클 상세 페이지에 공유 버튼 노출
- [ ] 모바일: Web Share API로 OS 네이티브 공유 시트 표시
- [ ] 데스크톱: 커스텀 모달 (링크 복사)
- [ ] 링크 복사 시 토스트 알림 "링크가 복사되었습니다"
- [ ] GA4 `share` 이벤트 전송 (method, content_type, item_id)
- [ ] OG 메타 태그로 공유 프리뷰 정상 표시
- [ ] (Phase 4.2) 카카오톡 공유 (데스크톱 fallback)

---

## Step 4. 크로스링크 영역 확장

### 4-1. 문제 분석

현재 크로스링크 현황:

| 연결 | 방향 | 상태 |
|------|------|------|
| 타임라인 → 아티클 | → | ✅ `linked_article_slugs` |
| 아티클 → 타임라인 | → | ✅ `linked_timeline_weeks` |
| 타임라인 → 영상 | → | ✅ `linked_video_ids` (Phase 3) |
| 영상 → 타임라인 | ← | ❌ 없음 |
| 영상 ↔ 블로그 | ↔ | ❌ 없음 |
| 블로그 → 영상 | → | ❌ 없음 |
| 베이비페어 ↔ 전체 | ↔ | ❌ 완전 고립 |

### 4-2. 설계

#### 데이터 모델 확장

```ts
// src/types/video.ts (기존 VideoItem 확장)
type VideoItem = {
  // ... 기존 필드
  linked_timeline_weeks?: number[];    // 신규 — 역방향 참조
  linked_article_slugs?: string[];     // 신규
};

// src/types/babyfair.ts (기존 BabyfairEvent 확장)
type BabyfairEvent = {
  // ... 기존 필드
  linked_timeline_weeks?: number[];    // 신규 — "출산 준비 시기에 열리는 행사"
  linked_article_slugs?: string[];     // 신규
};

// src/types/article.ts (기존 ArticleMeta 확장)
type ArticleMeta = {
  // ... 기존 필드
  linked_video_ids?: string[];         // 신규
};
```

#### 연결 매핑 전략

| 연결 | 매칭 기준 | 예시 |
|------|----------|------|
| 영상 → 타임라인 | `linked_video_ids`의 역참조 | 타임라인 32주에 video_017 → video_017 카드에 "32주" 표시 |
| 영상 ↔ 블로그 | 키워드/태그 매칭 | "체중 관리" 영상 → pregnancy-weight-management 아티클 |
| 블로그 → 영상 | 아티클 태그 ↔ 영상 카테고리 매칭 | "출산준비" 태그 아티클 → "출산 준비" 카테고리 영상 |
| 베이비페어 → 타임라인 | 주차 범위 (28~36주) | 베이비페어는 출산 준비 시기(28주+) 타임라인과 연결 |
| 베이비페어 → 블로그 | 태그 "출산준비", "아기용품" | 베이비페어 → baby-items-cost 아티클 |

#### UI 변경

**영상 카드 하단:**
```
┌─────────────────────────────────────────┐
│  🎬 [영상 제목]                          │
│  [영상 설명...]                          │
│  ───────────────────────────────────────│
│  📅 관련 주차: 32주 →                    │  ← 신규
│  📰 관련 글: 출산 가방 준비물 총정리 →    │  ← 신규
└─────────────────────────────────────────┘
```

**베이비페어 카드 하단:**
```
┌─────────────────────────────────────────┐
│  🎪 [베이비페어 이름]                    │
│  [일정, 장소...]                        │
│  ───────────────────────────────────────│
│  📅 관련 준비: 28~36주 타임라인 →        │  ← 신규
│  📰 관련 글: 아기 용품 비용 총정리 →      │  ← 신규
└─────────────────────────────────────────┘
```

### 4-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 내부 링크 밀도 | AdSense "잘 구조화된 사이트" 판정. 모든 페이지 3+ 내부 링크 |
| 콘텐츠 발견성 | 영상 → 타임라인 → 체크리스트 사용 → 리텐션 |
| 베이비페어 가치 상승 | 고립된 모듈에서 탈출. "32주 입원 가방 → 베이비페어 할인 구매" 여정 |
| SEO 크롤 효율 | 양방향 링크로 크롤러가 모든 페이지 효율적 발견 |
| 체류 시간 | 크로스 모듈 이동 ↑ → 세션 체류 ↑ → AdSense 단가 ↑ |

#### 단점 / 리스크

| 관점 | 내용 |
|------|------|
| 매핑 유지 비용 | 양방향 N×M 조합 → 수동 관리 불가능. Step 5 스크립트와 함께 진행 필수 |
| 데이터 모델 확장 | `videos.json`, `babyfair_events.json`, 아티클 front matter 모두 변경 |
| 베이비페어 매칭 난이도 | 이벤트 성격(날짜 한정)이라 콘텐츠와 연결이 부자연스러울 수 있음 |
| UI 과밀 | 카드 하단에 여러 종류 링크가 나오면 정보 과잉 |
| 역방향 일관성 | A→B 있으면 B→A도 필요. 수동 관리 시 불일치 발생 |

### 4-4. 법제/보안 이슈

| 이슈 | 심각도 | 상세 | 대응 |
|------|--------|------|------|
| **유튜브 썸네일 저작권** | MEDIUM | 유튜브 영상 링크는 허용. 썸네일 자체 서버 캐싱은 저작권 이슈 | `img.youtube.com` 직접 참조 또는 YouTube oEmbed API 사용 |
| **베이비페어 정보 정확성** | MEDIUM | 종료/취소된 베이비페어 링크가 남으면 사용자 혼란 | 종료 이벤트에 대한 링크 자동 비활성화 로직 |
| **외부 링크 책임** | LOW | 베이비페어 URL이 외부 사이트로 이동 | `rel="noopener noreferrer"` 적용 |

### 4-5. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/video.ts` | `linked_timeline_weeks`, `linked_article_slugs` 추가 |
| `src/types/babyfair.ts` | `linked_timeline_weeks`, `linked_article_slugs` 추가 |
| `src/types/article.ts` | `linked_video_ids` 추가 |
| `src/data/videos.json` | 주요 영상에 매핑 데이터 추가 (스크립트 생성) |
| `src/data/babyfair_events.json` | 베이비페어에 매핑 데이터 추가 |
| `src/content/articles/*.md` | front matter에 `linked_video_ids` 추가 |
| `src/components/videos/VideoCard.tsx` | 관련 타임라인/아티클 링크 표시 |
| `src/components/babyfair/BabyfairCard.tsx` | 관련 타임라인/아티클 링크 표시 |

### 4-6. 완료 조건

- [ ] 영상 카드에서 관련 타임라인 주차 링크 노출
- [ ] 영상 카드에서 관련 아티클 링크 노출
- [ ] 베이비페어 카드에서 관련 타임라인/아티클 링크 노출
- [ ] 아티클에서 관련 영상 링크 노출
- [ ] 종료된 베이비페어의 크로스링크 비활성화
- [ ] 모든 크로스링크 클릭 시 정상 이동

---

## Step 5. 크로스링크 자동 생성 스크립트

### 5-1. 문제 분석

모든 크로스링크가 수동 관리 상태:
- `timeline_items.json`의 `linked_article_slugs`, `linked_video_ids`
- 아티클 front matter의 `linked_timeline_weeks`
- 컴포넌트 하드코딩 (체중→아티클)

콘텐츠가 15개+로 증가하면 N×M 조합의 수동 매핑은 유지 불가능.

### 5-2. 설계

#### 스크립트 구조

```
scripts/generate-crosslinks.ts

입력:
  - src/data/timeline_items.json
  - src/data/videos.json
  - src/data/babyfair_events.json
  - src/content/articles/*.md (front matter)

처리:
  1. 모든 콘텐츠의 메타데이터 수집 (제목, 태그, 키워드)
  2. 콘텐츠 간 관련도 계산 (태그 Jaccard 유사도 + 키워드 TF-IDF)
  3. 임계값 이상인 쌍에 대해 양방향 링크 생성
  4. 기존 수동 매핑(manual: true) 보호
  5. 변경 사항 출력 또는 적용

출력:
  - timeline_items.json 갱신 (linked_article_slugs, linked_video_ids)
  - videos.json 갱신 (linked_timeline_weeks, linked_article_slugs)
  - babyfair_events.json 갱신 (linked_timeline_weeks, linked_article_slugs)
  - articles/*.md front matter 갱신 (linked_video_ids)
```

#### 매칭 알고리즘

```ts
// 1단계: 태그 기반 Jaccard 유사도
function jaccardSimilarity(tagsA: string[], tagsB: string[]): number {
  const intersection = tagsA.filter(t => tagsB.includes(t)).length;
  const union = new Set([...tagsA, ...tagsB]).size;
  return union === 0 ? 0 : intersection / union;
}

// 2단계: 키워드 매칭 (제목 + 설명에서 추출)
function keywordOverlap(textA: string, textB: string): number {
  const wordsA = extractKeywords(textA);
  const wordsB = extractKeywords(textB);
  return jaccardSimilarity(wordsA, wordsB);
}

// 3단계: 복합 점수
function relevanceScore(itemA, itemB): number {
  return jaccardSimilarity(itemA.tags, itemB.tags) * 0.6
       + keywordOverlap(itemA.title + itemA.description, itemB.title + itemB.description) * 0.4;
}

// 임계값: 0.2 이상이면 연결
const THRESHOLD = 0.2;
```

#### 수동 매핑 보호

```json
// timeline_items.json
{
  "week": 32,
  "linked_article_slugs": ["hospital-bag"],
  "linked_article_slugs_manual": true,  // ← 스크립트가 이 필드를 건드리지 않음
  "linked_video_ids": ["video_017"]
}
```

- `*_manual: true` 플래그가 있는 필드는 스크립트가 덮어쓰지 않음
- 스크립트가 생성한 매핑에는 `*_manual` 플래그 없음 (다음 실행 시 재계산)

#### 실행 모드

```bash
# 드라이런: 변경 사항만 출력, 파일 수정 없음
npx tsx scripts/generate-crosslinks.ts --dry-run

# 적용: 파일에 실제 반영
npx tsx scripts/generate-crosslinks.ts --apply

# 리포트: 현재 크로스링크 상태 요약
npx tsx scripts/generate-crosslinks.ts --report

# 강제: manual 매핑도 재계산 (주의)
npx tsx scripts/generate-crosslinks.ts --apply --force
```

#### 실행 빈도

- **정기**: 주 1회 (콘텐츠 추가 빈도가 주 1~2회이므로)
- **수동**: 콘텐츠 대량 추가 후 즉시 실행 가능
- **CI 연동 (선택)**: PR 머지 후 자동 실행 → 변경 있으면 자동 커밋 또는 PR 생성

### 5-3. 장단점 분석

#### 장점

| 관점 | 내용 |
|------|------|
| 운영 효율 | 콘텐츠 추가 → 스크립트 실행 → 관련 링크 자동 생성. 수동 매핑 불필요 |
| 일관성 | 누락/불일치 방지. 양방향 대칭성 보장 |
| 확장성 | 콘텐츠 50, 100개에서도 O(1) 운영 비용 |
| 품질 | 일관된 기준으로 관련도 판단. 사람 주관보다 균일 |
| CI/CD 연동 | 커밋 → 빌드 → 크로스링크 갱신 → 배포 원스텝 가능 |

#### 단점 / 리스크

| 관점 | 내용 |
|------|------|
| 매칭 품질 | 태그 겹침만으로 관련도 부족할 수 있음. "임신" 공통 태그로 모든 글 연결 문제 |
| 오버라이드 | 자동 생성이 수동 큐레이션을 덮어쓰면 문제 → `manual` 플래그 보호 필수 |
| 스크립트 복잡도 | 4모듈 × 양방향 = 12가지 조합. 알고리즘 설계 + 테스트 필요 |
| Git diff 노이즈 | 매주 JSON 변경 → 코드 리뷰 diff 증가 |

### 5-4. 법제/보안 이슈

| 이슈 | 심각도 | 상세 | 대응 |
|------|--------|------|------|
| **데이터 무결성** | MEDIUM | 잘못된 매핑 → 오정보 제공 | `--dry-run` 모드 + 변경 사항 프리뷰 필수 |
| **깨진 링크** | LOW | 삭제된 콘텐츠에 대한 링크 잔존 → 404 | 스크립트에서 콘텐츠 존재 확인(validation) 로직 포함 |

### 5-5. 구현 계획

| 파일 | 변경 내용 |
|------|-----------|
| `scripts/generate-crosslinks.ts` | 메인 스크립트 (신규) |
| `src/lib/crosslink-utils.ts` | 매칭 알고리즘 공유 유틸 (빌드 타임 + 스크립트 공용) (신규) |
| `package.json` | `"crosslinks": "tsx scripts/generate-crosslinks.ts"` 스크립트 추가 |

### 5-6. 완료 조건

- [ ] `--dry-run` 모드에서 변경 예정 사항이 정상 출력
- [ ] `--apply` 모드에서 JSON/front matter 파일 정상 갱신
- [ ] `--report` 모드에서 현재 크로스링크 통계 출력
- [ ] `*_manual: true` 매핑이 보호됨 (덮어쓰기 안 됨)
- [ ] 존재하지 않는 콘텐츠에 대한 링크가 생성되지 않음
- [ ] 실행 후 `npm run build` 성공
- [ ] 변경된 크로스링크가 UI에 정상 반영

---

## 종합 우선순위 매트릭스

| 기능 | 사용자 가치 | AdSense 영향 | 구현 비용 | 법적 리스크 | 추천 순위 |
|------|-----------|-------------|----------|-----------|----------|
| **Step 2. 관련 콘텐츠 추천** | ★★★★ | ★★★★★ | ★★☆ (Low) | ★☆ (Low) | **1순위** |
| **Step 5. 크로스링크 스크립트** | ★★★ | ★★★★ | ★★★ (Med) | ★☆ (Low) | **2순위** |
| **Step 3. 공유 기능** | ★★★★★ | ★★★ | ★★☆ (Low) | ★★ (Med) | **3순위** |
| **Step 4. 크로스링크 확장** | ★★★ | ★★★★ | ★★★★ (High) | ★★ (Med) | **4순위** |
| **Step 1. 체중 차트 강화** | ★★★★ | ★★★ | ★★★★ (High) | ★★★★ (High) | **5순위** |

---

## 일정 계획

| 주차 | 기간 | 개발 작업 | 비고 |
|------|------|----------|------|
| W1 | 4/21~4/27 | Step 2 (관련 콘텐츠 추천) + Step 3 (공유 기능) | 독립 작업, 병렬 가능 |
| W2 | 4/28~5/04 | Step 5 (크로스링크 스크립트) + Step 4 데이터 모델 설계 | 스크립트 기반 완성 |
| W3 | 5/05~5/11 | Step 4 (크로스링크 확장) + Step 1 선행 조건 (면책 프레임워크) | |
| W4 | 5/12~5/15 | Step 1 (체중 차트 강화) + QA | |

### 마일스톤

| 마일스톤 | 완료 기준 | 목표일 |
|---------|----------|--------|
| M4-A: 콘텐츠 네트워크 | 관련 콘텐츠 추천 + 공유 기능 | 4/27 |
| M4-B: 크로스링크 자동화 | 스크립트 완성 + 크로스링크 확장 | 5/11 |
| M4-C: 도구 고도화 | 체중 차트 BMI 시각화 + 면책 프레임워크 | 5/15 |

---

## QA 체크리스트

### 체중 차트

- [ ] 임신 전 정보 미입력 시 기존 차트 동작 (하위 호환)
- [ ] BMI별 권장 범위 영역 정상 표시
- [ ] 모바일 터치 인터랙션 정상
- [ ] 의료 면책 문구 차트 하단 표시
- [ ] 개인정보처리방침 업데이트 확인

### 관련 콘텐츠 추천

- [ ] 아티클 하단에 관련 글 3개 표시
- [ ] 태그 겹침 우선 + 최신 글 보충 정상 동작
- [ ] 아티클 1개일 때 에러 없음

### 공유 기능

- [ ] 모바일: Web Share API 네이티브 시트 표시
- [ ] 데스크톱: 링크 복사 + 토스트 알림
- [ ] OG 메타 태그 프리뷰 정상
- [ ] GA4 `share` 이벤트 전송

### 크로스링크

- [ ] 영상 → 타임라인/아티클 링크 노출
- [ ] 베이비페어 → 타임라인/아티클 링크 노출
- [ ] 종료된 베이비페어 링크 비활성화
- [ ] 모든 링크 클릭 시 정상 이동

### 크로스링크 스크립트

- [ ] `--dry-run` 변경 예정 사항 출력
- [ ] `--apply` 파일 정상 갱신
- [ ] `manual` 매핑 보호 확인
- [ ] 실행 후 `npm run build` 성공

### 빌드 & 배포

- [ ] `npm run build` 성공
- [ ] 기존 E2E 테스트 전체 통과
- [ ] 신규 기능 E2E 테스트 추가 및 통과
