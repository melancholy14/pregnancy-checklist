# Baby Fair Crawler Spec

Version: 0.2  
Target reader: Codex / AI coding agent / backend engineer / ops

이 문서는 한국 베이비페어 데이터를 수집·정규화·저장하는 크롤링 구조를 정의한다.

중요 원칙:
- **공식 페이지 우선**
- 비공식 집계 사이트는 fallback 또는 운영 검수용 보조 소스로만 사용
- crawler 결과를 바로 publish하지 않고 `review_status`를 둔다

---

## 1. Goals

1. 연도별 베이비페어 일정을 수집한다.
2. 공식 URL, 장소, 도시, 일정을 정규화한다.
3. 중복 이벤트를 병합한다.
4. 관리자 검수 후 공개한다.

---

## 2. Source Priority

### Tier 1: Official sources
1. COEX 행사 페이지
2. COEX Magok 행사 페이지
3. 베페 공식 모바일/웹 페이지
4. 코베 공식 페이지
5. 베베페어 공식 페이지

### Tier 2: Venue schedule pages
1. 코엑스 통합 행사 일정
2. 킨텍스/벡스코/엑스코/수원컨벤션센터 등 행사 페이지

### Tier 3: Aggregators
1. Showala
2. babyfair.krvvs.com

Tier 3는 누락 탐지용이다. Tier 1과 충돌하면 Tier 1을 신뢰한다.

---

## 3. Confirmed Reference Examples for 2026

다음 일정은 현재 공개 페이지에서 확인 가능한 예시 데이터다.

1. `2026 맘스홀릭베이비페어`  
   - 일정: 2026-01-15 ~ 2026-01-18  
   - 장소: COEX Hall A  
   - source: COEX 전시 페이지

2. `제49회 베페 베이비페어`  
   - 일정: 2026-04-02 ~ 2026-04-05  
   - 장소: COEX  
   - source: COEX 통합 일정 + 베페 공식 페이지

3. `2026 코베 베이비페어(코엑스 4월)`  
   - 일정: 2026-04-30 ~ 2026-05-03  
   - 장소: COEX 서울  
   - source: 코베 공식 페이지

4. `2026 맘스홀릭베이비페어 마곡`  
   - 일정: 2026-06-11 ~ 2026-06-14  
   - 장소: COEX Magok 1F 전시장  
   - source: 코엑스 마곡 공식 페이지

Sources:
- https://www.coex.co.kr/exhibitions/2026-%EB%A7%98%EC%8A%A4%ED%99%80%EB%A6%AD%EB%B2%A0%EC%9D%B4%EB%B9%84%ED%8E%98%EC%96%B4/
- https://www.coex.co.kr/event/full-schedules/
- https://m.befe.co.kr/m/company/summary.php
- https://m.cobe.co.kr/exhibition/info/?place=COEX
- https://coexmagok.co.kr/exhibitions/2026-%EB%A7%98%EC%8A%A4%ED%99%80%EB%A6%AD%EB%B2%A0%EC%9D%B4%EB%B9%84%ED%8E%98%EC%96%B4-%EB%A7%88%EA%B3%A1/
- https://bebefair.co.kr/92

---

## 4. Data Contract

```ts
export type BabyfairEventRaw = {
  source_name: string;
  source_url: string;
  crawled_at: string;
  title_raw: string;
  location_raw?: string;
  date_raw?: string;
  city_raw?: string;
  body_text?: string;
};

export type BabyfairEventNormalized = {
  id?: string;
  slug: string;
  name: string;
  organizer?: string | null;
  venue_name: string;
  venue_hall?: string | null;
  city: string;
  region?: string | null;
  address?: string | null;
  start_date: string;
  end_date: string;
  open_time?: string | null;
  close_time?: string | null;
  official_url: string;
  image_url?: string | null;
  source_name: string;
  source_url: string;
  confidence_score: number;
  review_status: 'pending' | 'approved' | 'rejected';
  updated_at?: string;
};
```

---

## 5. Database Schema

