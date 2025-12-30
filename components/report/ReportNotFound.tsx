/**
 * @file ReportNotFound.tsx
 * @description 리포트 404 페이지 컴포넌트
 *
 * LuxuryReportLayout과 동일한 배경 스타일을 사용하여
 * 일관된 사용자 경험을 제공합니다.
 */

"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

interface ReportNotFoundProps {
  prospectId: string;
  stepNumber: number;
}

export default function ReportNotFound({
  prospectId,
  stepNumber,
}: ReportNotFoundProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-950 to-black flex items-center justify-center p-4">
      {/* 중앙 카드 */}
      <div
        className="max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden"
        style={{
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="p-8 text-center">
          {/* 아이콘 */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileQuestion className="w-10 h-10 text-gray-400" />
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            리포트를 찾을 수 없습니다
          </h1>

          {/* 설명 */}
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            요청하신 Step {stepNumber} 리포트가 존재하지 않거나
            <br />
            아직 생성되지 않았습니다.
          </p>

          {/* 디버그 정보 (개발용) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left text-sm border border-gray-200">
              <p className="text-gray-500 font-mono">
                <span className="text-gray-400">prospect_id:</span> {prospectId}
              </p>
              <p className="text-gray-500 font-mono">
                <span className="text-gray-400">step:</span> {stepNumber}
              </p>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
            >
              <Home className="w-5 h-5" />
              홈으로 이동
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              뒤로 가기
            </button>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            문제가 지속되면 관리자에게 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
