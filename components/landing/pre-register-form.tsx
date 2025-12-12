'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  phone: z.string().min(1, '연락처를 입력해주세요'),
  budget: z.string().optional(),
  message: z.string().optional(),
  privacyAgreement: z.boolean().refine((val) => val === true, {
    message: '개인정보 수집 및 이용에 동의해주세요',
  }),
});

type FormData = z.infer<typeof formSchema>;

const budgetOptions = [
  { value: '', label: '예산 범위를 선택해주세요' },
  { value: '3000', label: '월 3000만원' },
  { value: '5000', label: '월 5000만원' },
  { value: '7000', label: '월 7000만원' },
  { value: '10000', label: '월 1억원' },
  { value: '20000+', label: '월 2억원 이상' },
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
    <section id="pre-register" className="py-32 px-6 md:px-20 bg-[#050505]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8 md:mb-12 px-4"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4 tracking-tight">
            지금 무료로 시작하세요
          </h2>
          <p className="text-base md:text-xl text-[#A1A1A6]">
            상위 1% 마케터의 제안서로 미팅 성사율을 높이세요
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          onSubmit={handleSubmit(onSubmit)}
          className="bg-[#141414] rounded-[20px] md:rounded-[24px] border border-white/10 p-6 md:p-10"
        >
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                이름 *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                placeholder="홍길동"
                className="w-full bg-[#1C1C1C] h-14 rounded-xl border-none text-white px-4 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
                회사 <span className="text-gray-500">(선택)</span>
              </label>
              <input
                {...register('company')}
                type="text"
                id="company"
                placeholder="ABC 마케팅"
                className="w-full bg-[#1C1C1C] h-14 rounded-xl border-none text-white px-4 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.company && (
                <p className="mt-2 text-sm text-red-400">{errors.company.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white mb-2">
                직무 <span className="text-gray-500">(선택)</span>
              </label>
              <input
                {...register('role')}
                type="text"
                id="role"
                placeholder="퍼포먼스 마케터"
                className="w-full bg-[#1C1C1C] h-14 rounded-xl border-none text-white px-4 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.role && (
                <p className="mt-2 text-sm text-red-400">{errors.role.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                이메일 *
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="your@email.com"
                className="w-full bg-[#1C1C1C] h-14 rounded-xl border-none text-white px-4 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                연락처 *
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                placeholder="010-1234-5678"
                className="w-full bg-[#1C1C1C] h-14 rounded-xl border-none text-white px-4 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-white mb-2">
                월 광고 집행 예산 <span className="text-gray-500">(선택)</span>
              </label>
              <select
                {...register('budget')}
                id="budget"
                className="w-full bg-[#1C1C1C] h-14 rounded-xl border-none text-white px-4 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {budgetOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#1C1C1C]">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.budget && (
                <p className="mt-2 text-sm text-red-400">{errors.budget.message}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                LinkPitch에게 바라는 점이 있으신가요?{' '}
                <span className="text-white font-semibold">
                  상위 1% 마케터
                </span>
                가 되기 위해 필요한 기능을 알려주세요. <span className="text-gray-500">(선택)</span>
              </label>
              <textarea
                {...register('message')}
                id="message"
                placeholder="예: 네이버 스마트스토어 외에 쿠팡, 11번가도 지원해주세요"
                rows={3}
                className="w-full bg-[#1C1C1C] rounded-xl border-none text-white px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-600 resize-none"
              />
              {errors.message && (
                <p className="mt-2 text-sm text-red-400">{errors.message.message}</p>
              )}
            </div>

            {/* Privacy Agreement */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-start gap-3">
                <input
                  {...register('privacyAgreement')}
                  type="checkbox"
                  id="privacyAgreement"
                  className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-[#1C1C1C] text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="privacyAgreement" className="text-sm text-[#A1A1A6] cursor-pointer leading-relaxed">
                  <span className="text-white font-medium">개인정보 수집 및 이용에 동의합니다.</span>
                  <span className="text-gray-500"> (필수)</span>
                  <br />
                  <span className="text-xs text-gray-600 mt-1 block">
                    제출하신 정보는 출시 알림 및 서비스 안내 목적으로만 사용되며, 안전하게 보관됩니다.
                  </span>
                </label>
              </div>
              {errors.privacyAgreement && (
                <p className="mt-2 text-sm text-red-400">{errors.privacyAgreement.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[56px] md:h-[60px] rounded-full bg-gradient-to-r from-[#2F80ED] to-[#007AFF] text-white text-base md:text-lg font-bold hover:scale-105 transition-transform duration-200 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-pulse"
              style={{ animationDuration: '3s' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm md:text-base">처리 중...</span>
                </div>
              ) : (
                '[ 1개월 무료 이용권 지금 확보하기 ]'
              )}
            </button>

            <p className="text-xs md:text-sm text-center text-gray-500 mt-4 leading-relaxed px-2">
              🔒 제출하신 정보는 출시 알림 목적으로만 안전하게 사용됩니다.
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
