/**
 * @file ReportSkeleton.tsx
 * @description 리포트 로딩 스켈레톤 컴포넌트
 *
 * LuxuryReportLayout과 동일한 구조의 스켈레톤 UI를 제공합니다.
 */

export function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-950 to-black">
      <div className="flex justify-center px-4 py-12 lg:py-20">
        <div
          className="w-full max-w-[840px] bg-white rounded-lg shadow-2xl overflow-hidden"
          style={{
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* 헤더 스켈레톤 */}
          <div className="px-8 lg:px-16 pt-10 lg:pt-14 pb-6 border-b border-gray-100">
            {/* 문서 타입 라벨 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* 테마 타이틀 */}
            <div className="h-7 w-80 max-w-full bg-gray-200 rounded animate-pulse mb-3" />

            {/* 메타 정보 */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>

          {/* 본문 스켈레톤 */}
          <div className="px-8 lg:px-16 py-10 lg:py-14 space-y-4">
            {/* 단락 1 */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* 제목 */}
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mt-8" />

            {/* 단락 2 */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* 테이블 스켈레톤 */}
            <div className="h-40 w-full bg-gray-100 rounded-lg animate-pulse mt-8" />

            {/* 단락 3 */}
            <div className="space-y-2 mt-6">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* 푸터 스켈레톤 */}
          <div className="px-8 lg:px-16 py-5 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
