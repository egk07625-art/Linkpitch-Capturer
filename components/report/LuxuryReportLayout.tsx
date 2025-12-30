/**
 * @file LuxuryReportLayout.tsx
 * @description 공개 리포트 페이지용 명품 레이아웃 컴포넌트
 *
 * 다크 그라데이션 배경 위에 흰색 종이 컨테이너를 배치하여
 * 프리미엄 감성의 리포트 뷰어 경험을 제공합니다.
 */

import { ReactNode } from 'react';

interface LuxuryReportLayoutProps {
  /** 리포트 본문 콘텐츠 */
  children: ReactNode;
  /** 헤더 표시 여부 */
  showHeader?: boolean;
  /** 회사명 */
  companyName?: string;
  /** 리포트 테마/주제 */
  theme?: string;
  /** 타겟 타입 */
  targetType?: string;
  /** 발행 회사 */
  issuingCompany?: string;
  /** Step 번호 */
  stepNumber?: number;
  /** 생성 날짜 */
  date?: string;
}

export function LuxuryReportLayout({
  children,
  showHeader = true,
  companyName,
  theme,
  targetType,
  issuingCompany,
  stepNumber,
  date,
}: LuxuryReportLayoutProps) {
  return (
    // 전체 배경 - 고급스러운 다크 그라데이션
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-950 to-black">
      {/* 중앙 정렬 컨테이너 */}
      <div className="flex justify-center px-4 py-12 lg:py-20">
        {/* 종이 질감 컨테이너 */}
        <article
          className="w-full max-w-[840px] bg-white rounded-lg shadow-2xl overflow-hidden"
          style={{
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* 리포트 헤더 */}
          {showHeader && (
            <header className="px-8 lg:px-16 pt-10 lg:pt-14 pb-6 border-b border-gray-100">
              {/* 문서 타입 라벨 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  AI 전략 분석 리포트
                </span>
                {stepNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    STEP {stepNumber}
                  </span>
                )}
              </div>

              {/* 테마 타이틀 */}
              {theme && (
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
                  {theme}
                </h1>
              )}

              {/* 메타 정보 배지들 */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {issuingCompany && (
                  <span className="text-gray-500">
                    {issuingCompany}
                  </span>
                )}
                {issuingCompany && (targetType || date) && (
                  <span className="text-gray-300">•</span>
                )}
                {targetType && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                    {targetType}
                  </span>
                )}
                {date && (
                  <span className="text-gray-400 text-xs">{date}</span>
                )}
              </div>
            </header>
          )}

          {/* 본문 영역 */}
          <div className="px-8 lg:px-16 py-10 lg:py-14">
            {children}
          </div>

          {/* 푸터 - 브랜딩 */}
          <footer className="px-8 lg:px-16 py-5 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">LP</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Powered by LinkPitch AI
                </span>
              </div>
              <span className="text-xs text-gray-400">
                © {new Date().getFullYear()} All rights reserved
              </span>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
