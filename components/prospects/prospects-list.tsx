"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Users,
  ArrowUpRight,
  Mail,
  User,
  ChevronRight,
  Send,
  Eye,
  MousePointer,
  Clock,
  FileText,
  Search,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { ProspectActionsMenu } from "./prospect-actions-menu";
import { cn } from "@/lib/utils";
import type { Prospect, CRMStatus } from "@/types/prospect";
import type { GeneratedEmail } from "@/types/generated-email";
import { getGeneratedEmailsByProspect } from "@/actions/generated-emails";

const statusConfig = {
  hot: {
    label: "Hot",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    dotColor: "bg-rose-400",
    dotShadow: "shadow-[0_0_8px_rgba(244,63,94,0.8)]",
    textColor: "text-rose-300",
    ringColor: "ring-rose-500/20",
    gradient: "from-rose-500/20 to-transparent",
  },
  warm: {
    label: "Warm",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    dotColor: "bg-amber-400",
    dotShadow: "shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    textColor: "text-amber-300",
    ringColor: "ring-amber-500/20",
    gradient: "from-amber-500/20 to-transparent",
  },
  cold: {
    label: "Cold",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    dotColor: "bg-blue-400",
    dotShadow: "shadow-[0_0_8px_rgba(59,130,246,0.8)]",
    textColor: "text-blue-300",
    ringColor: "ring-blue-500/20",
    gradient: "from-blue-500/20 to-transparent",
  },
};

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
    icon: MousePointer,
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

interface ProspectsListProps {
  prospects: Prospect[];
}

