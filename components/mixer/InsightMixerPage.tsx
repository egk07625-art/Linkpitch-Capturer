'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Send,
  Sparkles,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Paperclip,
  Copy,
  RefreshCw,
  LayoutTemplate,
  Check,
  PlayCircle,
  MousePointerClick,
  MessageSquare,
} from 'lucide-react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import type { Prospect, VisionData } from '@/types/prospect';
import type { UserAsset } from '@/types/user-asset';
import type { GeneratedEmail, EmailSubjects } from '@/types/generated-email';

interface InsightMixerPageProps {
  prospectId: string;
  prospect: Prospect;
  visionData: VisionData | null;
  initialUserAssets: UserAsset[];
  initialGeneratedEmails: GeneratedEmail[];
}

// 이니셜 추출 헬퍼
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// Subject Strategy 타입 정의
const subjectTypes: Record<string, { label: string; emoji: string; color: string }> = {
  metric_direct: { label: '지표 직격', emoji: '📊', color: 'blue' },
  soft_fomo: { label: 'FOMO', emoji: '⏰', color: 'orange' },
  curiosity: { label: '호기심', emoji: '🤔', color: 'purple' },
  report_bait: { label: '리포트', emoji: '📋', color: 'green' },
  plain_trust: { label: '신뢰', emoji: '🤝', color: 'gray' },
};

// 전략 칩 데이터
const strategyChips = [
  { id: 'c1', text: '🎯 경쟁사 분석', type: 'text' },
  { id: 'c2', text: '📈 데이터 근거', type: 'text' },
  { id: 'c3', text: '💰 비용 절감', type: 'text' },
  { id: 'c4', text: '🚀 성장 사례', type: 'text' },
];

// Draggable Chip Component
function DraggableChip({ chip }: { chip: { id: string; text: string; type: string } }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: chip.id,
    data: { type: 'chip', content: chip.text },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="px-3 py-1.5 bg-[#1C1C1E] border border-[#333] rounded-full text-xs text-zinc-300 cursor-grab hover:border-zinc-500 transition-colors flex items-center gap-1.5"
    >
      <Sparkles className="w-3 h-3 text-yellow-500" />
      {chip.text}
    </div>
  );
}

// Draggable Asset Component
function DraggableAsset({ asset }: { asset: UserAsset }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: asset.id,
    data: { type: 'asset', content: asset },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group relative aspect-square bg-zinc-900 border border-[#333] rounded-xl overflow-hidden cursor-grab hover:border-zinc-600 transition-colors"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {asset.file_type.startsWith('image') ? (
          asset.file_url ? (
            <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-zinc-600" />
          )
        ) : (
          <FileText className="w-6 h-6 text-zinc-600" />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm">
        <p className="text-[10px] text-zinc-300 truncate">{asset.file_name}</p>
      </div>
    </div>
  );
}

