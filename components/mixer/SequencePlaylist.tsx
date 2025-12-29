'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Bot, Sparkles, Copy, Check, Send } from 'lucide-react';
import { VisionItem } from '@/types/vision';
import { SCENARIO_STEPS } from '@/lib/constants/scenario-steps';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { GeneratedEmail } from '@/types/generated-email';
import type { Prospect } from '@/types/prospect';
import { markEmailAsSent, updateGeneratedEmailContent } from '@/actions/generated-emails';
import { generateEmailHtml, copyHtmlToClipboard } from '@/lib/email-html-generator';

interface SequencePlaylistProps {
  droppedInsights: VisionItem[];
  onRemove: (id: string) => void;
  currentStep?: number;
  generatedEmails?: GeneratedEmail[];
  prospect?: Prospect;
}

// ViewToggle Component
function ViewToggle({
  activeMode,
  onToggle
}: {
  activeMode: 'email' | 'report';
  onToggle: (mode: 'email' | 'report') => void;
}) {
  return (
    <div className="bg-zinc-900/80 p-1 rounded-lg inline-flex gap-1">
      <button
        onClick={() => onToggle('email')}
        className={cn(
          "relative px-4 py-2 rounded-md text-xs font-medium transition-all duration-200",
          activeMode === 'email'
            ? "text-zinc-900"
            : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        {activeMode === 'email' && (
          <motion.div
            layoutId="activeViewTab"
            className="absolute inset-0 bg-white rounded-md"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Mail className="w-3 h-3" />
          메일 본문
        </span>
      </button>

      <button
        onClick={() => onToggle('report')}
        className={cn(
          "relative px-4 py-2 rounded-md text-xs font-medium transition-all duration-200",
          activeMode === 'report'
            ? "text-zinc-900"
            : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        {activeMode === 'report' && (
          <motion.div
            layoutId="activeViewTab"
            className="absolute inset-0 bg-white rounded-md"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Bot className="w-3 h-3" />
          AI 리포트 구성
        </span>
      </button>
    </div>
  );
}

// Main Component
export default function SequencePlaylist({
  droppedInsights: _droppedInsights,
  onRemove: _onRemove,
  currentStep = 1,
  generatedEmails = [],
  prospect,
}: SequencePlaylistProps) {
  const [viewMode, setViewMode] = useState<'email' | 'report'>('report');
  const [emailBody, setEmailBody] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentScenario = SCENARIO_STEPS.find(s => s.step === currentStep) || SCENARIO_STEPS[0];

  // 현재 Step에 해당하는 Generated Email 찾기
  const currentEmail = generatedEmails.find(e => e.step_number === currentStep);
  
  // 🔍 데이터 구조 확인
  useEffect(() => {
    console.log('[SequencePlaylist] 🔍 generatedEmails 전체 데이터:', JSON.stringify(generatedEmails, null, 2));
    if (currentEmail) {
      console.log('[SequencePlaylist] 🔍 currentEmail 데이터 구조 (step ' + currentStep + '):', {
        '전체 객체': currentEmail,
        'cta_text 값': currentEmail.cta_text,
        'cta_text 타입': typeof currentEmail.cta_text,
        'report_url 값': currentEmail.report_url,
        'email_body_solopreneur 값': currentEmail.email_body_solopreneur,
        'email_body_corporate 값': currentEmail.email_body_corporate,
        '모든 키': Object.keys(currentEmail),
      });
    } else {
      console.log('[SequencePlaylist] ⚠️ currentEmail이 없습니다 (step ' + currentStep + ')');
    }
  }, [generatedEmails, currentEmail, currentStep]);

  // Generated Email이 있으면 초기값 설정
  useEffect(() => {
    if (currentEmail) {
      setReportContent(currentEmail.report_html_editable || '');
      setEmailBody(currentEmail.email_body_solopreneur || currentEmail.email_body_corporate || '');
    } else {
      setReportContent('');
      setEmailBody('');
    }
  }, [currentEmail, currentStep]);

  // 클립보드 복사 (이메일 모드는 HTML 형식으로 복사)
  const handleCopy = async () => {
    const content = viewMode === 'email' ? emailBody : reportContent;
    if (!content) return;

    try {
      if (viewMode === 'email') {
        // 이메일 모드: HTML 형식으로 복사 (CTA 버튼 포함)
        // 🔍 CTA 텍스트 결정 로직 (빈 문자열도 체크)
        const ctaText = currentEmail?.cta_text && currentEmail.cta_text.trim()
          ? currentEmail.cta_text
          : '리포트 확인하기';

        const reportUrl = currentEmail?.report_url ||
          (currentEmail?.id ? `${window.location.origin}/r/${currentEmail.id}` : '');

        console.log('[SequencePlaylist handleCopy] 🔍 복사 시 버튼 데이터:', {
          '원본 cta_text': currentEmail?.cta_text,
          'cta_text 타입': typeof currentEmail?.cta_text,
          'trim 후 길이': currentEmail?.cta_text?.trim().length,
          '최종 사용할 ctaText': ctaText,
          'reportUrl': reportUrl,
        });

        const emailHtml = generateEmailHtml({
          emailBody: content,
          ctaText,
          reportUrl,
        });

        const success = await copyHtmlToClipboard(emailHtml);
        if (success) {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } else {
          console.error('HTML 복사 실패');
        }
      } else {
        // 리포트 모드: 텍스트만 복사
        await navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 발송 완료 처리
  const handleMarkAsSent = async () => {
    if (!currentEmail) return;

    setIsSending(true);
    try {
      const { success, error } = await markEmailAsSent(currentEmail.id);
      if (!success) {
        console.error('발송 완료 처리 실패:', error);
      }
    } catch (err) {
      console.error('발송 완료 처리 중 오류:', err);
    } finally {
      setIsSending(false);
    }
  };

  // 편집 내용 저장
  const handleSave = async () => {
    if (!currentEmail) return;

    setIsSaving(true);
    try {
      const { success, error } = await updateGeneratedEmailContent(currentEmail.id, {
        report_html_editable: reportContent,
      });
      if (!success) {
        console.error('저장 실패:', error);
      }
    } catch (err) {
      console.error('저장 중 오류:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Root: Full height container
    <div className="flex flex-col h-full w-full">

      {/* A. Fixed Header (Toggle) */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-zinc-800/50 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ViewToggle activeMode={viewMode} onToggle={setViewMode} />
          {prospect && (
            <span className="text-sm text-zinc-500">
              {prospect.store_name || prospect.name}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-zinc-400 hover:text-zinc-100"
          >
            {isCopied ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {isCopied ? '복사됨' : '복사'}
          </Button>

          {currentEmail && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-zinc-400 hover:text-zinc-100"
              >
                {isSaving ? '저장 중...' : '저장'}
              </Button>

              {currentEmail.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={handleMarkAsSent}
                  disabled={isSending}
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? '처리 중...' : '발송 완료'}
                </Button>
              )}

              {currentEmail.status === 'sent' && (
                <span className="text-xs text-green-500 px-3 py-1.5 bg-green-500/10 rounded-md">
                  발송됨
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* B. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">

        {viewMode === 'report' ? (
          // REPORT MODE - 넓게 펼쳐진 레이아웃
          <div className="w-full max-w-5xl mx-auto p-8">

            {/* Container Box */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 min-h-[700px] flex flex-col">

              {/* Toolbar */}
              <div className="mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-400" />
                  AI 생성 리포트
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Step {currentStep}. {currentScenario.subtitle} - {currentScenario.title}
                </p>
              </div>

              {/* Textarea Container */}
              <div className="flex-1">
                {currentEmail?.report_html_editable ? (
                  <textarea
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    className="w-full h-full bg-transparent resize-none outline-none text-zinc-300 leading-relaxed placeholder:text-zinc-700"
                    placeholder="리포트 내용을 수정하세요..."
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <Sparkles className="w-12 h-12 text-amber-500/30 mb-4" />
                    <p className="text-zinc-500 mb-2">아직 생성된 리포트가 없습니다</p>
                    <p className="text-xs text-zinc-600">
                      좌측에서 인사이트 칩을 드래그하여 놓으면, AI가 리포트를 생성합니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // EMAIL MODE - 리포트와 동일한 디자인
          <div className="w-full max-w-5xl mx-auto p-8">

            {/* Container Box */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 min-h-[700px] flex flex-col">

              {/* Toolbar */}
              <div className="mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <Mail className="size-5 text-amber-400" />
                  메일 초안
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Step {currentStep}. {currentScenario.subtitle} - {currentScenario.title}
                </p>
              </div>

              {/* Email Content */}
              <div className="flex-1 flex flex-col">
                {currentEmail?.email_body_solopreneur || currentEmail?.email_body_corporate ? (
                  <>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="flex-1 w-full bg-transparent resize-none outline-none text-zinc-300 leading-relaxed placeholder:text-zinc-700 mb-6"
                      placeholder="메일 내용을 수정하세요..."
                    />

                    {/* CTA 버튼 미리보기 */}
                    {(() => {
                      // 🔍 버튼 텍스트 결정 로직 (빈 문자열도 체크)
                      const buttonText = currentEmail?.cta_text && currentEmail.cta_text.trim()
                        ? currentEmail.cta_text
                        : '리포트 확인하기';

                      console.log('[SequencePlaylist CTA Preview] 🔍 버튼 텍스트 결정:', {
                        '원본 cta_text': currentEmail?.cta_text,
                        'cta_text 타입': typeof currentEmail?.cta_text,
                        'trim 후 길이': currentEmail?.cta_text?.trim().length,
                        '최종 버튼 텍스트': buttonText,
                      });

                      return (
                        <div className="mt-auto pt-8 border-t border-white/10">
                          <div className="text-lg font-bold text-zinc-300 mb-6 uppercase tracking-wide">
                            이메일에 포함될 버튼 미리보기
                          </div>
                          <div className="flex justify-center py-4">
                            <a
                              href={currentEmail?.report_url || `${window.location.origin}/r/${currentEmail?.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-8 py-4 bg-[#1A2B3C] text-white font-bold rounded transition-all hover:bg-[#243749] hover:shadow-lg"
                            >
                              {buttonText}
                            </a>
                          </div>
                          <p className="text-sm text-zinc-400 text-center mt-5 leading-relaxed">
                            복사 버튼을 클릭하면 본문과 함께 이 버튼이 HTML 형식으로 복사됩니다
                          </p>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <Mail className="w-12 h-12 text-amber-500/30 mb-4" />
                    <p className="text-zinc-500 mb-2">아직 생성된 메일 초안이 없습니다</p>
                    <p className="text-xs text-zinc-600">
                      AI가 분석한 내용을 바탕으로 메일 초안이 자동 생성됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
