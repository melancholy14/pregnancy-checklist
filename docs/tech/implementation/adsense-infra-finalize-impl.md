# AdSense 인프라 마감 Implementation

> 출처: [docs/features/adsense-infra-finalize/spec.md](../features/adsense-infra-finalize/spec.md) (D-A: D-C1·D-C2)
> 작업일: 2026-05-13

## 완료 조건 충족 여부

| 조건 | 상태 | 비고 |
|------|------|------|
| **M1**. `public/ads.txt` 생성 (단일 라인 `google.com, pub-6022771079735605, DIRECT, f08c47fec0942fa0`) | ✅ 완료 | [public/ads.txt](../../public/ads.txt) — 1줄 + trailing newline |
| **M2**. 빈 `reviewed_by: ""` 4건 제거 | ✅ 완료 | 4개 article frontmatter에서 필드 자체 삭제 (빈 문자열 유지 X) |
| **M3**. 파서·타입 정의 깨지지 않음 | ✅ 완료 | `ArticleMeta` 타입은 `reviewed_by` 미포함이라 optional 처리 불필요. `parseArticleMeta`도 해당 필드 미사용. `npm run build` 무오류 |
| **M4**. phase-4.5.md D-C1 정정 (실제 상태 반영, 스크립트 추가 부분 삭제) | ✅ 완료 | "스크립트 태그 없음" → "ConsentGatedScripts에 consent-gated로 이미 주입됨"으로 갱신, 제목·수정 항목도 ads.txt 범위로 좁힘 |

배포 후 검증 (수동):
- `curl -I https://pregnancy-checklist.com/ads.txt` → 200 OK, 본문 정확히 1줄
- AdSense 콘솔 사이트 크롤링이 ads.txt 인식 (1~7일 내)

## 생성/수정 파일 목록

### 신규 생성
- [public/ads.txt](../../public/ads.txt) — AdSense 콘솔 크롤링용 게시자 ID 선언

### 수정
- [src/content/articles/early-pregnancy-fatigue-reasons.md](../../src/content/articles/early-pregnancy-fatigue-reasons.md) — frontmatter에서 `reviewed_by: ""` 삭제
- [src/content/articles/mid-pregnancy-lifestyle-guide.md](../../src/content/articles/mid-pregnancy-lifestyle-guide.md) — frontmatter에서 `reviewed_by: ""` 삭제
- [src/content/articles/pregnancy-foods-to-avoid.md](../../src/content/articles/pregnancy-foods-to-avoid.md) — frontmatter에서 `reviewed_by: ""` 삭제
- [src/content/articles/pregnancy-weight-management.md](../../src/content/articles/pregnancy-weight-management.md) — frontmatter에서 `reviewed_by: ""` 삭제
- [docs/plan/phase-4.5.md](../plan/phase-4.5.md) §4.2 D-C1 — 실제 상태로 갱신, 작업 범위를 ads.txt로 좁힘

## 주요 결정 사항

- **`reviewed_by` 4건만 처리, 나머지 미해결 빈 값 파일은 본 묶음에서 다루지 않음**: spec.md M2가 정확히 4개 article 경로를 명시. grep 결과 `pregnancy-exercise-starter-guide.md`, `pregnancy-supplements-by-week.md` (article) 및 다수 `src/content/draft/*.md` 파일도 `reviewed_by: ""`를 가지고 있으나, spec.md §2 won't에 따라 본 D-A 범위 밖. 별건 정리 대상으로 남김.
- **타입 정의 변경 없이 종료 (M3)**: `ArticleMeta`(src/types/article.ts)에 `reviewed_by`가 없고 `parseArticleMeta`도 해당 필드를 읽지 않음. gray-matter는 frontmatter에 존재하지 않는 키를 무시하므로 필드 삭제만으로 타입 영향 0. 별도 optional 마킹 작업 불필요로 판단.
- **markdown lint 경고 추가 수정 안 함**: phase-4.5.md 편집 후 MD013/MD022/MD032 경고가 IDE에서 노출되었으나, 동일 패턴이 파일 전체에 일관되게 존재하므로 본 묶음에서 별도 정리하지 않음. 별건 docs-cleanup 대상.

## 가정 사항

- AdSense 게시자 ID `pub-6022771079735605`는 spec.md에 명시된 운영자 보유 ID. 운영자 확인이 끝난 값으로 가정.
- 배포 후 ads.txt가 `https://pregnancy-checklist.com/ads.txt`로 정적 서빙됨 — Next.js `public/` 정적 서빙 동작에 따라 빌드 산출물에 자동 포함. 별도 라우트·설정 추가 불필요.
- consent 거부 시 AdSense 비활성화는 이미 [ConsentGatedScripts.tsx:25-32](../../src/components/consent/ConsentGatedScripts.tsx#L25-L32)에서 `adsenseId &&` + `useConsentAccepted()` 게이팅으로 처리됨. 별도 회귀 작업 불필요.

## 미구현 항목

- **AdUnit 컴포넌트 실제 게재 슬롯 배치** — spec.md §2 W1: 본 D-A 범위 외. 별건 기능으로 분리.
- **`reviewed_by` 4건에 임시 검수자 라벨 부착** — spec.md §2 W2: 운영자 timeline(출산예정 2026-08-13) 검토 후 별건 결정.
- **약관·개인정보 페이지 AdSense 조항 보강** — spec.md §2 W3: 이미 privacy §3·5·6·7·8, terms §13에 완비.
- **GDPR/CCPA 추가 조항** — spec.md §2 W4: 본 서비스는 한국 사용자 대상.
- **다른 article·draft의 빈 `reviewed_by` 정리** — 본 묶음 범위 밖 (위 "주요 결정 사항" 참조).