```sql
create table babyfair_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  organizer text,
  venue_name text not null,
  venue_hall text,
  city text not null,
  region text,
  address text,
  start_date date not null,
  end_date date not null,
  open_time text,
  close_time text,
  official_url text not null,
  image_url text,
  source_name text not null,
  source_url text not null,
  confidence_score numeric(4,2) not null default 0,
  review_status text not null default 'pending',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Optional raw table
```sql
create table babyfair_event_raw_logs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  payload jsonb not null,
  crawled_at timestamptz not null default now()
);
```

---

## 6. Normalization Rules

### Name normalization
- trim spaces
- normalize multiple spaces to one
- keep official numbering if present, e.g. `제49회`
- preserve brand labels like `베페`, `코베`, `맘스홀릭`

### Date normalization
- raw examples:
  - `2026.04.02 - 2026.04.05`
  - `2026년 4월 2일(목) ~ 5일(일)`
- output ISO:
  - `2026-04-02`
  - `2026-04-05`

### Venue normalization
Examples:
- `코엑스`, `COEX`, `서울 코엑스` -> `COEX`
- `코엑스 마곡`, `COEX Magok` -> `COEX Magok`
- `수원컨벤션센터`, `SCC` -> `수원컨벤션센터`

### City normalization
- 서울, 경기, 부산, 대구, 인천, 대전, 광주, 울산, 전북 등으로 정규화

---

## 7. Deduplication Rules

### Duplicate key candidate
`normalized_name + venue_name + start_date`

### Similarity checks
- same venue + same date range + similar brand tokens
- same official URL always identical
- if venue and dates match but title differs, mark for manual review

### Example
- `제49회 베페 베이비페어`
- `베페 베이비페어 49회`

=> same event candidate

---

## 8. Crawl Strategy

### Schedule
- Daily at 06:00 Asia/Seoul
- Additional weekly full refresh

### Modes
1. `full`: known source pages 전체 파싱
2. `incremental`: 변경 가능성이 큰 최근/올해 페이지 위주 파싱
3. `verify`: pending 레코드 재확인

### High-level pipeline
```text
fetch html
  -> extract fields
  -> save raw payload
  -> normalize
  -> dedupe
  -> upsert pending record
  -> admin review
  -> publish
```

---

## 9. Parser Hints by Source

### COEX exhibition pages
Selectors to inspect:
- title heading
- period block
- hall/location block
- venue intro text

### COEX schedule page
- list or calendar rows
- event title text
- date range text
- hall text

### BEFE mobile page
- 행사명
- 행사기간
- 장소
- 규모

### COBE pages
- 일정
- 장소
- 주최/주관

### BebeFair schedule page
- 행사명
- 일정
- 장소

주의: 사이트 구조가 바뀔 수 있으므로 `CSS selector only` 방식보다 `selector + text pattern` 혼합이 안전하다.

---

## 10. Example Pseudo Code

```ts
async function crawlSource(source: SourceConfig): Promise<BabyfairEventNormalized[]> {
  const html = await fetchHtml(source.url);
  const rawItems = source.parser(html);

  return rawItems.map(normalizeBabyfairEvent);
}

function normalizeBabyfairEvent(raw: BabyfairEventRaw): BabyfairEventNormalized {
  const name = normalizeName(raw.title_raw);
  const { startDate, endDate } = parseKoreanDateRange(raw.date_raw || raw.body_text || '');
  const venue = normalizeVenue(raw.location_raw || raw.body_text || '');
  const city = normalizeCity(raw.city_raw || raw.location_raw || raw.body_text || '');

  return {
    slug: buildSlug(name, venue.name, startDate),
    name,
    venue_name: venue.name,
    venue_hall: venue.hall,
    city,
    start_date: startDate,
    end_date: endDate,
    official_url: raw.source_url,
    source_name: raw.source_name,
    source_url: raw.source_url,
    confidence_score: calculateConfidence(raw, { startDate, endDate, venue, city }),
    review_status: 'pending'
  };
}
```

---

## 11. Confidence Scoring

### Suggested rule
- +0.40: official domain
- +0.20: valid start/end dates parsed
- +0.15: venue parsed
- +0.10: city parsed
- +0.15: source page title and body consistent

### Publish threshold
- `>= 0.75`: can auto-mark `pending_review_fastlane`
- `< 0.75`: manual review required

---

## 12. Admin Review UI Requirements

필수 액션:
- approve
- reject
- edit normalized fields
- compare duplicate candidates
- preview official source link

필수 필드:
- source URL
- raw title/date/location
- normalized title/date/location
- diff from existing candidate

---

## 13. Edge Cases

1. 같은 브랜드가 상반기/하반기 두 번 열림
2. `상`, `하`, `봄`, `가을` 표기가 이름에 포함됨
3. venue only page with link-out structure
4. 행사 취소/연기
5. 종료 행사 페이지가 여전히 노출됨
6. 이미지 배너에만 일정이 있고 본문 텍스트가 부족함

대응:
- `status`: `upcoming | ended | canceled | postponed`
- ended 계산은 `end_date < today`
- canceled/postponed는 검수 후 업데이트

---

## 14. API Shape

### Public API
`GET /api/babyfair-events?year=2026&city=서울&status=upcoming`

Response:
```json
{
  "items": [
    {
      "slug": "befe-coex-2026-04-02",
      "name": "제49회 베페 베이비페어",
      "venue_name": "COEX",
      "city": "서울",
      "start_date": "2026-04-02",
      "end_date": "2026-04-05",
      "official_url": "https://m.befe.co.kr/m/company/summary.php"
    }
  ]
}
```

### Internal admin API
- `POST /api/admin/crawl/babyfair/full`
- `POST /api/admin/crawl/babyfair/incremental`
- `POST /api/admin/babyfair-events/:id/approve`
- `POST /api/admin/babyfair-events/:id/reject`

---

## 15. Operational Notes

- robots.txt와 이용약관을 검토한다.
- 공식 API가 생기면 crawler보다 API 우선.
- 최초엔 5~10개 핵심 소스만 관리하는 편이 낫다.
- 완전 자동 게시보다 `반자동 검수`가 현실적이다.
