'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce';
import { supabase } from '@/lib/supabase/client';
import type { GeneratedEmail } from '@/types/generated-email';
import {
  Mail, FileText, Send, Save, ArrowLeft, Sparkles, ChevronDown, ChevronRight,
  Plus, X, Folder, FolderOpen, Trash2, Edit2, Check, LayoutTemplate, HelpCircle, FileOutput, ShieldCheck, Clock,
  BarChart2, TrendingUp, TrendingDown, Search, Zap, Link as LinkIcon, Target, Map, MousePointer2, CheckCircle2, Cpu, Coins, UserCheck, Navigation,
  Eye, Pencil, Columns, Copy, Maximize2, Keyboard, Type, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { generateEmailHtml, copyHtmlToClipboard } from '@/lib/email-html-generator';
import {
  convertMarkdownToEmailHtml,
  convertHtmlToEmailHtml,
  wrapEmailHtml,
  copyEmailHtmlToClipboard,
} from '@/lib/markdown-to-email-html';
import { FloatingToolbar } from '@/components/mixer/FloatingToolbar';
import { EmailPreviewModal } from '@/components/mixer/EmailPreviewModal';
import { SplitViewLayout, ViewMode } from '@/components/mixer/SplitViewLayout';
import { SubjectOptions } from '@/components/mixer/SubjectOptions';

// [Design] Step별 제목 카테고리 정의
const STEP_SUBJECT_CATEGORIES: Record<number, Record<string, { label: string, icon: any }>> = {
  1: {
    data_trail: { label: "데이터 궤적 추적형", icon: BarChart2 },
    system_defect: { label: "시스템적 결함 진단형", icon: Search },
    shadow_cost: { label: "그림자 매몰 비용형", icon: TrendingDown },
    precision_audit: { label: "전용 정밀 감사형", icon: ShieldCheck },
    bottleneck_impact: { label: "퍼스트뷰 병목 타격형", icon: Zap }
  },
  2: {
    followup_design: { label: "후속 설계 연결형", icon: LinkIcon },
    tactical_fix: { label: "전술적 자산 교정형", icon: Target },
    revenue_rebound: { label: "수익 지표 반등형", icon: TrendingUp },
    private_blueprint: { label: "비공개 블루프린트형", icon: Map },
    psy_trigger: { label: "심리 트리거 배치형", icon: MousePointer2 }
  },
  3: {
    sales_conclusion: { label: "매출 확정 결론형", icon: CheckCircle2 },
    integrated_ops: { label: "통합 운영 시스템형", icon: Cpu },
    cashflow_sim: { label: "현금 흐름 시뮬레이션형", icon: Coins },
    director_rx: { label: "수석 디렉터 처방형", icon: UserCheck },
    action_roadmap: { label: "실전 실행 로드맵형", icon: Navigation }
  }
};

// [Types]
type Asset = {
  id: string;
  name: string;
  type: 'image' | 'text' | 'file';
  content?: string; // 텍스트 파일일 경우 내용
  url: string;
};

type FolderType = {
  id: string;
  name: string;
  isOpen: boolean;
  assets: Asset[];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB 제한

interface InsightMixerClientProps {
  prospectId: string;
}

export default function InsightMixerClient({ prospectId }: InsightMixerClientProps) {
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [prospect, setProspect] = useState<any>(null);
  const [allStepsData, setAllStepsData] = useState<GeneratedEmail[]>([]);

  // UI State
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'email' | 'report'>('email');
  const [activeSubjectCategory, setActiveSubjectCategory] = useState<string>(''); // 초기화 로직은 useEffect에서 처리
  const [selectedSubjectText, setSelectedSubjectText] = useState('');
  const [subjectEdits, setSubjectEdits] = useState<Record<string, string>>({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [reportViewMode, setReportViewMode] = useState<'preview' | 'split'>('split');
  const [isCopied, setIsCopied] = useState(false);
  const [isSubjectCopied, setIsSubjectCopied] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null); // Monaco 에디터 인스턴스 (툴바용)
  const [isShortcutsGuideOpen, setIsShortcutsGuideOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailBody, setEmailBody] = useState('');
  const [isMarkdownCleaned, setIsMarkdownCleaned] = useState(false); // 리포트 마크다운 볼드 최적화 토글
  const [isEmailBoldOptimized, setIsEmailBoldOptimized] = useState(false); // 이메일 볼드 최적화 토글
  const [emailViewMode, setEmailViewMode] = useState<ViewMode>('split'); // 이메일 편집 뷰 모드

  // [Advanced Asset State]
  const [folders, setFolders] = useState<FolderType[]>([
    { id: 'f1', name: '자주 쓰는 자료', isOpen: true, assets: [] },
    { id: 'f2', name: '회사 소개서', isOpen: true, assets: [] }
  ]);
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [tempFolderName, setTempFolderName] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const activeFolderIdRef = useRef<string>('f1'); // 파일 추가할 타겟 폴더
  const monacoEditorRef = useRef<any>(null); // Monaco Editor 인스턴스 (리포트)
  const previewRef = useRef<HTMLDivElement>(null); // 프리뷰 스크롤 동기화용 (리포트)
  const editorContainerRef = useRef<HTMLDivElement>(null); // 에디터 컨테이너 (툴바 위치 계산용)

  // 이메일 에디터 refs
  const emailMonacoRef = useRef<any>(null); // Monaco Editor 인스턴스 (이메일)
  const emailPreviewRef = useRef<HTMLDivElement>(null); // 이메일 프리뷰 스크롤 동기화용

  // [Race Condition 방지] 에디터 현재값 추적 (리렌더링 없이)
  const prevStepRef = useRef<number>(activeStep); // 이전 Step 추적
  const emailBodyRef = useRef<string>(''); // 이메일 본문 현재값
  const reportMarkdownRef = useRef<string>(''); // 리포트 마크다운 현재값
  const isInitialLoadRef = useRef<boolean>(true); // 최초 로드 여부

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      console.log('[InsightMixer] Fetching data for prospect:', prospectId);
      setLoading(true);
      const { data: prospectData } = await supabase.from('prospects').select('*').eq('id', prospectId).single();
      if (prospectData) {
        setProspect(prospectData);
        console.log('[InsightMixer] Prospect data loaded:', prospectData.store_name);
      }
      
      const { data: emailData } = await supabase
        .from('generated_emails')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('step_number', { ascending: true })
        .order('created_at', { ascending: false });

      if (emailData && emailData.length > 0) {
        console.log('[InsightMixer] Email data loaded:', emailData.length, 'items');
        setAllStepsData(emailData as GeneratedEmail[]);
      } else {
        console.log('[InsightMixer] No email data found for this prospect.');
      }
      setLoading(false);
    };
    fetchData();
  }, [prospectId]);

  // --- Logic Helpers ---
  const currentStepData = allStepsData.find(item => item.step_number === activeStep);

  // Subject Parsing
  let subjectOptions: Record<string, string[]> = {};
  try {
      const rawSubjects = currentStepData?.email_subjects;
      const parsed = typeof rawSubjects === 'string' ? JSON.parse(rawSubjects) : rawSubjects;
      
      const categories = STEP_SUBJECT_CATEGORIES[activeStep] ? Object.keys(STEP_SUBJECT_CATEGORIES[activeStep]) : [];

      if (Array.isArray(parsed)) {
        if (parsed.length === 10 && categories.length === 5) {
          // 10개 제목이 오면 5개 카테고리에 순서대로 2개씩 매핑
          categories.forEach((catKey, idx) => {
            subjectOptions[catKey] = [parsed[idx * 2], parsed[idx * 2 + 1]];
          });
        } else if (parsed.length === 5 && categories.length === 5) {
          // Step 1: 5개 제목이 오면 각 카테고리에 2개씩 할당 (Step 2와 동일한 방식)
          // 순환 방식으로 할당: 카테고리 0 -> [0,1], 카테고리 1 -> [1,2], ..., 카테고리 4 -> [4,0]
          categories.forEach((catKey, idx) => {
            const firstIdx = idx;
            const secondIdx = (idx + 1) % parsed.length;
            subjectOptions[catKey] = [parsed[firstIdx], parsed[secondIdx]];
          });
        } else {
          // 그 외에는 현재 카테고리에 몰아넣기 (폴백)
          subjectOptions[activeSubjectCategory] = parsed;
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            subjectOptions[key] = value;
          } else if (typeof value === 'string') {
            subjectOptions[key] = [value];
          }
        });

        if (!subjectOptions[activeSubjectCategory] || subjectOptions[activeSubjectCategory].length === 0) {
          const firstAvailable = Object.values(subjectOptions).find(arr => arr.length > 0);
          if (firstAvailable) subjectOptions[activeSubjectCategory] = firstAvailable;
        }
      }
  } catch (e) {
    console.error('[InsightMixer] email_subjects 파싱 실패:', e);
    subjectOptions = {};
  }

  const getCleanBody = () => {
    // n8n에서 생성한 통합 필드(email_body)를 최우선으로 사용
    const rawBody = currentStepData?.email_body || currentStepData?.email_body_solopreneur || currentStepData?.email_body_corporate;

    if (!rawBody) {
      if (loading) return "데이터 로딩 중...";
      return "생성된 이메일 본문 데이터가 없습니다. n8n 워크플로우를 확인해주세요.";
    }

    return rawBody.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
  };

  // ===== 마크다운 볼드 → HTML 변환 함수 (프리뷰용) =====

  /**
   * 마크다운 볼드(**) → HTML <strong> 태그로 강제 변환
   * 변환 후 공백 복원 방식 - 단어와 태그 사이 공백 명시적 추가
   */
  const convertBoldToHtml = (text: string): string => {
    if (!text) return '';

    const originalAsterisks = (text.match(/\*\*/g) || []).length;
    let result = text;

    // ===== 1단계: ** 내부 공백 정리 =====
    // ** 텍스트 ** → **텍스트**
    result = result.replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**');
    result = result.replace(/\*\*\s+([^*]+?)\*\*/g, '**$1**');
    result = result.replace(/\*\*([^*]+?)\s+\*\*/g, '**$1**');

    // ===== 2단계: 볼드 → <strong> 변환 =====
    result = result.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');

    // ===== 3단계: 특수 컨텍스트 추가 처리 =====
    result = result.replace(/\[\*\*([^\]]+?)\*\*\]/g, '[<strong>$1</strong>]');
    result = result.replace(/\(\*\*([^)]+?)\*\*\)/g, '(<strong>$1</strong>)');
    result = result.replace(/\|\*\*([^|]+?)\*\*\|/g, '|<strong>$1</strong>|');
    result = result.replace(/\|\*\*([^|]+?)\*\*/g, '|<strong>$1</strong>');
    result = result.replace(/\*\*([^|]+?)\*\*\|/g, '<strong>$1</strong>|');

    // ===== 4단계: 남은 고아 별표 제거 =====
    result = result.replace(/\*\*/g, '');

    // ===== 5단계: 공백 복원 (핵심!) =====
    // 한글/영문/숫자/닫는괄호 바로 뒤에 <strong>이 붙어있으면 공백 추가
    result = result.replace(/([가-힣a-zA-Z0-9\)\]\%])<strong>/g, '$1 <strong>');
    // </strong> 바로 뒤에 한글/영문/숫자/여는괄호가 붙어있으면 공백 추가
    result = result.replace(/<\/strong>([가-힣a-zA-Z0-9\(\[])/g, '</strong> $1');

    // 검증 로그
    const strongTags = (result.match(/<strong>/g) || []).length;
    const sample = result.match(/.{0,8}<strong>.+?<\/strong>.{0,8}/)?.[0];
    console.log('[볼드 최적화 결과]', {
      변환전_별표쌍: originalAsterisks / 2,
      생성된_strong_태그: strongTags,
      샘플: sample || '없음',
    });

    return result;
  };

  // 리포트 프리뷰용 콘텐츠 (볼드 → HTML 변환 적용)
  const getPreviewContent = () => {
    const content = reportMarkdown || currentStepData?.report_markdown || '# 리포트 작성\n\n여기에 마크다운으로 리포트를 작성하세요...';
    return isMarkdownCleaned ? convertBoldToHtml(content) : content;
  };

  // 이메일 프리뷰용 콘텐츠 (Monaco 에디터 내용 사용)
  const getEmailPreviewContent = () => {
    // Monaco 에디터의 현재 값 사용
    const content = emailBodyRef.current || emailBody || getCleanBody();
    // EmailPreviewModal에서 마크다운 변환을 처리하므로 원본 반환
    return content;
  };

  // [수정됨] Step 전환 시에만 에디터 값 초기화 (Race Condition 방지)
  // currentStepData 변경만으로는 에디터 값을 덮어쓰지 않음
  useEffect(() => {
    // 최초 로드 시 또는 Step이 실제로 변경되었을 때만 실행
    const isStepChanged = prevStepRef.current !== activeStep;
    const isInitialLoad = isInitialLoadRef.current && currentStepData;

    if ((isStepChanged || isInitialLoad) && currentStepData) {
      console.log(`[Editor] Step changed or initial load: ${prevStepRef.current} → ${activeStep}`);

      // 이메일 본문 초기화
      const cleanBody = getCleanBody();
      setEmailBody(cleanBody);
      emailBodyRef.current = cleanBody;

      // 리포트 마크다운 초기화
      const markdown = currentStepData.report_markdown || '';
      setReportMarkdown(markdown);
      reportMarkdownRef.current = markdown;

      // Monaco Editor가 있으면 직접 값 설정 (Controlled 우회)
      if (monacoEditorRef.current && isStepChanged) {
        monacoEditorRef.current.setValue(markdown);
      }

      // contentEditable div도 직접 업데이트
      if (editorRef.current && isStepChanged) {
        editorRef.current.innerHTML = cleanBody;
      }

      prevStepRef.current = activeStep;
      isInitialLoadRef.current = false;
    }
  }, [activeStep, currentStepData]);

  const reportHtml = currentStepData?.report_html_editable || "<p class='text-zinc-500 text-sm'>생성된 리포트가 없습니다.</p>";
  useEffect(() => {
    if (activeStep) {
      const stepCategories = STEP_SUBJECT_CATEGORIES[activeStep];
      if (stepCategories) {
        const firstCategoryKey = Object.keys(stepCategories)[0];
        setActiveSubjectCategory(firstCategoryKey);
        setSelectedSubjectText('');
      }
    }
  }, [activeStep]);

  const currentCategorySubjects = subjectOptions?.[activeSubjectCategory] || [];

  // 현재 활성화된 카테고리의 특정 인덱스 편집 텍스트 가져오기 헬퍼
  const getDisplaySubject = (idx: number, original: string) => {
    const editKey = `${activeStep}_${activeSubjectCategory}_${idx}`;
    return subjectEdits[editKey] || original;
  };

  const handleSubjectEdit = (idx: number, newText: string) => {
    const editKey = `${activeStep}_${activeSubjectCategory}_${idx}`;
    setSubjectEdits(prev => ({ ...prev, [editKey]: newText }));
  };

  useEffect(() => {
    if (currentCategorySubjects.length > 0 && !selectedSubjectText) {
      setSelectedSubjectText(getDisplaySubject(0, currentCategorySubjects[0]));
    }
  }, [currentCategorySubjects, selectedSubjectText]);

  // [제거됨] 기존 reportMarkdown 초기화 로직 - 위의 통합 useEffect에서 처리
  // Race Condition 방지를 위해 currentStepData 변경 시 자동 덮어쓰기 제거

  // 외부 클릭 시 단축키 가이드 닫기
  useEffect(() => {
    if (!isShortcutsGuideOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.shortcuts-guide-container') && !target.closest('button[title="단축키 가이드"]')) {
        setIsShortcutsGuideOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isShortcutsGuideOpen]);

  // 리포트 탭 전환 시 분할 모드로 자동 초기화
  useEffect(() => {
    if (activeTab === 'report') {
      setReportViewMode('split');
    }
  }, [activeTab]);

  // --- [Data Persistence: handleSaveDraft] ---
  // [수정됨] ref 값을 사용하여 저장 (Race Condition 방지)
  const handleSaveDraft = useCallback(async (showToast = true) => {
    if (!currentStepData || isSaving) return;

    // ref에서 현재 에디터 값 가져오기 (상태가 아닌 실시간 값)
    const currentEmailBody = emailBodyRef.current || editorRef.current?.innerHTML || '';
    const currentReportMarkdown = reportMarkdownRef.current || '';

    try {
      setIsSaving(true);
      console.log(`[InsightMixer] Saving draft for Step ${activeStep}...`);

      // 1. 현재 편집된 제목들 준비
      const currentSubjects = { ...subjectOptions };
      Object.entries(subjectEdits).forEach(([key, text]) => {
        const [stepNo, category, idx] = key.split('_');
        if (parseInt(stepNo) === activeStep && currentSubjects[category]) {
          currentSubjects[category][parseInt(idx)] = text;
        }
      });

      // 2. DB 업데이트 (ref 값 사용)
      const { error } = await supabase
        .from('generated_emails')
        .update({
          email_body: currentEmailBody,
          email_subjects: currentSubjects,
          report_markdown: currentReportMarkdown,
          updated_at: new Date().toISOString(),
        })
        .eq('prospect_id', prospectId)
        .eq('step_number', activeStep);

      if (error) throw error;

      // 3. [수정됨] 로컬 상태 업데이트 - 에디터 값은 업데이트하지 않음!
      // 에디터 값을 여기서 업데이트하면 currentStepData가 변경되어 useEffect가 트리거됨
      // 대신 email_subjects만 업데이트 (제목 편집 동기화용)
      setAllStepsData(prev => prev.map(item =>
        item.step_number === activeStep
          ? {
              ...item,
              email_subjects: currentSubjects as any,
              // email_body와 report_markdown은 의도적으로 제외 (Race Condition 방지)
            }
          : item
      ));

      if (showToast) {
        toast.success(`Step ${activeStep} 임시 저장이 완료되었습니다.`);
      }
      console.log(`[InsightMixer] Step ${activeStep} saved successfully.`);
    } catch (err) {
      console.error('[InsightMixer] Save failed:', err);
      if (showToast) {
        toast.error('저장 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentStepData, isSaving, activeStep, subjectOptions, subjectEdits, prospectId]);

  // --- [Auto-save Logic] ---
  // [수정됨] 디바운스된 자동 저장 콜백 (use-debounce 사용)
  const debouncedAutoSave = useDebouncedCallback(() => {
    if (!loading && currentStepData) {
      handleSaveDraft(false); // 토스트 없이 자동 저장
    }
  }, 3000);

  // 제목 편집 시 자동 저장 트리거 (기존 동작 유지)
  useEffect(() => {
    if (loading || !currentStepData) return;
    if (Object.keys(subjectEdits).length > 0) {
      debouncedAutoSave();
    }
  }, [subjectEdits, loading, currentStepData, debouncedAutoSave]);

  // [신규] 이메일 본문 변경 핸들러 (ref만 업데이트 - 상태 업데이트 제거로 리렌더링 방지)
  const handleEmailBodyChange = useCallback((html: string) => {
    emailBodyRef.current = html;
    // setEmailBody 제거! - contentEditable에서 상태 업데이트하면 커서 리셋됨
    debouncedAutoSave();
  }, [debouncedAutoSave]);

  // [신규] 리포트 마크다운 변경 핸들러 (ref 업데이트 + 디바운스 상태 업데이트 + 자동 저장)
  const handleReportMarkdownChange = useCallback((value: string) => {
    reportMarkdownRef.current = value;
    setReportMarkdown(value); // 프리뷰 동기화용
    debouncedAutoSave();
  }, [debouncedAutoSave]);

  // ESC 키로 모달 닫기 + body 스크롤 제어
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReportModalOpen) {
        setIsReportModalOpen(false);
      }
    };

    if (isReportModalOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReportModalOpen]);

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      e.preventDefault();
      e.stopPropagation();

      const href = anchor.getAttribute('href');
      if (href) {
        (document.activeElement as HTMLElement)?.blur();
        window.getSelection()?.removeAllRanges();
        window.open(href, '_blank');
      }
    }
  };

  // Monaco Editor 마운트 핸들러
  const handleEditorMount = (editor: any) => {
    monacoEditorRef.current = editor;
    setEditorInstance(editor); // 툴바용 상태 업데이트

    // 에디터 스크롤 시 프리뷰 동기화
    editor.onDidScrollChange(() => {
      if (!previewRef.current || reportViewMode !== 'split') return;

      const scrollInfo = editor.getScrollTop();
      const scrollHeight = editor.getScrollHeight();
      const clientHeight = editor.getLayoutInfo().height;

      if (scrollHeight <= clientHeight) return;

      const scrollRatio = scrollInfo / (scrollHeight - clientHeight);
      const preview = previewRef.current;
      const previewScrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight);

      preview.scrollTop = previewScrollTop;
    });
  };

  // 프리뷰 스크롤 시 에디터 동기화 (양방향)
  const handlePreviewScroll = () => {
    if (!monacoEditorRef.current || !previewRef.current || reportViewMode !== 'split') return;

    const preview = previewRef.current;
    const editor = monacoEditorRef.current;

    if (preview.scrollHeight <= preview.clientHeight) return;

    const scrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    const editorScrollHeight = editor.getScrollHeight();
    const editorClientHeight = editor.getLayoutInfo().height;
    const editorScrollTop = scrollRatio * (editorScrollHeight - editorClientHeight);

    editor.setScrollTop(editorScrollTop);
  };

  // ===== 이메일 에디터 핸들러 =====

  // 이메일 Monaco Editor 마운트 핸들러
  const handleEmailEditorMount = (editor: any) => {
    emailMonacoRef.current = editor;

    // 에디터 스크롤 시 프리뷰 동기화
    editor.onDidScrollChange(() => {
      if (!emailPreviewRef.current || emailViewMode !== 'split') return;

      const scrollInfo = editor.getScrollTop();
      const scrollHeight = editor.getScrollHeight();
      const clientHeight = editor.getLayoutInfo().height;

      if (scrollHeight <= clientHeight) return;

      const scrollRatio = scrollInfo / (scrollHeight - clientHeight);
      const preview = emailPreviewRef.current;
      const previewScrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight);

      preview.scrollTop = previewScrollTop;
    });
  };

  // 이메일 프리뷰 스크롤 시 에디터 동기화
  const handleEmailPreviewScroll = () => {
    if (!emailMonacoRef.current || !emailPreviewRef.current || emailViewMode !== 'split') return;

    const preview = emailPreviewRef.current;
    const editor = emailMonacoRef.current;

    if (preview.scrollHeight <= preview.clientHeight) return;

    const scrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    const editorScrollHeight = editor.getScrollHeight();
    const editorClientHeight = editor.getLayoutInfo().height;
    const editorScrollTop = scrollRatio * (editorScrollHeight - editorClientHeight);

    editor.setScrollTop(editorScrollTop);
  };

  // 이메일 본문 변경 핸들러 (Monaco Editor용)
  const handleEmailMonacoChange = useCallback((value: string | undefined) => {
    const newValue = value || '';
    emailBodyRef.current = newValue;
    setEmailBody(newValue);
    debouncedAutoSave();
  }, [debouncedAutoSave]);

  // 이메일 프리뷰용 HTML 콘텐츠 생성
  const getEmailPreviewHtml = useCallback(() => {
    const content = emailBody || getCleanBody();
    if (!content) return '';

    // HTML 태그를 줄바꿈으로 복원
    let cleanedContent = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')
      .replace(/<span[^>]*>/gi, '');

    // HTML 엔티티 디코딩
    cleanedContent = cleanedContent
      .replace(/&nbsp;/gi, ' ')
      .replace(/&gt;/gi, '>')
      .replace(/&lt;/gi, '<')
      .replace(/&amp;/gi, '&');

    // 마크다운 → 이메일 HTML 변환
    return convertMarkdownToEmailHtml(cleanedContent);
  }, [emailBody]);

  // --- [Subject Copy Handler] ---
  const handleCopySubject = async () => {
    if (!selectedSubjectText) {
      toast.error('복사할 제목을 먼저 선택해주세요.');
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedSubjectText);
      setIsSubjectCopied(true);
      toast.success('제목이 클립보드에 복사되었습니다!');

      setTimeout(() => setIsSubjectCopied(false), 2000);
    } catch (error) {
      console.error('제목 복사 중 오류:', error);
      toast.error('제목 복사에 실패했습니다.');
    }
  };

  // --- [Email Copy Handler] ---
  // Step별 CTA 텍스트 정의
  const STEP_CTA_TEXTS: Record<number, string> = {
    1: '1단계 진단 리포트 확인하기',
    2: '2단계 전략 리포트 확인하기',
    3: '3단계 실행 로드맵 확인하기',
  };

  // Step별 리포트 URL 생성 (Query Parameter 방식: /report/{id}?step=N)
  const generateStepReportUrl = (step: number): string => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    return `${baseUrl}/report/${prospectId}?step=${step}`;
  };

  const handleCopyEmail = async () => {
    // Monaco 에디터 또는 상태에서 본문 가져오기
    const rawEmailBody = emailBodyRef.current || emailBody || getCleanBody();

    if (!currentStepData || !rawEmailBody.trim()) {
      toast.error('복사할 이메일 본문이 없습니다.');
      return;
    }

    try {
      // 이메일 프리뷰와 동일한 변환 적용
      const styledBodyHtml = getEmailPreviewHtml();

      // Step별 동적 CTA 텍스트
      const ctaText = currentStepData.cta_text && currentStepData.cta_text.trim()
        ? currentStepData.cta_text
        : STEP_CTA_TEXTS[activeStep] || '리포트 확인하기';

      // Step별 동적 URL 생성 (/report/{prospectId}/{stepNumber})
      const reportUrl = generateStepReportUrl(activeStep);

      console.log(`[Email Copy] Step ${activeStep} URL:`, reportUrl, '볼드 최적화:', isEmailBoldOptimized);

      // 최종 이메일 HTML 생성 (본문 + CTA 버튼)
      const finalEmailHtml = wrapEmailHtml(styledBodyHtml, ctaText, reportUrl);

      const success = await copyEmailHtmlToClipboard(finalEmailHtml);

      if (success) {
        setIsCopied(true);
        toast.success(`Step ${activeStep} 이메일이 복사되었습니다!`, {
          description: isEmailBoldOptimized
            ? '볼드 최적화가 적용된 버전입니다'
            : `버튼: "${ctaText}"`,
        });
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        toast.error('클립보드 복사에 실패했습니다.');
      }
    } catch (error) {
      console.error('이메일 복사 중 오류:', error);
      toast.error('이메일 복사 중 오류가 발생했습니다.');
    }
  };

  // --- [Folder Management Logic] ---

  // 1. 폴더 추가
  const addFolder = () => {
    const newFolder: FolderType = {
      id: Math.random().toString(36).substr(2, 9),
      name: '새 폴더',
      isOpen: true,
      assets: []
    };
    setFolders([...folders, newFolder]);
    // 바로 이름 수정 모드로 진입
    setEditingFolderId(newFolder.id);
    setTempFolderName('새 폴더');
  };

  // 2. 폴더 삭제
  const deleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('폴더와 내부 파일이 모두 삭제됩니다.')) {
      setFolders(folders.filter(f => f.id !== folderId));
    }
  };

  // 3. 이름 수정 저장
  const saveFolderName = () => {
    if (editingFolderId) {
      setFolders(folders.map(f => f.id === editingFolderId ? { ...f, name: tempFolderName } : f));
      setEditingFolderId(null);
    }
  };

  // --- [Asset Management Logic] ---

  // 1. 파일 추가 트리거
  const triggerFileUpload = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    activeFolderIdRef.current = folderId;
    fileInputRef.current?.click();
  };

  // 2. 파일 처리 (용량 제한 + 텍스트 파일 읽기)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const targetFolderId = activeFolderIdRef.current;

    const newAssets: Asset[] = [];

    for (const file of files) {
      // 4. 용량 제한 체크
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}은 5MB를 초과하여 제외되었습니다.`);
        continue;
      }

      let assetType: Asset['type'] = 'file';
      let content = '';

      if (file.type.startsWith('image/')) assetType = 'image';
      else if (file.type === 'text/plain') {
        assetType = 'text';
        content = await file.text(); // 텍스트 파일 내용 읽기
      }

      newAssets.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: assetType,
        url: URL.createObjectURL(file),
        content: content
      });
    }

    setFolders(prev => prev.map(f =>
      f.id === targetFolderId ? { ...f, assets: [...f.assets, ...newAssets] } : f
    ));

    if (newAssets.length > 0) toast.success(`${newAssets.length}개의 파일이 추가되었습니다.`);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- [Drag & Drop Logic] ---

  // 1. 드래그 시작 (Library -> Editor)
  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    setDraggedAsset(asset);
    // 데이터 전송 설정
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
  };

  // 2. 에디터 드롭 영역 처리
  const handleEditorDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // 커서 모양 변경 (+)
  };

  // 3. 에디터에 드롭 (Insert Logic)
  const handleEditorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const assetData = e.dataTransfer.getData('application/json');
    if (!assetData) return;

    try {
      const asset: Asset = JSON.parse(assetData);
      insertAssetToEditor(asset);
    } catch (err) {
      console.error("Drop failed", err);
    }
    setDraggedAsset(null);
  };

  // 4. 실제 삽입 함수
  const insertAssetToEditor = (asset: Asset) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (asset.type === 'image') {
      document.execCommand('insertHTML', false,
        `<img src="${asset.url}" alt="${asset.name}" style="max-width: 100%; border-radius: 8px; margin: 10px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /><br>`
      );
      toast.success("이미지가 본문에 삽입되었습니다.");
    } else if (asset.type === 'text') {
      // 텍스트 파일은 내용을 삽입
      document.execCommand('insertText', false, asset.content || '');
      toast.success("텍스트가 본문에 삽입되었습니다.");
    } else {
      // 일반 파일은 링크 형태 텍스트 삽입
      document.execCommand('insertHTML', false,
        `<span style="background: #2C2C2E; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.9em;">📎 ${asset.name}</span>&nbsp;`
      );
      toast.info("파일 링크가 본문에 삽입되었습니다.");
    }
  };

  // --- Rendering ---
  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center font-medium">Loading Workspace...</div>;
  if (!prospect) return <div className="h-screen bg-black text-white flex items-center justify-center font-medium">Client Not Found</div>;

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden selection:bg-blue-500/30">

      {/* Hidden File Input (Global) */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />

      {/* Header */}
      <header className="h-16 border-b border-[#222] bg-[#0A0A0A] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/prospects" className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1C1C1E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-5 w-[1px] bg-[#333]" />
          
          {/* Library Toggle (Left) */}
          <button
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className={`h-9 px-3 rounded-lg border transition-all flex items-center gap-2 mb-0.5 ${
              isLibraryOpen 
                ? 'bg-[#1C1C1E] text-white border-[#333] shadow-sm' 
                : 'border-transparent text-zinc-400 hover:bg-[#1C1C1E] hover:text-white hover:border-[#333]'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span className="text-xs font-bold">소재 라이브러리</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center text-xs font-bold text-zinc-400 border border-[#333]">
              {prospect.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                {prospect.store_name || prospect.name}
              </h1>
              <span className="text-xs text-zinc-500 font-medium">{prospect.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`h-9 px-3 rounded-lg border transition-all flex items-center gap-2 ${
              isHistoryOpen 
                ? 'bg-[#1C1C1E] text-white border-[#333] shadow-sm' 
                : 'border-transparent text-zinc-400 hover:bg-[#1C1C1E] hover:text-white hover:border-[#333]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold">히스토리</span>
          </button>
          <button 
            onClick={() => handleSaveDraft()}
            disabled={isSaving}
            className="h-9 px-4 rounded-lg border border-[#333] bg-transparent text-xs font-medium text-zinc-400 hover:bg-[#1C1C1E] hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> <span>임시 저장</span>
              </>
            )}
          </button>
          <button className="h-9 px-5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/5">
            <Send className="w-4 h-4" /> <span>발송하기</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* [Left Panel] Asset Library */}
        <aside
          className={`border-r border-[#222] bg-[#0A0A0A] flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isLibraryOpen ? 'w-[340px] translate-x-0' : 'w-0 -translate-x-full border-none'}`}
        >
          <div className="px-6 py-5 border-b border-[#222] bg-[#0A0A0A] flex justify-between items-center whitespace-nowrap overflow-hidden">
            <h2 className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
              <LayoutTemplate className="w-3.5 h-3.5" /> 소재 라이브러리
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={addFolder} className="p-1 text-zinc-500 hover:text-white transition-colors rounded hover:bg-[#1C1C1E]" title="폴더 추가">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setIsLibraryOpen(false)} className="p-1 text-zinc-500 hover:text-white transition-colors rounded hover:bg-[#1C1C1E]" title="닫기">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 whitespace-nowrap">
            {folders.map((folder) => (
              <div key={folder.id} className="select-none mb-4">
                {/* Folder Header */}
                <div
                  className="group flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#1C1C1E] cursor-pointer"
                  onClick={() => {
                    // 이름 수정 중이 아닐 때만 토글
                    if (editingFolderId !== folder.id) {
                      setFolders(folders.map(f => f.id === folder.id ? { ...f, isOpen: !f.isOpen } : f));
                    }
                  }}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {folder.isOpen ? (
                      <FolderOpen className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Folder className="w-4 h-4 text-zinc-500" />
                    )}

                    {/* Folder Name Editing */}
                    {editingFolderId === folder.id ? (
                      <input
                        type="text"
                        value={tempFolderName}
                        onChange={(e) => setTempFolderName(e.target.value)}
                        onBlur={saveFolderName}
                        onKeyDown={(e) => e.key === 'Enter' && saveFolderName()}
                        autoFocus
                        className="bg-black border border-blue-500 text-xs text-white px-1 py-0.5 rounded w-32 outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="text-xs font-bold text-zinc-300 truncate"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setTempFolderName(folder.name);
                        }}
                      >
                        {folder.name}
                      </span>
                    )}
                  </div>

                  {/* Folder Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => triggerFileUpload(folder.id, e)}
                      className="p-1 rounded hover:bg-[#333] text-zinc-400 hover:text-white"
                      title="파일 추가"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => deleteFolder(folder.id, e)}
                      className="p-1 rounded hover:bg-[#333] text-zinc-400 hover:text-red-400"
                      title="폴더 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Assets List */}
                {folder.isOpen && (
                  <div className="pl-2 mt-1 space-y-1 border-l-2 border-[#1C1C1E] ml-3">
                    {folder.assets.length === 0 ? (
                      <div className="py-2 pl-4 text-[10px] text-zinc-700 italic">비어있음</div>
                    ) : (
                      folder.assets.map((asset) => (
                        <div
                          key={asset.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, asset)}
                          onDragEnd={() => setDraggedAsset(null)}
                          onClick={() => insertAssetToEditor(asset)}
                          className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#1F1F1F] cursor-grab active:cursor-grabbing transition-all ml-2"
                        >
                          <div className="w-8 h-8 rounded bg-[#111] border border-[#222] flex items-center justify-center shrink-0 overflow-hidden">
                            {asset.type === 'image' ? (
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">{asset.name}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        </aside>

        {/* [Center Panel] Editor */}
        <main className="flex-1 bg-[#050505] flex flex-col relative min-w-0">
          
          {/* Sticky Header Area: Navigator + Mode Switcher + Report Toolbar */}
          <div className="flex-shrink-0 sticky top-0 z-[100] bg-[#050505]">
            <div className="max-w-[1400px] mx-auto px-10 md:px-12">
              <div className="space-y-8 py-6 border-b border-white/10">
                {/* Step Navigator */}
                <div className="flex items-center justify-center gap-4">
                  {[1, 2, 3].map((step) => {
                    const hasData = allStepsData.some(d => d.step_number === step);
                    const isActive = activeStep === step;
                    return (
                      <button
                        key={step}
                        onClick={() => { setActiveStep(step); }}
                        className={`h-12 px-7 rounded-full text-base font-bold transition-all flex items-center gap-2.5 border ${isActive ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' : hasData ? 'bg-[#111] text-zinc-400 border-[#333] hover:border-zinc-500 hover:text-zinc-200' : 'bg-[#0A0A0A] text-zinc-800 border-[#222] cursor-not-allowed'}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-black text-white' : 'bg-[#222] text-zinc-600'}`}>{step}</span>
                        <span>Step</span>
                      </button>
                    );
                  })}
                </div>

                {/* Mode Switcher */}
                <div className="flex justify-center">
                  <div className="p-1.5 bg-[#111] border border-[#222] rounded-xl flex items-center shadow-inner">
                    <button onClick={() => setActiveTab('email')} className={`flex items-center gap-2 px-8 py-3 rounded-lg text-base font-bold transition-all ${activeTab === 'email' ? 'bg-[#2C2C2E] text-white shadow-sm border border-[#333]' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      <Mail className="w-5 h-5" /> 이메일
                    </button>
                    <button onClick={() => setActiveTab('report')} className={`flex items-center gap-2 px-8 py-3 rounded-lg text-base font-bold transition-all ${activeTab === 'report' ? 'bg-[#2C2C2E] text-white shadow-sm border border-[#333]' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      <FileText className="w-5 h-5" /> 리포트
                    </button>
                  </div>
                </div>
              </div>

              {/* 리포트 탭 툴바 (리포트 탭일 때만 표시) */}
              {activeTab === 'report' && (
                <div className="py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-lg">
                        <button
                          onClick={() => setReportViewMode('split')}
                          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-md text-base font-medium transition-all ${
                            reportViewMode === 'split'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          <Columns className="w-5 h-5" />
                          편집
                        </button>
                      </div>
                    </div>

                    {/* 오른쪽 버튼 그룹 */}
                    <div className="flex items-center gap-3">
                      {/* 볼드 최적화 토글 버튼 */}
                      <button
                        onClick={() => setIsMarkdownCleaned(!isMarkdownCleaned)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          isMarkdownCleaned
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                        }`}
                        title={isMarkdownCleaned ? '원본 마크다운 보기' : '가독성 최적화: 볼드 문법 자동 교정 (** 공백 문제 등)'}
                      >
                        {isMarkdownCleaned ? (
                          <>
                            <Type className="w-4 h-4" />
                            <span>원본 보기</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            <span>가독성 최적화</span>
                          </>
                        )}
                      </button>

                      {/* Preview 버튼 */}
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2.5 px-5 py-3 rounded-lg text-base font-semibold transition-all
                          bg-gradient-to-b from-zinc-800 to-zinc-900 text-white border border-zinc-700
                          hover:from-zinc-700 hover:to-zinc-800 hover:border-zinc-600
                          shadow-lg shadow-black/20"
                        title="몰입형 프리뷰"
                      >
                        <Maximize2 className="w-5 h-5" />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 이메일 탭 - 제한된 너비 */}
          {activeTab === 'email' && (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-10 md:px-12 md:py-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">

                  {/* Subject Picker - 다크모드 카드 시스템 */}
                  <SubjectOptions
                    categories={STEP_SUBJECT_CATEGORIES[activeStep] || {}}
                    subjectsByCategory={subjectOptions}
                    activeCategory={activeSubjectCategory}
                    onCategoryChange={setActiveSubjectCategory}
                    selectedSubject={selectedSubjectText}
                    onSubjectSelect={setSelectedSubjectText}
                    getDisplaySubject={getDisplaySubject}
                    onSubjectEdit={handleSubjectEdit}
                    isCopied={isSubjectCopied}
                    onCopy={handleCopySubject}
                  />

                  {/* Body Editor - 분할 뷰 */}
                  <div className="h-[650px] border border-zinc-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <SplitViewLayout
                      title="BODY CONTENT"
                      icon={<FileText className="w-4 h-4 text-blue-500" />}
                      viewMode={emailViewMode}
                      onViewModeChange={setEmailViewMode}
                      previewScrollRef={emailPreviewRef}
                      onPreviewScroll={handleEmailPreviewScroll}

                      // 툴바 버튼들
                      toolbarButtons={
                        <>
                          {/* 볼드 최적화 버튼 */}
                          <button
                            onClick={() => setIsEmailBoldOptimized(!isEmailBoldOptimized)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              isEmailBoldOptimized
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-700'
                            }`}
                            title={isEmailBoldOptimized ? '원본 보기' : '가독성 최적화: 볼드 문법(**) → 굵은 글씨로 변환'}
                          >
                            {isEmailBoldOptimized ? (
                              <>
                                <Type className="w-3.5 h-3.5" />
                                원본
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5" />
                                가독성 최적화
                              </>
                            )}
                          </button>

                          {/* 럭셔리 미리보기 버튼 */}
                          <button
                            onClick={() => setIsEmailPreviewOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                                       bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-700"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            전체화면
                          </button>

                          {/* 복사 버튼 */}
                          <button
                            onClick={handleCopyEmail}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              isCopied
                                ? 'bg-green-500 text-white border-green-600'
                                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                복사됨!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                이메일 복사
                              </>
                            )}
                          </button>
                        </>
                      }

                      // 에디터 콘텐츠 (Monaco Editor)
                      editorContent={
                        <Editor
                          height="100%"
                          language="markdown"
                          theme="light"
                          value={emailBody || (() => {
                            // 초기값: getCleanBody()에서 HTML을 마크다운 형태로 정리
                            const raw = getCleanBody();
                            return raw
                              .replace(/<br\s*\/?>/gi, '\n')
                              .replace(/<\/p>/gi, '\n\n')
                              .replace(/<p[^>]*>/gi, '')
                              .replace(/<[^>]+>/gi, '');
                          })()}
                          onChange={handleEmailMonacoChange}
                          onMount={handleEmailEditorMount}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 15,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 24, bottom: 100 },
                            renderLineHighlight: 'line',
                            lineHeight: 28,
                          }}
                        />
                      }

                      // 프리뷰 콘텐츠
                      previewContent={
                        <div className="p-8" style={{ paddingBottom: '120px' }}>
                          {/* 이메일 본문 프리뷰 */}
                          <div
                            className="prose prose-slate max-w-none"
                            style={{ fontSize: '15px', lineHeight: '1.7' }}
                            dangerouslySetInnerHTML={{ __html: getEmailPreviewHtml() }}
                          />

                          {/* CTA 버튼 미리보기 */}
                          {currentStepData && (() => {
                            const buttonText = currentStepData.cta_text && currentStepData.cta_text.trim()
                              ? currentStepData.cta_text
                              : STEP_CTA_TEXTS[activeStep] || '리포트 확인하기';
                            const previewUrl = generateStepReportUrl(activeStep);

                            return (
                              <div className="mt-10 pt-8 border-t border-zinc-200">
                                <div className="mb-4">
                                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" /> CTA 버튼
                                  </span>
                                </div>
                                <div className="flex justify-center py-8 px-6 bg-zinc-50 rounded-xl">
                                  <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-7 py-3.5 bg-[#1A1A1A] text-white font-semibold rounded-lg transition-all hover:bg-[#2A2A2A] hover:shadow-lg"
                                    style={{ letterSpacing: '-0.02em', fontWeight: 600, fontSize: '15px' }}
                                  >
                                    {buttonText}
                                  </a>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      }
                    />
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Tab - 전체 너비 활용 */}
          {activeTab === 'report' && (
              <div className="flex-1 flex flex-col overflow-hidden w-full max-w-[1400px] mx-auto px-10 md:px-12 pb-10 mt-6">
                {/* 콘텐츠 영역 */}
                <div
                  className={`flex-1 flex overflow-hidden bg-white border border-zinc-200 rounded-2xl shadow-sm ${
                    reportViewMode === 'split' ? 'flex-row' : ''
                  } max-h-full`}
                >
                  {/* 분할 뷰 왼쪽 (에디터) */}
                  {reportViewMode === 'split' && (
                    <div className={`flex flex-col flex-1 overflow-hidden ${reportViewMode === 'split' ? 'border-r border-zinc-200' : ''}`}>
                      {reportViewMode === 'split' && (
                        <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 shrink-0">
                          <span className="text-base font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Pencil className="w-3 h-3" /> 편집
                          </span>
                        </div>
                      )}
                      <div ref={editorContainerRef} className="flex-1 min-h-0 relative h-full">
                        {/* 플로팅 포맷 툴바 */}
                        <FloatingToolbar
                          editorInstance={editorInstance}
                          containerRef={editorContainerRef}
                        />
                        <Editor
                          height="100%"
                          language="markdown"
                          theme="light"
                          value={reportMarkdown || currentStepData?.report_markdown || '# 리포트 작성\n\n여기에 마크다운으로 리포트를 작성하세요...'}
                          onChange={(value) => handleReportMarkdownChange(value || '')}
                          onMount={handleEditorMount}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 15,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 24, bottom: 100 },
                            renderLineHighlight: 'line',
                            lineHeight: 28,
                          }}
                        />
                        
                      </div>
                    </div>
                  )}

                  {/* 애플 스타일 플로팅 단축키 가이드 */}
                  <AnimatePresence>
                    {isShortcutsGuideOpen && reportViewMode === 'split' && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute bottom-16 right-2 z-20 w-80"
                        onClick={(e) => e.stopPropagation()}
                        onMouseLeave={() => setIsShortcutsGuideOpen(false)}
                      >
                        <div 
                          className="shortcuts-guide-container bg-black/40 backdrop-blur-xl border-t border-white/10 rounded-2xl shadow-2xl p-5"
                          style={{ backgroundColor: 'rgba(23, 23, 23, 0.6)', backdropFilter: 'blur(20px)' }}
                        >
                          {/* 타이틀 */}
                          <div className="mb-4">
                            <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">SHORTCUTS</span>
                          </div>

                          {/* 단축키 목록 */}
                          <div className="space-y-3">
                            {/* 굵게 */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <Keyboard className="w-4 h-4 text-white/70" />
                                <span className="text-sm text-white font-medium">굵게</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <kbd className="px-2.5 py-1.5 bg-neutral-800/90 border border-white/10 rounded-md text-xs font-semibold text-white shadow-sm text-center min-w-[2.5rem]">Ctrl</kbd>
                                <span className="text-white/60 text-xs font-medium">+</span>
                                <kbd className="px-2.5 py-1.5 bg-neutral-800/90 border border-white/10 rounded-md text-xs font-semibold text-white shadow-sm text-center min-w-[2rem]">B</kbd>
                              </div>
                            </div>

                            {/* 기울임 */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <Keyboard className="w-4 h-4 text-white/70" />
                                <span className="text-sm text-white font-medium">기울임</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <kbd className="px-2.5 py-1.5 bg-neutral-800/90 border border-white/10 rounded-md text-xs font-semibold text-white shadow-sm text-center min-w-[2.5rem]">Ctrl</kbd>
                                <span className="text-white/60 text-xs font-medium">+</span>
                                <kbd className="px-2.5 py-1.5 bg-neutral-800/90 border border-white/10 rounded-md text-xs font-semibold text-white shadow-sm text-center min-w-[2rem]">I</kbd>
                              </div>
                            </div>

                            {/* 링크 */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <Keyboard className="w-4 h-4 text-white/70" />
                                <span className="text-sm text-white font-medium">링크</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <kbd className="px-2.5 py-1.5 bg-neutral-800/90 border border-white/10 rounded-md text-xs font-semibold text-white shadow-sm text-center min-w-[2.5rem]">Ctrl</kbd>
                                <span className="text-white/60 text-xs font-medium">+</span>
                                <kbd className="px-2.5 py-1.5 bg-neutral-800/90 border border-white/10 rounded-md text-xs font-semibold text-white shadow-sm text-center min-w-[2rem]">K</kbd>
                              </div>
                            </div>
                          </div>

                          {/* 설명 문구 */}
                          <p className="text-xs text-white/70 mt-4 pt-4 border-t border-white/10 leading-relaxed">
                            텍스트 선택 시 포맷 툴바가 표시됩니다
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 프리뷰 모드 또는 분할 뷰 오른쪽 */}
                  {(reportViewMode === 'preview' || reportViewMode === 'split') && (
                    <div className={`flex flex-col flex-1 overflow-hidden relative ${reportViewMode === 'split' ? '' : ''}`}>
                      {reportViewMode === 'split' && (
                        <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 shrink-0">
                          <span className="text-base font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye className="w-3 h-3" /> 프리뷰
                          </span>
                        </div>
                      )}
                      <div
                        ref={previewRef}
                        onScroll={handlePreviewScroll}
                        className="flex-1 p-6 lg:p-8 overflow-y-auto prose prose-slate max-w-none relative"
                        style={{ paddingBottom: '200px' }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold text-zinc-900 border-b border-zinc-200 pb-3 mb-6 mt-0">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-semibold text-zinc-800 mt-8 mb-4 pb-2 border-b border-zinc-100">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-medium text-zinc-700 mt-6 mb-3">{children}</h3>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-6 rounded-lg border border-zinc-200">
                                <table className="min-w-full divide-y divide-zinc-200 text-sm">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-zinc-50">{children}</thead>,
                            th: ({ children }) => (
                              <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider whitespace-nowrap">{children}</th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 text-sm text-zinc-700 border-t border-zinc-100">{children}</td>
                            ),
                            tr: ({ children }) => <tr className="hover:bg-zinc-50 transition-colors">{children}</tr>,
                            strong: ({ children }) => <strong className="font-bold text-zinc-900">{children}</strong>,
                            em: ({ children }) => <em className="italic text-zinc-700">{children}</em>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-blue-500 pl-4 py-3 my-6 bg-blue-50 rounded-r-lg text-zinc-700 italic">{children}</blockquote>
                            ),
                            ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 my-4 text-zinc-700">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 my-4 text-zinc-700">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            p: ({ children }) => <p className="my-4 leading-relaxed text-zinc-700">{children}</p>,
                            a: ({ href, children }) => (
                              <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-sm text-red-600 font-mono">{children}</code>
                              ) : (
                                <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="bg-zinc-900 rounded-lg overflow-x-auto my-4">{children}</pre>,
                            hr: () => <hr className="my-8 border-zinc-200" />,
                          }}
                        >
                          {getPreviewContent()}
                        </ReactMarkdown>
                      </div>
                      {/* 단축키 가이드 토글 버튼 - 프리뷰 우측 하단 (스크롤 영역 밖, 고정 위치) */}
                      {reportViewMode === 'split' && (
                        <button
                          onClick={() => setIsShortcutsGuideOpen(!isShortcutsGuideOpen)}
                          onMouseEnter={() => setIsShortcutsGuideOpen(true)}
                          className="absolute bottom-2 right-2 z-10 w-16 h-16 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all shadow-lg"
                          title="단축키 가이드"
                        >
                          <HelpCircle className="w-8 h-8" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

        {/* [Right Panel] History & Preview */}
        <aside
          className={`border-l border-[#222] bg-[#0A0A0A] flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isHistoryOpen ? 'w-[340px] translate-x-0' : 'w-0 translate-x-full border-none'}`}
        >
          <div className="px-6 py-5 border-b border-[#222] bg-[#0A0A0A] flex justify-between items-center whitespace-nowrap overflow-hidden">
            <h2 className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> 히스토리
            </h2>
            <button onClick={() => setIsHistoryOpen(false)} className="p-1 text-zinc-500 hover:text-white transition-colors rounded hover:bg-[#1C1C1E]" title="닫기">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Report Preview Button - Step별 동적 URL */}
            <div className="p-5 border border-[#333] rounded-xl bg-[#1C1C1E]/30">
              <button
                onClick={() => window.open(generateStepReportUrl(activeStep), '_blank')}
                className="w-full h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <FileText className="w-5 h-5" />
                Step {activeStep} 리포트 미리보기
              </button>
              <p className="text-xs text-zinc-500 mt-3 text-center leading-relaxed">
                고객이 보게 될 Step {activeStep} 리포트를 새 탭에서 확인
              </p>
            </div>

            {/* History List */}
            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">📝 이전 발송 내역</h3>
              
              {allStepsData.map((stepData, index) => (
                <div key={stepData.id} className="mb-4 p-4 border border-[#333] rounded-xl bg-[#1C1C1E]/20 hover:bg-[#1C1C1E]/40 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold text-white">Step {stepData.step_number}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      stepData.step_number === activeStep 
                        ? 'bg-white text-black font-bold' 
                        : 'bg-[#333] text-zinc-400'
                    }`}>
                      {stepData.step_number === activeStep ? '현재' : stepData.theme}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(stepData.created_at).toLocaleDateString('ko-KR')} 생성
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* ============================================
          럭셔리 리포트 프리뷰 모달 (몰입형)
          ============================================ */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
              backdropFilter: 'blur(20px) brightness(0.5)',
              WebkitBackdropFilter: 'blur(20px) brightness(0.5)',
            }}
            onClick={() => setIsReportModalOpen(false)}
          >
            {/* 럭셔리 페이퍼 컨테이너 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl overflow-hidden flex flex-col"
              style={{
                width: '840px',
                maxWidth: '95vw',
                maxHeight: '92vh',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors group"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-zinc-500 group-hover:text-zinc-700 transition-colors" />
              </button>

              {/* 스크롤 가능한 본문 영역 */}
              <div className="flex-1 overflow-y-auto px-20 py-16">
                {/* 리포트 콘텐츠 렌더링 */}
                {(() => {
                  // 분할 프리뷰와 동일한 콘텐츠 사용 (볼드 최적화 포함)
                  const safeContent = getPreviewContent();

                  // CTA 패턴 감지 함수
                  const isCTAContent = (text: string): boolean => {
                    if (!text || typeof text !== 'string') return false;
                    const ctaPatterns = [
                      /👉/,
                      /누수\s*지점\s*정밀\s*분석서/,
                      /신청하기/,
                      /상담.*?신청/,
                      /로드맵.*?이행/,
                      /전사적.*?매출.*?환수/,
                      /열람하기/,
                      /확인하기/,
                    ];
                    return ctaPatterns.some(pattern => pattern.test(text));
                  };

                  // URL 추출 함수 (본문에서 consultation URL 추출)
                  const extractConsultationUrl = (content: string): string | null => {
                    // 1. currentStepData에서 직접 가져오기
                    if (currentStepData?.consultation_url) {
                      return currentStepData.consultation_url;
                    }
                    // 2. 본문에서 URL 추출 시도
                    const urlMatch = content.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
                    if (urlMatch && urlMatch[1]) {
                      return urlMatch[1];
                    }
                    // 3. report_url 폴백
                    if (currentStepData?.report_url) {
                      return currentStepData.report_url;
                    }
                    return null;
                  };

                  const consultationUrl = extractConsultationUrl(safeContent);

                  if (!safeContent.trim()) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <FileText className="w-16 h-16 text-zinc-200 mb-6" />
                        <h3 className="text-xl font-semibold text-zinc-400 mb-2">리포트가 없습니다</h3>
                        <p className="text-sm text-zinc-400">아직 생성된 리포트 데이터가 없습니다.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <article className="luxury-report-prose max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            h1: ({ children }) => (
                              <h1
                                className="text-[2rem] font-bold text-zinc-900 mb-10 pb-6 border-b-2 border-zinc-200"
                                style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
                              >
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2
                                className="text-[1.5rem] font-semibold text-zinc-800 mt-12 mb-6 pb-3 border-b border-zinc-100"
                                style={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}
                              >
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3
                                className="text-[1.25rem] font-semibold text-zinc-700 mt-8 mb-4"
                                style={{ letterSpacing: '-0.005em', lineHeight: 1.4 }}
                              >
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => {
                              // CTA 패턴이 포함된 단락은 숨김 처리
                              const textContent = typeof children === 'string'
                                ? children
                                : Array.isArray(children)
                                  ? children.map(c => typeof c === 'string' ? c : '').join('')
                                  : '';

                              if (isCTAContent(textContent)) {
                                return null; // CTA 단락 숨김
                              }

                              return (
                                <p
                                  className="text-[1.0625rem] text-zinc-600 my-5"
                                  style={{ letterSpacing: '0.01em', lineHeight: 1.9 }}
                                >
                                  {children}
                                </p>
                              );
                            },
                            strong: ({ children }) => (
                              <strong className="font-bold text-zinc-900">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-zinc-700">{children}</em>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-6 space-y-3 my-6 text-zinc-600" style={{ lineHeight: 1.8 }}>{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-6 space-y-3 my-6 text-zinc-600" style={{ lineHeight: 1.8 }}>{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-[1.0625rem]" style={{ letterSpacing: '0.01em' }}>{children}</li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-blue-500 pl-6 py-4 my-8 bg-blue-50/50 rounded-r-xl text-zinc-700 italic">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-8 rounded-xl border border-zinc-200 shadow-sm">
                                <table className="min-w-full divide-y divide-zinc-200">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-zinc-50">{children}</thead>,
                            th: ({ children }) => (
                              <th className="px-5 py-3 text-left text-xs font-bold text-zinc-600 uppercase tracking-wider">{children}</th>
                            ),
                            td: ({ children }) => (
                              <td className="px-5 py-4 text-sm text-zinc-700 border-t border-zinc-100">{children}</td>
                            ),
                            tr: ({ children }) => <tr className="hover:bg-zinc-50 transition-colors">{children}</tr>,
                            a: ({ href, children }) => {
                              // CTA 링크 감지 및 숨김 처리
                              const linkText = typeof children === 'string'
                                ? children
                                : Array.isArray(children)
                                  ? children.map(c => typeof c === 'string' ? c : '').join('')
                                  : '';

                              // CTA 패턴 링크는 숨김 (하단에 별도 버튼으로 표시)
                              if (isCTAContent(linkText) || href?.includes('consultation')) {
                                return null;
                              }

                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                                >
                                  {children}
                                </a>
                              );
                            },
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-zinc-100 px-2 py-1 rounded text-sm text-red-600 font-mono">{children}</code>
                              ) : (
                                <code className="block bg-zinc-900 text-zinc-100 p-5 rounded-xl overflow-x-auto text-sm font-mono">{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="bg-zinc-900 rounded-xl overflow-x-auto my-6">{children}</pre>,
                            hr: () => <hr className="my-12 border-zinc-200" />,
                          }}
                        >
                          {safeContent}
                        </ReactMarkdown>
                      </article>

                      {/* 럭셔리 CTA 버튼 - 리포트 하단 */}
                      {consultationUrl && (
                        <div className="flex justify-center mt-16 mb-8 pt-8 border-t border-gray-100">
                          <a
                            href={consultationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-3
                                       bg-slate-800 hover:bg-slate-700 active:bg-slate-900
                                       text-white font-medium text-base
                                       py-4 px-8 rounded-lg
                                       shadow-lg hover:shadow-xl
                                       transform hover:scale-[1.02] active:scale-[0.98]
                                       transition-all duration-200 ease-out"
                          >
                            {prospect?.store_name
                              ? `${prospect.store_name} 전사적 매출 환수 로드맵 상담 신청하기`
                              : '전사적 매출 환수 로드맵 상담 신청하기'
                            }
                          </a>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          이메일 미리보기 모달
          ============================================ */}
      <EmailPreviewModal
        isOpen={isEmailPreviewOpen}
        onClose={() => setIsEmailPreviewOpen(false)}
        recipient={prospect?.store_name || prospect?.name || '고객'}
        subject={selectedSubjectText}
        body={getEmailPreviewContent()}
        ctaUrl={generateStepReportUrl(activeStep)}
        ctaText={currentStepData?.cta_text?.trim() || STEP_CTA_TEXTS[activeStep] || '리포트 확인하기'}
        onCopyEmail={handleCopyEmail}
      />
    </div>
  )
}
