'use client';

import Link from 'next/link';
import { SignedOut, SignedIn, UserButton } from '@clerk/nextjs';
import { ArrowRight, Zap, MousePointerClick, TrendingUp, Check, LayoutTemplate, Type, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* ---------------------------------------------------------------------- */}
      {/* [1] Navigation */}
      {/* ---------------------------------------------------------------------- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tighter cursor-pointer text-white">LinkPitch</span>
          <div className="flex items-center gap-6">
            <SignedOut>
              <Link 
                href="/sign-in" 
                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors relative z-10 cursor-pointer"
              >
                로그인
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "size-8",
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link 
                href="/sign-up" 
                className="h-8 px-4 rounded-full bg-white text-black text-xs font-bold flex items-center hover:bg-zinc-200 transition-colors relative z-10 cursor-pointer"
              >
                무료로 시작하기
              </Link>
            </SignedOut>
            <SignedIn>
              <Link 
                href="/app" 
                className="h-8 px-4 rounded-full bg-white text-black text-xs font-bold flex items-center hover:bg-zinc-200 transition-colors relative z-10 cursor-pointer"
              >
                대시보드
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ---------------------------------------------------------------------- */}
      {/* [2] Hero Section */}
      {/* ---------------------------------------------------------------------- */}
      <section className="relative pt-44 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none opacity-40" />
        
        <div className="relative z-10 max-w-[1000px] mx-auto px-6 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-semibold text-zinc-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-3 h-3 text-blue-400" />
            AI-Powered Sales Engine
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
            개인맞춤형 메일 한 통에 5시간?<br />
            이젠 딱 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">20분만 투자하세요</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium tracking-tight">
            AI 분석 내용을 나만의 파일로 간편히 커스텀하여<br/>
            <span className="text-white border-b border-white/20 pb-0.5">매일 반복되는 잃어버린 3시간</span>을 찾으세요
          </p>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
            <Link href="/dashboard" className="h-14 px-10 rounded-full bg-white text-black font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
              무료 체험해보기 <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* [3] Feature Showcase (Unified Texture & New Layout) */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-black">
        <div className="max-w-[1400px] mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
            
            {/* ------------------------------------------------------- */}
            {/* [Card 1: Left Big] Dashboard & 5-Step Generator */}
            {/* ------------------------------------------------------- */}
            <div className="lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-[#0A0A0A] to-black border border-white/10 rounded-[32px] p-10 relative overflow-hidden group flex flex-col shadow-2xl">
              <div className="relative z-10 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                   <LayoutTemplate className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">한 번의 스캔, 5배의 결과물</h3>
                <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
                  상세페이지 URL 하나만 입력하면,<br/>
                  AI가 <span className="text-white font-bold">5단계 최적화 자산</span>을 자동으로 생성합니다.
                </p>
              </div>

              {/* Visual: The 5-Step Generation Flow */}
              <div className="mt-auto relative w-full h-[320px] bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-inner overflow-hidden">
                 
                 {/* Input */}
                 <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3 px-4 py-2 bg-black border border-zinc-800 rounded-full text-xs text-zinc-500">
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                       Scanned: smartstore.naver.com...
                    </div>
                 </div>

                 {/* Arrow Flow */}
                 <div className="absolute top-[60px] left-1/2 -translate-x-1/2 h-8 w-[1px] bg-gradient-to-b from-zinc-700 to-transparent" />

                 {/* Output Grid (The 5 Steps) */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
                    {/* 1. Images */}
                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group/item">
                       <div className="flex items-center gap-2 mb-2 text-blue-400">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">5 Images</span>
                       </div>
                       <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => <div key={i} className="w-full h-8 bg-zinc-800 rounded-sm" />)}
                       </div>
                    </div>

                    {/* 2. Titles */}
                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group/item">
                       <div className="flex items-center gap-2 mb-2 text-indigo-400">
                          <Type className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">10 Titles</span>
                       </div>
                       <div className="space-y-1.5">
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full"/>
                          <div className="w-3/4 h-1.5 bg-zinc-800 rounded-full"/>
                          <div className="w-5/6 h-1.5 bg-zinc-800 rounded-full"/>
                       </div>
                    </div>

                    {/* 3. Report */}
                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors group/item sm:col-span-1 col-span-2">
                       <div className="flex items-center gap-2 mb-2 text-purple-400">
                          <FileText className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">Optimization Report</span>
                       </div>
                       <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-zinc-500">Step 1~5 Analysis</span>
                          <span className="text-[10px] text-green-500 font-bold">Ready</span>
                       </div>
                    </div>
                 </div>

                 {/* Decorative Glow */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
              </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* [Card 2: Right Top] One-Click Scan */}
            {/* ------------------------------------------------------- */}
            <div className="bg-gradient-to-br from-[#0A0A0A] to-black border border-white/10 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xl font-bold text-white">원클릭 스캔하기</h3>
                     <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                  <p className="text-zinc-400 text-sm mb-6">
                     브라우저 우측 상단 버튼만 누르세요.<br/>
                     자동화 엔진이 즉시 작동합니다.
                  </p>
                  
                  {/* Browser Mockup */}
                  <div className="w-full bg-[#121212] rounded-xl border border-white/5 p-3 shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                     <div className="h-8 bg-black rounded-lg border border-zinc-800 flex items-center justify-between px-3">
                        <div className="w-20 h-1.5 bg-zinc-800 rounded-full" />
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-600/30">
                           <Zap className="w-3 h-3 text-white fill-white" />
                        </div>
                     </div>
                     <div className="mt-3 space-y-2">
                        <div className="w-full h-20 bg-zinc-900 rounded-lg border border-zinc-800/50" />
                     </div>
                  </div>
               </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* [Card 3: Right Bottom] Result Report (Mobile) */}
            {/* ------------------------------------------------------- */}
            <div className="bg-gradient-to-br from-[#0A0A0A] to-black border border-white/10 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
               <div className="relative z-10 flex gap-4">
                  <div className="flex-1">
                     <h3 className="text-xl font-bold text-white mb-2">성과로 직결되는 리포트</h3>
                     <p className="text-zinc-400 text-sm">
                        상담 버튼 클릭 시<br/>
                        <span className="text-rose-500 font-bold">Hot Lead</span>로 전환
                     </p>
                  </div>
               </div>

               {/* Mobile UI (Sliding Up) */}
               <div className="absolute -bottom-12 right-6 w-[160px] bg-[#121212] border border-zinc-700 rounded-[20px] p-2 shadow-2xl transform group-hover:-translate-y-4 transition-transform duration-500">
                  <div className="h-full bg-black rounded-[14px] overflow-hidden border border-zinc-800">
                     <div className="h-8 bg-[#1C1C1E] border-b border-zinc-800" />
                     <div className="p-3 space-y-2">
                        <div className="h-2 w-3/4 bg-zinc-800 rounded-full" />
                        <div className="h-12 bg-zinc-900 rounded border border-zinc-800" />
                        <div className="h-6 w-full bg-[#FEE500] rounded text-[8px] text-black font-bold flex items-center justify-center">
                           1:1 무료 상담하기
                        </div>
                     </div>
                  </div>
                  {/* Cursor */}
                  <div className="absolute bottom-10 right-4 animate-bounce">
                     <MousePointerClick className="w-6 h-6 text-white fill-white drop-shadow-md" />
                  </div>
               </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* [Card 4] Value Proposition (Efficiency) */}
            {/* ------------------------------------------------------- */}
            <div className="bg-gradient-to-br from-[#0A0A0A] to-black border border-white/10 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
               <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                     <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">최고 효율로 가치 창출</h3>
                  <p className="text-zinc-400 text-xs mb-6">
                    최저 시급으로 1시간만 아껴도<br/>
                    한 달이면 <span className="text-white font-bold">20만원</span> 이상의 가치입니다.
                  </p>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                     <div className="w-[85%] h-full bg-green-500 rounded-full" />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-mono">
                     <span>Time Saving</span>
                     <span className="text-green-500">+ 200,000 KRW</span>
                  </div>
               </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* [Card 5] Focus Accounts (Unified Texture) */}
            {/* ------------------------------------------------------- */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#0A0A0A] to-black border border-white/10 rounded-[32px] p-8 relative overflow-hidden group flex flex-col justify-center shadow-2xl">
               <h3 className="text-xl font-bold mb-4 text-white">Focus Accounts</h3>
               
               {/* UI Mockup (Consistent Style) */}
               <div className="bg-[#121212] rounded-xl border border-white/5 p-4 flex items-center justify-between shadow-lg transform group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-[#1F1F1F] flex items-center justify-center text-sm font-bold text-zinc-400 border border-[#333]">홍</div>
                     <div>
                        <div className="text-sm font-bold text-white">홍길동 팀장</div>
                        <div className="text-xs text-zinc-500">contact@email.com</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="px-2.5 py-1 bg-[#0A0A0A] text-blue-400 text-[10px] font-bold rounded border border-[#333]">
                        Cold
                     </div>
                  </div>
               </div>
               
               <p className="mt-4 text-xs text-zinc-500">
                  중요한 고객만 따로 모아 집중 관리하세요.
               </p>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* [4] Pricing Section */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-24 bg-black border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">Pricing</h2>
          <p className="text-zinc-400 mb-16">합리적인 가격으로 영업 효율을 극대화하세요.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             
             {/* Basic */}
             <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col text-left hover:border-zinc-700 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
                <p className="text-zinc-500 text-sm mb-6">가볍게 시작하는 개인</p>
                <div className="text-3xl font-bold text-white mb-8">₩29,000<span className="text-base font-normal text-zinc-500">/월</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500"/> 60 Credits</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500"/> Basic Analytics</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500"/> Email Support</li>
                </ul>
                <button className="w-full py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors">Get Started</button>
             </div>

             {/* Standard (Popular) */}
             <div className="bg-[#121212] border border-blue-500/30 rounded-3xl p-8 flex flex-col text-left relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                <h3 className="text-xl font-bold text-white mb-2">Standard</h3>
                <p className="text-zinc-500 text-sm mb-6">성장을 위한 최적의 선택</p>
                <div className="text-4xl font-bold text-white mb-2">₩49,000<span className="text-base font-normal text-zinc-500">/월</span></div>
                <p className="text-[11px] text-blue-400 font-medium mb-8">아메리카노 한 잔 값으로, 11명의 고객에게 제안하세요.</p>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex items-center gap-3 text-sm text-white"><Check className="w-4 h-4 text-blue-500"/> 120 Credits</li>
                   <li className="flex items-center gap-3 text-sm text-white"><Check className="w-4 h-4 text-blue-500"/> Insight Mixer</li>
                   <li className="flex items-center gap-3 text-sm text-white"><Check className="w-4 h-4 text-blue-500"/> No-Pixel CRM</li>
                   <li className="flex items-center gap-3 text-sm text-white"><Check className="w-4 h-4 text-blue-500"/> Custom Context</li>
                </ul>
                <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">Get Started</button>
             </div>

             {/* Pro */}
             <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col text-left hover:border-zinc-700 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                <p className="text-zinc-500 text-sm mb-6">물량이 많은 팀/에이전시</p>
                <div className="text-3xl font-bold text-white mb-8">₩79,000<span className="text-base font-normal text-zinc-500">/월</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                   <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500"/> 240 Credits</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500"/> Advanced Analytics</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500"/> Priority Support</li>
                   <li className="flex items-center gap-3 text-sm text-zinc-300"><Check className="w-4 h-4 text-zinc-500"/> API Access</li>
                </ul>
                <button className="w-full py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors">Get Started</button>
             </div>

          </div>
          
          <p className="text-zinc-600 text-xs mt-12">
             회원가입 시 무료 3건을 드립니다. 카드 등록 없이 체험해보세요.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* [5] Footer */}
      {/* ---------------------------------------------------------------------- */}
      <footer className="py-16 border-t border-white/10 bg-black text-center">
        <p className="text-zinc-600 text-sm font-medium">
          © 2024 LinkPitch. Designed for Intelligent Sales.
        </p>
      </footer>

    </div>
  );
}
