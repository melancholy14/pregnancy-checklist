import type { NextConfig } from "next";

// PoC: 정적 HTML 빌드 → gh-pages 배포
// 운영 전환 시: output: 'export' 제거 → standalone 모드 (Phase 5)
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
