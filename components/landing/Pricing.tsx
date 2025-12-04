"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

export function Pricing() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pricing
          </h2>
          <p className="text-zinc-400 text-lg">
            초기 사용자를 위한 특별한 혜택
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className="relative group">
            {/* Glowing Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative bg-zinc-900 ring-1 ring-white/10 rounded-3xl p-8 md:p-10">
              {/* Recommended Ribbon */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 rotate-12 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-amber-400">
                Recommended
              </div>

              <div className="text-center mb-8">
                <h3 className="text-xl font-medium text-zinc-300 mb-2">Beta Access</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-bold text-white tracking-tighter">Free</span>
                  <span className="text-zinc-500">/ forever</span>
                </div>
                <p className="text-sm text-zinc-500 mt-4">
                  지금 가입하고 모든 기능을 무료로 이용하세요
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "무제한 콜드메일 생성",
                  "AI 기반 기업 분석",
                  "맞춤형 제안서 작성",
                  "실시간 성과 추적",
                  "이메일 템플릿 제공"
                ].map((feature) => (
                  <li key={feature} className="flex items-center text-zinc-300">
                    <Check className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className="block w-full py-4 px-6 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-center transition-colors"
              >
                지금 무료로 시작하기
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
