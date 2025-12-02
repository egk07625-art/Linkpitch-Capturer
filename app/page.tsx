"use client";

import Navbar from "@/components/Navbar";
import { FloatingNavbar } from "@/components/landing/FloatingNavbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Check, ArrowRight, BarChart3, ScanLine, Brain, Target, Bell, LayoutTemplate } from "lucide-react";
import Link from "next/link";

// --- High-Fidelity Static UI Cards ---

const VisionAICard = () => {
  return (
    <div className="relative w-full aspect-[4/3] bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden group shadow-2xl">
      {/* Background: Blurred Website Mockup */}
      <div className="absolute inset-0 bg-zinc-950 p-6 opacity-60 blur-sm transition-all duration-700 group-hover:blur-md group-hover:scale-105">
        <div className="w-full h-full border border-zinc-800 rounded-lg bg-zinc-900/50 p-4 space-y-4">
           <div className="h-8 w-1/3 bg-zinc-800 rounded-md" />
           <div className="h-48 w-full bg-zinc-800/50 rounded-md" />
           <div className="grid grid-cols-3 gap-4">
             <div className="h-24 bg-zinc-800/50 rounded-md" />
             <div className="h-24 bg-zinc-800/50 rounded-md" />
             <div className="h-24 bg-zinc-800/50 rounded-md" />
           </div>
        </div>
      </div>

      {/* Overlay: Analysis Tags */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">
        {/* Tag 1: Visual Attention Analysis (Warning) */}
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950/80 backdrop-blur-xl border border-rose-500/20 rounded-full shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)] translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]" />
          <span className="text-rose-400 font-medium tracking-normal">시선 추적: 시선 분산 심각 (3초 이탈 위험)</span>
        </div>
        
        {/* Tag 2: Content Logic Audit (Caution) */}
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950/80 backdrop-blur-xl border border-amber-500/20 rounded-full shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] -translate-x-12 group-hover:translate-x-0 transition-transform duration-700 delay-100">
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]" />
          <span className="text-amber-400 font-medium tracking-normal">설득 논리: 소셜 프루프(후기) 영역 부재</span>
        </div>

        {/* Tag 3: Actionable Solution (Success) */}
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950/80 backdrop-blur-xl border border-emerald-500/20 rounded-full shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] translate-x-12 group-hover:translate-x-0 transition-transform duration-700 delay-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
          <span className="text-emerald-400 font-medium tracking-normal">개선안: CTA 버튼, 퍼스트뷰 상단 배치 필요</span>
        </div>
      </div>
    </div>
  );
};

