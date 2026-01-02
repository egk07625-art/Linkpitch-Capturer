'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  Search, Plus, MoreHorizontal, ArrowUpDown, X, 
  User, Mail, Link as LinkIcon, Phone, Edit, 
  FileText, History, Trash2, StickyNote, Send, Calendar, Clock 
} from 'lucide-react';

// ✅ Actions & Utils
import { 
  getProspects, 
  getProspectsCount, 
  createProspect, 
  deleteProspect,
  updateProspect,
  type GetProspectsOptions 
} from '@/app/actions/prospects';
import { getProspectsCampaignStats } from '@/actions/prospects';
import { supabase } from '@/utils/supabase/client'; // 히스토리 조회용
import type { Prospect, CampaignStats } from '@/types/prospect';
import { cn } from '@/lib/utils';

// ✅ UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { ProspectEditDialog } from "@/components/prospects/prospect-edit-dialog";

// ----------------------------------------------------------------------
// [Schema & Types]
// ----------------------------------------------------------------------

const prospectSchema = z.object({
  name: z.string().min(1, '회사명을 입력해주세요'),
  contact_name: z.string().optional(),
  contact_email: z.string().email('올바른 이메일을 입력해주세요'),
  contact_phone: z.string().optional(),
  url: z.string().url('올바른 URL을 입력해주세요'),
  memo: z.string().optional(),
});

type ProspectFormData = z.infer<typeof prospectSchema>;
type FilterStatus = 'All' | 'Hot' | 'Warm' | 'Cold';

const statusConfig: Record<string, { label: string; className: string }> = {
  hot: { label: 'Hot', className: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
  warm: { label: 'Warm', className: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  cold: { label: 'Cold', className: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30' },
};

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  } catch {
    return '';
  }
}

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : '?';
}

