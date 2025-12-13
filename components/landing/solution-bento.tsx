'use client';

import { motion } from 'framer-motion';
import { Scan, PenTool, Layers, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';

const companies = ['쿠팡', '네이버', '카카오', '당근마켓', '티몬', '위메프', '11번가', '옥션'];

export function SolutionBento() {
  const [randomCompany, setRandomCompany] = useState('쿠팡');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * companies.length);
    setRandomCompany(companies[randomIndex]);
  }, []);
  return (
    <section className="relative pt-32 md:pt-40 pb-24 md:pb-28 px-6 md:px-20 bg-black overflow-hidden">
      {/* The Visual Breath (Connector) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Part 1: The Narrative Bridge (Hero Moment) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-20 md:mb-28"
        >
          {/* Overline */}
          <span className="inline-block py-2 px-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-base md:text-lg font-bold tracking-widest mb-10 md:mb-12">
            The Solution
          </span>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-snug tracking-tight px-2 md:px-4 break-keep">
            이제{' '}
            {/* Super-Charged AI Text */}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-600 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)] text-[1.1em] font-bold">
              'AI'
            </span>
            라는 무기를 드십시오
          </h2>

          {/* Sub-headline */}
          <p className="text-sm sm:text-base md:text-2xl lg:text-3xl text-gray-300 mt-10 md:mt-12 leading-relaxed max-w-3xl mx-auto px-4 break-keep">
            낡은 <span className="text-red-400 font-bold">'템플릿 복붙'</span>은 이제 멈추고,
            <br className="hidden md:block" />
            데이터가 설계한{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-600 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)] font-bold">
              '이기는 제안서'
            </span>
            로 갈아탈 때입니다!
          </p>
        </motion.div>

        {/* Part 2: The Feature Grid (Compact & Sharp) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Card 1: 이미지 정밀 스캔 (Cyan Theme) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8 md:p-10 hover:border-cyan-500/30 hover:shadow-[inset_0_0_40px_rgba(6,182,212,0.1)] transition-all duration-500"
          >
            {/* Icon */}
            <div className="mb-6 md:mb-8">
              <div className="inline-flex bg-cyan-500/10 rounded-lg p-4">
                <Scan className="w-12 h-12 md:w-14 md:h-14 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-5 leading-snug break-keep">
              담당자도 몰랐던<br />
              <span className="text-cyan-400">'숨은 소구점'</span>을 찾아냅니다
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 leading-relaxed mb-6 md:mb-8 break-keep">
              단순 요약이 아닙니다. <span className="text-white font-bold">네이버 스마트스토어</span>의 상세페이지 구조와 리뷰를 딥다이브하여 <span className="text-white font-semibold">'설득의 논리'</span>를 역설계합니다.
            </p>

            {/* Visual: Scanning Beam */}
            <div className="relative h-24 w-full bg-black/40 rounded-lg border border-white/5 overflow-hidden">
              {/* Abstract Content Blocks */}
              <div className="absolute inset-0 p-3 space-y-2 opacity-30">
                <div className="h-2 w-1/3 bg-gray-500 rounded"></div>
                <div className="h-8 w-full bg-gray-600 rounded"></div>
                <div className="h-2 w-1/2 bg-gray-500 rounded"></div>
                </div>
              {/* The Laser */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_cyan] animate-scan-down" />
            </div>
          </motion.div>

          {/* Card 2: AI Draft & Analysis (Blue Theme) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8 md:p-10 hover:border-blue-500/30 hover:shadow-[inset_0_0_40px_rgba(59,130,246,0.1)] transition-all duration-500"
          >
            {/* Icon */}
            <div className="mb-6 md:mb-8">
              <div className="inline-flex bg-blue-500/10 rounded-lg p-4">
                <PenTool className="w-12 h-12 md:w-14 md:h-14 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-5 leading-snug group-hover:-translate-y-1 transition-transform duration-500 break-keep">
              고민 없는 <span className="text-blue-400">'초안'</span>, 10분 안에 뽑기
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 leading-relaxed mb-6 md:mb-8 break-keep">
              복잡한 스토어 분석은 AI에게 맡기세요. <span className="text-white font-bold">단 10분이면 충분합니다.</span><br className="hidden md:block" />
              설득의 논리가 완벽하게 갖춰진 <span className="text-blue-400 font-bold">'90% 완성 초안'</span>을 즉시 대령합니다.
            </p>

            {/* Visual: Auto-Typing Document */}
            <div className="relative w-full h-24 bg-black/40 rounded-lg border border-white/5 p-3 flex flex-col gap-2 overflow-hidden">
              {/* Typing Animation Lines */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '75%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-2 bg-blue-500/40 rounded"
              />
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="h-2 bg-white/10 rounded"
              />
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '83%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="h-2 bg-white/10 rounded"
              />
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '50%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="h-2 bg-white/10 rounded"
              />

              {/* Progress Indicator */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-400">Draft:</span>
                <span className="text-xs md:text-sm font-bold text-blue-400">90% Ready</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: 하이브리드 드래그 앤 드롭 (Purple Theme) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8 md:p-10 hover:border-purple-500/30 hover:shadow-[inset_0_0_40px_rgba(168,85,247,0.1)] transition-all duration-500"
          >
            {/* Icon */}
            <div className="mb-6 md:mb-8">
              <div className="inline-flex bg-purple-500/10 rounded-lg p-4">
                <Layers className="w-12 h-12 md:w-14 md:h-14 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-5 leading-snug group-hover:-translate-y-1 transition-transform duration-500 break-keep">
              AI의 논리에,
              <br />
              <span className="text-purple-400">당신의 무기</span>를 더하세요
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 leading-relaxed mb-6 md:mb-8 break-keep">
              드래그 한 번으로 끝납니다. AI가 짠 제안서 흐름 속에 내 레퍼런스와 인사이트를 자유롭게 결합하세요.
            </p>

            {/* Visual: Abstract Layer Icon */}
            <div className="h-24 w-full flex items-center justify-center rounded-lg border border-dashed border-white/10 group-hover:border-purple-500/50 transition-colors">
              <Layers className="w-12 h-12 text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
            </div>
          </motion.div>

          {/* Card 4: Hot Lead Alert (Orange Theme) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8 md:p-10 hover:border-orange-500/30 hover:shadow-[inset_0_0_40px_rgba(249,115,22,0.1)] transition-all duration-500"
          >
            {/* Icon */}
            <div className="mb-6 md:mb-8">
              <div className="inline-flex bg-orange-500/10 rounded-lg p-4">
                <Flame className="w-12 h-12 md:w-14 md:h-14 text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-5 leading-snug group-hover:-translate-y-1 transition-transform duration-500 break-keep">
              읽는 순간 감지하는,
              <br />
              <span className="text-orange-400">골든타임</span>
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 leading-relaxed mb-6 md:mb-8 break-keep">
              고객이 제안서를 읽으면 즉시 <span className="text-orange-400 font-semibold">'Hot Lead'</span> 알림이 뜹니다. 감이 아닌 데이터로 타이밍을 잡으세요.
            </p>

            {/* Visual: Notification Toast */}
            <div className="relative">
                  <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-xl p-5 md:p-6 flex items-start gap-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] mb-4"
              >
                <Flame className="w-6 h-6 md:w-7 md:h-7 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                   <div className="text-base md:text-lg font-bold text-white mb-2">
                     Hot Lead 감지
                </div>
                   <div className="text-sm md:text-base text-gray-300 leading-relaxed">
                     담당자가 리포트를 스크롤을 80%이상 리딩했으며 30초이상 머물렀습니다.
              </div>
            </div>
          </motion.div>
            </div>
                </motion.div>
        </div>
      </div>
    </section>
  );
}
