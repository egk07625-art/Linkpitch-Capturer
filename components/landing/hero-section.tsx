'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// Apple-style easing curve
const springEase = 'easeOut' as const;

// Counter Component for "300% 상승"
function CountUpCounter({ end, duration = 2.5 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [colorProgress, setColorProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;
    const endValue = end;

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // seconds
      const progress = Math.min(elapsed / duration, 1);

      // EaseOutCirc easing function
      const easeOutCirc = (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2));
      const easedProgress = easeOutCirc(progress);

      const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
      setCount(currentValue);
      setColorProgress(easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
        setColorProgress(1);
      }
    };

    const timer = setTimeout(() => {
      animate();
    }, 1000); // Start after 1 second delay

    return () => clearTimeout(timer);
  }, [end, duration]);

  // Color interpolation: gray-500 (0) -> white (0.5) -> red-500 (1)
  const getColor = () => {
    if (colorProgress < 0.5) {
      // gray-500 to white
      const t = colorProgress * 2;
      const gray = 107 + (255 - 107) * t; // #6B7280 to #FFFFFF
      return `rgb(${gray}, ${gray}, ${gray})`;
    } else {
      // white to red-500 (#EF4444)
      const t = (colorProgress - 0.5) * 2;
      const r = 255; // Always 255 (red)
      const g = 255 - (255 - 68) * t; // 255 to 68
      const b = 255 - (255 - 68) * t; // 255 to 68
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const textShadow = colorProgress >= 0.9 
    ? '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)'
    : 'none';

  return (
    <span
      className="tabular-nums font-bold"
      style={{
        color: getColor(),
        textShadow,
        transition: 'color 0.1s ease-out, text-shadow 0.1s ease-out',
      }}
    >
      {count}%
    </span>
  );
}

export function HeroSection() {
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNew(true);
    }, 1000); // Start transition after 1 second

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-6 pt-32 pb-40 overflow-hidden bg-[#000000]">
      {/* Animated Background Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-cyan-600/30 blur-[120px] rounded-full pointer-events-none"
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Bottom Fade Out Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0) 100%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Eyebrow - First to appear */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: springEase, delay: 0.2 }}
          className="inline-flex mb-6 md:mb-8"
        >
          <div className="rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm text-blue-400 px-5 py-2 text-xs md:text-sm font-semibold">
            경쟁사와의 승부처를 '운영'에서 '분석'으로 이동하십시오
          </div>
        </motion.div>

        {/* Headline - Second to appear */}
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: springEase, delay: 0.4 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-center mb-6 md:mb-8 px-4"
        >
          {/* Line 1: Elevator Slide Transition */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-2 md:mb-3 flex-wrap">
            <span className="text-white font-medium">커스텀 제안서 작성</span>
            
            {/* Container for the transition */}
            <div className="relative h-[1.1em] overflow-hidden inline-flex flex-col justify-end">
              <AnimatePresence mode="wait">
                {showNew ? (
                  <motion.span
                    key="new"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    className="text-red-500 font-bold"
                  >
                    20분
                  </motion.span>
                ) : (
                  <motion.span
                    key="old"
                    initial={{ y: '0%', opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="text-gray-500 font-medium"
                  >
                    5시간
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Line 2: Harmonious Counter */}
          <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
            <span className="text-white font-medium">미팅 성사율은</span>
            <CountUpCounter end={300} duration={2.5} />
            <span className="text-white font-medium">상승</span>
          </div>
        </motion.h1>

        {/* Sub-headline - Third to appear */}
        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: springEase, delay: 0.6 }}
          className="text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed px-4"
        >
          AI 정밀 분석으로 소구점을 찾고, '개인 맞춤 이메일'로 전환합니다.
          <br className="hidden md:block" />
          5시간 걸리던 설득의 과정, 이제 20분이면 충분합니다.
        </motion.p>

        {/* CTA Button - The Star - Fourth to appear */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: springEase, delay: 0.8 }}
          className="mb-16 md:mb-20"
        >
          <CTAButton />
        </motion.div>
      </div>

      {/* Mobile Sticky CTA - Only on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        <Link
          href="#pre-register"
          className="block w-full h-14 rounded-full bg-gradient-to-r from-[#2F80ED] to-[#00C6FF] text-white text-base font-bold flex items-center justify-center shadow-lg shadow-blue-600/40"
        >
          [ 무료로 사전 예약하고 1개월 혜택 받기 👉 ]
        </Link>
      </div>
    </section>
  );
}

// Separate CTA Button Component for clean code
function CTAButton() {
  return (
    <Link href="#pre-register" className="inline-block group">
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        {/* Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative h-14 md:h-16 px-8 md:px-10 rounded-full bg-gradient-to-r from-[#2F80ED] to-[#00C6FF] flex items-center justify-center overflow-hidden cursor-pointer"
          style={{
            boxShadow: '0 0 20px rgba(47, 128, 237, 0.5)',
          }}
        >
          {/* Shimmer Effect */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1,
            }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          />

          {/* Button Text */}
          <span className="relative z-10 text-white text-base md:text-lg font-bold whitespace-nowrap">
            [ 무료로 사전 예약하고 1개월 혜택 받기 👉 ]
          </span>
        </motion.div>

        {/* Pulsing Shadow */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2F80ED] to-[#00C6FF] blur-xl -z-10"
          style={{
            opacity: 0.6,
          }}
        />

        {/* Hover Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full blur-2xl -z-20"
          style={{
            background: 'radial-gradient(circle, rgba(47, 128, 237, 0.8) 0%, transparent 70%)',
          }}
        />
      </motion.div>
    </Link>
  );
}