const InsightMixerCard = () => {
  return (
    <div className="relative w-full aspect-[4/3] bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex shadow-2xl">
      {/* Left: Chips Panel */}
      <div className="w-1/3 border-r border-zinc-800 bg-zinc-900/80 p-4 space-y-3 backdrop-blur-sm">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Context Chips</div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-300 text-sm cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-colors group/chip">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span className="tracking-normal">성과 그래프</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-300 text-sm cursor-grab active:cursor-grabbing hover:border-purple-500/50 hover:bg-zinc-800/80 transition-colors">
          <LayoutTemplate className="w-4 h-4 text-purple-400" />
          <span className="tracking-normal">경쟁사 비교</span>
        </div>
         <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-300 text-sm cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-colors">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="tracking-normal">타겟 분석</span>
        </div>
      </div>

      {/* Right: Email Editor */}
      <div className="flex-1 bg-zinc-950 p-6 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />
        
        {/* Floating Chip Animation */}
        <motion.div
          className="absolute flex items-center gap-2 px-4 py-2 bg-emerald-900/90 border border-emerald-500/30 rounded-full text-emerald-300 text-sm font-medium shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-sm"
          initial={{ x: -280, y: 120, opacity: 0 }}
          animate={{
            x: [- 280, 120, 120, 120],
            y: [120, 180, 180, 180],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 4,
            times: [0, 0.3, 0.7, 1],
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut"
          }}
        >
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="tracking-normal">타겟 분석</span>
        </motion.div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-xs text-zinc-600">받는 사람</div>
            <div className="text-sm text-zinc-300 font-medium">대표님</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-zinc-600">제목</div>
            <div className="text-sm text-zinc-300 font-medium">제안서 예고편</div>
          </div>
          
          <div className="space-y-3">
             <div className="text-xs text-zinc-600">Generated Content</div>
             {/* Skeleton Email Body */}
             <div className="space-y-2">
               <div className="h-2 w-3/4 bg-zinc-800 rounded animate-pulse" />
               <div className="h-2 w-full bg-zinc-800 rounded animate-pulse delay-75" />
               <div className="h-2 w-5/6 bg-zinc-800 rounded animate-pulse delay-150" />
               
               {/* Flash effect when chip drops */}
               <motion.div 
                 className="h-24 w-full bg-indigo-900/10 border border-indigo-500/20 rounded-lg mt-4 p-3 flex items-center justify-center"
                 animate={{
                   backgroundColor: [
                     "rgba(49, 46, 129, 0.1)",
                     "rgba(79, 70, 229, 0.3)",
                     "rgba(49, 46, 129, 0.1)"
                   ],
                   borderColor: [
                     "rgba(99, 102, 241, 0.2)",
                     "rgba(99, 102, 241, 0.5)",
                     "rgba(99, 102, 241, 0.2)"
                   ]
                 }}
                 transition={{
                   duration: 0.5,
                   delay: 1.2,
                   repeat: Infinity,
                   repeatDelay: 4.5,
                   ease: "easeInOut"
                 }}
               >
                  <span className="text-indigo-400/50 text-xs font-mono tracking-normal">Context: 타겟 분석 Integrated</span>
               </motion.div>
               <div className="h-2 w-1/2 bg-zinc-800 rounded animate-pulse delay-200" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NoPixelCRMCard = () => {
  return (
    <div className="relative w-full aspect-[4/3] bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col items-center justify-center shadow-2xl p-8">
      
      {/* Notification Card - Slide in animation */}
      <motion.div 
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-xl relative overflow-hidden mb-8"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.5,
          repeat: Infinity,
          repeatDelay: 3.2,
          ease: "easeOut"
        }}
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        <div className="flex items-start gap-4">
          <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <p className="text-zinc-200 text-lg font-medium tracking-normal">
              🔔 <span className="text-white font-bold">글로우업</span> 님이 리포트를 <span className="text-indigo-400 font-bold">정독(80%)</span> 중입니다.
            </p>
            <p className="text-zinc-500 text-sm tracking-normal">방금 전 • 서울, 강남구</p>
          </div>
        </div>
      </motion.div>

      {/* Status Badge Transformation */}
      <div className="relative">
        <motion.div 
          className="absolute inset-0 blur-xl opacity-20"
          animate={{
            backgroundColor: [
              "rgba(156, 163, 175, 0.2)",
              "rgba(244, 63, 94, 0.3)"
            ]
          }}
          transition={{
            duration: 1.5,
            delay: 1.5,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="relative px-6 py-2 rounded-full flex items-center justify-center gap-3"
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1, 1.1, 1],
            backgroundColor: [
              "rgba(24, 24, 27, 1)",
              "rgba(24, 24, 27, 1)",
              "rgba(24, 24, 27, 1)",
              "rgba(24, 24, 27, 1)"
            ],
            borderColor: [
              "rgba(113, 113, 122, 0.3)",
              "rgba(113, 113, 122, 0.3)",
              "rgba(244, 63, 94, 0.5)",
              "rgba(244, 63, 94, 0.5)"
            ],
            boxShadow: [
              "0 0 0px rgba(244, 63, 94, 0)",
              "0 0 0px rgba(244, 63, 94, 0)",
              "0 0 30px -5px rgba(244, 63, 94, 0.6)",
              "0 0 30px -5px rgba(244, 63, 94, 0.6)"
            ]
          }}
          transition={{
            duration: 4,
            times: [0, 0.375, 0.5, 1],
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ border: "1px solid" }}
        >
          <motion.span 
            className="font-bold text-lg text-center"
            animate={{
              color: [
                "rgba(161, 161, 170, 1)",
                "rgba(161, 161, 170, 1)",
                "rgba(254, 205, 211, 1)",
                "rgba(254, 205, 211, 1)"
              ]
            }}
            transition={{
              duration: 4,
              times: [0, 0.375, 0.5, 1],
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.span
              animate={{
                opacity: [1, 1, 0, 0]
              }}
              transition={{
                duration: 4,
                times: [0, 0.375, 0.5, 1],
                repeat: Infinity
              }}
              style={{ display: "inline-block", position: "absolute" }}
            >
              Cold ❄️
            </motion.span>
            <motion.span
              animate={{
                opacity: [0, 0, 1, 1]
              }}
              transition={{
                duration: 4,
                times: [0, 0.375, 0.5, 1],
                repeat: Infinity
              }}
              style={{ display: "inline-block" }}
              className="tracking-normal"
            >
              Hot 🔥
            </motion.span>
          </motion.span>
        </motion.div>
      </div>

    </div>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 relative overflow-hidden font-sans">
      <Navbar />
      <FloatingNavbar />

      {/* --- Background Effects --- */}
      <div className="fixed inset-0 bg-zinc-950 -z-20" />
      {/* Aurora Effect */}
      <div className="fixed top-[-20%] left-[-10%] w-[120%] h-[80%] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen animate-aurora pointer-events-none -z-10" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[100%] h-[60%] bg-purple-900/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none -z-10" />
      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10" />

      <main className="relative pt-32 pb-24 px-6">
        
        {/* --- Section 1: Hero (The Hook) --- */}
        <section className="max-w-6xl mx-auto text-center mb-40 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                콜드메일 작성 시간을<br />
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-500">
                6시간 → 10분으로
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto font-light"
            >
              퍼포먼스 마케터를 위한 AI 수주 비서 Linkpitch
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
              <Link
                href="/dashboard"
                className="relative px-10 py-5 bg-zinc-950 ring-1 ring-white/10 rounded-full leading-none flex items-center divide-x divide-zinc-600"
              >
                <span className="flex items-center space-x-5">
                  <span className="pr-6 text-indigo-100 text-lg font-semibold">시작하기</span>
                </span>
                <span className="pl-6 text-indigo-400 group-hover:text-indigo-300 transition duration-200">
                  <ArrowRight className="w-6 h-6" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* --- Section 2: Feature Showcase (Overhauled) --- */}
        <section className="max-w-7xl mx-auto space-y-40 mb-40">
          
          {/* Feature 1: Vision AI */}
          <div className="min-h-[600px] grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold tracking-wide mb-8">
                <ScanLine className="w-4 h-4" /> Vision AI Analysis
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6 leading-relaxed">
                경쟁사가 보지 못하는<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-extrabold">&lsquo;시각적 빈틈&rsquo;</span>을 찾아냅니다.
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                단순 텍스트 분석이 아닙니다. <span className="text-zinc-50 font-semibold">폰트, 여백, 레이아웃, 이미지 무드</span>까지.<br className="hidden md:block" /> <span className="text-zinc-50 font-semibold">10년 차 디자이너의 눈</span>으로 상세페이지를 해부하고, <span className="text-indigo-400 font-semibold">이길 수밖에 없는 제안 포인트</span>를 추출합니다.
              </p>
            </div>
            <div className="order-1 lg:order-2 w-full">
              <VisionAICard />
            </div>
          </div>

          {/* Feature 2: Insight Mixer */}
          <div className="min-h-[600px] grid lg:grid-cols-2 gap-20 items-center">
            <div className="w-full">
              <InsightMixerCard />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold tracking-wide mb-8">
                <Brain className="w-4 h-4" /> Teaser & Movie Strategy
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-normal text-white mb-6 leading-relaxed">
                설명하지 마세요.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-extrabold">&lsquo;예고&rsquo;</span>하세요.
              </h2>
              <p className="text-zinc-400 text-xl leading-relaxed max-w-lg">
                메일 본문은 철저히 <span className="text-zinc-100 font-semibold">후킹</span>에만 집중하세요. 결정적인 한 방은 <span className="text-zinc-100 font-semibold">링크</span> 속에 숨겨져 있습니다. 고객이 링크를 타고 들어오는 순간, AI 분석과 당신의 인사이트가 결합된 리포트가 확실한 <span className="text-zinc-100 font-semibold">결과</span>를 만들어냅니다.
              </p>
            </div>
          </div>

          {/* Feature 3: No-Pixel CRM */}
          <div className="min-h-[600px] grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold tracking-wide mb-8">
                <Target className="w-4 h-4" /> No-Pixel Tracking
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-normal text-white mb-6 leading-relaxed">
                관심을 보이는 그 순간,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-extrabold">놓치지 말고 낚아채세요.</span>
              </h2>
              <p className="text-zinc-400 text-xl leading-relaxed max-w-lg">
                <span className="text-zinc-100 font-semibold">스크롤 80%</span>, <span className="text-zinc-100 font-semibold">체류 시간 30초</span>. 당신의 리포트를 <span className="text-zinc-100 font-semibold">정독</span>한 고객은 이미 마음이 열려 있습니다. <span className="text-zinc-100 font-semibold">확신</span>을 가지고 미팅을 제안하세요.
              </p>
            </div>
            <div className="order-1 lg:order-2 w-full">
              <NoPixelCRMCard />
            </div>
          </div>

        </section>

        {/* --- Section 3: Pricing (The Anchor) --- */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Pricing</h2>
            <p className="text-zinc-400 text-lg">합리적인 가격으로 영업 효율을 극대화하세요.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            
            {/* Basic Tier */}
            <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <h3 className="text-xl font-semibold text-white mb-2">Basic</h3>
              <p className="text-zinc-400 text-sm mb-6">가볍게 시작하는 개인</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">₩29,000</span>
                <span className="text-zinc-500">/월</span>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-indigo-500" /> 60 Credits
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-indigo-500" /> Basic Analytics
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-indigo-500" /> Email Support
                </div>
              </div>
              <button className="w-full py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors">
                Get Started
              </button>
            </div>

            {/* Standard Tier (Most Popular) */}
            <div className="relative p-8 rounded-2xl border border-indigo-500/50 bg-zinc-900/60 shadow-[0_0_40px_-10px_rgba(79,70,229,0.3)] scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Standard</h3>
              <p className="text-zinc-400 text-sm mb-6">성장을 위한 최적의 선택</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">₩49,000</span>
                <span className="text-zinc-500">/월</span>
              </div>
              <p className="text-xs text-indigo-300 mb-6 font-medium">
                ☕ 아메리카노 한 잔 값으로, 11명의 고객에게 제안하세요.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-indigo-400" /> 120 Credits
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-indigo-400" /> Insight Mixer
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-indigo-400" /> No-Pixel CRM
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-indigo-400" /> Custom Context
                </div>
              </div>
              <button className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-500/25">
                Get Started
              </button>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
              <p className="text-zinc-400 text-sm mb-6">물량이 많은 팀/에이전시</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">₩79,000</span>
                <span className="text-zinc-500">/월</span>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-indigo-500" /> 240 Credits
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-indigo-500" /> Advanced Analytics
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-indigo-500" /> Priority Support
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-indigo-500" /> API Access
                </div>
              </div>
              <button className="w-full py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors">
                Get Started
              </button>
            </div>

          </div>

          <div className="mt-12 text-center">
             <p className="text-zinc-500 text-sm">
               회원가입 시 <span className="text-indigo-400 font-semibold">무료 3건</span>을 드립니다. 카드 등록 없이 체험해보세요.
             </p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
