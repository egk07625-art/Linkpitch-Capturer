"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러를 콘솔에 로깅
    console.error("Prospects page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          
          <h1 className="text-2xl font-semibold text-white mb-2">
            오류가 발생했습니다
          </h1>
          
          <p className="text-zinc-400 text-sm mb-6">
            {error.message || "고객사 목록을 불러오는 중 오류가 발생했습니다."}
          </p>

          {error.digest && (
            <p className="text-zinc-600 text-xs font-mono mb-6">
              에러 ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-gradient-to-b from-orange-400 to-orange-500 text-black px-6 py-3 rounded-full font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
            
            <Link
              href="/"
              className="flex items-center gap-2 border border-zinc-700 text-zinc-300 px-6 py-3 rounded-full font-medium text-sm hover:bg-zinc-900 transition-all"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}














