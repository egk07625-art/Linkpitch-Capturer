"use client";

import { Search, Plus, MoreHorizontal, ArrowUpRight, Mail, FileText, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// 상태 스타일 설정 (프로젝트 표준)
const statusConfig = {
  hot: {
    label: "Hot",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    dotColor: "bg-rose-400",
    dotShadow: "shadow-[0_0_5px_rgba(244,63,94,1)]",
    textColor: "text-rose-200",
    shadow: "shadow-[0_0_10px_rgba(244,63,94,0.05)]",
    hoverShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]",
  },
  warm: {
    label: "Warm",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    dotColor: "bg-amber-400",
    dotShadow: "shadow-[0_0_5px_rgba(245,158,11,1)]",
    textColor: "text-amber-200",
    shadow: "shadow-[0_0_10px_rgba(245,158,11,0.05)]",
    hoverShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  },
  cold: {
    label: "Cold",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    dotColor: "bg-blue-400",
    dotShadow: "shadow-[0_0_5px_rgba(59,130,246,1)]",
    textColor: "text-blue-200",
    shadow: "shadow-[0_0_10px_rgba(59,130,246,0.05)]",
    hoverShadow: "group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  },
  all: {
    label: "전체",
    bgColor: "bg-zinc-800",
    borderColor: "border-zinc-700",
    textColor: "text-zinc-300",
  },
};

type FilterStatus = '전체' | 'Hot' | 'Warm' | 'Cold';

export default function ClientList() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('전체');

  // 필터 탭 스타일 (디자인 가이드 준수)
  const getTabStyle = (tabName: FilterStatus) => {
    const baseStyle = "px-5 py-2 rounded-full text-xs font-medium transition-all duration-150 border";
    
    if (activeFilter === tabName) {
      switch (tabName) {
        case 'Hot':
          return cn(
            baseStyle,
            "bg-rose-500/10 border-rose-500/30 text-rose-400",
            "shadow-[0_0_10px_rgba(244,63,94,0.15)]"
          );
        case 'Warm':
          return cn(
            baseStyle,
            "bg-amber-500/10 border-amber-500/30 text-amber-400",
            "shadow-[0_0_10px_rgba(245,158,11,0.15)]"
          );
        case 'Cold':
          return cn(
            baseStyle,
            "bg-blue-500/10 border-blue-500/30 text-blue-400",
            "shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          );
        default: // 전체
          return cn(
            baseStyle,
            "bg-zinc-800 border-zinc-700 text-zinc-300",
            "shadow-[0_0_10px_rgba(0,0,0,0.2)]"
          );
      }
    }
    return cn(
      baseStyle,
      "border-zinc-800 text-zinc-500",
      "hover:text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700"
    );
  };

  // 상태 배지 스타일 가져오기
  const getStatusStyle = (status: 'hot' | 'warm' | 'cold') => {
    return statusConfig[status];
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 md:p-12 font-sans selection:bg-orange-500/30">
      
      {/* 헤더: 디자인 가이드 준수 */}
      <div className="w-full flex justify-between items-end mb-10 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-zinc-50 mb-3">클라이언트 관리</h1>
          <p className="text-zinc-500 font-light text-sm tracking-wide">
            등록된 파트너사를 한눈에 모니터링하고 관리하세요.
          </p>
        </div>
        
        {/* 버튼: 오렌지 그라디언트 + 한글 */}
        <button className="group relative bg-gradient-to-b from-orange-400 to-orange-500 text-black pl-5 pr-6 py-3 rounded-full font-medium text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          <div className="absolute inset-0 bg-white/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
          <div className="relative flex items-center gap-2">
            <Plus size={16} strokeWidth={2.5} />
            <span>고객사 등록</span>
          </div>
        </button>
      </div>

      {/* 컨트롤 바 (검색 & 필터) */}
      <div className="w-full flex justify-between items-center mb-6">
        
        {/* 검색창: 디자인 가이드 Input 패턴 */}
        <div className="relative w-[380px] group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 transition-colors duration-150">
            <Search size={18} strokeWidth={1.5} />
          </div>
          <input 
            type="text" 
            placeholder="회사명, 담당자, URL 검색..." 
            className={cn(
              "w-full bg-zinc-900 border border-zinc-800 text-zinc-50 text-sm rounded-sm pl-12 pr-4 py-3",
              "focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50",
              "placeholder:text-zinc-600 transition-all duration-150 font-light"
            )}
          />
        </div>

        {/* 필터 탭: 디자인 가이드 Badge 패턴 */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-full border border-zinc-800">
          {(['전체', 'Hot', 'Warm', 'Cold'] as FilterStatus[]).map((status) => (
            <button 
              key={status} 
              onClick={() => setActiveFilter(status)}
              className={getTabStyle(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 리스트 컨테이너 */}
      <div className="w-full">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-12 gap-6 px-4 py-3 border-b border-zinc-800 text-[11px] font-medium text-zinc-500 uppercase tracking-widest">
          <div className="col-span-3 pl-2">회사 정보 / 링크</div>
          <div className="col-span-6">담당자 정보 / 메모</div>
          <div className="col-span-2 text-center">상태</div>
          <div className="col-span-1 text-right pr-4">관리</div>
        </div>

        {/* 리스트 아이템 1 (올리브영) */}
        <div className="group grid grid-cols-12 gap-6 px-4 py-5 items-start border-b border-zinc-800 hover:bg-zinc-900 transition-colors duration-150 cursor-pointer">
          
          {/* 회사 정보 & URL */}
          <div className="col-span-3 pl-2">
            <div className="text-[15px] font-medium text-zinc-100 tracking-tight group-hover:text-zinc-50 transition-colors duration-150">
              올리브영
            </div>
            <div className="flex items-center gap-1 mt-1 text-zinc-500 group-hover:text-amber-400 transition-colors duration-150">
              <ArrowUpRight size={10} />
              <span className="text-xs font-mono truncate max-w-[200px] opacity-70">
                smartstore.naver.com/oliveyoung
              </span>
            </div>
          </div>

          {/* 담당자 정보 & 메모 통합 */}
          <div className="col-span-6 flex flex-col gap-2">
            {/* 담당자 이름 */}
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <User size={12} className="text-zinc-600 flex-shrink-0" />
              <span>홍길동 매니저</span>
            </div>
            {/* 담당자 이메일 */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-light">
              <Mail size={12} className="text-zinc-700 flex-shrink-0" />
              <span className="truncate">egk5112@gmail.com</span>
            </div>
            {/* 메모 */}
            <div className="flex items-start gap-2 mt-0.5">
              <FileText size={12} className="text-zinc-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-zinc-500 leading-relaxed truncate group-hover:text-zinc-400 transition-colors duration-150">
                사과 판매 애플향농원 상세페이지 진단 요청건...
              </p>
            </div>
          </div>

          {/* 상태 */}
          <div className="col-span-2 flex justify-center pt-1">
            {(() => {
              const statusStyle = getStatusStyle('cold');
              return (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-150",
                  statusStyle.bgColor,
                  statusStyle.borderColor,
                  statusStyle.shadow,
                  statusStyle.hoverShadow
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    statusStyle.dotColor,
                    statusStyle.dotShadow
                  )}></div>
                  <span className={cn(
                    "text-[11px] font-medium tracking-wide",
                    statusStyle.textColor
                  )}>
                    {statusStyle.label}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* 관리 버튼 */}
          <div className="col-span-1 flex justify-end pr-2 pt-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all duration-150">
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* 리스트 아이템 2 (나이키) */}
        <div className="group grid grid-cols-12 gap-6 px-4 py-5 items-start border-b border-zinc-800 hover:bg-zinc-900 transition-colors duration-150 cursor-pointer">
          
          <div className="col-span-3 pl-2">
            <div className="text-[15px] font-medium text-zinc-100 tracking-tight group-hover:text-zinc-50 transition-colors duration-150">
              나이키 코리아
            </div>
            <div className="flex items-center gap-1 mt-1 text-zinc-500 group-hover:text-amber-400 transition-colors duration-150">
              <ArrowUpRight size={10} />
              <span className="text-xs font-mono truncate max-w-[200px] opacity-70">
                brand.naver.com/nike
              </span>
            </div>
          </div>

          {/* 담당자 정보 & 메모 통합 */}
          <div className="col-span-6 flex flex-col gap-2">
            {/* 담당자 이름 */}
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <User size={12} className="text-zinc-600 flex-shrink-0" />
              <span>박지성 팀장</span>
            </div>
            {/* 담당자 이메일 */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-light">
              <Mail size={12} className="text-zinc-700 flex-shrink-0" />
              <span className="truncate">marketing@nike.co.kr</span>
            </div>
            {/* 메모 */}
            <div className="flex items-start gap-2 mt-0.5">
              <FileText size={12} className="text-zinc-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-zinc-500 leading-relaxed truncate group-hover:text-zinc-400 transition-colors duration-150">
                신상품 런칭 프로모션 기획안 전달 완료 (피드백 대기중)
              </p>
            </div>
          </div>

          <div className="col-span-2 flex justify-center pt-1">
            {(() => {
              const statusStyle = getStatusStyle('hot');
              return (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-150",
                  statusStyle.bgColor,
                  statusStyle.borderColor,
                  statusStyle.shadow,
                  statusStyle.hoverShadow
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    statusStyle.dotColor,
                    statusStyle.dotShadow
                  )}></div>
                  <span className={cn(
                    "text-[11px] font-medium tracking-wide",
                    statusStyle.textColor
                  )}>
                    {statusStyle.label}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="col-span-1 flex justify-end pr-2 pt-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all duration-150">
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

