"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Mail,
  FileText,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prospect, CRMStatus, CampaignStats } from "@/types/prospect";
import type { GeneratedEmail } from "@/types/generated-email";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProspectEditDialog } from "@/components/prospects/prospect-edit-dialog";
import { ProspectDeleteDialog } from "@/components/prospects/prospect-delete-dialog";
import { ProspectCreateModal } from "@/components/prospects/prospect-create-modal";
import { getGeneratedEmailsByProspect } from "@/actions/generated-emails";
import { updateProspect } from "@/app/actions/prospects";
import { toast } from "sonner";

interface ClientsUnifiedViewProps {
  prospects: Prospect[];
  campaignStats: Record<string, CampaignStats>;
  selectedClientId?: string;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
}

type FilterStatus = "All" | "Hot" | "Warm" | "Cold";

const statusConfig: Record<CRMStatus, { label: string; className: string }> = {
  hot: {
    label: "Hot",
    className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  warm: {
    label: "Warm",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  cold: {
    label: "Cold",
    className: "bg-zinc-700 text-zinc-400 border-zinc-700",
  },
};

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// 날짜 포맷팅 헬퍼 (예: "12월 7일")
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  } catch {
    return "";
  }
}

export default function ClientsUnifiedView({
  prospects,
  campaignStats,
  selectedClientId: _selectedClientId,
  totalCount,
  currentPage,
  itemsPerPage,
}: ClientsUnifiedViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 초기 상태 읽기
  const urlStatus = searchParams.get("status");
  const urlSearch = searchParams.get("search") || "";
  
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(
    urlStatus && ["hot", "warm", "cold"].includes(urlStatus.toLowerCase())
      ? (urlStatus.charAt(0).toUpperCase() + urlStatus.slice(1).toLowerCase()) as FilterStatus
      : "All"
  );

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    const urlSearch = searchParams.get("search") || "";
    setSearchQuery(urlSearch);
    setActiveFilter(
      urlStatus && ["hot", "warm", "cold"].includes(urlStatus.toLowerCase())
        ? (urlStatus.charAt(0).toUpperCase() + urlStatus.slice(1).toLowerCase()) as FilterStatus
        : "All"
    );
  }, [searchParams]);
  
  // 상태 관리 (이메일 히스토리, 메모 등)
  const [emailHistoryOpen, setEmailHistoryOpen] = useState(false);
  const [selectedClientIdForHistory, setSelectedClientIdForHistory] = useState<string | null>(null);
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [selectedClientIdForMemo, setSelectedClientIdForMemo] = useState<string | null>(null);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoText, setMemoText] = useState("");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [memoHistory, setMemoHistory] = useState<Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
  }>>([]);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClientIdForEdit, setSelectedClientIdForEdit] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClientIdForDelete, setSelectedClientIdForDelete] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 서버에서 이미 필터링/검색된 데이터를 받아오므로 클라이언트 사이드 필터링 제거
  // 정렬: Hot > Warm > Cold 순서
  const sortedProspects = [...prospects].sort((a, b) => {
    const statusOrder: Record<CRMStatus, number> = { hot: 0, warm: 1, cold: 2 };
    return statusOrder[a.crm_status] - statusOrder[b.crm_status];
  });

  // 통계 계산 (현재 페이지의 데이터만 사용)
  // totalCount는 props로 전달받음
  // const hotCount = prospects.filter((p) => p.crm_status === "hot").length;
  // const warmCount = prospects.filter((p) => p.crm_status === "warm").length;
  // const coldCount = prospects.filter((p) => p.crm_status === "cold").length;

  // 이메일 히스토리 로드
  useEffect(() => {
    if (emailHistoryOpen && selectedClientIdForHistory) {
      setLoadingEmails(true);
      getGeneratedEmailsByProspect(selectedClientIdForHistory)
        .then((result) => {
          if (result.error) {
            console.error('이메일 조회 에러:', result.error);
            setEmails([]);
          } else if (result.data) {
            setEmails(result.data);
          }
        })
        .catch((error) => {
          console.error('이메일 조회 중 예외 발생:', error);
          setEmails([]);
        })
        .finally(() => setLoadingEmails(false));
    }
  }, [emailHistoryOpen, selectedClientIdForHistory]);

  // 메모 히스토리 파싱
  const parseMemoHistory = (memo: string | undefined): Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
  }> => {
    if (!memo) return [];
    try {
      const parsed = JSON.parse(memo);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return [];
    } catch {
      if (memo.trim()) {
        return [{
          id: crypto.randomUUID(),
          title: "메모",
          content: memo,
          created_at: new Date().toISOString(),
        }];
      }
      return [];
    }
  };

  // 핸들러 함수들
  const handleEmailHistoryClick = (clientId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedClientIdForHistory(clientId);
    setEmailHistoryOpen(true);
  };

  const handleMemoClick = (clientId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const client = sortedProspects.find(c => c.id === clientId);
    setSelectedClientIdForMemo(clientId);
    const history = parseMemoHistory(client?.memo);
    setMemoHistory(history);
    setMemoTitle("");
    setMemoText("");
    setSelectedMemoId(null);
    setMemoOpen(true);
  };

  const handleEditClick = (clientId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.error("잘못된 클라이언트 ID:", clientId);
      toast.error(`잘못된 고객사 ID입니다: ${clientId}`);
      return;
    }
    
    setSelectedClientIdForEdit(clientId);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (clientId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.error("잘못된 클라이언트 ID:", clientId);
      toast.error(`잘못된 고객사 ID입니다: ${clientId}`);
      return;
    }
    
    setSelectedClientIdForDelete(clientId);
    setDeleteDialogOpen(true);
  };

  const handleSaveMemo = async () => {
    if (!selectedClientIdForMemo || !memoTitle.trim() || !memoText.trim()) {
      toast.error("메모 제목과 내용을 모두 입력해주세요.");
      return;
    }
    
    setIsSavingMemo(true);
    try {
      const newMemo = {
        id: selectedMemoId || crypto.randomUUID(),
        title: memoTitle.trim(),
        content: memoText.trim(),
        created_at: new Date().toISOString(),
      };

      const updatedHistory = selectedMemoId
        ? memoHistory.map(m => m.id === selectedMemoId ? newMemo : m)
        : [newMemo, ...memoHistory];

      const memoJson = JSON.stringify(updatedHistory);
      await updateProspect(selectedClientIdForMemo, { memo: memoJson });
      toast.success("메모가 저장되었습니다.");
      
      setMemoHistory(updatedHistory);
      setMemoTitle("");
      setMemoText("");
      setSelectedMemoId(null);
      
      router.refresh();
    } catch (error) {
      console.error("메모 저장 실패:", error);
      toast.error("메모 저장에 실패했습니다.");
    } finally {
      setIsSavingMemo(false);
    }
  };

  const selectedClient = sortedProspects.find(c => c.id === selectedClientIdForHistory);
  const selectedClientForMemo = sortedProspects.find(c => c.id === selectedClientIdForMemo);

  return (
    <div className="w-full bg-[#161618] border border-[#333] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
      {/* 컨트롤 바 (Toolbar) - 배경색 분리로 영역 구분 */}
      <div className="px-8 py-6 md:px-10 border-b border-[#2C2C2E] flex flex-col md:flex-row gap-6 justify-between items-center bg-[#1C1C1E]">
        {/* 검색창 */}
        <div className="relative w-full md:w-[480px] group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            placeholder="회사명, 담당자, 이메일 검색..."
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              // 검색 변경 시 URL 업데이트 및 페이지 리셋
              const params = new URLSearchParams(searchParams.toString());
              if (value) {
                params.set("search", value);
              } else {
                params.delete("search");
              }
              params.delete("page"); // 페이지를 1로 리셋
              router.push(`/prospects?${params.toString()}`);
            }}
            className="block w-full pl-12 pr-4 py-3.5 bg-[#0A0A0C] border border-[#333] rounded-2xl text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
          />
        </div>

        {/* 우측 필터 & 버튼 */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* 필터 그룹 */}
          <div className="flex p-1.5 bg-[#0A0A0C] border border-[#333] rounded-2xl">
            <button
              onClick={() => {
                setActiveFilter("All");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("status");
                params.delete("page"); // 페이지를 1로 리셋
                router.push(`/prospects?${params.toString()}`);
              }}
              className={cn(
                "px-6 py-2.5 text-base font-semibold rounded-xl transition-colors",
                activeFilter === "All"
                  ? "text-white bg-[#1C1C1E] shadow-sm font-bold border border-[#333]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              All
            </button>
            <button
              onClick={() => {
                setActiveFilter("Hot");
                const params = new URLSearchParams(searchParams.toString());
                params.set("status", "hot");
                params.delete("page"); // 페이지를 1로 리셋
                router.push(`/prospects?${params.toString()}`);
              }}
              className={cn(
                "px-6 py-2.5 text-base font-semibold rounded-xl transition-colors",
                activeFilter === "Hot"
                  ? "text-white bg-[#1C1C1E] shadow-sm font-bold border border-[#333]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Hot
            </button>
            <button
              onClick={() => {
                setActiveFilter("Warm");
                const params = new URLSearchParams(searchParams.toString());
                params.set("status", "warm");
                params.delete("page"); // 페이지를 1로 리셋
                router.push(`/prospects?${params.toString()}`);
              }}
              className={cn(
                "px-6 py-2.5 text-base font-semibold rounded-xl transition-colors",
                activeFilter === "Warm"
                  ? "text-white bg-[#1C1C1E] shadow-sm font-bold border border-[#333]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Warm
            </button>
            <button
              onClick={() => {
                setActiveFilter("Cold");
                const params = new URLSearchParams(searchParams.toString());
                params.set("status", "cold");
                params.delete("page"); // 페이지를 1로 리셋
                router.push(`/prospects?${params.toString()}`);
              }}
              className={cn(
                "px-6 py-2.5 text-base font-semibold rounded-xl transition-colors",
                activeFilter === "Cold"
                  ? "text-white bg-[#1C1C1E] shadow-sm font-bold border border-[#333]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Cold
            </button>
          </div>

          {/* 추가 버튼 (Primary) */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-white text-black font-bold text-base rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="flex-1 bg-[#161618] min-h-[500px] flex flex-col">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-12 gap-6 px-10 py-6 border-b border-[#2C2C2E] bg-[#1C1C1E]/50 text-base font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap shrink-0">
          <div className="col-span-3 pl-2 flex items-center gap-2 cursor-pointer hover:text-zinc-300">
            회사 정보 <ArrowUpDown className="w-3 h-3" />
          </div>
          <div className="col-span-2">담당자</div>
          <div className="col-span-2">연락처</div>
          <div className="col-span-3">캠페인 활동</div>
          <div className="col-span-1 text-center">상태</div>
          <div className="col-span-1 text-right pr-2">관리</div>
        </div>

        {/* 데이터 리스트 (스크롤 가능 영역) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2C2C2E]">
          {sortedProspects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl" />
                <div className="relative space-y-3 text-center">
                  <p className="text-sm text-zinc-400">
                    {searchQuery || activeFilter !== "All"
                      ? "검색 결과가 없습니다"
                      : "고객사가 없습니다"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            sortedProspects.map((prospect) => {
              const statusStyle = statusConfig[prospect.crm_status];
              const displayUrl = prospect.url || "";
              const displayName = prospect.store_name || prospect.name;
              const stats = campaignStats[prospect.id] || {
                sentCount: 0,
                nextScheduleDate: null,
                daysUntilNext: null,
                progress: 0,
              };

              return (
                <div
                  key={prospect.id}
                  className="grid grid-cols-12 gap-6 px-10 py-7 items-center hover:bg-[#1F1F22] transition-all group cursor-pointer"
                  onClick={() => {
                    router.push(`/prospects/${prospect.id}/mix`);
                  }}
                >
                  {/* 1. 회사 정보 (3칸) - 가장 중요 -> 가장 크게 */}
                  <div className="col-span-3 flex flex-col justify-center overflow-hidden pl-2">
                    <div className="text-xl font-bold text-white mb-1.5 truncate">
                      {displayName}
                    </div>
                    {displayUrl ? (
                      <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-500 truncate group-hover:text-blue-400 transition-colors block w-full font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {displayUrl.replace(/^https?:\/\//, "").substring(0, 40)}
                        {displayUrl.length > 40 ? "..." : ""}
                      </a>
                    ) : (
                      <span className="text-sm text-zinc-500">-</span>
                    )}
                  </div>

                  {/* 2. 담당자 (2칸) - 아바타 강조 */}
                  <div className="col-span-2 flex items-center gap-4 overflow-hidden">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#252528] flex items-center justify-center text-base font-bold text-zinc-400 border border-[#333]">
                      {prospect.contact_name
                        ? getInitial(prospect.contact_name)
                        : getInitial(displayName)}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-base font-medium text-zinc-200 truncate">
                        {prospect.contact_name || "-"}
                      </span>
                      {prospect.category && (
                        <span className="text-xs text-zinc-500 truncate">
                          {prospect.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. 연락처 (2칸) */}
                  <div 
                    className="col-span-2 flex flex-col justify-center overflow-hidden gap-1 select-text"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {prospect.contact_email ? (
                      <span className="text-base text-zinc-300 font-mono truncate hover:text-white transition-colors cursor-text select-all">
                        {prospect.contact_email}
                      </span>
                    ) : (
                      <span className="text-base text-zinc-500">-</span>
                    )}
                    {prospect.contact_phone && (
                      <span className="text-sm text-zinc-600 font-mono truncate cursor-text select-all">
                        {prospect.contact_phone}
                      </span>
                    )}
                  </div>

                  {/* 4. 캠페인 활동 (3칸) */}
                  <div className="col-span-3 flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-zinc-500 font-bold mb-1 tracking-wider">
                        SENT
                      </span>
                      <span className="text-lg font-bold text-white">
                        {stats.sentCount}<span className="text-sm text-zinc-500 ml-0.5">회</span>
                      </span>
                    </div>
                    <div className="w-[1px] h-10 bg-[#333]"></div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-zinc-500 font-bold mb-1 tracking-wider">
                        NEXT
                      </span>
                      <div className="flex items-center gap-2">
                        {stats.nextScheduleDate ? (
                          <>
                            <span className="text-base font-medium text-zinc-300">
                              {formatDate(stats.nextScheduleDate)}
                              {stats.daysUntilNext !== null && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold ml-2">
                                  D-{stats.daysUntilNext}
                                </span>
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-medium text-zinc-500">
                            일정 없음
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. 상태 (1칸) */}
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={cn(
                        "inline-flex items-center px-3.5 py-1.5 rounded-lg text-sm font-bold border",
                        statusStyle.className === "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          : statusStyle.className === "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                      )}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* 6. 관리 (1칸) */}
                  <div className="col-span-1 flex justify-end pr-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                        >
                          <MoreHorizontal size={24} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(prospect.id, e);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit size={14} className="mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailHistoryClick(prospect.id, e);
                          }}
                          className="cursor-pointer"
                        >
                          <Mail size={14} className="mr-2" />
                          이메일 히스토리
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMemoClick(prospect.id, e);
                          }}
                          className="cursor-pointer"
                        >
                          <FileText size={14} className="mr-2" />
                          메모
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(prospect.id, e);
                          }}
                          className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
                        >
                          <Trash2 size={14} className="mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 하단 페이지네이션 (Apple Style) */}
      {totalCount > 0 && (() => {
        const totalPages = Math.ceil(totalCount / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, totalCount);
        const isFirstPage = currentPage === 1;
        const isLastPage = currentPage === totalPages;

        // 페이지 번호 버튼 생성 로직
        const getPageNumbers = () => {
          const pages: (number | string)[] = [];
          
          if (totalPages <= 7) {
            // 페이지가 7개 이하일 때는 모두 표시
            for (let i = 1; i <= totalPages; i++) {
              pages.push(i);
            }
          } else {
            // 첫 페이지
            pages.push(1);
            
            if (currentPage <= 3) {
              // 현재 페이지가 앞쪽에 있을 때
              for (let i = 2; i <= 4; i++) {
                pages.push(i);
              }
              pages.push("...");
              pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
              // 현재 페이지가 뒤쪽에 있을 때
              pages.push("...");
              for (let i = totalPages - 3; i <= totalPages; i++) {
                pages.push(i);
              }
            } else {
              // 현재 페이지가 중간에 있을 때
              pages.push("...");
              for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(i);
              }
              pages.push("...");
              pages.push(totalPages);
            }
          }
          
          return pages;
        };

        const pageNumbers = getPageNumbers();

        const handlePageChange = (page: number) => {
          const params = new URLSearchParams(searchParams.toString());
          if (page === 1) {
            params.delete("page");
          } else {
            params.set("page", page.toString());
          }
          router.push(`/prospects?${params.toString()}`);
        };

        return (
          <div className="px-8 py-5 border-t border-[#333] bg-[#161618] flex flex-col md:flex-row gap-4 justify-between items-center select-none">
            {/* 좌측: 정보 표시 */}
            <span className="text-sm font-medium text-zinc-500">
              Showing <span className="text-zinc-200">{startIndex}</span> to <span className="text-zinc-200">{endIndex}</span> of <span className="text-zinc-200">{totalCount}</span> clients
            </span>

            {/* 우측: 페이지 컨트롤 */}
            <div className="flex items-center gap-1">
              {/* Previous 버튼 */}
              <button
                onClick={() => !isFirstPage && handlePageChange(currentPage - 1)}
                disabled={isFirstPage}
                className="px-3 py-2 text-sm font-medium text-zinc-500 rounded-lg hover:bg-[#2C2C2E] hover:text-zinc-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* 숫자 버튼 그룹 */}
              <div className="flex items-center gap-1 mx-2">
                {pageNumbers.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="w-9 h-9 flex items-center justify-center text-zinc-600">
                        ...
                      </span>
                    );
                  }
                  
                  const pageNum = page as number;
                  const isActive = pageNum === currentPage;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`
                        w-9 h-9 flex items-center justify-center text-sm rounded-lg transition-all
                        ${isActive
                          ? "text-black bg-white shadow-lg shadow-white/10 scale-105 font-bold"
                          : "font-medium text-zinc-500 hover:bg-[#2C2C2E] hover:text-zinc-300"
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next 버튼 */}
              <button
                onClick={() => !isLastPage && handlePageChange(currentPage + 1)}
                disabled={isLastPage}
                className="px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-[#2C2C2E] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        );
      })()}

      {/* 이메일 히스토리 Sheet */}
      <Sheet open={emailHistoryOpen} onOpenChange={setEmailHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#0a0a0a] border-l border-white/10 overflow-y-auto">
          <SheetHeader className="border-b border-white/10 pb-4 mb-6">
            <SheetTitle className="text-xl font-semibold text-white">
              {selectedClient?.store_name || selectedClient?.name || "이메일 히스토리"}
            </SheetTitle>
            {emails.length > 0 && (
              <p className="text-sm text-zinc-500 mt-1">
                총 {emails.length}통 발송됨
              </p>
            )}
          </SheetHeader>
          {loadingEmails ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-zinc-400 text-sm mb-1">발송된 이메일이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="rounded-xl border border-white/[0.06] bg-zinc-900/30 p-4"
                >
                  <div className="text-sm font-medium text-zinc-200">
                    {email.theme || `Step ${email.step_number} 이메일`}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {email.sent_at
                      ? new Date(email.sent_at).toLocaleDateString("ko-KR")
                      : "미발송"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 메모 Sheet */}
      <Sheet open={memoOpen} onOpenChange={setMemoOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0a0a0a] border-l border-white/10 overflow-y-auto">
          <SheetHeader className="border-b border-white/10 pb-4 mb-6">
            <SheetTitle className="text-xl font-semibold text-white">
              {selectedClientForMemo?.store_name || selectedClientForMemo?.name || "메모"} - 메모
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-400 mb-2 block">
                메모 제목
              </label>
              <input
                type="text"
                value={memoTitle}
                onChange={(e) => setMemoTitle(e.target.value)}
                placeholder="메모 제목을 입력하세요..."
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-400 mb-2 block">
                메모 내용
              </label>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="고객사에 대한 메모를 입력하세요..."
                rows={8}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 resize-none"
              />
            </div>
            <button
              onClick={handleSaveMemo}
              disabled={isSavingMemo || !memoTitle.trim() || !memoText.trim()}
              className="w-full px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingMemo ? "저장 중..." : "메모 저장"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      {selectedClientIdForEdit && (() => {
        const prospectToEdit = sortedProspects.find(p => p.id === selectedClientIdForEdit);
        return prospectToEdit ? (
          <ProspectEditDialog
            prospect={prospectToEdit}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setSelectedClientIdForEdit(null);
                router.refresh();
              }
            }}
          />
        ) : null;
      })()}

      {/* Delete Dialog */}
      {selectedClientIdForDelete && (() => {
        const prospectToDelete = sortedProspects.find(p => p.id === selectedClientIdForDelete);
        return prospectToDelete ? (
          <ProspectDeleteDialog
            prospect={prospectToDelete}
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) {
                setSelectedClientIdForDelete(null);
                router.refresh();
              }
            }}
          />
        ) : null;
      })()}

      {/* Create Modal */}
      <ProspectCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}

