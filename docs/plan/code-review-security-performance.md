# 코드 리뷰: 보안 & 성능 분석

> 대상: Next.js 16 + React 19 정적 export 사이트 (GitHub Pages 배포)
> 리뷰 일자: 2026-04-13
> 브랜치: feat/phase-3

---

## 1. 보안 (Security)

### [MEDIUM] `dangerouslySetInnerHTML` — XSS 잠재 위험

`src/components/articles/ArticleDetail.tsx:62`

```tsx
<div
  className="article-prose"
  dangerouslySetInnerHTML={{ __html: article.content }}
/>
```

현재 소스는 로컬 마크다운 파일이라 즉시 위험은 낮다. 그러나 `remark-html`은 **sanitizer가 아니다**. 마크다운 안에 `<script>`, `<iframe>`, `<img onerror>` 같은 raw HTML이 들어가면 그대로 렌더링된다.

- Phase 4에서 GCP 연동이나 외부 CMS로 전환 시 **즉시 취약점**으로 변함
- **권장**: `rehype-sanitize` 추가 (remark 파이프라인에 자연스럽게 통합됨)

```ts
// articles.ts
import rehypeSanitize from 'rehype-sanitize';
// remark().use(remarkGfm).use(html) 대신
// remark().use(remarkGfm).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify)
```

---

### [MEDIUM] `data-source.ts` — Path Traversal 잠재 위험

`src/lib/data-source.ts:10`

```ts
async function fetchFromLocal<T>(path: string): Promise<T> {
  const filePath = `${process.cwd()}/src/data/${path}`;
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}
```

`path` 파라미터에 `../../etc/passwd` 같은 값이 들어오면 임의 파일을 읽을 수 있다. 현재는 빌드타임 전용이지만, Phase 4에서 서버 모드 전환 시 위험하다.

- **권장**: `path.resolve()` 후 prefix 체크, 또는 허용 파일명 화이트리스트

---

### [LOW] `JSON.parse` 무방비 사용

`src/components/home/HomeContent.tsx:57`

```ts
const checkedCount = JSON.parse(
  localStorage.getItem("checklist-storage") || "{}"
).state?.checkedIds?.length;
```

`localStorage`에 오염된 JSON이 들어있으면 `JSON.parse`가 예외를 던진다. 바깥의 try-catch가 잡아주고 있지만, optional chaining 전에 파싱이 터지면 이후 로직(`last-visit-date` 저장 등)이 실행되지 않는다.

- **권장**: `JSON.parse`도 별도 try-catch로 감싸거나, Zustand store에서 직접 값을 읽기

---

### [LOW] 체중 입력 유효성 검증 부재

`src/components/weight/WeightForm.tsx:17-18`

```ts
if (!newDate || !newWeight) return;
onSubmit(newDate, parseFloat(newWeight));
```

- `parseFloat("abc")` → `NaN`이 store에 저장됨
- `parseFloat("-500")` → 음수 체중 저장 가능
- 미래 날짜 입력도 차단 없음
- **권장**: `isNaN` 체크 + 범위 검증 (예: 30~200kg)

---

### [INFO] 보안적으로 잘 된 부분

| 항목 | 평가 |
|------|------|
| localStorage try-catch 처리 | 시크릿 모드 대응 잘 됨 |
| 서버 통신 없음 (정적 사이트) | CSRF, SSRF 위험 원천 차단 |
| 환경변수가 모두 `NEXT_PUBLIC_` prefix | 서버 시크릿 노출 없음 |
| GA/AdSense 조건부 로딩 | 환경변수 없으면 안전하게 skip |
| 사용자 PII 미수집 | 출산예정일/체중만 로컬 저장, 서버 전송 없음 |

---

## 2. 성능 (Performance)

### [HIGH] Recharts 번들 크기 — 약 450KB

`src/components/weight/WeightChart.tsx:1-10`

```ts
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
```

`recharts`는 tree-shaking이 제한적인 라이브러리다. `/weight` 페이지에서만 사용되는데, 정적 export 모드에서는 코드 스플리팅이 페이지 단위로 되긴 하지만, `WeightContainer`가 `WeightChart`를 static import하고 있어 해당 페이지 진입 시 즉시 450KB를 로드한다.

- **권장**: `next/dynamic`으로 lazy load

```tsx
// WeightContainer.tsx
import dynamic from "next/dynamic";
const WeightChart = dynamic(() =>
  import("./WeightChart").then(m => ({ default: m.WeightChart })),
  { ssr: false }
);
```

