'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { convertMarkdownToEmailHtml } from '@/lib/markdown-to-email-html';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: string;
  subject: string;
  body: string;
  ctaUrl: string;
  ctaText?: string;
  onCopyEmail: () => void;
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  recipient,
  subject,
  body,
  ctaUrl,
  ctaText = '맞춤 진단 리포트 확인하기',
  onCopyEmail,
}: EmailPreviewModalProps) {

  /**
   * 마크다운 기호 제거 및 이메일용 HTML로 변환
   * - HTML 태그를 제거하고 줄바꿈으로 복원
   * - ###, >, -, ** 등 모든 마크다운 기호를 스타일된 HTML로 변환
   */
  const convertedBody = useMemo(() => {
    if (!body) return '';

    let cleanedBody = body;

    // 1. HTML 태그 → 줄바꿈으로 변환 (순서 중요)
    cleanedBody = cleanedBody
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')
      .replace(/<span[^>]*>/gi, '');

    // 2. HTML 엔티티 디코딩
    cleanedBody = cleanedBody
      .replace(/&nbsp;/gi, ' ')
      .replace(/&gt;/gi, '>')
      .replace(/&lt;/gi, '<')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"');

    // 3. 기타 HTML 태그 제거 (strong, b 등은 유지)
    cleanedBody = cleanedBody
      .replace(/<(?!\/?(strong|b|em|i)\b)[^>]+>/gi, '');

    // 4. 연속 줄바꿈 정리
    cleanedBody = cleanedBody
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 마크다운 → 이메일 HTML 변환
    return convertMarkdownToEmailHtml(cleanedBody);
  }, [body]);

  // ESC 키로 닫기 + body overflow 관리
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: 'blur(20px)' }}
          />

          {/* 모달 컨테이너 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[800px] max-h-[90vh]
                       bg-gray-100 rounded-xl shadow-2xl overflow-hidden
                       flex flex-col"
          >

            {/* ===== 이메일 앱 헤더 ===== */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200">
              {/* 상단 툴바 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail size={18} className="text-blue-500" />
                  <span className="font-medium">이메일 미리보기</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600
                             hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 이메일 메타 정보 */}
              <div className="px-6 py-4 space-y-2">
                {/* 받는 사람 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-16">받는 사람</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {recipient} 담당자님
                    </span>
                  </div>
                </div>

                {/* 제목 */}
                <div className="flex items-start gap-3">
                  <span className="text-sm text-gray-400 w-16 pt-0.5">제목</span>
                  <h2 className="text-lg font-semibold text-gray-900 flex-1">
                    {subject || '(제목 없음)'}
                  </h2>
                </div>
              </div>
            </div>

            {/* ===== 이메일 본문 (스크롤 영역) ===== */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
              {/* 이메일 종이 컨테이너 */}
              <div
                className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
                style={{
                  maxWidth: '700px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* 본문 내용 - 마크다운 → HTML 변환 후 렌더링 */}
                <div className="px-10 py-12">
                  <article
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: convertedBody || '<p style="color: #6b7280;">(본문 없음)</p>'
                    }}
                  />

                  {/* CTA 버튼 영역 */}
                  {ctaUrl && (
                    <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                      <a
                        href={ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2
                                   px-7 py-3.5
                                   bg-[#1A1A1A] hover:bg-[#2A2A2A]
                                   text-white text-[15px] font-medium
                                   rounded-lg shadow-lg hover:shadow-xl
                                   transition-all duration-200
                                   transform hover:scale-[1.02]"
                        style={{
                          letterSpacing: '-0.2px',
                          lineHeight: '1',
                        }}
                      >
                        {ctaText}
                      </a>

                      {/* URL 미리보기 */}
                      <p className="mt-3 text-xs text-gray-400 truncate max-w-[400px] mx-auto">
                        {ctaUrl}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== 하단 액션 바 ===== */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  실제 이메일에서 보이는 모습을 확인하세요
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800
                               hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => {
                      onCopyEmail();
                      toast.success('이메일이 클립보드에 복사되었습니다');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5
                               bg-blue-600 hover:bg-blue-700
                               text-white text-sm font-medium
                               rounded-lg shadow-sm hover:shadow
                               transition-all duration-200"
                  >
                    <Copy size={16} />
                    이메일 복사하기
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