// 메모 아이템 타입
interface MemoItem {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------
// [Main Content]
// ----------------------------------------------------------------------

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // -- State --
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals & Sheets State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false); // 등록 모달
  const [isMemoOpen, setIsMemoOpen] = useState(false);       // 메모 시트
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // 히스토리 시트
  const [isEditOpen, setIsEditOpen] = useState(false);       // 수정 다이얼로그
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [selectedProspectForEdit, setSelectedProspectForEdit] = useState<Prospect | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]); // 이메일 히스토리 데이터
  
  // Memo State
  const [memoText, setMemoText] = useState('');
  const [memoHistory, setMemoHistory] = useState<MemoItem[]>([]);
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const initialFilterRaw = searchParams.get('status');
  const initialFilter = initialFilterRaw 
    ? (initialFilterRaw.charAt(0).toUpperCase() + initialFilterRaw.slice(1).toLowerCase()) as FilterStatus 
    : 'All';
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(initialFilter);
  const [currentPage, setCurrentPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));
  const itemsPerPage = 20;

  // -- Form --
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      name: '', contact_name: '', contact_email: '', contact_phone: '', url: '', memo: '',
    },
  });

  // -- Fetch Logic --
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: GetProspectsOptions = {};
      if (activeFilter !== 'All') options.status = activeFilter.toLowerCase() as 'hot' | 'warm' | 'cold';
      if (searchQuery.trim()) options.search = searchQuery.trim();
      
      const offset = (currentPage - 1) * itemsPerPage;
      options.limit = itemsPerPage;
      options.offset = offset;

      const [prospectsData, count] = await Promise.all([
        getProspects(options),
        getProspectsCount({ status: options.status, search: options.search }),
      ]);

      setProspects(prospectsData || []);
      setTotalCount(count || 0);

      if (prospectsData && prospectsData.length > 0) {
        const prospectIds = prospectsData.map((p) => p.id);
        const statsResult = await getProspectsCampaignStats(prospectIds);
        if (statsResult.data) setCampaignStats(statsResult.data);
      } else {
        setCampaignStats({});
      }
    } catch (error) {
      console.error(error);
      toast.error('데이터 로딩 실패');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // -- URL Sync --
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (activeFilter !== 'All') params.set('status', activeFilter.toLowerCase());
    if (currentPage > 1) params.set('page', currentPage.toString());
    const newUrl = params.toString() ? `?${params.toString()}` : '/prospects';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, activeFilter, currentPage, router]);

  // -- Handlers --

  // 1. 등록
  const onSubmit = async (data: ProspectFormData) => {
    try {
      await createProspect({
        name: data.name,
        contact_name: data.contact_name || undefined,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || undefined,
        url: data.url,
        memo: data.memo || undefined,
      });
      toast.success('등록되었습니다.');
      reset();
      setIsRegisterOpen(false);
      await fetchData();
    } catch (error) {
      toast.error('등록 실패');
    }
  };

  // 2. 삭제
  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteProspect(id);
        toast.success('삭제되었습니다.');
        await fetchData();
      } catch (error) {
        toast.error('삭제 실패');
      }
    }
  };

  // 3. 메모 보기 (Sheet Open)
  const handleOpenMemo = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsMemoOpen(true);
    setMemoText('');
    setEditingMemoId(null);
    
    // 기존 메모를 JSON 배열로 파싱
    if (prospect.memo) {
      try {
        // 문자열인 경우에만 파싱 시도
        const memoData = typeof prospect.memo === 'string' ? JSON.parse(prospect.memo) : prospect.memo;
        
        if (Array.isArray(memoData)) {
          // 각 항목의 content가 JSON 문자열인지 확인하고 정리
          const cleanedHistory = memoData.map((item: any) => {
            let content = item.content;
            
            // content가 JSON 문자열인 경우 파싱
            if (typeof content === 'string' && content.trim().startsWith('[')) {
              try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  content = parsed[0].content || parsed[0] || content;
                } else if (typeof parsed === 'string') {
                  content = parsed;
                }
              } catch {
                // 파싱 실패 시 원본 사용
              }
            }
            
            return {
              id: item.id || crypto.randomUUID(),
              content: String(content || ''),
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || item.created_at || new Date().toISOString(),
            };
          });
          
          // 최신순으로 정렬
          setMemoHistory(cleanedHistory.sort((a, b) => 
            new Date(b.updated_at || b.created_at).getTime() - 
            new Date(a.updated_at || a.created_at).getTime()
          ));
        } else if (typeof memoData === 'object' && memoData !== null) {
          // 단일 객체인 경우 배열로 변환
          setMemoHistory([{
            id: memoData.id || crypto.randomUUID(),
            content: String(memoData.content || memoData || ''),
            created_at: memoData.created_at || new Date().toISOString(),
            updated_at: memoData.updated_at || memoData.created_at || new Date().toISOString(),
          }]);
        } else {
          // 단일 텍스트인 경우 배열로 변환
          setMemoHistory([{
            id: crypto.randomUUID(),
            content: String(memoData),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
        }
      } catch {
        // JSON이 아닌 경우 단일 텍스트로 처리
        setMemoHistory([{
          id: crypto.randomUUID(),
          content: String(prospect.memo),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      }
    } else {
      setMemoHistory([]);
    }
  };

  // 메모 저장 핸들러
  const handleSaveMemo = async () => {
    if (!selectedProspect || !memoText.trim()) {
      toast.error('메모 내용을 입력해주세요.');
      return;
    }
    
    setIsSavingMemo(true);
    try {
      const now = new Date().toISOString();
      
      let updatedHistory: MemoItem[];
      if (editingMemoId) {
        // 기존 메모 수정
        updatedHistory = memoHistory.map(memo => 
          memo.id === editingMemoId 
            ? { ...memo, content: memoText.trim(), updated_at: now }
            : memo
        );
      } else {
        // 새 메모 추가
        const newMemo: MemoItem = {
          id: crypto.randomUUID(),
          content: memoText.trim(),
          created_at: now,
          updated_at: now,
        };
        updatedHistory = [newMemo, ...memoHistory];
      }
      
      // 최신순으로 정렬
      updatedHistory.sort((a, b) => 
        new Date(b.updated_at || b.created_at).getTime() - 
        new Date(a.updated_at || a.created_at).getTime()
      );
      
      const memoJson = JSON.stringify(updatedHistory);
      await updateProspect(selectedProspect.id, { memo: memoJson });
      
      toast.success(editingMemoId ? '메모가 수정되었습니다.' : '메모가 저장되었습니다.');
      setMemoText('');
      setEditingMemoId(null);
      setMemoHistory(updatedHistory);
      await fetchData(); // 목록 새로고침
    } catch (error) {
      console.error('메모 저장 실패:', error);
      toast.error('메모 저장에 실패했습니다.');
    } finally {
      setIsSavingMemo(false);
    }
  };

  // 메모 수정 핸들러
  const handleEditMemo = (memo: MemoItem) => {
    // content가 JSON 문자열인 경우 파싱하여 실제 텍스트만 추출
    let contentText = memo.content;
    
    // JSON 문자열인지 확인하고 파싱 시도
    if (typeof contentText === 'string' && contentText.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(contentText);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
          // 배열의 첫 번째 항목의 content 사용
          contentText = parsed[0].content;
        } else if (typeof parsed === 'string') {
          contentText = parsed;
        }
      } catch {
        // 파싱 실패 시 원본 사용
      }
    }
    
    // content가 객체인 경우 content 필드 추출
    if (typeof contentText === 'object' && contentText !== null) {
      contentText = (contentText as any).content || String(contentText);
    }
    
    setMemoText(String(contentText));
    setEditingMemoId(memo.id);
  };

  // 메모 취소 핸들러
  const handleCancelEdit = () => {
    setMemoText('');
    setEditingMemoId(null);
  };

  // 4. 히스토리 보기 (Sheet Open + Fetch)
  const handleOpenHistory = async (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsHistoryOpen(true);
    setHistoryData([]); // 초기화

    // DB에서 히스토리 조회
    const { data } = await supabase
      .from('generated_emails')
      .select('*')
      .eq('prospect_id', prospect.id)
      .order('created_at', { ascending: false });
    
    if (data) setHistoryData(data);
  };

  // 5. 수정
  const handleEdit = (prospect: Prospect) => {
    setSelectedProspectForEdit(prospect);
    setIsEditOpen(true);
  };

  // 수정 다이얼로그 닫기 핸들러
  const handleEditClose = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setSelectedProspectForEdit(null);
      fetchData(); // 목록 새로고침
    }
  };

  // 6. 행 클릭 (상세 이동)
  const handleRowClick = useCallback((id: string) => {
    router.push(`/prospects/${id}/mix`);
  }, [router]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);
  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  return (
    <div className="h-full w-full bg-[#050505] text-zinc-100 font-sans overflow-hidden flex flex-col relative">
      
      {/* ---------------------------------------------------------------------- */}
      {/* [SHEET 1] 메모장 (우측 슬라이드) */}
      {/* ---------------------------------------------------------------------- */}
      <Sheet open={isMemoOpen} onOpenChange={(open) => {
        setIsMemoOpen(open);
        if (!open) {
          setMemoText('');
          setEditingMemoId(null);
        }
      }}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-[#161618] border-l border-[#333] text-zinc-100 p-0 overflow-y-auto">
          <SheetHeader className="px-6 py-6 border-b border-[#2C2C2E] sticky top-0 z-10 bg-[#161618]">
            <SheetTitle className="text-xl font-bold text-white">고객사 메모</SheetTitle>
            <SheetDescription className="text-zinc-500">
              {selectedProspect?.name} 담당자에 대한 기록입니다.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 space-y-4">
            {/* 메모 입력 영역 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {editingMemoId ? '메모 수정' : '새 메모 작성'}
              </label>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="메모를 입력하세요..."
                className="w-full h-32 bg-[#0A0A0C] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveMemo}
                  disabled={!memoText.trim() || isSavingMemo}
                  className="flex-1 px-4 py-2 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSavingMemo ? '저장 중...' : editingMemoId ? '수정' : '저장'}
                </button>
                {editingMemoId && (
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSavingMemo}
                    className="px-4 py-2 bg-[#2C2C2E] text-zinc-400 font-semibold text-sm rounded-xl hover:bg-[#333] disabled:opacity-50 transition-all"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>

            {/* 메모 히스토리 목록 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">메모 히스토리</h3>
              {memoHistory.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">저장된 메모가 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {memoHistory.map((memo) => (
                    <div key={memo.id} className="bg-[#0A0A0C] border border-[#333] rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(memo.updated_at || memo.created_at).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {memo.updated_at !== memo.created_at && (
                            <span className="text-[10px] text-zinc-400 ml-1">(수정됨)</span>
                          )}
                        </span>
                        <button
                          onClick={() => handleEditMemo(memo)}
                          disabled={isSavingMemo || editingMemoId === memo.id}
                          className="text-xs text-zinc-400 hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          수정
                        </button>
                      </div>
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{memo.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ---------------------------------------------------------------------- */}
      {/* [SHEET 2] 이메일 히스토리 (우측 슬라이드 - 타임라인) */}
      {/* ---------------------------------------------------------------------- */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="w-[400px] sm:w-[600px] bg-[#161618] border-l border-[#333] text-zinc-100 p-0 overflow-y-auto">
          <SheetHeader className="px-6 py-6 border-b border-[#2C2C2E] bg-[#161618] sticky top-0 z-10">
            <SheetTitle className="text-xl font-bold text-white">캠페인 히스토리</SheetTitle>
            <SheetDescription className="text-zinc-500">
              {selectedProspect?.name}에게 발송된 이메일 기록입니다.
            </SheetDescription>
          </SheetHeader>
          
          <div className="p-8 relative">
            {historyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
                <History className="w-10 h-10 opacity-20" />
                <p>아직 발송된 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-8 relative">
                {/* 타임라인 수직선 */}
                <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-[#333] -z-10"></div>
                
                {historyData.map((log, index) => (
                  <div key={log.id} className="flex gap-6 relative group">
                    {/* 타임라인 점 */}
                    <div className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-[#333] flex items-center justify-center shrink-0 z-10 group-hover:border-white/40 transition-colors">
                      <Send className="w-4 h-4 text-zinc-400" />
                    </div>
                    
                    {/* 내용 카드 */}
                    <div className="flex-1 bg-[#0A0A0C] border border-[#333] rounded-xl p-5 hover:border-zinc-600 transition-colors cursor-pointer" onClick={() => handleRowClick(selectedProspect!.id)}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white/85 text-[10px] font-bold border border-white/20 uppercase">
                          Step {log.step_number || 1}
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-200 mb-2 leading-tight">
                        {log.email_subjects?.metric_direct?.[0] || "제목 없음"}
                      </h4>
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                        {/* HTML 태그 제거하고 텍스트만 미리보기 */}
                        {log.email_body_corporate?.replace(/<[^>]*>?/gm, '') || "내용 없음"}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-medium">
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> 발송 완료</span>
                         {/* 추후 오픈율 데이터 연동 시 여기에 표시 */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* -------------------------------------------------------------------------- */}
      {/* [MODAL] Customer Registration (기존 모달) */}
      {/* -------------------------------------------------------------------------- */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsRegisterOpen(false)}></div>
          <div className="relative w-full max-w-[540px] bg-[#161618] border border-[#333] rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
            <div className="px-8 py-6 border-b border-[#2C2C2E] flex justify-between items-start bg-[#161618]">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-white tracking-tight">고객사 등록</h2>
                <p className="text-sm text-zinc-500">새로운 잠재 고객의 정보를 입력해주세요.</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} disabled={isSubmitting} className="p-2 -mr-2 -mt-2 rounded-full text-zinc-500 hover:text-white hover:bg-[#2C2C2E]">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-8 space-y-6 bg-[#161618]">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">회사명 <span className="text-red-500">*</span></label>
                   <input type="text" {...register('name')} placeholder="예: 쿠팡" disabled={isSubmitting} className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl px-4 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all" autoFocus />
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">담당자 이름</label>
                     <input type="text" {...register('contact_name')} placeholder="홍길동" className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">연락처</label>
                     <input type="text" {...register('contact_phone')} placeholder="010-0000-0000" className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">이메일 <span className="text-red-500">*</span></label>
                   <input type="email" {...register('contact_email')} placeholder="contact@example.com" className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">타겟 URL <span className="text-red-500">*</span></label>
                   <input type="text" {...register('url')} placeholder="https://..." className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">메모</label>
                   <textarea rows={3} {...register('memo')} placeholder="특이사항 입력" className="w-full bg-[#0A0A0C] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none" />
                 </div>
              </div>
              <div className="px-8 py-6 bg-[#1C1C1E] border-t border-[#2C2C2E] flex justify-end gap-3">
                <button type="button" onClick={() => setIsRegisterOpen(false)} className="px-6 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-[#2C2C2E]">취소</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200">{isSubmitting ? '저장 중...' : '등록하기'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* [DIALOG] Prospect Edit Dialog */}
      {/* -------------------------------------------------------------------------- */}
      {selectedProspectForEdit && (
        <ProspectEditDialog
          prospect={selectedProspectForEdit}
          open={isEditOpen}
          onOpenChange={handleEditClose}
          onSuccess={fetchData}
        />
      )}

      {/* [PAGE CONTENT] */}
      <div className="flex-1 w-full h-full overflow-y-auto">
        <div className="w-full max-w-[1500px] mx-auto px-6 py-10 md:px-8 md:py-12 flex flex-col gap-6">
          <header className="flex flex-col gap-2 px-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Clients</h1>
            <p className="text-lg text-zinc-500">고객사를 관리하고 이메일 캠페인 성과를 추적하세요.</p>
          </header>

          <div className="w-full bg-[#161618] border border-[#333] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            {/* Toolbar */}
            <div className="px-8 py-6 md:px-10 border-b border-[#2C2C2E] flex flex-col md:flex-row gap-6 justify-between items-center bg-[#1C1C1E]">
               <div className="relative w-full md:w-[480px] group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-zinc-500" /></div>
                  <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="block w-full pl-12 pr-4 py-3.5 bg-[#0A0A0C] border border-[#333] rounded-2xl text-base text-zinc-200 focus:outline-none focus:border-zinc-500 transition-all"/>
               </div>
               <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div className="flex p-1.5 bg-[#0A0A0C] border border-[#333] rounded-2xl">
                     {(['All', 'Hot', 'Warm', 'Cold'] as const).map((status) => (
                       <button key={status} onClick={() => { setActiveFilter(status); setCurrentPage(1); }} className={cn("px-5 py-2 text-sm font-medium rounded-xl transition-colors", activeFilter === status ? "text-white bg-[#1C1C1E] shadow-sm border border-[#333]" : "text-zinc-500 hover:text-zinc-300")}>{status}</button>
                     ))}
                  </div>
                  <button onClick={() => setIsRegisterOpen(true)} className="h-[50px] px-6 bg-white text-black font-bold text-base rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                     <Plus className="w-5 h-5" /> <span>Add Client</span>
                  </button>
               </div>
            </div>

            {/* List Table */}
            <div className="flex-1 bg-[#161618] min-h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-20 text-zinc-500">로딩 중...</div>
              ) : prospects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">데이터가 없습니다.</div>
              ) : (
                <div className="divide-y divide-[#2C2C2E]">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-6 px-10 py-5 border-b border-[#2C2C2E] bg-[#1C1C1E]/50 text-sm font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    <div className="col-span-3 pl-2">회사 정보</div>
                    <div className="col-span-2">담당자</div>
                    <div className="col-span-2">연락처</div>
                    <div className="col-span-3">캠페인 활동</div>
                    <div className="col-span-1 text-center">상태</div>
                    <div className="col-span-1 text-right pr-2">관리</div>
                  </div>

                  {/* Body Rows */}
                  {prospects.map((prospect) => {
                    const statusKey = (prospect.crm_status || 'cold').toLowerCase();
                    const statusStyle = statusConfig[statusKey] || statusConfig['cold'];
                    const stats = campaignStats[prospect.id] || { sentCount: 0, nextScheduleDate: null, daysUntilNext: null };

                    return (
                      <div 
                        key={prospect.id} 
                        className="grid grid-cols-12 gap-6 px-10 py-7 items-center hover:bg-[#1F1F22] transition-all group cursor-pointer" 
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <div className="col-span-3 flex flex-col justify-center overflow-hidden pl-2">
                          <div className="text-xl font-bold text-white mb-1.5 truncate">{prospect.name}</div>
                          {prospect.category && (
                            <span className="text-sm font-medium text-zinc-400 mb-1 truncate">{prospect.category}</span>
                          )}
                          <span className="text-sm text-zinc-500 truncate group-hover:text-zinc-300 transition-colors block w-full">{prospect.url?.replace(/^https?:\/\//, '')}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-4 overflow-hidden">
                          <div className="w-11 h-11 rounded-full bg-[#252528] flex items-center justify-center text-base font-bold text-zinc-400 border border-[#333]">{getInitial(prospect.contact_name || prospect.name)}</div>
                          <div className="flex flex-col"><span className="text-base font-medium text-zinc-200 truncate">{prospect.contact_name || '-'}</span></div>
                        </div>
                        <div className="col-span-2 flex flex-col justify-center overflow-hidden gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-base text-zinc-300 font-mono truncate select-all">{prospect.contact_email}</span>
                          <span className="text-sm text-zinc-600 font-mono truncate select-all">{prospect.contact_phone}</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-8">
                          <div className="flex flex-col"><span className="text-[11px] text-zinc-500 font-bold mb-1 tracking-wider">SENT</span><span className="text-lg font-bold text-white">{stats.sentCount}회</span></div>
                          <div className="w-[1px] h-10 bg-[#333]"></div>
                          <div className="flex flex-col"><span className="text-[11px] text-zinc-500 font-bold mb-1 tracking-wider">NEXT</span>{stats.nextScheduleDate ? <span className="text-base font-medium text-zinc-300">{formatDate(stats.nextScheduleDate)}</span> : <span className="text-base font-medium text-zinc-500">일정 없음</span>}</div>
                        </div>
                        <div className="col-span-1 flex justify-center"><span className={cn("px-3.5 py-1.5 rounded-lg text-sm font-bold border", statusStyle.className)}>{statusStyle.label}</span></div>

                        {/* ✅ 관리 메뉴 (Action) */}
                        <div className="col-span-1 flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-3 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-colors outline-none"><MoreHorizontal className="w-6 h-6" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#1C1C1E] border border-[#333] text-zinc-200 rounded-xl shadow-xl p-1" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-wider px-3 py-2">Actions</DropdownMenuLabel>
                              
                              <DropdownMenuItem onClick={() => handleEdit(prospect)} className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-[#2C2C2E] focus:bg-[#2C2C2E]"><Edit className="w-4 h-4 text-zinc-400" /> <span>정보 수정</span></DropdownMenuItem>
                              
                              {/* ⚡ Sheet Trigger: 메모 보기 */}
                              <DropdownMenuItem onClick={() => handleOpenMemo(prospect)} className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-[#2C2C2E] focus:bg-[#2C2C2E]"><StickyNote className="w-4 h-4 text-yellow-400" /> <span>메모 보기</span></DropdownMenuItem>
                              
                              {/* ⚡ Sheet Trigger: 히스토리 보기 */}
                              <DropdownMenuItem onClick={() => handleOpenHistory(prospect)} className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-[#2C2C2E] focus:bg-[#2C2C2E]"><History className="w-4 h-4 text-zinc-400" /> <span>히스토리</span></DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="bg-[#333] my-1" />
                              <DropdownMenuItem onClick={() => handleDelete(prospect.id)} className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-red-500/10 text-red-400 focus:bg-red-500/10"><Trash2 className="w-4 h-4" /> <span>삭제</span></DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {!isLoading && prospects.length > 0 && (
              <div className="px-10 py-5 border-t border-[#2C2C2E] bg-[#161618] flex flex-col md:flex-row gap-4 justify-between items-center select-none">
                <span className="text-sm font-medium text-zinc-500">Showing <span className="text-zinc-200">{startItem}</span> to <span className="text-zinc-200">{endItem}</span> of <span className="text-zinc-200">{totalCount}</span> clients</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 text-sm font-medium text-zinc-500 rounded-lg hover:bg-[#2C2C2E] disabled:opacity-50">Previous</button>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-[#2C2C2E] disabled:opacity-50">Next</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-[#050505] text-zinc-100 flex items-center justify-center">Loading...</div>}>
      <ClientsPageContent />
    </Suspense>
  );
}
