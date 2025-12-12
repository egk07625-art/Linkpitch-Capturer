'use client';

import { motion } from 'framer-motion';
import { Megaphone, FileQuestion } from 'lucide-react';

const problems = [
  {
    id: 1,
    icon: Megaphone,
    title: "또 '매출 올려드린다'는 광고성 메일인가요?",
    description:
      '똑같은 템플릿, 똑같은 약속... 클라이언트는 5초 만에 스팸으로 분류합니다. 당신의 진짜 실력을 보여줄 기회조차 얻지 못합니다.',
  },
  {
    id: 2,
    icon: FileQuestion,
    title: '첨부파일 PDF, 읽었는지 알 방법이 없습니다.',
    description:
      '열심히 만든 제안서를 보냈지만, 열람 여부를 확인할 수 없어 답답합니다. 언제 팔로업해야 할까요? 모든 것이 불투명합니다.',
  },
];

export function ProblemSection() {
  return (
    <section className="bg-black py-24 px-6 md:px-20 relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            열심히 보낸 제안서,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
              왜 회신이 없을까요?
            </span>
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                className="group bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-red-500/30 transition-all duration-300 min-h-[280px] flex flex-col"
              >
                {/* Icon */}
                <div className="mb-6">
                  <Icon className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {problem.title}
                  </h3>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* The Bridge (Conclusion) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          className="mt-40 mb-20 text-center max-w-4xl mx-auto px-6"
        >
          <p className="text-xl md:text-2xl font-medium text-gray-300 leading-relaxed">
            클라이언트가 기다리는 건 뻔한{' '}
            <span className="text-white font-bold">
              'ROAS 개선 광고 제안서'
            </span>
            가 아닙니다.
            <br className="hidden md:block" />
            내 상품을 나보다 더 꿰뚫어 본{' '}
            <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              '정밀 진단 보고서'
            </span>
            입니다.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
