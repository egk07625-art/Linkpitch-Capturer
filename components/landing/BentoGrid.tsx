"use client";

import { motion } from "framer-motion";
import { Keyboard, Sparkles, BarChart3 } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "입력",
    description: "Prospect 정보와 Step 타입을 입력하세요",
    icon: Keyboard,
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    id: 2,
    title: "생성",
    description: "AI가 인사이트와 콜드메일 초안을 생성합니다",
    icon: Sparkles,
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    id: 3,
    title: "관리",
    description: "발송 이력과 관여도를 한눈에 확인하세요",
    icon: BarChart3,
    colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
  },
];

export function BentoGrid() {
  return (
    <section className="py-24 px-4 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl font-bold text-white mb-4">어떻게 동작하나요?</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className={`group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/10 p-8 hover:bg-zinc-900 hover:scale-105 hover:border-amber-500/50 transition-all duration-300 ${step.colSpan}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col items-center text-center h-full justify-center">
              <div className="mb-6 p-4 rounded-2xl bg-white/5 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                <step.icon className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
              </div>
              
              <div className="text-4xl font-bold text-amber-500/20 mb-4 font-mono">
                {step.id}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
