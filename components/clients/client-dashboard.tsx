"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  ExternalLink,
  Mail,
  User,
  MoreHorizontal,
  Send,
  MousePointer2,
  Clock,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Eye,
  X,
  FileText,
  Save,
  Phone,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Prospect, CRMStatus } from "@/types/prospect";
import type { GeneratedEmail } from "@/types/generated-email";
import { getGeneratedEmailsByProspect } from "@/actions/generated-emails";
import { updateProspect, createProspect } from "@/app/actions/prospects";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProspectEditDialog } from "@/components/prospects/prospect-edit-dialog";
import { ProspectDeleteDialog } from "@/components/prospects/prospect-delete-dialog";

interface ClientDashboardProps {
  /** 초기 고객사 목록 */
  initialClients?: Prospect[];
  /** 선택된 고객사 ID */
  selectedClientId?: string;
}

// 고객사 등록 폼 스키마
const prospectSchema = z.object({
  name: z.string().min(1, "회사명을 입력해주세요"),
  contact_name: z.string().optional(),
  contact_email: z.string().email("올바른 이메일을 입력해주세요"),
  contact_phone: z.string().optional(),
  url: z.string().url("올바른 URL을 입력해주세요"),
  memo: z.string().optional(),
});

type ProspectFormData = z.infer<typeof prospectSchema>;

// 상태 스타일 설정
const statusConfig: Record<CRMStatus, {
  label: string;
  className: string;
  dotColor: string;
}> = {
  hot: {
    label: "Hot",
    className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    dotColor: "bg-rose-400",
  },
  warm: {
    label: "Warm",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dotColor: "bg-amber-400",
  },
  cold: {
    label: "Cold",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-400",
  },
};

type FilterStatus = "All" | "Hot" | "Warm" | "Cold";

// Segmented Control 스타일을 위한 헬퍼 함수
const getActiveFilterStyle = (tab: FilterStatus): string => {
  switch (tab) {
    case "All":
      return "bg-white/10 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]";
    case "Hot":
      return "bg-[#FF453A]/15 text-[#FF453A] shadow-[0_2px_8px_rgba(255,69,58,0.3)]";
    case "Warm":
      return "bg-[#FFD60A]/15 text-[#FFD60A] shadow-[0_2px_8px_rgba(255,214,10,0.3)]";
    case "Cold":
      return "bg-[#0A84FF]/15 text-[#0A84FF] shadow-[0_2px_8px_rgba(10,132,255,0.3)]";
    default:
      return "bg-white/10 text-white";
  }
};

