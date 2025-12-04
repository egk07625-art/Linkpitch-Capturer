"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Prospect, CRMStatus } from "@/types/prospect";
import type { GeneratedEmail } from "@/types/generated-email";
import { getGeneratedEmailsByProspect } from "@/actions/generated-emails";
import { updateProspect } from "@/app/actions/prospects";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientDashboardProps {
  /** 초기 고객사 목록 */
  initialClients?: Prospect[];
  /** 선택된 고객사 ID */
  selectedClientId?: string;
}

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

  // 샘플 데이터 (실제 데이터 연동 시 삭제하세요)
  const sampleClients: Prospect[] = initialClients.length > 0
    ? initialClients
    : [
        {
          id: "1",
          user_id: "",
          name: "올리브영",
          contact_name: "홍길동",
          contact_email: "egk5112@gmail.com",
          url: "https://smartstore.naver.com/applehyangfarm/products/9380057523",
          memo: "사과 판매 애플향농원",
          crm_status: "cold",
          max_scroll_depth: 0,
          max_duration_seconds: 0,
          visit_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          user_id: "",
          name: "무신사",
          contact_name: "김철수",
          contact_email: "kim@musinsa.com",
          url: "https://www.musinsa.com",
          memo: "",
          crm_status: "warm",
          max_scroll_depth: 0,
          max_duration_seconds: 0,
          visit_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          user_id: "",
          name: "쿠팡",
          contact_name: "이영희",
          contact_email: "lee@coupang.com",
          url: "https://www.coupang.com",
          memo: "",
          crm_status: "hot",
          max_scroll_depth: 0,
          max_duration_seconds: 0,
          visit_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

  // 필터링 및 검색
  const filteredClients = sampleClients.filter((client) => {
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

  const handleEmailHistoryClick = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleMemoClick = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const client = sortedClients.find(c => c.id === clientId);
    setSelectedClientIdForMemo(clientId);
    const history = parseMemoHistory(client?.memo);
    setMemoHistory(history);
    setMemoTitle("");
    setMemoText("");
    setSelectedMemoId(null);
    setMemoOpen(true);
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
      
      // 로컬 상태 업데이트
      const clientIndex = sampleClients.findIndex(c => c.id === selectedClientIdForMemo);
      if (clientIndex !== -1) {
        sampleClients[clientIndex].memo = memoJson;
      }
      
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

  return (
    <div className="h-full bg-[#050505] text-zinc-100 font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0a0a0a]">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Clients</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            고객사를 관리하고 이메일 캠페인 성과를 추적하세요.
          </p>
        </div>
        <Link
          href="/prospects/new"
          className="flex items-center gap-2 bg-gradient-to-b from-orange-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(249,115,22,0.3)]"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Client
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-[#0a0a0a] space-y-3">
        {/* Search */}
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="회사명, 담당자, URL 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {(["All", "Hot", "Warm", "Cold"] as FilterStatus[]).map((tab) => {
            const isActive = activeTab === tab;
            const config = tab !== "All" ? statusConfig[tab.toLowerCase() as CRMStatus] : null;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? config
                      ? `${config.className} border`
                      : "bg-white text-black"
                    : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent",
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-6 py-4">
          {/* Table */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/50 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-900/50 border-b border-white/10">
              <div className="col-span-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                회사 정보
              </div>
              <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                담당자
              </div>
              <div className="col-span-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                URL
              </div>
              <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                상태
              </div>
              <div className="col-span-1 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                마지막 활동
              </div>
              <div className="col-span-1 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
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
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      {/* Company Info - 로고 제거 */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-zinc-100 truncate">
                            {client.name}
                          </span>
                          {client.store_name && (
                            <span className="text-xs text-zinc-500 truncate">
                              {client.store_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-2 flex flex-col gap-1">
                        {client.contact_name && (
                          <div className="flex items-center gap-2 text-sm text-zinc-300">
                            <User size={12} className="text-zinc-600" />
                            <span className="truncate">{client.contact_name}</span>
                          </div>
                        )}
                        {client.contact_email && (
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Mail size={12} className="text-zinc-700" />
                            <span className="truncate">{client.contact_email}</span>
                          </div>
                        )}
                        {!client.contact_name && !client.contact_email && (
                          <span className="text-xs text-zinc-600">-</span>
                        )}
                      </div>

                      {/* URL */}
                      <div className="col-span-3 flex items-center">
                        {client.url ? (
                          <a
                            href={client.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-orange-400 transition-colors group/link truncate"
                          >
                            <ExternalLink size={12} />
                            <span className="font-mono truncate">{displayUrl}</span>
                            <ArrowUpRight
                              size={10}
                              className="opacity-0 group-hover/link:opacity-100 transition-opacity"
                            />
                          </a>
                        ) : (
                          <span className="text-sm text-zinc-600">-</span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium",
                            statusStyle.className,
                          )}
                        >
                          <div
                            className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dotColor)}
                          />
                          {statusStyle.label}
                        </div>
                      </div>

                      {/* Last Active */}
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="text-xs text-zinc-500">
                          {formatLastActive(client.last_activity_at)}
                        </span>
                      </div>

                      {/* Actions - 드롭다운 메뉴 */}
                      <div className="col-span-1 flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem
                              onClick={(e) => handleEmailHistoryClick(client.id, e)}
                              className="cursor-pointer"
                            >
                              <Mail size={14} className="mr-2" />
                              이메일 히스토리
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleMemoClick(client.id, e)}
                              className="cursor-pointer"
                            >
                              <FileText size={14} className="mr-2" />
                              메모
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
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
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
    </div>
  );
}