---

### [MEDIUM] `chartData` 매 렌더마다 재계산

`src/components/weight/WeightContainer.tsx:30-33`

```ts
const chartData = entries.map((e) => ({
  date: format(parseISO(e.date), "MM/dd", { locale: ko }),
  weight: e.weight,
}));
```

`entries`가 변하지 않아도 컴포넌트가 리렌더될 때마다 `parseISO` + `format`이 전체 배열에 대해 실행된다.

- **권장**: `useMemo`로 감싸기

```ts
const chartData = useMemo(() =>
  entries.map((e) => ({
    date: format(parseISO(e.date), "MM/dd", { locale: ko }),
    weight: e.weight,
  })),
  [entries]
);
```

---

### [MEDIUM] Zustand store 내 정렬이 매 추가마다 실행

`src/store/useWeightStore.ts:22-24`

```ts
addLog: (log) =>
  set((state) => ({
    logs: [...state.logs, log].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  })),
```

매번 `new Date()` 생성 + 전체 배열 sort. 데이터가 소량이라 당장 문제는 아니지만, `Date` 생성자는 비용이 있고 이미 정렬된 배열에 삽입 정렬이 더 효율적이다.

- **권장**: 삽입 위치를 찾아서 splice하거나, 최소한 sort 비교함수에서 string 비교 사용 (`a.date.localeCompare(b.date)`)

---

### [MEDIUM] `images: { unoptimized: true }`

`next.config.ts:7`

GitHub Pages 배포 특성상 불가피하지만, 이미지 최적화가 전혀 없다.

- WebP 변환 없음, responsive srcset 없음, lazy loading은 Next.js Image 기본값으로 동작
- **권장**: 빌드타임에 `sharp`로 WebP 변환하는 스크립트 추가하거나, Cloudflare Pages 등 edge 최적화가 가능한 호스팅으로 전환 검토

---

### [LOW] `HomeContent`의 과도한 useMemo 체인

`src/components/home/HomeContent.tsx:85-151`

7개의 `useMemo`가 체인으로 연결되어 있다. 각각은 올바르지만, `currentWeek` → `thisWeekChecklist` → `thisWeekUnchecked` 순서로 의존성이 전파되어 디버깅이 어렵다.

- 현재 규모에서는 문제 없으나, 향후 확장 시 커스텀 훅으로 추출 고려

---

### [LOW] Poppins 폰트 weight 5개 로드

`src/app/layout.tsx:11-15`

```ts
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
```

한국어 사이트에서 Latin 서브셋 5개 weight 모두 로드하고 있다. 실제 사용 weight를 확인해서 줄이면 폰트 로딩 시간을 절약할 수 있다.

---

### [INFO] 성능적으로 잘 된 부분

| 항목 | 평가 |
|------|------|
| 정적 export (SSG) | TTFB 최소화, CDN 캐싱 최적 |
| `generateStaticParams` 사용 | 아티클 페이지 빌드타임 렌더링 |
| Hydration 패턴 (`hydrated` state) | SSR/CSR 불일치 방지 잘 처리됨 |
| `font-display: swap` | FOIT 방지 |
| Lucide React 아이콘 | SVG 기반, 번들에 미치는 영향 최소 |
| JSON 빌드타임 import | 런타임 fetch 없이 데이터 로드 |

---

## 3. 요약 우선순위 매트릭스

| 우선순위 | 이슈 | 분류 | 난이도 |
|---------|------|------|--------|
| 1 | `dangerouslySetInnerHTML` sanitize 추가 | 보안 | 낮음 |
| 2 | Recharts dynamic import | 성능 | 낮음 |
| 3 | `data-source.ts` path traversal 방어 | 보안 | 낮음 |
| 4 | WeightForm 입력 검증 강화 | 보안 | 낮음 |
| 5 | chartData `useMemo` 적용 | 성능 | 낮음 |
| 6 | WeightStore sort 최적화 | 성능 | 낮음 |
| 7 | Poppins font weight 정리 | 성능 | 낮음 |

전반적으로 정적 사이트 + 로컬 데이터 아키텍처 덕분에 보안 공격 표면이 매우 작고, 코드 품질도 좋다. 위 이슈 중 1~4번은 Phase 4(GCP 전환) 전에 선제적으로 처리하면 좋겠다.
