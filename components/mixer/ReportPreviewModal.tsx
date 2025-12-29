'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Printer, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { convertMarkdownToEmailHtml, copyHtmlToClipboard } from '@/utils/markdownToEmailHtml';

interface ReportPreviewModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 리포트 마크다운 컨텐츠 */
  content: string;
  /** 리포트 제목 (선택) */
  title?: string;
  /** 리포트 URL (이메일 복사용) */
  reportUrl?: string;
  /** CTA 버튼 텍스트 (이메일 복사용) */
  ctaText?: string;
}

export default function ReportPreviewModal({
  isOpen,
  onClose,
  content,
  title = '리포트 프리뷰',
  reportUrl,
  ctaText = '리포트 확인하기',
}: ReportPreviewModalProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  // ESC 키로 모달 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // 모달 열릴 때 body 스크롤 방지 & 키보드 이벤트 등록
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      // 첫 번째 버튼에 포커스
      setTimeout(() => firstButtonRef.current?.focus(), 100);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // 이메일 HTML 복사
  const handleCopyEmail = async () => {
    if (!content) {
      toast.error('복사할 내용이 없습니다.');
      return;
    }

    try {
      const emailHtml = convertMarkdownToEmailHtml(content, reportUrl, {
        includeWrapper: true,
        ctaButtonText: ctaText,
      });

      const success = await copyHtmlToClipboard(emailHtml);

      if (success) {
        setIsCopied(true);
        toast.success('이메일 형식으로 클립보드에 복사되었습니다.');
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        toast.error('복사에 실패했습니다.');
      }
    } catch (error) {
      console.error('이메일 복사 오류:', error);
      toast.error('복사 중 오류가 발생했습니다.');
    }
  };

  // PDF 인쇄
  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="report-preview-overlay fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
          onClick={onClose}
        >
          {/* 리포트 용지 (Paper) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="report-preview-modal bg-white rounded-lg overflow-hidden flex flex-col
                       w-[820px] max-w-[90vw] max-h-[90vh]"
            style={{
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* 상단 스티키 툴바 */}
            <div
              className="sticky-toolbar sticky top-0 z-10 flex items-center justify-between
                         px-6 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm"
            >
              <span className="text-sm text-gray-500">{title}</span>
              <div className="flex items-center gap-2">
                <button
                  ref={firstButtonRef}
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm
                             text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  {isCopied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                  {isCopied ? '복사됨' : '이메일 복사'}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm
                             text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  <Printer size={16} /> PDF 인쇄
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600
                             hover:bg-gray-100 rounded-md transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 리포트 본문 영역 */}
            <div className="flex-1 overflow-y-auto px-16 py-12 sm:px-8 sm:py-6">
              <article className="report-prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
