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
  FileText, History, Trash2 
} from 'lucide-react';

import { 
  getProspects, 
  getProspectsCount, 
  createProspect,
  type GetProspectsOptions 
} from '@/app/actions/prospects';
import { getProspectsCampaignStats } from '@/actions/prospects';

import type { Prospect, CampaignStats, CRMStatus } from '@/types/prospect';
import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  cold: { label: 'Cold', className: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
};

// ----------------------------------------------------------------------
// [Helper Functions]
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// [Main Component Content]
// ----------------------------------------------------------------------

function ClientsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  const initialFilterRaw = searchParams.get('status');
  const initialFilter = initialFilterRaw 
    ? (initialFilterRaw.charAt(0).toUpperCase() + initialFilterRaw.slice(1).toLowerCase()) as FilterStatus 
    : 'All';
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(initialFilter);

  const [currentPage, setCurrentPage] = useState(Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1));

  const itemsPerPage = 20;

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

  // -- Data Fetching --
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const options: GetProspectsOptions = {};
      
      if (activeFilter !== 'All') {
        options.status = activeFilter.toLowerCase() as 'hot' | 'warm' | 'cold';
      }
      if (searchQuery.trim()) {
        options.search = searchQuery.trim();
      }
      
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
        if (statsResult.data) {
          setCampaignStats(statsResult.data);
        }
      } else {
        setCampaignStats({});
      }
    } catch (error) {
      console.error('[ClientsPage] Fetch Error:', error);
      setErrorMessage('고객사 목록을 불러오는 중 오류가 발생했습니다.');
      // ✅ [FIX 1] 에러 시 모든 상태 초기화
      setProspects([]);
      setTotalCount(0);
      setCampaignStats({});
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (activeFilter !== 'All') params.set('status', activeFilter.toLowerCase());
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = params.toString() ? `/prospects?${params.toString()}` : '/prospects';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, activeFilter, currentPage, router]);

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
      toast.success('고객사가 등록되었습니다.');
      reset();
      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      toast.error('고객사 등록에 실패했습니다.');
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      reset();
      setIsModalOpen(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleRowClick = useCallback((id: string) => {
    router.push(`/prospects/${id}/mix`);
  }, [router]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  // ✅ [FIX 3] 페이지 번호 계산 함수 분리 및 안전하게 처리
  const getPageNumbers = useCallback((): number[] => {
    const pages: number[] = [];
    const maxButtons = Math.min(5, totalPages);
    
    let startPage: number;
    
    if (totalPages <= 5) {
      startPage = 1;
    } else if (currentPage <= 3) {
      startPage = 1;
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    } else {
      startPage = Math.max(1, currentPage - 2);
    }
    
    for (let i = 0; i < maxButtons; i++) {
      const pageNum = startPage + i;
      if (pageNum >= 1 && pageNum <= totalPages) {
        pages.push(pageNum);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="h-full w-full bg-[#050505] text-zinc-100 font-sans overflow-hidden flex flex-col relative">
      
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl border border-red-500/20 bg-red-500/10 p-4 max-w-md animate-in slide-in-from-right">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
            onClick={handleCloseModal}
          ></div>
          <div className="relative w-full max-w-[540px] bg-[#161618] border border-[#333] rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
            <div className="px-8 py-6 border-b border-[#2C2C2E] flex justify-between items-start bg-[#161618]">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-white tracking-tight">고객사 등록</h2>
                <p className="text-sm text-zinc-500">새로운 잠재 고객의 정보를 입력해주세요.</p>
              </div>
              <button onClick={handleCloseModal} disabled={isSubmitting} className="p-2 -mr-2 -mt-2 rounded-full text-zinc-500 hover:text-white hover:bg-[#2C2C2E] transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-8 space-y-6 bg-[#161618]">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">회사명 <span className="text-red-500">*</span></label>
                   <input type="text" {...register('name')} placeholder="예: 쿠팡, 올리브영" disabled={isSubmitting} className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl px-4 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all disabled:opacity-50" autoFocus />
                   {errors.name && <p className="text-xs text-red-400 ml-1">{errors.name.message}</p>}
                 </div>

                 <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">담당자 이름</label>
                     <div className="relative">
                       <User className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                       <input type="text" {...register('contact_name')} placeholder="홍길동" disabled={isSubmitting} className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">연락처</label>
                     <div className="relative">
                       <Phone className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                       <input type="text" {...register('contact_phone')} placeholder="010-0000-0000" disabled={isSubmitting} className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all" />
                     </div>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">담당자 이메일 <span className="text-red-500">*</span></label>
                   <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <input type="email" {...register('contact_email')} placeholder="contact@company.com" disabled={isSubmitting} className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all" />
                   </div>
                   {errors.contact_email && <p className="text-xs text-red-400 ml-1">{errors.contact_email.message}</p>}
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">타겟 URL <span className="text-red-500">*</span></label>
                   <div className="relative">
                      <LinkIcon className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                      <input type="text" {...register('url')} placeholder="https://..." disabled={isSubmitting} className="w-full h-12 bg-[#0A0A0C] border border-[#333] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all" />
                   </div>
                   {errors.url && <p className="text-xs text-red-400 ml-1">{errors.url.message}</p>}
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">메모</label>
                   <textarea rows={3} {...register('memo')} placeholder="특이사항 입력" disabled={isSubmitting} className="w-full bg-[#0A0A0C] border border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all resize-none" />
                 </div>
              </div>

              <div className="px-8 py-6 bg-[#1C1C1E] border-t border-[#2C2C2E] flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-6 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-[#2C2C2E] transition-colors">취소</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  {isSubmitting ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Content */}
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
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="검색..." 
                    value={searchQuery} 
                    onChange={(e) => handleSearchChange(e.target.value)} 
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#0A0A0C] border border-[#333] rounded-2xl text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
               </div>
               <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div className="flex p-1.5 bg-[#0A0A0C] border border-[#333] rounded-2xl">
                     {(['All', 'Hot', 'Warm', 'Cold'] as const).map((status) => (
                       <button 
                         key={status} 
                         onClick={() => handleFilterChange(status)}
                         className={cn("px-5 py-2 text-sm font-medium rounded-xl transition-colors", activeFilter === status ? "text-white bg-[#1C1C1E] shadow-sm border border-[#333]" : "text-zinc-500 hover:text-zinc-300")}
                       >
                         {status}
                       </button>
                     ))}
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="h-[50px] px-6 bg-white text-black font-bold text-base rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                     <Plus className="w-5 h-5" /> <span>Add Client</span>
                  </button>
               </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-[#161618] min-h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-20 text-zinc-500">로딩 중...</div>
              ) : prospects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">데이터가 없습니다.</div>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-6 px-10 py-5 border-b border-[#2C2C2E] bg-[#1C1C1E]/50 text-sm font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    <div className="col-span-3 pl-2 flex items-center gap-2 cursor-pointer hover:text-zinc-300">회사 정보 <ArrowUpDown className="w-3 h-3" /></div>
                    <div className="col-span-2">담당자</div>
                    <div className="col-span-2">연락처</div>
                    <div className="col-span-3">캠페인 활동</div>
                    <div className="col-span-1 text-center">상태</div>
                    <div className="col-span-1 text-right pr-2">관리</div>
                  </div>

                  <div className="divide-y divide-[#2C2C2E]">
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
                          
                          {/* ✅ [FIX 2] URL 안전하게 처리 */}
                          <div className="col-span-3 flex flex-col justify-center overflow-hidden pl-2">
                            <div className="text-xl font-bold text-white mb-1.5 truncate">
                              {prospect.store_name || prospect.name}
                            </div>
                            {prospect.url ? (
                              <a 
                                href={prospect.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                onClick={(e) => e.stopPropagation()} 
                                className="text-sm text-zinc-500 truncate group-hover:text-blue-400 transition-colors block w-full"
                              >
                                {prospect.url.replace(/^https?:\/\//, '')}
                              </a>
                            ) : (
                              <span className="text-sm text-zinc-600 truncate block w-full">
                                URL 없음
                              </span>
                            )}
                          </div>

                          <div className="col-span-2 flex items-center gap-4 overflow-hidden">
                            <div className="w-11 h-11 rounded-full bg-[#252528] flex items-center justify-center text-base font-bold text-zinc-400 border border-[#333]">
                              {getInitial(prospect.contact_name || prospect.name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-base font-medium text-zinc-200 truncate">{prospect.contact_name || '-'}</span>
                              <span className="text-xs text-zinc-500 truncate">{prospect.category || '-'}</span>
                            </div>
                          </div>

                          <div className="col-span-2 flex flex-col justify-center overflow-hidden gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-base text-zinc-300 font-mono truncate select-all">{prospect.contact_email || '-'}</span>
                            {prospect.contact_phone && <span className="text-sm text-zinc-600 font-mono truncate select-all">{prospect.contact_phone}</span>}
                          </div>

                          <div className="col-span-3 flex items-center gap-8">
                            <div className="flex flex-col">
                              <span className="text-[11px] text-zinc-500 font-bold mb-1 tracking-wider">SENT</span>
                              <span className="text-lg font-bold text-white">{stats.sentCount}<span className="text-sm text-zinc-500 ml-0.5">회</span></span>
                            </div>
                            <div className="w-[1px] h-10 bg-[#333]"></div>
                            <div className="flex flex-col">
                              <span className="text-[11px] text-zinc-500 font-bold mb-1 tracking-wider">NEXT</span>
                              {stats.nextScheduleDate ? (
                                <span className="text-base font-medium text-zinc-300">
                                  {formatDate(stats.nextScheduleDate)}
                                  {stats.daysUntilNext !== null && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold ml-2">D-{stats.daysUntilNext}</span>}
                                </span>
                              ) : <span className="text-base font-medium text-zinc-500">일정 없음</span>}
                            </div>
                          </div>

                          <div className="col-span-1 flex justify-center">
                            <span className={cn("px-3.5 py-1.5 rounded-lg text-sm font-bold border", statusStyle.className)}>
                              {statusStyle.label}
                            </span>
                          </div>

                          <div className="col-span-1 flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-3 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-colors outline-none"><MoreHorizontal className="w-6 h-6" /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-[#1C1C1E] border border-[#333] text-zinc-200 rounded-xl shadow-xl p-1" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-wider px-3 py-2">Actions</DropdownMenuLabel>
                                <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-[#2C2C2E] focus:bg-[#2C2C2E]"><Edit className="w-4 h-4 text-blue-400" /> <span>정보 수정</span></DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-[#2C2C2E] focus:bg-[#2C2C2E]"><History className="w-4 h-4 text-zinc-400" /> <span>히스토리</span></DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#333] my-1" />
                                <DropdownMenuItem className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-red-500/10 text-red-400 focus:bg-red-500/10"><Trash2 className="w-4 h-4" /> <span>삭제</span></DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ✅ [FIX 3] Pagination - 안전한 페이지 번호 계산 */}
            {!isLoading && prospects.length > 0 && (
              <div className="px-10 py-5 border-t border-[#2C2C2E] bg-[#161618] flex flex-col md:flex-row gap-4 justify-between items-center select-none">
                <span className="text-sm font-medium text-zinc-500">
                  Showing <span className="text-zinc-200">{startItem}</span> to <span className="text-zinc-200">{endItem}</span> of <span className="text-zinc-200">{totalCount}</span> clients
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1} 
                    className="px-3 py-2 text-sm font-medium text-zinc-500 rounded-lg hover:bg-[#2C2C2E] hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map((pageNum) => (
                      <button 
                        key={`page-${pageNum}`}
                        onClick={() => handlePageChange(pageNum)} 
                        className={cn(
                          "w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors", 
                          currentPage === pageNum 
                            ? "text-black bg-white shadow-lg shadow-white/10 scale-105" 
                            : "text-zinc-500 hover:bg-[#2C2C2E] hover:text-zinc-300"
                        )}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages} 
                    className="px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-[#2C2C2E] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// [Export]
// ----------------------------------------------------------------------
export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-[#050505] text-zinc-100 flex items-center justify-center">Loading...</div>}>
      <ClientsPageContent />
    </Suspense>
  );
}