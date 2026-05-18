# AdSense 인프라 마감 (D-A: D-C1·D-C2) 기획서 (간단판)

> 작성일: 2026-05-13  size: S
> 출처: [docs/plan/phase-4.5.md §4.2](../../plan/phase-4.5.md) D-C1·D-C2 (묶음 D-A)

## 0. 현재 상태 (페이즈 5 진입 전 사실 확인)

phase-4.5.md 기록 일부가 stale이라 진행 전 정리:

| 항목 | phase-4.5.md 기록 | 실제 상태 |
|---|---|---|
| `<meta name="google-adsense-account">` | 있음 | ✓ [src/app/layout.tsx:50-52](../../../src/app/layout.tsx#L50-L52) |
| `adsbygoogle.js` 스크립트 | 없음 | ✓ 이미 있음 — [src/components/consent/ConsentGatedScripts.tsx:25-32](../../../src/components/consent/ConsentGatedScripts.tsx#L25-L32) (consent-gated) |
| `public/ads.txt` | 없음 | ✗ 없음 → **본 묶음에서 생성** |
| consent 거부 시 비활성화 | (언급 없음) | ✓ 이미 구현 ([src/lib/use-consent.ts](../../../src/lib/use-consent.ts) `useConsentAccepted()` 게이팅) |
| 약관·개인정보 AdSense 조항 | (언급 없음) | ✓ 완비 — privacy §3·5·6·7·8, terms §13. **추가 불필요** |
| `reviewed_by: ""` 4건 (D-C2) | 빈 값 | ✓ 추정 (구현 시 재확인) → **본 묶음에서 필드 제거** |

→ 본 묶음의 실제 작업 = `public/ads.txt` 1건 + `reviewed_by` 4건 제거 + phase-4.5.md 갱신.

## 1. 사용자 시나리오

AdSense 콘솔이 `https://pregnancy-checklist.com/ads.txt`를 크롤링해 200 응답과 등록된 게시자 ID를 확인한다. 동시에 YMYL 콘텐츠 4편의 frontmatter에서 빈 `reviewed_by` 필드가 사라져, 독자와 검색엔진이 "리뷰받지 않았다"는 잘못된 신호 없이 글을 읽는다.

## 2. 기능 요구사항

### must
- **M1**. `public/ads.txt` 생성, 단일 라인: `google.com, pub-6022771079735605, DIRECT, f08c47fec0942fa0`
- **M2**. 빈 `reviewed_by: ""` 필드 4건 제거 (필드 자체 삭제, 빈 문자열 유지 금지):
  - [src/content/articles/early-pregnancy-fatigue-reasons.md](../../../src/content/articles/early-pregnancy-fatigue-reasons.md)
  - [src/content/articles/mid-pregnancy-lifestyle-guide.md](../../../src/content/articles/mid-pregnancy-lifestyle-guide.md)
  - [src/content/articles/pregnancy-foods-to-avoid.md](../../../src/content/articles/pregnancy-foods-to-avoid.md)
  - [src/content/articles/pregnancy-weight-management.md](../../../src/content/articles/pregnancy-weight-management.md)
- **M3**. M2가 frontmatter 파서·타입 정의를 깨지 않음을 확인 — `ArticleFrontMatter`에서 `reviewed_by`가 optional인지 검증, optional이 아니면 optional로 수정.
- **M4**. [docs/plan/phase-4.5.md](../../plan/phase-4.5.md) D-C1 항목의 "스크립트 태그 없음" 문장을 실제 상태(ConsentGatedScripts에 이미 존재, consent-gated)로 갱신. D-C1을 "ads.txt 생성"으로 좁히고 "스크립트 추가" 부분 삭제.

### won't
- **W1**. `AdUnit` 컴포넌트를 실제 게재 위치(article 본문/info-tab 등)에 박지 **않음** — 슬롯 배치는 D-A 범위 외, 별건 기능으로 분리.
- **W2**. `reviewed_by` 4건에 임시 검수자 라벨(예: "운영자 자체 검토") 부착 **안 함** — 검수자 섭외 가능성은 운영자 timeline(출산예정 2026-08-13) 검토 후 별건으로 결정.
- **W3**. 약관·개인정보 페이지 수정 **안 함** — AdSense 관련 조항이 이미 완비됨 (사실 확인 §0 참조).
- **W4**. GDPR/CCPA 추가 조항 **안 함** — 본 서비스는 한국 사용자 대상.
- **W5**. consent 거부 시 AdSense 비활성화 추가 구현 **안 함** — 이미 ConsentGatedScripts/AdUnit에서 게이팅됨.

## 3. 성공 기준

- 배포 후 `curl -I https://pregnancy-checklist.com/ads.txt` → `200 OK`, 본문이 정확히 `google.com, pub-6022771079735605, DIRECT, f08c47fec0942fa0` 1줄.
- 4개 article 파일에서 `grep -n 'reviewed_by' src/content/articles/{early-pregnancy-fatigue-reasons,mid-pregnancy-lifestyle-guide,pregnancy-foods-to-avoid,pregnancy-weight-management}.md` 결과 0건.
- `npm run build` + `tsc --noEmit` 무오류 (frontmatter 타입 호환성 확인).
- AdSense 콘솔 사이트 크롤링이 ads.txt를 인식 (배포 후 1~7일 내 콘솔 상태 확인).
