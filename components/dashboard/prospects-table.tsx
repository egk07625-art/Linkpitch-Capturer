"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, MoreHorizontal, Edit, Mail, FileText, Trash2, ChevronRight, ChevronLeft, Clock, MousePointer2, Eye, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
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
import { getGeneratedEmailsByProspect } from "@/actions/generated-emails";
import { updateProspect } from "@/app/actions/prospects";
import { toast } from "sonner";

interface ProspectsTableProps {
  prospects: Prospect[];
  filterStatus?: "hot" | "warm" | "all";
  limit?: number;
  showViewAll?: boolean;
  campaignStats?: Record<string, CampaignStats>;
}

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

export function ProspectsTable({
  prospects,
  filterStatus,
  limit,
  showViewAll = true,
  campaignStats = {},
}: ProspectsTableProps) {
  const router = useRouter();

  // 상태 관리
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClientIdForEdit, setSelectedClientIdForEdit] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClientIdForDelete, setSelectedClientIdForDelete] = useState<string | null>(null);

  // 필터링 적용
  let filteredProspects = [...prospects];
  if (filterStatus === "hot") {
    filteredProspects = filteredProspects.filter((p) => p.crm_status === "hot");
  } else if (filterStatus === "warm") {
    filteredProspects = filteredProspects.filter(
      (p) => p.crm_status === "warm" || p.crm_status === "hot",
    );
  }

  // HOT 고객을 최상단에 정렬
  const sortedProspects = filteredProspects.sort((a, b) => {
    const statusOrder: Record<CRMStatus, number> = { hot: 0, warm: 1, cold: 2 };
    return statusOrder[a.crm_status] - statusOrder[b.crm_status];
  });

  // 제한 적용
  const displayedProspects = limit
    ? sortedProspects.slice(0, limit)
    : sortedProspects;

  if (displayedProspects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl" />
          <div className="relative space-y-3 text-center">
            <p className="text-sm text-zinc-400">분석할 고객사가 없습니다</p>
            <Button asChild className="premium-button shadow-lg shadow-amber-500/20">
              <Link href="/app/create">분석 시작하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 다음 일정 포맷팅 헬퍼
  function formatNextSchedule(daysUntilNext: number | null): string {
    if (daysUntilNext === null) return "일정 없음";
    if (daysUntilNext === 0) return "오늘";
    if (daysUntilNext === 1) return "내일";
    return `${daysUntilNext}일 후`;
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

  // 마지막 활동 포맷팅
  function formatLastSent(lastSentAt: string | null | undefined): string {
    if (!lastSentAt) return "-";
    try {
      return formatDistanceToNow(new Date(lastSentAt), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return "-";
    }
  }

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
    const client = displayedProspects.find(c => c.id === clientId);
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
    
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.error("잘못된 클라이언트 ID:", clientId);
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

  const selectedClient = displayedProspects.find(c => c.id === selectedClientIdForHistory);
  const selectedClientForMemo = displayedProspects.find(c => c.id === selectedClientIdForMemo);

  // 이메일 상태 헬퍼
  function getEmailReactionStatus(email: GeneratedEmail): CRMStatus {
    if (email.status === "opened") return "warm";
    return "cold";
  }

  // 날짜 포맷팅 헬퍼
  function formatFullDate(dateString: string | null | undefined): string {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const emailStatusConfig = {
    pending: { label: "대기 중", icon: Clock, color: "text-zinc-500" },
    sent: { label: "발송됨", icon: Mail, color: "text-blue-500" },
    opened: { label: "열람됨", icon: Eye, color: "text-emerald-500" },
    clicked: { label: "클릭됨", icon: MousePointer2, color: "text-purple-500" },
    failed: { label: "실패", icon: X, color: "text-red-500" },
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 헤더 바 */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {filterStatus === "hot"
              ? "당장 연락할 곳"
              : filterStatus === "warm"
                ? "우선순위 고객"
                : "우선순위 고객"}
          </h2>
          <p className="text-sm text-zinc-400">
            {displayedProspects.length}개의 고객사
            {filterStatus && ` (${filterStatus === "hot" ? "Hot" : "Hot/Warm"}만 표시)`}
          </p>
        </div>
        {showViewAll && (
          <a href="/prospects" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group">
            모두 보기
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        )}
      </div>

      {/* Grid 헤더 */}
      <div className="grid grid-cols-12 gap-6 px-6 py-3 border-b border-white/10 bg-[#1C1C1E] text-sm font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap shrink-0">
        <div className="col-span-3">회사 정보</div>
        <div className="col-span-2">담당자</div>
        <div className="col-span-2">연락처</div>
        <div className="col-span-3">캠페인 활동</div>
        <div className="col-span-1 text-center">상태</div>
        <div className="col-span-1 text-right">관리</div>
      </div>

      {/* Grid 데이터 행 (스크롤 가능 영역) */}
      <div className="flex-1 overflow-y-auto bg-transparent divide-y divide-[#2C2C2E]">
        {displayedProspects.map((prospect) => {
          const statusStyle = statusConfig[prospect.crm_status];
          const displayUrl = prospect.url || "";
          const displayName = prospect.store_name || prospect.name;
          const stats = campaignStats[prospect.id] || {
            sentCount: 0,
            nextScheduleDate: null,
            daysUntilNext: null,
            progress: 0,
          };

          // 마지막으로 보낸 메일 날짜 계산 (임시로 stats에서 가져오거나 prospect의 last_activity_at 사용)
          const lastSent = stats.nextScheduleDate
            ? new Date(stats.nextScheduleDate).getTime() - stats.daysUntilNext! * 24 * 60 * 60 * 1000
            : null;

          return (
            <div
              key={prospect.id}
              className="grid grid-cols-12 gap-6 px-6 py-6 items-center border-b border-white/10 hover:bg-white/5 transition-all group cursor-pointer"
              onClick={() => {
                router.push(`/prospects/${prospect.id}/mix`);
              }}
            >
              {/* 1. 회사 정보 (3칸) */}
              <div className="col-span-3 flex flex-col justify-center overflow-hidden">
                <div className="text-lg font-bold text-white mb-1 truncate">{displayName}</div>
                {displayUrl ? (
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-blue-400 truncate transition-colors block w-full font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {displayUrl.replace(/^https?:\/\//, "").substring(0, 40)}
                    {displayUrl.length > 40 ? "..." : ""}
                  </a>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </div>

              {/* 2. 담당자 (2칸) */}
              <div className="col-span-2 flex items-center gap-3 overflow-hidden">
                {/* 아바타: 이니셜로 깔끔하게 */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-xs font-bold text-gray-400 border border-[#333]">
                  {prospect.contact_name
                    ? getInitial(prospect.contact_name)
                    : getInitial(displayName)}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-base font-medium text-gray-200 truncate">
                    {prospect.contact_name || "-"}
                  </span>
                  {prospect.category && (
                    <span className="text-[11px] text-gray-500 truncate">{prospect.category}</span>
                  )}
                </div>
              </div>

              {/* 3. 연락처 (2칸) - 로고 삭제 & 폰트 정리 */}
              <div className="col-span-2 flex flex-col justify-center overflow-hidden">
                {prospect.contact_email ? (
                  <span
                    className="text-base text-gray-400 font-mono tracking-tight truncate hover:text-white transition-colors cursor-pointer"
                    title="메일 복사하기"
                  >
                    {prospect.contact_email}
                  </span>
                ) : (
                  <span className="text-base text-gray-500">-</span>
                )}
              </div>

              {/* 4. 캠페인 활동 (3칸) - 정보 밀도 최적화 */}
              <div className="col-span-3 flex items-center gap-4">
                {/* SENT */}
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500 font-bold mb-1 tracking-wider">SENT</span>
                  <span className="text-base font-bold text-white">{stats.sentCount}회</span>
                </div>

                {/* 구분선 */}
                <div className="w-[1px] h-8 bg-[#333]"></div>

                {/* NEXT */}
                <div className="flex flex-col">
                  <span className="text-[11px] text-blue-400 font-bold mb-1 tracking-wider">NEXT</span>
                  <div className="flex items-center gap-2">
                    {stats.nextScheduleDate ? (
                      <>
                        <span className="text-base font-medium text-gray-300">
                          {formatDate(stats.nextScheduleDate)}
                        </span>
                        {stats.daysUntilNext !== null && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                            D-{stats.daysUntilNext}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-base font-medium text-gray-500">일정 없음</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. 상태 (독립된 컬럼 - 중앙 정렬) */}
              <div className="col-span-1 flex justify-center">
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold border shadow-[0_0_15px_rgba(10,132,255,0.15)]",
                    statusStyle.className === "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                      : statusStyle.className === "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mr-2",
                      statusStyle.className === "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        ? "bg-rose-400 animate-pulse"
                        : statusStyle.className === "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-blue-400 animate-pulse"
                    )}
                  ></div>
                  {statusStyle.label}
                </span>
              </div>

              {/* 6. 관리 (1칸) - 우측 정렬 */}
              <div className="col-span-1 flex justify-end pr-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    >
                      <MoreHorizontal size={20} />
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
        })}
      </div>

      {/* Email History Sheet */}
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

      {/* Memo Sheet */}
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
                  {selectedClientForMemo?.store_name || selectedClientForMemo?.name || "메모"} - 메모
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
                  className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
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
                  className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 resize-none"
                />
              </div>
              <Button
                onClick={handleSaveMemo}
                disabled={isSavingMemo || !memoTitle.trim() || !memoText.trim()}
                className="w-full premium-button"
              >
                {isSavingMemo ? "저장 중..." : selectedMemoId ? "메모 수정" : "메모 저장"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      {selectedClientIdForEdit && (() => {
        const prospectToEdit = displayedProspects.find(p => p.id === selectedClientIdForEdit);
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
        const prospectToDelete = displayedProspects.find(p => p.id === selectedClientIdForDelete);
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
    </div>
  );
}