export function ProspectsList({ prospects }: ProspectsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Filter states
  const currentStatus = searchParams.get("status") as CRMStatus | null;
  const currentSearch = searchParams.get("search") || "";

  const selectedProspect = prospects.find((p) => p.id === selectedId);

  // Load emails when prospect is selected
  useEffect(() => {
    if (selectedId) {
      setLoadingEmails(true);
      setEmails([]);
      getGeneratedEmailsByProspect(selectedId)
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
  }, [selectedId]);

  // Auto-select first prospect when list changes
  useEffect(() => {
    if (prospects.length > 0 && !selectedId) {
      setSelectedId(prospects[0].id);
    }
  }, [prospects, selectedId]);

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/prospects?${params.toString()}`);
  };

  // Email stats for the selected prospect
  const emailStats = {
    total: emails.length,
    sent: emails.filter((e) => e.status !== "pending").length,
    opened: emails.filter((e) => e.status === "opened" || e.status === "clicked").length,
    clicked: emails.filter((e) => e.status === "clicked").length,
  };

  // Group emails by reaction status
  const getEmailReactionStatus = (email: GeneratedEmail): CRMStatus => {
    if (email.status === "clicked") return "hot";
    if (email.status === "opened") return "warm";
    return "cold";
  };

  if (prospects.length === 0) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-6 shadow-2xl">
          <Users size={32} className="text-zinc-500" />
        </div>
        <h3 className="text-xl font-medium text-zinc-200 mb-2">
          등록된 고객사가 없습니다
        </h3>
        <p className="text-zinc-500 text-sm mb-8 text-center max-w-sm">
          첫 번째 고객사를 등록하고
          <br />
          맞춤형 이메일 캠페인을 시작하세요.
        </p>
        <Link
          href="/prospects/new"
          className="group relative bg-gradient-to-b from-orange-400 to-orange-500 text-black px-6 py-3 rounded-full font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
        >
          <Plus size={18} className="inline mr-2" />
          새 고객사 등록
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex gap-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/50 backdrop-blur-xl">
      {/* Left Panel - Prospects List */}
      <div className="w-[380px] flex-shrink-0 border-r border-white/[0.06] flex flex-col">
        {/* Search & Filters */}
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          {/* Search */}
          <div className="relative group">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 transition-colors"
            />
            <input
              type="text"
              placeholder="검색..."
              value={currentSearch}
              onChange={(e) => updateParams("search", e.target.value || null)}
              className="w-full bg-zinc-900/50 border border-white/[0.06] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-zinc-700 placeholder-zinc-600 transition-all"
            />
            {currentSearch && (
              <button
                onClick={() => updateParams("search", null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex gap-1.5">
            {[
              { key: null, label: "전체" },
              { key: "hot", label: "Hot" },
              { key: "warm", label: "Warm" },
              { key: "cold", label: "Cold" },
            ].map((filter) => {
              const isActive = currentStatus === filter.key;
              const config = filter.key ? statusConfig[filter.key as CRMStatus] : null;
              return (
                <button
                  key={filter.key || "all"}
                  onClick={() => updateParams("status", filter.key)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    isActive
                      ? config
                        ? `${config.bgColor} ${config.textColor} border ${config.borderColor}`
                        : "bg-white text-black"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prospects List */}
        <div className="flex-1 overflow-y-auto">
          {prospects.map((prospect) => {
            const config = statusConfig[prospect.crm_status];
            const isSelected = selectedId === prospect.id;

            return (
              <div
                key={prospect.id}
                onClick={() => setSelectedId(prospect.id)}
                className={cn(
                  "group relative px-4 py-4 cursor-pointer transition-all border-b border-white/[0.04]",
                  isSelected
                    ? "bg-white/[0.05]"
                    : "hover:bg-white/[0.02]"
                )}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-gradient-to-b from-orange-400 to-orange-500 rounded-r-full" />
                )}

                <div className="flex items-start gap-3">
                  {/* Status Indicator */}
                  <div className="relative mt-1">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        config.dotColor,
                        config.dotShadow
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Company Name */}
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "text-sm font-medium truncate transition-colors",
                          isSelected ? "text-white" : "text-zinc-200"
                        )}
                      >
                        {prospect.name}
                      </h3>
                      <ChevronRight
                        size={14}
                        className={cn(
                          "flex-shrink-0 transition-all",
                          isSelected
                            ? "text-zinc-400 opacity-100"
                            : "text-zinc-600 opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </div>

                    {/* Contact Info */}
                    {prospect.contact_name && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        {prospect.contact_name}
                      </p>
                    )}

                    {/* Meta Row */}
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          config.bgColor,
                          config.textColor
                        )}
                      >
                        {config.label}
                      </span>
                      {prospect.last_activity_at && (
                        <span className="text-[10px] text-zinc-600">
                          {formatDate(prospect.last_activity_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Summary */}
        <div className="p-4 border-t border-white/[0.06] bg-zinc-900/30">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{prospects.length}개 고객사</span>
            <Link
              href="/prospects/new"
              className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Plus size={14} />
              <span>추가</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedProspect ? (
          <>
            {/* Detail Header */}
            <div className="flex-shrink-0 p-6 border-b border-white/[0.06]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Company Name & Status */}
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold text-white tracking-tight">
                      {selectedProspect.name}
                    </h2>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                        statusConfig[selectedProspect.crm_status].bgColor,
                        statusConfig[selectedProspect.crm_status].textColor,
                        "border",
                        statusConfig[selectedProspect.crm_status].borderColor
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          statusConfig[selectedProspect.crm_status].dotColor
                        )}
                      />
                      {statusConfig[selectedProspect.crm_status].label}
                    </span>
                  </div>

                  {/* URL */}
                  {selectedProspect.url && (
                    <a
                      href={selectedProspect.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-orange-400 transition-colors group"
                    >
                      <ExternalLink size={14} />
                      <span className="font-mono">
                        {selectedProspect.url.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                      </span>
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/prospects/${selectedProspect.id}/mix`)}
                    className="flex items-center gap-2 bg-gradient-to-b from-orange-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                  >
                    <Sparkles size={16} />
                    이메일 편집
                  </button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ProspectActionsMenu prospect={selectedProspect} />
                  </div>
                </div>
              </div>

              {/* Contact & Meta Info */}
              <div className="grid grid-cols-3 gap-6 mt-6 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
                {/* Contact */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                    담당자
                  </p>
                  <div className="space-y-1.5">
                    {selectedProspect.contact_name && (
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <User size={14} className="text-zinc-600" />
                        {selectedProspect.contact_name}
                      </div>
                    )}
                    {selectedProspect.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
                        <Mail size={14} className="text-zinc-600" />
                        {selectedProspect.contact_email}
                      </div>
                    )}
                    {!selectedProspect.contact_name && !selectedProspect.contact_email && (
                      <p className="text-sm text-zinc-600 italic">정보 없음</p>
                    )}
                  </div>
                </div>

                {/* Email Stats */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                    이메일 현황
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-light text-white">{emailStats.sent}</p>
                      <p className="text-[10px] text-zinc-600">발송됨</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                      <p className="text-2xl font-light text-blue-400">{emailStats.opened}</p>
                      <p className="text-[10px] text-zinc-600">열람</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                      <p className="text-2xl font-light text-purple-400">{emailStats.clicked}</p>
                      <p className="text-[10px] text-zinc-600">클릭</p>
                    </div>
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                    메모
                  </p>
                  {selectedProspect.memo ? (
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {selectedProspect.memo}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-600 italic">메모 없음</p>
                  )}
                </div>
              </div>
            </div>

            {/* Email History */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  이메일 히스토리
                </h3>
                {emailStats.total > 0 && (
                  <span className="text-xs text-zinc-600">
                    총 {emailStats.total}통
                  </span>
                )}
              </div>

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
                    const statusConf = emailStatusConfig[email.status];
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
                              reactionConfig.bgColor,
                              reactionConfig.textColor
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
                              {/* Reaction Badge */}
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  reactionConfig.bgColor,
                                  reactionConfig.textColor
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

                          {/* Expand Arrow */}
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
                            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04]">
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
            </div>
          </>
        ) : (
          // No Selection State
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-zinc-600" />
              </div>
              <p className="text-zinc-400">고객사를 선택하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