// 이메일 상태 설정
const emailStatusConfig = {
  pending: {
    label: "대기",
    icon: Clock,
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10",
  },
  sent: {
    label: "발송됨",
    icon: Send,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  opened: {
    label: "열람",
    icon: Eye,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  clicked: {
    label: "클릭",
    icon: MousePointer2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  failed: {
    label: "실패",
    icon: X,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
};

// 날짜 포맷팅 헬퍼
function formatLastActive(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  } catch {
    return "-";
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function formatFullDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 이메일 반응 상태 결정
function getEmailReactionStatus(email: GeneratedEmail): CRMStatus {
  if (email.status === "clicked") return "hot";
  if (email.status === "opened") return "warm";
  return "cold";
}

export default function ClientDashboard({
  initialClients = [],
  selectedClientId,
}: ClientDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailHistoryOpen, setEmailHistoryOpen] = useState(false);
  const [selectedClientIdForHistory, setSelectedClientIdForHistory] = useState<string | null>(null);
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClientIdForEdit, setSelectedClientIdForEdit] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClientIdForDelete, setSelectedClientIdForDelete] = useState<string | null>(null);

  // 고객사 등록 폼
  const {
    register: registerProspect,
    handleSubmit: handleProspectSubmit,
    formState: { errors: prospectErrors, isSubmitting: isSubmittingProspect },
    reset: resetProspectForm,
  } = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
  });

  // 실제 데이터만 사용
  const clients: Prospect[] = initialClients || [];

  // 필터링 및 검색
  const filteredClients = clients.filter((client) => {
    const matchesTab =
      activeTab === "All" ||
      client.crm_status.toUpperCase() === activeTab.toUpperCase();
    const matchesSearch =
      searchQuery === "" ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.url?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // 정렬: Hot > Warm > Cold 순서
  const sortedClients = [...filteredClients].sort((a, b) => {
    const statusOrder: Record<CRMStatus, number> = { hot: 0, warm: 1, cold: 2 };
    return statusOrder[a.crm_status] - statusOrder[b.crm_status];
  });

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

  // 각 prospect별 보낸 이메일 개수 계산 헬퍼 함수
  const getSentEmailCount = async (prospectId: string): Promise<number> => {
    try {
      const result = await getGeneratedEmailsByProspect(prospectId);
      if (result.data) {
        return result.data.filter(email => email.status === 'sent').length;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  // 다음 일정 계산 헬퍼 함수 (임시: 샘플 데이터)
  const getNextSchedule = (client: Prospect): { date: string; daysUntil: number | null } => {
    // 임시: 샘플 데이터로 다음 일정 계산
    // 추후 sequences/step 테이블에서 실제 일정 조회 필요
    const sampleDate = new Date();
    sampleDate.setDate(sampleDate.getDate() + 3);
    const daysUntil = Math.ceil((sampleDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: sampleDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }),
      daysUntil: daysUntil > 0 ? daysUntil : null,
    };
  };

  const handleEmailHistoryClick = (clientId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedClientIdForHistory(clientId);
    setEmailHistoryOpen(true);
  };

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
      // 기존 단일 메모 형식인 경우
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

  const handleMemoClick = (clientId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const client = sortedClients.find(c => c.id === clientId);
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
    
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.error("잘못된 클라이언트 ID:", {
        clientId,
        clientIdType: typeof clientId,
        clientIdLength: clientId?.length,
        allClientIds: sortedClients.map(c => ({ id: c.id, name: c.name })),
      });
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
    
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.error("잘못된 클라이언트 ID:", {
        clientId,
        clientIdType: typeof clientId,
        clientIdLength: clientId?.length,
        allClientIds: sortedClients.map(c => ({ id: c.id, name: c.name })),
      });
      toast.error(`잘못된 고객사 ID입니다: ${clientId}`);
      return;
    }
    
    setSelectedClientIdForDelete(clientId);
    setDeleteDialogOpen(true);
  };

  const handleLoadMemo = (memoId: string) => {
    const memo = memoHistory.find(m => m.id === memoId);
    if (memo) {
      setMemoTitle(memo.title);
      setMemoText(memo.content);
      setSelectedMemoId(memoId);
    }
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

      // 기존 히스토리에서 같은 ID가 있으면 업데이트, 없으면 추가
      const updatedHistory = selectedMemoId
        ? memoHistory.map(m => m.id === selectedMemoId ? newMemo : m)
        : [newMemo, ...memoHistory];

      const memoJson = JSON.stringify(updatedHistory);
      await updateProspect(selectedClientIdForMemo, { memo: memoJson });
      toast.success("메모가 저장되었습니다.");
      
      // 히스토리 업데이트
      setMemoHistory(updatedHistory);
      setMemoTitle("");
      setMemoText("");
      setSelectedMemoId(null);
      
      router.refresh(); // 서버 데이터 새로고침
    } catch (error) {
      console.error("메모 저장 실패:", error);
      toast.error("메모 저장에 실패했습니다.");
    } finally {
      setIsSavingMemo(false);
    }
  };

  const selectedClient = sortedClients.find(c => c.id === selectedClientIdForHistory);
  const selectedClientForMemo = sortedClients.find(c => c.id === selectedClientIdForMemo);

  // 고객사 등록 핸들러
  const onProspectSubmit = async (data: ProspectFormData) => {
    try {
      await createProspect({
        name: data.name,
        contact_name: data.contact_name || undefined,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || undefined,
        url: data.url,
        memo: data.memo || undefined,
      });

      toast.success("고객사가 등록되었습니다.");
      setIsAddModalOpen(false);
      resetProspectForm();
      router.refresh(); // 리스트 새로고침
    } catch (error) {
      console.error("Prospect 생성 실패:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "고객사 등록에 실패했습니다."
      );
    }
  };

  return (
    <div className="h-full bg-[#050505] text-zinc-100 font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col">
      {/* Unified Card Container - 제목, 검색/필터, 테이블을 하나의 카드로 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-2 py-6 md:py-8">
          <div className="w-full max-w-[1400px] mx-auto rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden p-6 md:p-8 lg:p-10">
            {/* Page Title - 컨테이너 내부 최상단 */}
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-4xl font-bold text-white tracking-tight">Clients</h1>
              <p className="text-base text-zinc-500">
                고객사를 관리하고 이메일 캠페인 성과를 추적하세요.
              </p>
            </div>

            {/* Card Top Section - Search & Filter */}
            <div className="mb-6 border-b border-white/10 pb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Search - 왼쪽 */}
                <div className="relative group w-full sm:w-[320px] flex-shrink-0">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="회사명, 담당자, URL 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 bg-[#1C1C1E] border border-[#2C2C2E] rounded-[10px] pl-10 pr-4 text-[15px] text-white focus:outline-none focus:border-[#0A84FF] focus:bg-[#2C2C2E] focus:shadow-[0_0_0_4px_rgba(10,132,255,0.15)] transition-all placeholder:text-zinc-600"
                  />
                </div>

                {/* Right Group: Filters + Add Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Status Filters - Segmented Control 스타일 */}
                  <div className="flex items-center gap-0.5 bg-[#1C1C1E] p-1 rounded-[10px] flex-shrink-0">
                    {(["All", "Hot", "Warm", "Cold"] as FilterStatus[]).map((tab) => {
                      const isActive = activeTab === tab;
                      
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "px-4 py-2 rounded-[7px] text-sm font-medium transition-all duration-300",
                            isActive
                              ? "bg-[#636366] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] font-semibold"
                              : "bg-transparent text-zinc-500 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 h-12 bg-white text-black px-5 rounded-[10px] text-sm font-semibold hover:bg-[#F2F2F7] hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
                  >
                    <Plus size={16} strokeWidth={2} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card Bottom Section - Table */}
            <div className="p-6">
              {/* Table */}
              <div className="overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-zinc-900/50 border-b border-white/10 whitespace-nowrap">
                  <div className="col-span-2 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                    회사 정보
                  </div>
                  <div className="col-span-1 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                    담당자
                  </div>
                  <div className="col-span-2 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                    이메일
                  </div>
                  <div className="col-span-2 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                    연락처
                  </div>
                  <div className="col-span-3 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                    캠페인 활동
                  </div>
                  <div className="col-span-1 text-sm font-medium text-zinc-500 uppercase tracking-wider text-center">
                    상태
                  </div>
                  <div className="col-span-1 text-sm font-medium text-zinc-500 uppercase tracking-wider text-right">
                    관리
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/5">
              {sortedClients.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-zinc-500 text-sm">검색 결과가 없습니다.</p>
                </div>
              ) : (
                sortedClients.map((client) => {
                  const statusStyle = statusConfig[client.crm_status];
                  const displayUrl = client.url
                    ? client.url.replace(/^https?:\/\//, "").replace(/^www\./, "")
                    : "-";

                  return (
                    <div
                      key={client.id}
                      onClick={() => router.push(`/prospects/${client.id}/mix`)}
                      className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-white/5 transition-colors cursor-pointer group items-center"
                    >
                      {/* Company Info + URL 통합 */}
                      <div className="col-span-2 flex flex-col justify-center">
                        <div className="text-base font-bold text-white mb-1">{client.name}</div>
                        {client.url ? (
                          <a
                            href={client.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-blue-400 truncate flex items-center gap-1 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            {displayUrl.substring(0, 30)}
                            {displayUrl.length > 30 ? "..." : ""}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </div>

                      {/* 담당자 (1칸) - 로고 제거 */}
                      <div className="col-span-1 flex flex-col justify-center overflow-hidden">
                        <span className="text-sm font-medium text-gray-200 truncate">
                          {client.contact_name || "-"}
                        </span>
                        {client.store_name && (
                          <span className="text-[11px] text-gray-500 truncate">{client.store_name}</span>
                        )}
                      </div>

                      {/* 이메일 컬럼 (독립) */}
                      <div className="col-span-2 flex flex-col justify-center">
                        {client.contact_email ? (
                          <div 
                            className="flex items-center gap-2 mb-1 cursor-text select-all"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await navigator.clipboard.writeText(client.contact_email!);
                                toast.success("이메일이 복사되었습니다");
                              } catch (err) {
                                console.error("복사 실패:", err);
                                toast.error("복사에 실패했습니다");
                              }
                            }}
                            title="클릭하여 복사"
                          >
                            <Mail className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-sm text-gray-400 font-mono tracking-tight hover:text-white transition-colors">
                              {client.contact_email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>

                      {/* 연락처 컬럼 (전화번호) */}
                      <div className="col-span-2 flex flex-col justify-center">
                        {client.contact_phone ? (
                          <div 
                            className="flex items-center gap-2 mb-1 cursor-text select-all"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await navigator.clipboard.writeText(client.contact_phone!);
                                toast.success("전화번호가 복사되었습니다");
                              } catch (err) {
                                console.error("복사 실패:", err);
                                toast.error("복사에 실패했습니다");
                              }
                            }}
                            title="클릭하여 복사"
                          >
                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-sm text-gray-400 font-mono tracking-tight hover:text-white transition-colors">
                              {client.contact_phone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>

                      {/* Campaign Activity - NEW */}
                      <div className="col-span-3 flex items-start gap-6">
                        {/* 보낸 횟수 */}
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-1">
                            Sent
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2C2C2E] text-gray-300">
                              <Send size={12} />
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {/* TODO: 실제 이메일 개수로 교체 */}
                              0회
                            </span>
                          </div>
                        </div>

                        {/* 구분선 */}
                        <div className="w-[1px] h-8 bg-[#333]"></div>

                        {/* 다음 일정 */}
                        <div className="flex flex-col">
                          <span className="text-[10px] text-blue-400 uppercase tracking-wide font-bold mb-1">
                            Next
                          </span>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const nextSchedule = getNextSchedule(client);
                              return (
                                <>
                                  <span className="text-sm font-medium text-gray-300">
                                    {nextSchedule.date}
                                  </span>
                                  {nextSchedule.daysUntil !== null && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                                      D-{nextSchedule.daysUntil}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* 상태 (독립된 컬럼 - 중앙 정렬) */}
                      <div className="col-span-1 flex justify-center">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold shadow-[0_0_10px_rgba(10,132,255,0.1)]",
                            statusStyle.className,
                          )}
                        >
                          <div
                            className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusStyle.dotColor)}
                          />
                          {statusStyle.label}
                        </div>
                      </div>

                      {/* 관리 (독립된 컬럼 - 우측 정렬) */}
                      <div className="col-span-1 flex justify-end pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                              <MoreHorizontal size={20} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(client.id, e);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit size={14} className="mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmailHistoryClick(client.id, e);
                              }}
                              className="cursor-pointer"
                            >
                              <Mail size={14} className="mr-2" />
                              이메일 히스토리
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMemoClick(client.id, e);
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
                                handleDeleteClick(client.id, e);
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

              {/* Footer Summary */}
              <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
                <span>총 {sortedClients.length}개 고객사</span>
                <div className="flex items-center gap-4">
                  <span>
                    Hot: {sortedClients.filter((c) => c.crm_status === "hot").length}
                  </span>
                  <span>
                    Warm: {sortedClients.filter((c) => c.crm_status === "warm").length}
                  </span>
                  <span>
                    Cold: {sortedClients.filter((c) => c.crm_status === "cold").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email History Drawer */}
      <Sheet open={emailHistoryOpen} onOpenChange={setEmailHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#0a0a0a] border-l border-white/10 overflow-y-auto">
          <SheetHeader className="border-b border-white/10 pb-4 mb-6">
            <SheetTitle className="text-xl font-semibold text-white">
              {selectedClient?.name || "이메일 히스토리"}
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
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
                <Mail size={24} className="text-zinc-600" />
              </div>
              <p className="text-zinc-400 text-sm mb-1">발송된 이메일이 없습니다</p>
              <p className="text-zinc-600 text-xs">
                이메일 편집 페이지에서 첫 이메일을 작성해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => {
                const reactionStatus = getEmailReactionStatus(email);
                const reactionConfig = statusConfig[reactionStatus];
                const statusConf = emailStatusConfig[email.status as keyof typeof emailStatusConfig];
                const StatusIcon = statusConf.icon;
                const isExpanded = expandedEmailId === email.id;

                return (
                  <div
                    key={email.id}
                    className={cn(
                      "rounded-xl border transition-all overflow-hidden",
                      "border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-900/50"
                    )}
                  >
                    {/* Email Header */}
                    <button
                      onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                      className="w-full p-4 flex items-center gap-4 text-left"
                    >
                      {/* Step Number */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                          reactionConfig.className,
                        )}
                      >
                        {email.step_number}
                      </div>

                      {/* Email Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-200 truncate">
                            {email.theme || `Step ${email.step_number} 이메일`}
                          </p>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              reactionConfig.className,
                            )}
                          >
                            {reactionConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              statusConf.color
                            )}
                          >
                            <StatusIcon size={12} />
                            {statusConf.label}
                          </span>
                          {email.sent_at && (
                            <span className="text-xs text-zinc-600">
                              {formatDate(email.sent_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={cn(
                          "text-zinc-600 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/[0.04] pt-4">
                        {/* Subject */}
                        {Object.keys(email.email_subjects).length > 0 && (
                          <div className="mb-4">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                              제목
                            </p>
                            <p className="text-sm text-zinc-300">
                              {Object.values(email.email_subjects)[0]}
                            </p>
                          </div>
                        )}

                        {/* Body Preview */}
                        <div className="mb-4">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                            본문 미리보기
                          </p>
                          <div
                            className="text-sm text-zinc-400 max-h-40 overflow-y-auto prose prose-invert prose-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: email.report_html_editable || email.report_html || "<p>내용 없음</p>",
                            }}
                          />
                        </div>

                        {/* Timeline */}
                        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/[0.04]">
                          {email.created_at && (
                            <div className="text-xs text-zinc-600">
                              <span className="text-zinc-500">생성:</span>{" "}
                              {formatFullDate(email.created_at)}
                            </div>
                          )}
                          {email.sent_at && (
                            <div className="text-xs text-zinc-600">
                              <span className="text-emerald-500">발송:</span>{" "}
                              {formatFullDate(email.sent_at)}
                            </div>
                          )}
                          {email.opened_at && (
                            <div className="text-xs text-zinc-600">
                              <span className="text-blue-500">열람:</span>{" "}
                              {formatFullDate(email.opened_at)}
                            </div>
                          )}
                          {email.clicked_at && (
                            <div className="text-xs text-zinc-600">
                              <span className="text-purple-500">클릭:</span>{" "}
                              {formatFullDate(email.clicked_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Memo Drawer */}
      <Sheet open={memoOpen} onOpenChange={setMemoOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0a0a0a] border-l border-white/10 overflow-y-auto">
          <SheetHeader className="border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              {selectedMemoId && (
                <button
                  onClick={() => {
                    setSelectedMemoId(null);
                    setMemoTitle("");
                    setMemoText("");
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div className="flex-1">
                <SheetTitle className="text-xl font-semibold text-white">
                  {selectedClientForMemo?.name || "메모"} - 메모
                </SheetTitle>
                <p className="text-sm text-zinc-500 mt-1">
                  {selectedMemoId 
                    ? "메모를 수정하거나 저장할 수 있습니다."
                    : "고객사에 대한 메모를 작성하고 관리하세요."}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Memo History List - 선택된 메모가 없을 때만 표시 */}
            {!selectedMemoId && memoHistory.length > 0 && (
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-3 block">
                  저장된 메모
                </label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {memoHistory.map((memo) => (
                    <button
                      key={memo.id}
                      onClick={() => handleLoadMemo(memo.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all",
                        "bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate">
                            {memo.title}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {new Date(memo.created_at).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Memo Form */}
            <div className={cn(
              "space-y-4",
              selectedMemoId ? "" : "pt-4 border-t border-white/10"
            )}>
              {/* Back Button - 메모 선택 시 표시 */}
              {selectedMemoId && (
                <button
                  onClick={() => {
                    setSelectedMemoId(null);
                    setMemoTitle("");
                    setMemoText("");
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors mb-2 w-fit"
                  title="메모 목록으로 돌아가기"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">
                  메모 제목
                </label>
                <input
                  type="text"
                  value={memoTitle}
                  onChange={(e) => setMemoTitle(e.target.value)}
                  placeholder="메모 제목을 입력하세요..."
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:bg-zinc-900 transition-all"
                  disabled={isSavingMemo}
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
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:bg-zinc-900 transition-all resize-none min-h-[200px]"
                  disabled={isSavingMemo}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setMemoOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
                disabled={isSavingMemo}
              >
                취소
              </button>
              <button
                onClick={handleSaveMemo}
                disabled={isSavingMemo}
                className="px-4 py-2 rounded-lg bg-gradient-to-b from-orange-400 to-orange-500 text-black text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(249,115,22,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingMemo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Prospect Dialog */}
      {selectedClientIdForEdit && (() => {
        const prospectToEdit = sortedClients.find(c => c.id === selectedClientIdForEdit);
        if (!prospectToEdit) {
          console.error("Prospect를 찾을 수 없습니다:", {
            selectedClientIdForEdit,
            availableIds: sortedClients.map(c => c.id),
            sortedClientsLength: sortedClients.length,
          });
          return null;
        }
        return (
          <ProspectEditDialog
            prospect={prospectToEdit}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) {
                setSelectedClientIdForEdit(null);
              }
            }}
          />
        );
      })()}

      {/* Delete Prospect Dialog */}
      {selectedClientIdForDelete && (() => {
        const prospectToDelete = sortedClients.find(c => c.id === selectedClientIdForDelete);
        if (!prospectToDelete) {
          console.error("Prospect를 찾을 수 없습니다:", {
            selectedClientIdForDelete,
            availableIds: sortedClients.map(c => c.id),
            sortedClientsLength: sortedClients.length,
          });
          return null;
        }
        return (
          <ProspectDeleteDialog
            prospect={prospectToDelete}
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) {
                setSelectedClientIdForDelete(null);
              }
            }}
          />
        );
      })()}

      {/* Add Prospect Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsAddModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg bg-[#161618] border border-[#333] rounded-2xl p-8 shadow-2xl mx-4">
            {/* Header */}
            <h2 className="text-2xl font-bold text-white mb-1">고객사 등록</h2>
            <p className="text-gray-400 text-sm mb-6">새로운 고객사 정보를 입력해주세요.</p>
            
            {/* Form */}
            <form onSubmit={handleProspectSubmit(onProspectSubmit)} className="space-y-4">
              {/* 회사명 */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-400 mb-1">
                  회사명 <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  {...registerProspect("name")}
                  placeholder="예: 올리브영"
                  className="w-full h-12 bg-[#1C1C1E] border border-[#333] rounded-lg px-3 text-white text-[15px] focus:border-white/50 focus:outline-none transition-colors placeholder:text-zinc-600"
                  disabled={isSubmittingProspect}
                />
                {prospectErrors.name && (
                  <p className="mt-1 text-sm text-red-400">{prospectErrors.name.message}</p>
                )}
              </div>

              {/* 담당자 이름 */}
              <div>
                <label htmlFor="contact_name" className="block text-sm font-semibold text-gray-400 mb-1">
                  담당자 이름
                </label>
                <input
                  id="contact_name"
                  {...registerProspect("contact_name")}
                  placeholder="예: 홍길동"
                  className="w-full h-12 bg-[#1C1C1E] border border-[#333] rounded-lg px-3 text-white text-[15px] focus:border-white/50 focus:outline-none transition-colors placeholder:text-zinc-600"
                  disabled={isSubmittingProspect}
                />
              </div>

              {/* 담당자 이메일 */}
              <div>
                <label htmlFor="contact_email" className="block text-sm font-semibold text-gray-400 mb-1">
                  담당자 이메일 <span className="text-red-400">*</span>
                </label>
                <input
                  id="contact_email"
                  type="email"
                  {...registerProspect("contact_email")}
                  placeholder="예: contact@example.com"
                  className="w-full h-12 bg-[#1C1C1E] border border-[#333] rounded-lg px-3 text-white text-[15px] focus:border-white/50 focus:outline-none transition-colors placeholder:text-zinc-600"
                  disabled={isSubmittingProspect}
                />
                {prospectErrors.contact_email && (
                  <p className="mt-1 text-sm text-red-400">{prospectErrors.contact_email.message}</p>
                )}
              </div>

              {/* 담당자 연락처 */}
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-semibold text-gray-400 mb-1">
                  담당자 연락처
                </label>
                <input
                  id="contact_phone"
                  type="tel"
                  {...registerProspect("contact_phone")}
                  placeholder="예: 010-1234-5678"
                  className="w-full h-12 bg-[#1C1C1E] border border-[#333] rounded-lg px-3 text-white text-[15px] focus:border-white/50 focus:outline-none transition-colors placeholder:text-zinc-600"
                  disabled={isSubmittingProspect}
                />
              </div>

              {/* 타겟 URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-semibold text-gray-400 mb-1">
                  타겟 URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="url"
                  type="url"
                  {...registerProspect("url")}
                  placeholder="예: https://store.example.com"
                  className="w-full h-12 bg-[#1C1C1E] border border-[#333] rounded-lg px-3 text-white text-[15px] focus:border-white/50 focus:outline-none transition-colors placeholder:text-zinc-600"
                  disabled={isSubmittingProspect}
                />
                {prospectErrors.url && (
                  <p className="mt-1 text-sm text-red-400">{prospectErrors.url.message}</p>
                )}
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="memo" className="block text-sm font-semibold text-gray-400 mb-1">
                  메모
                </label>
                <textarea
                  id="memo"
                  {...registerProspect("memo")}
                  placeholder="추가 정보를 입력하세요"
                  rows={4}
                  className="w-full h-auto min-h-[96px] bg-[#1C1C1E] border border-[#333] rounded-lg px-3 py-3 text-white text-[15px] focus:border-white/50 focus:outline-none transition-colors placeholder:text-zinc-600 resize-none"
                  disabled={isSubmittingProspect}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetProspectForm();
                  }}
                  className="px-5 h-11 text-gray-400 hover:text-white font-medium transition-colors"
                  disabled={isSubmittingProspect}
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="px-6 h-11 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmittingProspect}
                >
                  {isSubmittingProspect ? "등록 중..." : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
