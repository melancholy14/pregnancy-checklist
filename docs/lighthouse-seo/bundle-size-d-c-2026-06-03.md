# 번들 사이즈 비교 — phase-4.5 D-C (D-Mn1) 처리 전후

**측정일**: 2026-06-03
**대상 작업**: phase-4.5 D-Mn1 — 미사용 shadcn ui 컴포넌트 29개 + use-mobile + 외부 의존성 8개 + radix-ui 15개 일괄 제거
**비교 커밋**: Before `fcd3b85` (Step 2 직전) → After `fc4ff76` (Step 3 후 HEAD)

## 결과 요약

| 항목 | Before | After | Δ | % |
|---|---:|---:|---:|---:|
| `.next` 전체 | 25.85 MB | 25.70 MB | **−148 KB** | −0.57 % |
| `.next/static` | 1.86 MB | 1.81 MB | **−44 KB** | −2.37 % |
| `.next/static/chunks` | 1.62 MB | 1.58 MB | **−44 KB** | −2.71 % |
| `node_modules` | 1023.34 MB | 1015.17 MB | **−7.79 MB** | −0.80 % |

(원본 바이트: Before 26,451,968 / 1,904,640 / 1,662,976 / 1,023,340,544. After 26,300,416 / 1,859,584 / 1,617,920 / 1,015,169,024.)

## 해석

- **프로덕션 번들(.next/static/chunks) 절감은 -44 KB(-2.7 %)에 그침**. 30개 컴포넌트가 통째로 빠졌지만 Next.js 16 turbopack 트리쉐이킹이 빌드 단계에서 이미 미사용 export를 잘라내고 있었음. 사용자에게 도달하는 JS 페이로드 영향은 작다.
- **node_modules −7.79 MB가 실질 효과**. CI 캐시 미스 시 install 속도, 보안 surface, dependabot/audit 노이즈가 그만큼 줄어듦.
- 상위 청크 사이즈는 Before/After 동일(예: 392,401 B 청크 두 빌드 모두 존재) — vendor / 공통 청크 구성은 변하지 않았음을 확인.

## 측정 방법

```bash
# Before
git checkout fcd3b85 -- package.json package-lock.json src/
npm install --legacy-peer-deps
rm -rf .next && npm run build
du -sk .next .next/static .next/static/chunks node_modules

# After
git checkout fc4ff76 -- package.json package-lock.json src/
npm install
rm -rf .next && npm run build
du -sk .next .next/static .next/static/chunks node_modules
```

- 두 빌드 모두 `next 16.2.0 (Turbopack)`, `NODE_ENV=production` 기본값.
- `--legacy-peer-deps`는 Before 상태의 `react-day-picker@8.10.1`이 react 19 peer를 만족하지 못해 필요했음. After는 해당 의존성이 제거돼 불필요.
- `@next/bundle-analyzer`는 일회성 측정 취지상 도입하지 않고 `du -sk` + 청크 파일 크기로 갈음.

## 후속

- DESIGN.md / docs/tech/spec.md에 "추가 금지 리스트" 명문화 (Step 5).
- 다음 정기 측정(phase-5 또는 분기 점검) 시 본 리포트와 비교 가능.
