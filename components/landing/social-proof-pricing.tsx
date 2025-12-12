'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const stats = [
  { value: '300%↑', label: '제안서 읽음률 증가' },
  { value: 'Hot Lead', label: '자동 감지 시스템' },
  { value: '20 mins', label: '평균 제작 시간' },
];

export function SocialProofPricing() {
  return (
    <section className="py-20 md:py-32 px-4 md:px-20 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Social Proof Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-20 md:mb-32"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-12 md:mb-16 tracking-tight px-4">
            검증된 성과
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                className="text-center"
              >
                <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-3 md:mb-4">
                  {stat.value}
                </div>
                <div className="text-[#A1A1A6] text-sm md:text-base font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Early Bird Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 tracking-tight px-4">
            지금 시작하면
          </h2>

          <div className="max-w-lg mx-auto bg-gradient-to-br from-[#141414] to-[#0A0A0A] rounded-[24px] border border-white/10 p-8 md:p-10 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-block mb-6">
                <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
                  <span className="text-blue-400 text-xs md:text-sm font-bold">
                    🎉 사전 예약 한정 혜택 (Early Bird)
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-8">
                <div className="text-base md:text-xl text-gray-400 line-through mb-2">
                  정식 출시가 월 49,000원
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-3">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2F80ED] to-[#007AFF]">
                    0원
                  </span>
                  <span className="text-white text-2xl md:text-3xl ml-2">에 미리 확보</span>
                </div>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed px-4">
                  지금 예약하시면, 런칭 시 <strong className="text-white font-bold">1개월 무료 이용권</strong>을 가장 먼저 보내드립니다.
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-3 md:space-y-4 text-left mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-blue-400" strokeWidth={3} />
                  </div>
                  <span className="text-sm md:text-base text-gray-300">
                    런칭 즉시 <strong className="text-white">1개월 무제한 이용</strong>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-blue-400" strokeWidth={3} />
                  </div>
                  <span className="text-sm md:text-base text-gray-300">
                    <strong className="text-white">평생 30% 구독 할인 혜택</strong>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-blue-400" strokeWidth={3} />
                  </div>
                  <span className="text-sm md:text-base text-gray-300">
                    Hot Lead 실시간 추적 기능 포함
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-blue-400" strokeWidth={3} />
                  </div>
                  <span className="text-sm md:text-base text-gray-300">
                    베타 테스터 우선 초대
                  </span>
                </div>
              </div>

              {/* Note */}
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                * 사전 예약자에 한해, 런칭 알림과 함께 100% 할인 링크를 보내드립니다.<br className="hidden md:block" />
                (지금 확보해두지 않으면 유료로 결제해야 합니다.)
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
