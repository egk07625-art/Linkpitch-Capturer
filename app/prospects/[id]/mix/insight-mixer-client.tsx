'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client'; // 1. 만능 열쇠 가져오기
import { 
  ArrowLeft, Save, Send, Sparkles, FileText, 
  Image as ImageIcon, MoreHorizontal, Copy, RefreshCw, LayoutTemplate, 
  Paperclip, ArrowRight
} from 'lucide-react';

interface InsightMixerClientProps {
  prospectId: string;
}

export default function InsightMixerClient({ prospectId }: InsightMixerClientProps) {
  // --------------------------------------------------------
  // [상태 관리] 데이터가 들어올 그릇들
  // --------------------------------------------------------
  const [loading, setLoading] = useState(true); // 로딩 중인가?
  const [prospect, setProspect] = useState<any>(null); // 고객 정보
  const [aiData, setAiData] = useState<any>(null); // AI가 쓴 글
  
  // UI 상태
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'email' | 'report'>('email');
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [selectedBodyType, setSelectedBodyType] = useState('solopreneur');

  // --------------------------------------------------------
  // [핵심 로직] DB에서 진짜 데이터 가져오기 (useEffect)
  // --------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // (1) 고객 정보 가져오기 (이름, 카테고리 등)
      const { data: prospectData, error: prospectError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId) // URL의 id와 일치하는 녀석 찾기
        .single();

      if (prospectError) {
        console.error("고객 정보 로딩 실패:", prospectError);
      } else {
        setProspect(prospectData);
      }

      // (2) AI 생성 데이터 가져오기 (이메일 제목, 본문 등)
      // generated_emails 테이블에서 해당 고객의 데이터를 가져옴
      const { data: emailData, error: emailError } = await supabase
        .from('generated_emails')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false }); // 최신순

      if (emailError) {
        console.error("AI 데이터 로딩 실패:", emailError);
      } else if (emailData && emailData.length > 0) {
        // 가장 최신 데이터 하나를 사용
        setAiData(emailData[0]); 
      }

      setLoading(false); // 로딩 끝!
    };

    fetchData();
  }, [prospectId]);

  // --------------------------------------------------------
  // [예외 처리] 로딩 중이거나 데이터가 없을 때
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="h-screen w-full bg-[#050505] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-zinc-500">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return <div className="h-screen w-full bg-black text-white p-10">고객 정보를 찾을 수 없습니다.</div>;
  }

  // --------------------------------------------------------
  // [데이터 매핑] DB 데이터를 UI 변수에 연결 (Data Binding)
  // --------------------------------------------------------
  
  // 만약 AI 데이터가 아직 없으면(스캔 전이면) 기본값 표시
  const subjectOptions = aiData?.email_subjects || { metric_direct: ["아직 생성된 제목이 없습니다.", "스캔을 진행해주세요."] };
  const bodyOptions = {
    solopreneur: aiData?.email_body_solopreneur || "아직 생성된 본문이 없습니다. AI 분석을 먼저 진행해주세요.",
    corporate: aiData?.email_body_corporate || "아직 생성된 본문이 없습니다."
  };
  const reportHtml = aiData?.report_html_editable || "<p>아직 생성된 리포트가 없습니다.</p>";

  // 현재 선택된 제목 (기본값: metric_direct 타입의 첫 번째)
  const currentSubjects = subjectOptions['metric_direct'] || []; 

  return (
    <div className="h-screen w-full bg-[#050505] text-zinc-100 font-sans flex flex-col overflow-hidden">
      
      {/* [1] Header */}
      <header className="h-16 border-b border-[#2C2C2E] bg-[#0A0A0A] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/prospects" className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-white hover:bg-[#2C2C2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-[1px] bg-[#333]" />
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-xs font-bold text-zinc-400 border border-[#333]">
                {prospect.name.charAt(0)}
             </div>
             <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                   {prospect.store_name || prospect.name} 
                   <span className="text-zinc-500 font-normal">・ {prospect.category || "카테고리 미정"}</span>
                </h1>
                <div className="flex items-center gap-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${prospect.crm_status === 'Hot' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                   <span className="text-[10px] text-zinc-400 font-medium capitalize">{prospect.crm_status || 'Cold'} Lead</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button className="h-9 px-4 rounded-lg border border-[#333] bg-[#161618] text-sm font-medium text-zinc-300 hover:bg-[#2C2C2E] transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>임시 저장</span>
           </button>
           <button className="h-9 px-5 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              <Send className="w-4 h-4" />
              <span>발송하기</span>
           </button>
        </div>
      </header>

      {/* [2] Workspace */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* (A) Left Panel: Asset Library */}
         <aside className="w-[320px] border-r border-[#2C2C2E] bg-[#0A0A0A] flex flex-col shrink-0">
            <div className="px-5 py-4 border-b border-[#2C2C2E] bg-[#0F0F0F]">
               <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-blue-500" />
                  나만의 무기고
               </h2>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-zinc-500 text-sm">
               <p>AI 분석 결과가 이곳에 표시됩니다.</p>
               {/* 여기에 추후 map으로 자산 리스트 렌더링 */}
            </div>
         </aside>

         {/* (B) Center Panel: Editor */}
         <main className="flex-1 bg-[#050505] flex flex-col relative min-w-0">
            
            {/* Step Navigator */}
            <div className="h-16 border-b border-[#2C2C2E] flex items-center px-6 gap-2 bg-[#0A0A0A]">
               {[1, 2, 3, 4, 5].map((step) => (
                  <button
                     key={step}
                     onClick={() => setActiveStep(step)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        activeStep === step ? 'bg-white text-black border-white' : 'bg-[#161618] text-zinc-500 border-[#333]'
                     }`}
                  >
                     <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === step ? 'bg-black text-white' : 'bg-[#2C2C2E] text-zinc-400'}`}>{step}</span>
                     <span>Step {step}</span>
                  </button>
               ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
               <div className="max-w-3xl mx-auto space-y-8">
                  
                  {/* Mode Switcher */}
                  <div className="flex justify-center mb-8">
                     <div className="p-1 bg-[#161618] border border-[#333] rounded-xl flex">
                        <button onClick={() => setActiveTab('email')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'email' ? 'bg-[#2C2C2E] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>✉️ 이메일</button>
                        <button onClick={() => setActiveTab('report')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-[#2C2C2E] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>📊 리포트</button>
                     </div>
                  </div>

                  {activeTab === 'email' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Subject Selection */}
                        <div className="space-y-3">
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">추천 제목</label>
                           <div className="grid grid-cols-1 gap-3">
                              {currentSubjects.slice(0, 3).map((subject: string, idx: number) => (
                                 <div 
                                    key={idx}
                                    onClick={() => setSelectedSubjectIndex(idx)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedSubjectIndex === idx ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#161618] border-[#333] hover:border-zinc-600'}`}
                                 >
                                    <p className={`text-sm ${selectedSubjectIndex === idx ? 'text-white font-medium' : 'text-zinc-400'}`}>{subject}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Body Editor */}
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">이메일 본문</label>
                              <div className="flex bg-[#161618] rounded-lg p-0.5 border border-[#333]">
                                 <button onClick={() => setSelectedBodyType('solopreneur')} className={`px-3 py-1 text-xs rounded-md transition-all ${selectedBodyType === 'solopreneur' ? 'bg-[#2C2C2E] text-white' : 'text-zinc-500'}`}>👤 대표님용</button>
                                 <button onClick={() => setSelectedBodyType('corporate')} className={`px-3 py-1 text-xs rounded-md transition-all ${selectedBodyType === 'corporate' ? 'bg-[#2C2C2E] text-white' : 'text-zinc-500'}`}>👥 실무자용</button>
                              </div>
                           </div>
                           
                           <div className="min-h-[300px] bg-[#161618] border border-[#333] rounded-2xl p-6">
                              <div 
                                 className="text-base text-zinc-300 leading-relaxed font-light outline-none whitespace-pre-wrap"
                                 contentEditable
                                 suppressContentEditableWarning
                                 dangerouslySetInnerHTML={{ __html: bodyOptions[selectedBodyType as keyof typeof bodyOptions] }}
                              />
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === 'report' && (
                     <div className="min-h-[500px] bg-[#161618] border border-[#333] rounded-2xl p-8">
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: reportHtml }} />
                     </div>
                  )}

               </div>
            </div>
         </main>

         {/* (C) Right Panel: Preview (Smartphone) */}
         <aside className="w-[360px] border-l border-[#2C2C2E] bg-[#0A0A0A] flex flex-col shrink-0">
            <div className="px-5 py-4 border-b border-[#2C2C2E] flex justify-between items-center bg-[#0F0F0F]">
               <h2 className="text-sm font-bold text-white">수신자 미리보기</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-[#000] flex items-center justify-center">
               <div className="w-full bg-white rounded-[32px] overflow-hidden border-[8px] border-[#2C2C2E] shadow-2xl relative min-h-[500px]">
                  <div className="h-6 bg-white w-full flex justify-center items-center border-b border-gray-100">
                     <div className="w-16 h-4 bg-black rounded-b-xl" />
                  </div>
                  <div className="p-4 bg-gray-50 h-full">
                     <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                        <div className="flex gap-2 items-center mb-2">
                           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">LP</div>
                           <div>
                              <p className="text-xs font-bold text-gray-900">LinkPitch</p>
                              <p className="text-[10px] text-gray-500">방금 전</p>
                           </div>
                        </div>
                        <div className="text-xs text-gray-800 leading-relaxed line-clamp-6">
                           {/* 본문 미리보기 (HTML 태그 제거하고 텍스트만) */}
                           {bodyOptions[selectedBodyType as keyof typeof bodyOptions].replace(/<[^>]*>?/gm, '')}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </aside>

      </div>
    </div>
  )
}

