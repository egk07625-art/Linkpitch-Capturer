import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }],
  },
  // Next.js 16: Turbopack이 기본값이므로 빈 설정 추가
  turbopack: {},
  // WSL 환경에서 파일 감시 최적화 (개발 모드에서만 사용)
  webpack: (config, { isServer }) => {
    // 파일 시스템 감시 문제 방지
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.git/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
