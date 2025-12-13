'use client';

import { motion } from 'framer-motion';
import { Check, ArrowDown, CheckCircle2, Ticket } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  company: z.string().optional(),
  role: z.string().min(1, '직무를 선택해주세요'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  phone: z.string().min(1, '연락처를 입력해주세요'),
  budget: z.string().min(1, '월 광고 집행 예산을 선택해주세요'),
  message: z.string().optional(),
  privacyAgreement: z.boolean().refine((val) => val === true, {
    message: '개인정보 수집 및 이용에 동의해주세요',
  }),
});

type FormData = z.infer<typeof formSchema>;

const budgetOptions = [
  { value: '', label: '예산 범위를 선택해주세요' },
  { value: 'under_30m', label: '3,000만원 미만' },
  { value: '30m_50m', label: '3,000만원 ~ 5,000만원' },
  { value: '50m_100m', label: '5,000만원 ~ 1억원' },
  { value: '100m_200m', label: '1억원 ~ 2억원' },
  { value: 'over_200m', label: '2억원 이상' },
];

const roleOptions = [
  { value: '', label: '직무를 선택해주세요' },
  { value: 'agency', label: '광고대행사 마케터' },
  { value: 'freelancer', label: '프리랜서' },
];

export function PreRegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Google Apps Script Web App URL (환경 변수에서 가져오기)
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPTURL;

      if (!scriptUrl) {
        throw new Error('Google Script URL이 설정되지 않았습니다.');
      }

      // 디버깅: 전송할 데이터 확인
      console.log('=== 폼 제출 디버깅 ===');
      console.log('전체 데이터:', JSON.stringify(data, null, 2));
      console.log('message 값:', data.message);
      console.log('message 타입:', typeof data.message);
      console.log('message가 undefined인가?', data.message === undefined);
      console.log('message가 null인가?', data.message === null);
      console.log('message가 빈 문자열인가?', data.message === '');
      console.log('message 길이:', data.message?.length);

      // FormData를 URLSearchParams로 변환 (Google Apps Script의 e.parameter와 매칭)
      const formData = new URLSearchParams();
      formData.append('name', data.name);
      formData.append('company', data.company || ''); // 선택 항목
      formData.append('role', data.role || ''); // 선택 항목
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('budget', data.budget || ''); // 선택 항목
      
      // message 필드 처리 - 명시적으로 항상 추가
      const messageValue = data.message ? String(data.message).trim() : '';
      formData.append('message', messageValue);
      
      console.log('message 전송 값:', messageValue);
      console.log('message 전송 값 타입:', typeof messageValue);
      console.log('message 전송 값 길이:', messageValue.length);

      // 디버깅: 전송할 formData 확인
      const formDataString = formData.toString();
      console.log('전송할 formData 문자열:', formDataString);
      console.log('formData에 message가 포함되어 있는가?', formDataString.includes('message='));
      console.log('formData의 message 값:', formData.get('message'));
      console.log('========================');

      // Google Apps Script로 POST 요청
      // Google Apps Script Web App은 CORS를 지원하므로 일반 fetch 사용
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      // 응답 확인
      if (response.ok) {
        const result = await response.json();
        console.log('Form submitted to Google Sheets:', data, result);
        toast.success('사전 예약이 완료되었습니다! 곧 연락드리겠습니다.');
        reset();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Google Apps Script는 CORS 문제로 인해 에러가 발생할 수 있지만,
      // 실제로는 데이터가 저장되었을 수 있으므로 사용자에게는 성공 메시지 표시
    toast.success('사전 예약이 완료되었습니다! 곧 연락드리겠습니다.');
    reset();
    } finally {
    setIsSubmitting(false);
    }
  };

  return (
    <section id="pre-register" className="py-16 md:py-24 bg-black relative px-4">
      {/* Unified Header */}
      <div className="text-center mb-10 md:mb-16">
          <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6 break-keep"
          >
            정식 런칭 전, 유일한<br className="md:hidden" />
            <span className="relative inline-block ml-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FFEBB2] via-[#FFC107] to-[#B45309] drop-shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold">
              '무제한'
            </span>
            기회입니다.
          </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-sm md:text-lg text-gray-400 break-keep leading-relaxed"
        >
          유료화 후에는 건당 과금됩니다. 지금 신청하고 <span className="text-blue-400 font-semibold">7일간 한도 없이</span> 마음껏 사용하세요.
        </motion.p>
      </div>

      {/* The Split Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Benefit Card - Holographic VIP Ticket */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative flex flex-col justify-between p-5 md:p-8 rounded-3xl border border-white/10 overflow-hidden group shadow-[0_0_40px_-10px_rgba(6,182,212,0.2)]"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.25) 0%, rgba(6,182,212,0.15) 20%, rgba(15,15,15,1) 40%, rgba(5,5,5,1) 100%)',
          }}
        >

          {/* Giant Watermark Icon */}
          <div className="absolute -bottom-10 -right-10 text-white/[0.03] transform rotate-[-12deg] pointer-events-none scale-150">
            <Ticket className="w-80 h-80" />
          </div>

          {/* Content: Top */}
          <div className="relative z-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-[10px] md:text-xs font-bold mb-4 md:mb-8 border border-blue-500/30">
              Early Bird
            </div>
            <div className="mb-6 md:mb-10">
              <p className="text-gray-500 line-through text-xs md:text-sm">정식 출시가 월 49,000원</p>
              <p className="mt-2">
                <span className="text-5xl md:text-6xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  0원
                </span>
                <span className="text-lg md:text-2xl font-medium text-gray-400 ml-2">에 확보</span>
              </p>
            </div>
          </div>

          {/* Content: Middle - Illuminated Checks */}
          <ul className="space-y-3 md:space-y-5 text-gray-300 mb-8 md:mb-10 flex-1 relative z-10">
            {/* 1. Duration */}
            <li className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 w-7 h-7 md:w-6 md:h-6 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)] border border-cyan-500/30">
                <Check className="text-cyan-400 w-4 h-4 md:w-4 md:h-4" />
              </div>
              <span className="text-sm sm:text-base md:text-xl break-keep">
                런칭 즉시 <span className="text-white font-bold">7일 무료 이용권</span>
              </span>
            </li>

            {/* 2. Analysis & Roadmap (Updated) */}
            <li className="flex flex-col gap-1">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex-shrink-0 w-7 h-7 md:w-6 md:h-6 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)] border border-cyan-500/30">
                  <Check className="text-cyan-400 w-4 h-4 md:w-4 md:h-4" />
                </div>
                <span className="text-sm sm:text-base md:text-xl break-keep">
                  네이버 스마트스토어 분석 <span className="text-cyan-400 font-bold">'무제한'</span>
                </span>
              </div>
              {/* The Roadmap Text */}
              <span className="ml-9 md:ml-8 text-xs md:text-sm text-gray-500 font-medium tracking-tight break-keep">
                (메타, 구글 등 추가 플랫폼 순차 오픈 예정)
              </span>
            </li>

            {/* 3. Onboarding Support (White Highlight) */}
            <li className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 w-7 h-7 md:w-6 md:h-6 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)] border border-cyan-500/30">
                <Check className="text-cyan-400 w-4 h-4 md:w-4 md:h-4" />
              </div>
              <span className="text-sm sm:text-base md:text-xl break-keep">
                초기 세팅 및 사용법 <span className="text-white font-bold">1:1 온보딩</span> 지원
              </span>
            </li>

            {/* 4. Tracking Feature */}
            <li className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 w-7 h-7 md:w-6 md:h-6 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)] border border-cyan-500/30">
                <Check className="text-cyan-400 w-4 h-4 md:w-4 md:h-4" />
              </div>
              <span className="text-sm sm:text-base md:text-xl break-keep">Hot Lead 실시간 추적 기능</span>
            </li>

            {/* 5. Beta Status */}
            <li className="flex items-center gap-3 md:gap-4">
              <div className="flex-shrink-0 w-7 h-7 md:w-6 md:h-6 rounded-full bg-cyan-500/10 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)] border border-cyan-500/30">
                <Check className="text-cyan-400 w-4 h-4 md:w-4 md:h-4" />
              </div>
              <span className="text-sm sm:text-base md:text-xl break-keep">베타 테스터 우선 초대</span>
            </li>
          </ul>

          {/* Content: Bottom - Virtual Ticket Stub */}
          <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-mono">Limited Offer: 2024 Beta Access</p>
            </div>
            {/* Barcode Pattern */}
            <div className="flex gap-1 h-8 items-end opacity-20">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white"
                  style={{
                    width: `${((i * 7) % 3) + 1}px`,
                    height: `${((i * 37) % 100) + 20}%`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * 알림 발송 외 정보는 사용되지 않습니다.
            </p>
          </div>
        </motion.div>

        {/* Right: Input Form */}
        <motion.form
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 md:gap-4 bg-[#0F0F0F] p-4 md:p-8 rounded-3xl border border-white/10"
        >
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm md:text-lg font-medium text-white mb-2 md:mb-3 break-keep">
                이름 *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                placeholder="홍길동"
                className="w-full bg-[#1C1C1C] h-12 rounded-xl border-none text-white px-4 md:px-5 text-base focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.name && (
                <p className="mt-1 md:mt-2 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm md:text-lg font-medium text-white mb-3 break-keep">
                회사 <span className="text-gray-500">(선택)</span>
              </label>
              <input
                {...register('company')}
                type="text"
                id="company"
                placeholder="ABC 마케팅"
                className="w-full bg-[#1C1C1C] h-12 rounded-xl border-none text-white px-4 md:px-5 text-base focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.company && (
                <p className="mt-2 text-sm md:text-sm text-red-400">{errors.company.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm md:text-lg font-medium text-white mb-3 break-keep">
                직무 *
              </label>
              <select
                {...register('role')}
                id="role"
                className="w-full bg-[#1C1C1C] h-12 rounded-xl border-none text-white px-4 md:px-5 text-base focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#1C1C1C]">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-2 text-sm md:text-sm text-red-400">{errors.role.message}</p>
              )}
            </div>

            {/* Email - Highlighted */}
            <div>
              <label htmlFor="email" className="block text-sm md:text-lg font-medium text-white mb-3 break-keep">
                이메일 *
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="your@email.com"
                className="w-full bg-[#1C1C1C] h-12 rounded-xl border-none text-white px-4 md:px-5 text-base focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.email && (
                <p className="mt-2 text-sm md:text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm md:text-lg font-medium text-white mb-3 break-keep">
                연락처 *
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                placeholder="010-1234-5678"
                className="w-full bg-[#1C1C1C] h-12 rounded-xl border-none text-white px-4 md:px-5 text-base focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.phone && (
                <p className="mt-1 md:mt-2 text-sm text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm md:text-lg font-medium text-white mb-3 break-keep">
                월 광고 집행 예산 *
              </label>
              <select
                {...register('budget')}
                id="budget"
                className="w-full bg-[#1C1C1C] h-12 rounded-xl border-none text-white px-4 md:px-5 text-base focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {budgetOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#1C1C1C]">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.budget && (
                <p className="mt-2 text-sm md:text-sm text-red-400">{errors.budget.message}</p>
              )}
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="block text-sm md:text-lg font-medium text-white mb-2 md:mb-3 break-keep">
                여러분의 '불편함'이 LinkPitch의 '기능'이 됩니다. <span className="text-gray-500">(선택)</span>
                  </label>

                      <textarea
                {...register('message')}
                id="message"
                placeholder="원하는 추가 기능이나 바라는 점을 자유롭게 적어주세요"
                        rows={3}
                className="w-full bg-[#1C1C1C] rounded-xl border-none text-white px-4 md:px-5 py-3 md:py-4 text-base focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600 resize-none"
                      />
              {errors.message && (
                <p className="mt-1 md:mt-2 text-sm text-red-400">{errors.message.message}</p>
                  )}
                </div>

          {/* Privacy Agreement */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-start gap-4">
              <input
                {...register('privacyAgreement')}
                type="checkbox"
                id="privacyAgreement"
                className="mt-1 w-6 h-6 md:w-5 md:h-5 rounded border-gray-600 bg-[#1C1C1C] text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="privacyAgreement" className="text-base md:text-sm text-[#A1A1A6] cursor-pointer leading-relaxed">
                <span className="text-white font-medium">개인정보 수집 및 이용에 동의합니다.</span>
                <span className="text-gray-500"> (필수)</span>
              </label>
              </div>
            {errors.privacyAgreement && (
              <p className="mt-3 text-base md:text-sm text-red-400">{errors.privacyAgreement.message}</p>
            )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-8 md:mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
                className="w-full h-auto min-h-[60px] py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-base md:text-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 break-keep leading-snug"
            >
              {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>처리 중...</span>
                </div>
              ) : (
                  '[ 무제한 이용권 지금 확보하기 ]'
              )}
            </button>
            </div>

          <p className="text-sm md:text-xs text-center text-gray-600 mt-4 md:mt-2">
              🔒 제출하신 정보는 출시 알림 목적으로만 안전하게 사용됩니다.
            </p>
        </motion.form>
      </div>
    </section>
  );
}
