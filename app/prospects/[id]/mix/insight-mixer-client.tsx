'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { GeneratedEmail } from '@/types/generated-email';
import {
  Mail, FileText, Send, Save, ArrowLeft, Sparkles, ChevronDown, ChevronRight,
  Plus, X, Folder, FolderOpen, Trash2, Edit2, Check, LayoutTemplate, HelpCircle, FileOutput, ShieldCheck, Clock,
  BarChart2, TrendingUp, TrendingDown, Search, Zap, Link as LinkIcon, Target, Map, MousePointer2, CheckCircle2, Cpu, Coins, UserCheck, Navigation
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';

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
          // 5개 제목이 오면 5개 카테고리에 순서대로 1:1 매핑
          categories.forEach((catKey, idx) => {
            subjectOptions[catKey] = [parsed[idx]];
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

  const currentBodyHtml = getCleanBody();
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

  useEffect(() => {
    if (currentStepData?.report_markdown) {
      setReportMarkdown(currentStepData.report_markdown);
    } else {
      setReportMarkdown('');
    }
  }, [currentStepData]);

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
    <div className="h-screen w-full bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden selection:bg-blue-500/30">

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
          <button className="h-9 px-4 rounded-lg border border-[#333] bg-transparent text-xs font-medium text-zinc-400 hover:bg-[#1C1C1E] hover:text-white transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> <span>임시 저장</span>
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
          
          {/* Sticky Header Area: Navigator + Mode Switcher */}
          <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-[#111] px-10 md:px-12 py-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
              {/* Step Navigator */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((step) => {
                  const hasData = allStepsData.some(d => d.step_number === step);
                  const isActive = activeStep === step;
                  return (
                    <button
                      key={step}
                      onClick={() => { setActiveStep(step); }}
                      className={`h-11 px-6 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${isActive ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' : hasData ? 'bg-[#111] text-zinc-400 border-[#333] hover:border-zinc-500 hover:text-zinc-200' : 'bg-[#0A0A0A] text-zinc-800 border-[#222] cursor-not-allowed'}`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${isActive ? 'bg-black text-white' : 'bg-[#222] text-zinc-600'}`}>{step}</span>
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
          </div>

          <div className="flex-1 overflow-y-auto p-10 md:px-12 md:py-8 no-scrollbar">
            <div className="max-w-[1400px] mx-auto space-y-8">

              {activeTab === 'email' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">

                  {/* Subject Picker */}
                  <div className="space-y-5">
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-blue-500" /> Subject Options
                    </label>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {STEP_SUBJECT_CATEGORIES[activeStep] && Object.keys(STEP_SUBJECT_CATEGORIES[activeStep]).map((key) => {
                        const category = STEP_SUBJECT_CATEGORIES[activeStep][key];
                        const Icon = category.icon;
                        return (
                          <button key={key} onClick={() => setActiveSubjectCategory(key)} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all border whitespace-nowrap ${activeSubjectCategory === key ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-[#111] text-zinc-500 border-[#222] hover:border-zinc-700 hover:text-zinc-300'}`}>
                            <Icon className="w-4 h-4" />{category.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {currentCategorySubjects.length > 0 ? (
                        currentCategorySubjects.map((originalSubject, idx) => {
                          const displaySubject = getDisplaySubject(idx, originalSubject);
                          const isSelected = selectedSubjectText === displaySubject;

                          return (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedSubjectText(displaySubject)} 
                              className={`group px-6 py-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-[#1C1C1E] border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-[#0F0F0F] border-[#222] hover:border-zinc-600'}`}
                            >
                              <div className="flex-1 mr-4">
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  className={`text-base font-medium outline-none ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                                  onInput={(e) => handleSubjectEdit(idx, e.currentTarget.innerText)}
                                  onClick={(e) => e.stopPropagation()} 
                                >
                                  {displaySubject}
                                </div>
                              </div>
                              {isSelected && <Check className="w-5 h-5 text-blue-500 shrink-0" />}
                            </div>
                          );
                        })
                      ) : <div className="p-6 rounded-xl border border-[#222] bg-[#0F0F0F] text-zinc-600 text-sm text-center">제목 없음</div>}
                    </div>
                  </div>

                  {/* Body Editor (Drop Target) */}
                  <div className="space-y-5">
                      <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" /> Body Content
                      </label>

                    <div
                      className={`
                        min-h-[500px] bg-[#0F0F0F] border rounded-2xl p-10 transition-all shadow-inner relative
                        ${draggedAsset ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20' : 'border-[#222] focus-within:border-zinc-600'}
                      `}
                      onDragOver={handleEditorDragOver}
                      onDrop={handleEditorDrop}
                    >
                      {/* Drag Overlay Hint */}
                      {draggedAsset && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl pointer-events-none z-10">
                          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">
                            <Plus className="w-4 h-4" /> 여기에 놓기
                          </div>
                        </div>
                      )}

                      <div
                        ref={editorRef}
                        className="text-lg text-zinc-300 leading-8 font-light outline-none prose prose-invert max-w-none prose-p:my-4 prose-strong:text-white prose-strong:font-bold prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6"
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: currentBodyHtml }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Report Tab */}
              {activeTab === 'report' && (
                <div className="h-[700px] bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-2xl">
                  <Editor
                    height="100%"
                    language="markdown"
                    theme="vs-dark"
                    value={reportMarkdown || currentStepData?.report_markdown || '# 리포트 작성\n\n여기에 마크다운으로 리포트를 작성하세요...'}
                    onChange={(value) => setReportMarkdown(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 }
                    }}
                  />
                </div>
              )}

            </div>
          </div>
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
            {/* Report Preview Button */}
            <div className="p-5 border border-[#333] rounded-xl bg-[#1C1C1E]/30">
              <button
                onClick={() => window.open(`/r/${prospectId}`, '_blank')}
                className="w-full h-14 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <FileText className="w-5 h-5" />
                리포트 미리보기
              </button>
              <p className="text-xs text-zinc-500 mt-3 text-center leading-relaxed">
                고객이 보게 될 최종 페이지를 새 탭에서 확인
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
    </div>
  )
}