// Droppable Editor Area
function DroppableEditor({
  children,
  onDrop,
}: {
  children: React.ReactNode;
  onDrop: (data: any) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'email-editor',
    data: { type: 'editor' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver ? 'ring-2 ring-blue-500/50' : ''}`}
    >
      {children}
    </div>
  );
}

// email_subjects를 구조화된 형태로 변환
interface StructuredEmailSubjects {
  metric_direct?: string[];
  soft_fomo?: string[];
  curiosity?: string[];
  report_bait?: string[];
  plain_trust?: string[];
}

function emailSubjectsToStructured(
  emailSubjects: EmailSubjects | undefined
): StructuredEmailSubjects {
  if (!emailSubjects || typeof emailSubjects !== 'object') {
    return {};
  }

  const structured: StructuredEmailSubjects = {};

  // 키 이름에 타입이 포함되어 있는지 확인
  Object.entries(emailSubjects).forEach(([key, value]) => {
    if (typeof value !== 'string') return;

    // 키 이름으로 타입 추론
    if (key.includes('metric') || key.includes('direct')) {
      if (!structured.metric_direct) structured.metric_direct = [];
      structured.metric_direct.push(value);
    } else if (key.includes('fomo')) {
      if (!structured.soft_fomo) structured.soft_fomo = [];
      structured.soft_fomo.push(value);
    } else if (key.includes('curiosity') || key.includes('호기심')) {
      if (!structured.curiosity) structured.curiosity = [];
      structured.curiosity.push(value);
    } else if (key.includes('report') || key.includes('리포트')) {
      if (!structured.report_bait) structured.report_bait = [];
      structured.report_bait.push(value);
    } else if (key.includes('trust') || key.includes('신뢰')) {
      if (!structured.plain_trust) structured.plain_trust = [];
      structured.plain_trust.push(value);
    } else {
      // 기본값으로 metric_direct에 추가
      if (!structured.metric_direct) structured.metric_direct = [];
      structured.metric_direct.push(value);
    }
  });

  // 각 타입별로 최소 2개씩 채우기 (부족하면 복제)
  Object.keys(subjectTypes).forEach((type) => {
    const key = type as keyof StructuredEmailSubjects;
    if (!structured[key] || structured[key]!.length === 0) {
      structured[key] = [`샘플 제목 ${type}`];
    }
    // 최소 2개 보장
    while (structured[key]!.length < 2) {
      structured[key]!.push(structured[key]![0] + ' (변형)');
    }
  });

  return structured;
}

// Step 테마 가져오기
function getStepTheme(stepNumber: number, generatedEmails: GeneratedEmail[]): string {
  const step = generatedEmails.find((e) => e.step_number === stepNumber);
  return step?.theme || `Step ${stepNumber}`;
}

export default function InsightMixerPage({
  prospectId,
  prospect,
  visionData,
  initialUserAssets,
  initialGeneratedEmails,
}: InsightMixerPageProps) {
  // Step Navigation: 최대 5개 Step만 표시
  const steps = useMemo(() => {
    if (!initialGeneratedEmails || initialGeneratedEmails.length === 0) {
      return [];
    }
    const sorted = [...initialGeneratedEmails]
      .sort((a, b) => a.step_number - b.step_number)
      .slice(0, 5);
    return sorted;
  }, [initialGeneratedEmails]);

  const [activeStep, setActiveStep] = useState(() => {
    if (steps.length > 0) {
      return steps[0].step_number;
    }
    return 1;
  });
  const [activeTab, setActiveTab] = useState<'email' | 'report'>('email');
  const [selectedSubjectType, setSelectedSubjectType] = useState('metric_direct');
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [selectedBodyType, setSelectedBodyType] = useState<'solopreneur' | 'corporate'>('solopreneur');
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [copiedSteps, setCopiedSteps] = useState(new Set<string>());
  const [editorContent, setEditorContent] = useState<string>('');

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const draggedData = active.data.current;
    if (!draggedData) return;

    // Editor 영역에 드롭된 경우
    if (over.id === 'email-editor') {
      console.log('[InsightMixerPage] 드래그 앤 드롭:', draggedData);
      
      // TODO: Server Action으로 재생성 요청
      // await regenerateStepAction({
      //   step_id: currentStep?.id,
      //   asset_id: draggedData.type === 'asset' ? draggedData.content.id : undefined,
      //   chip_text: draggedData.type === 'chip' ? draggedData.content : undefined,
      // });

      // 임시로 에디터에 마커 추가
      if (draggedData.type === 'chip') {
        const marker = `\n\n[ 📷 여기에 (${draggedData.content}) 이미지를 붙여넣으세요 ]\n\n`;
        setEditorContent((prev) => prev + marker);
      } else if (draggedData.type === 'asset') {
        const marker = `\n\n[ 📷 여기에 (${draggedData.content.file_name}) 이미지를 붙여넣으세요 ]\n\n`;
        setEditorContent((prev) => prev + marker);
      }
    }
  };

  // 현재 활성 Step 데이터
  const currentStep = useMemo(() => {
    if (steps.length === 0) return null;
    return steps.find((s) => s.step_number === activeStep) || steps[0] || null;
  }, [steps, activeStep]);

  // 구조화된 email_subjects
  const structuredSubjects = useMemo(() => {
    if (!currentStep) return {};
    return emailSubjectsToStructured(currentStep.email_subjects);
  }, [currentStep]);

  // 현재 선택된 Subject
  const currentSubject = useMemo(() => {
    if (!currentStep) return '';
    const subjects = structuredSubjects[selectedSubjectType as keyof StructuredEmailSubjects];
    return subjects?.[selectedSubjectIndex] || '';
  }, [structuredSubjects, selectedSubjectType, selectedSubjectIndex, currentStep]);

  // 현재 선택된 Body (에디터 내용이 있으면 우선 사용)
  const currentBody = useMemo(() => {
    if (editorContent) {
      return editorContent;
    }
    if (!currentStep) return '';
    if (selectedBodyType === 'solopreneur') {
      return currentStep.email_body_solopreneur || '';
    }
    return currentStep.email_body_corporate || '';
  }, [currentStep, selectedBodyType, editorContent]);

  // Step 변경 시 에디터 내용 초기화
  React.useEffect(() => {
    if (!currentStep) {
      setEditorContent('');
      return;
    }
    if (selectedBodyType === 'solopreneur') {
      setEditorContent(currentStep.email_body_solopreneur || '');
    } else {
      setEditorContent(currentStep.email_body_corporate || '');
    }
  }, [currentStep, selectedBodyType]);

  // 리포트 HTML
  const reportHtml = useMemo(() => {
    return currentStep?.report_html || '';
  }, [currentStep]);

  const displayName = prospect.store_name || prospect.name;
  const contactName = prospect.contact_name || displayName;
  const crmStatus = prospect.crm_status || 'cold';

  // 임시 저장 핸들러
  const handleSave = () => {
    console.log('[InsightMixerPage] 임시 저장 클릭');
    // TODO: Server Action 연결
  };

  // 발송 핸들러
  const handleSend = () => {
    console.log('[InsightMixerPage] 발송하기 클릭');
    // TODO: Server Action 연결
  };

  // 복사 및 발송 완료 처리
  const handleCopyAndComplete = () => {
    if (!currentStep) {
      console.warn('[InsightMixerPage] 현재 Step이 없습니다.');
      return;
    }

    // 클립보드에 복사
    const emailContent = `제목: ${currentSubject || '(제목 없음)'}\n\n${currentBody || '(본문 없음)'}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(emailContent).then(() => {
        console.log('[InsightMixerPage] 클립보드에 복사됨');
        setCopiedSteps(new Set([...copiedSteps, currentStep.id]));
        // TODO: Server Action으로 상태 업데이트
      }).catch((err) => {
        console.error('[InsightMixerPage] 클립보드 복사 실패:', err);
      });
    } else {
      console.warn('[InsightMixerPage] 클립보드 API를 사용할 수 없습니다.');
    }
  };

  // Step이 없을 때 처리
  if (steps.length === 0) {
    return (
      <div className="h-screen w-full bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#2C2C2E] bg-[#0A0A0A] flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <Link
              href="/prospects"
              className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#2C2C2E] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-6 w-[1px] bg-[#333]" />
            <h1 className="text-sm font-bold text-white">{displayName}</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-2">생성된 이메일이 없습니다.</p>
            <p className="text-sm text-zinc-500">먼저 시퀀스를 생성해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen w-full bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden">
      {/* ---------------------------------------------------------------------- */}
      {/* [1] Header: 작업 맥락 & 상태 표시 */}
      {/* ---------------------------------------------------------------------- */}
      <header className="h-16 border-b border-[#2C2C2E] bg-[#0A0A0A] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/prospects"
            className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#2C2C2E] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-[1px] bg-[#333]" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-xs font-bold text-zinc-400 border border-[#333]">
              {getInitial(contactName)}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                {displayName}
                {prospect.category && (
                  <>
                    {' '}
                    <span className="text-zinc-500 font-normal">・ {prospect.category}</span>
                  </>
                )}
              </h1>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    crmStatus === 'hot'
                      ? 'bg-rose-500'
                      : crmStatus === 'warm'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  }`}
                />
                <span className="text-[10px] text-zinc-400 font-medium capitalize">
                  {crmStatus} Lead
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="h-9 px-4 rounded-lg border border-[#333] bg-[#161618] text-sm font-medium text-zinc-300 hover:bg-[#2C2C2E] transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>임시 저장</span>
          </button>
          <button
            onClick={handleSend}
            className="h-9 px-5 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            <Send className="w-4 h-4" />
            <span>발송하기</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------------- */}
      {/* [2] Main Workspace: 3-Column Layout */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* (A) Left Panel: Asset Library */}
        <aside className="w-[320px] border-r border-[#2C2C2E] bg-[#0A0A0A] flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-[#2C2C2E] bg-[#0F0F0F]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-blue-500" />
              나만의 무기고
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Strategy Chips */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                전략 토핑
              </p>
              <div className="flex flex-wrap gap-2">
                {strategyChips.map((chip) => (
                  <DraggableChip key={chip.id} chip={chip} />
                ))}
              </div>
            </div>

            {/* User Assets */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                업로드된 자료
              </p>
              <div className="grid grid-cols-2 gap-3">
                {initialUserAssets.slice(0, 4).map((asset) => (
                  <DraggableAsset key={asset.id} asset={asset} />
                ))}
                {/* Upload Placeholder */}
                <div className="aspect-square border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors cursor-pointer">
                  <Paperclip className="w-5 h-5 mb-1" />
                  <span className="text-[10px]">Upload</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* (B) Center Panel: The Editor (Main) */}
        <main className="flex-1 bg-[#050505] flex flex-col relative min-w-0">
          {/* Step Navigator */}
          <div className="h-16 border-b border-[#2C2C2E] flex items-center px-6 gap-2 bg-[#0A0A0A] overflow-x-auto no-scrollbar">
            {steps.map((step) => (
              <button
                key={step.step_number}
                onClick={() => setActiveStep(step.step_number)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                  activeStep === step.step_number
                    ? 'bg-white text-black border-white'
                    : 'bg-[#161618] text-zinc-500 border-[#333] hover:text-zinc-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    activeStep === step.step_number
                      ? 'bg-black text-white'
                      : 'bg-[#2C2C2E] text-zinc-400'
                  }`}
                >
                  {step.step_number}
                </span>
                <span>{step.theme || `Step ${step.step_number}`}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Mode Switcher */}
              <div className="flex justify-center mb-8">
                <div className="p-1 bg-[#161618] border border-[#333] rounded-xl flex">
                  <button
                    onClick={() => setActiveTab('email')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'email'
                        ? 'bg-[#2C2C2E] text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    ✉️ 이메일 (예고편)
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'report'
                        ? 'bg-[#2C2C2E] text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    📊 리포트 (본편)
                  </button>
                </div>
              </div>

              {activeTab === 'email' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Subject Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Subject Strategy
                      </label>
                      <div className="flex gap-2">
                        {Object.entries(subjectTypes).map(([key, info]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedSubjectType(key);
                              setSelectedSubjectIndex(0);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              selectedSubjectType === key
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-[#1C1C1E] text-zinc-500 border border-[#333]'
                            }`}
                          >
                            {info.emoji} {info.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {structuredSubjects[selectedSubjectType as keyof StructuredEmailSubjects] &&
                      structuredSubjects[selectedSubjectType as keyof StructuredEmailSubjects]!.length > 0 ? (
                        structuredSubjects[selectedSubjectType as keyof StructuredEmailSubjects]!.map(
                          (subject, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedSubjectIndex(idx)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedSubjectIndex === idx
                                  ? 'bg-blue-500/10 border-blue-500/50'
                                  : 'bg-[#161618] border-[#333] hover:border-zinc-600'
                              }`}
                            >
                              <p
                                className={`text-sm ${
                                  selectedSubjectIndex === idx ? 'text-white font-medium' : 'text-zinc-400'
                                }`}
                              >
                                {subject}
                              </p>
                            </div>
                          )
                        )
                      ) : (
                        <div className="p-4 rounded-xl border border-[#333] bg-[#161618] text-zinc-500 text-sm text-center">
                          제목 옵션이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Editor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Email Body
                      </label>
                      <div className="flex bg-[#161618] rounded-lg p-0.5 border border-[#333]">
                        <button
                          onClick={() => setSelectedBodyType('solopreneur')}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${
                            selectedBodyType === 'solopreneur'
                              ? 'bg-[#2C2C2E] text-white'
                              : 'text-zinc-500'
                          }`}
                        >
                          👤 대표님용
                        </button>
                        <button
                          onClick={() => setSelectedBodyType('corporate')}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${
                            selectedBodyType === 'corporate'
                              ? 'bg-[#2C2C2E] text-white'
                              : 'text-zinc-500'
                          }`}
                        >
                          👥 실무자용
                        </button>
                      </div>
                    </div>

                    <DroppableEditor onDrop={(data) => console.log('Drop:', data)}>
                      <div className="min-h-[300px] bg-[#161618] border border-[#333] rounded-2xl p-6 relative group focus-within:border-zinc-500 transition-colors">
                        <div
                          className="text-base text-zinc-300 leading-relaxed font-light outline-none"
                          contentEditable
                          onInput={(e) => {
                            const target = e.currentTarget;
                            setEditorContent(target.innerHTML);
                          }}
                          dangerouslySetInnerHTML={{ __html: currentBody }}
                        />
                        {/* Drag Hint */}
                        <div className="absolute inset-0 bg-blue-500/5 border-2 border-blue-500/30 border-dashed rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-blue-400 text-xs font-medium">
                            ✨ 이곳에 무기고의 재료를 드래그하세요
                          </p>
                        </div>
                      </div>
                    </DroppableEditor>
                  </div>
                </div>
              )}

              {activeTab === 'report' && (
                <div className="h-[500px] bg-[#161618] border border-[#333] rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="w-16 h-16 bg-[#2C2C2E] rounded-2xl flex items-center justify-center mb-6">
                    <LayoutTemplate className="w-8 h-8 text-zinc-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">리포트 빌더</h3>
                  <p className="text-zinc-500 text-sm max-w-sm">
                    왼쪽 <span className="text-white">나만의 무기고</span>에서 그래프, 영상, PDF를
                    <br />
                    이곳으로 끌어와 리포트를 풍성하게 만드세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* (C) Right Panel: Preview (Simulation) */}
        <aside className="w-[360px] border-l border-[#2C2C2E] bg-[#0A0A0A] flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-[#2C2C2E] flex justify-between items-center bg-[#0F0F0F]">
            <h2 className="text-sm font-bold text-white">미리보기</h2>
            <button className="text-xs text-blue-400 hover:text-blue-300">새 창으로 보기</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#000]">
            {/* Phone Frame */}
            <div className="w-full bg-white rounded-[32px] overflow-hidden border-[8px] border-[#2C2C2E] shadow-2xl relative">
              {/* Status Bar */}
              <div className="h-6 bg-white w-full flex justify-between px-4 items-center">
                <span className="text-[10px] font-bold text-black">9:41</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-black rounded-full" />
                </div>
              </div>

              {/* Content */}
              <div className="bg-slate-50 min-h-[500px] p-4">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                  <div className="flex gap-2 items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      LP
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">LinkPitch AI</p>
                      <p className="text-[10px] text-gray-500">방금 전</p>
                    </div>
                  </div>
                  {currentBody ? (
                    <div
                      className="text-sm text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: currentBody }}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 italic">이메일 본문이 없습니다.</p>
                  )}
                </div>

                {reportHtml && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-zinc-900 p-4">
                      <span className="text-[10px] text-yellow-400 font-bold">REPORT</span>
                      <p className="text-sm text-white font-bold mt-1">
                        {visionData?.report_title || `${displayName} 매출 분석`}
                      </p>
                    </div>
                    <div className="p-4">
                      <div
                        className="text-sm text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: reportHtml }}
                      />
                      <button className="w-full mt-4 py-2 bg-[#FEE500] rounded-lg text-xs font-bold text-black flex items-center justify-center gap-2">
                        <MessageSquare className="w-3 h-3" /> 카카오톡 상담하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#2C2C2E] bg-[#0A0A0A]">
            <button
              onClick={handleCopyAndComplete}
              className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                copiedSteps.has(currentStep?.id || '')
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {copiedSteps.has(currentStep?.id || '') ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>내용 복사 & 발송 완료 처리</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
    </DndContext>
  );
}
