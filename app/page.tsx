'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { AppleNavbar } from '@/components/landing/apple-navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { ProblemSection } from '@/components/landing/problem-section';
import { DataStreamGap } from '@/components/landing/data-stream-gap';
import { SolutionBento } from '@/components/landing/solution-bento';
import { SocialProofPricing } from '@/components/landing/social-proof-pricing';
import { PreRegisterForm } from '@/components/landing/pre-register-form';
import { AppleFooter } from '@/components/landing/apple-footer';

export default function LandingPage() {
  // UTM 파라미터 추적 (window.location.search 직접 사용하여 SSR 문제 회피)
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    // GA4가 로드될 때까지 대기
    const checkGtag = () => {
      const gtag = (window as any).gtag;
      if (!gtag) {
        // GA4가 아직 로드되지 않았으면 재시도
        setTimeout(checkGtag, 100);
        return;
      }

      // URL 파라미터에서 UTM 추출
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');
      const utmTerm = urlParams.get('utm_term');
      const utmContent = urlParams.get('utm_content');

      // UTM 파라미터가 있으면 GA4 이벤트로 전송
      if (utmSource || utmMedium || utmCampaign) {
        const utmParams: Record<string, string> = {};
        
        if (utmSource) utmParams.utm_source = utmSource;
        if (utmMedium) utmParams.utm_medium = utmMedium;
        if (utmCampaign) utmParams.utm_campaign = utmCampaign;
        if (utmTerm) utmParams.utm_term = utmTerm;
        if (utmContent) utmParams.utm_content = utmContent;

        // 페이지뷰 이벤트에 UTM 파라미터 포함
        gtag('event', 'page_view', {
          page_path: window.location.pathname + window.location.search,
          page_title: document.title,
          ...utmParams,
        });

        // 추가로 커스텀 이벤트로도 전송 (확실한 추적을 위해)
        gtag('event', 'utm_tracking', {
          event_category: 'marketing',
          ...utmParams,
        });
      }
    };

    // 초기 체크
    checkGtag();
  }, []);
  return (
    <>
      {/* GA4 설치 코드 - 랜딩 페이지에만 적용 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-E6572JB840"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          // URL에서 UTM 파라미터 추출
          const urlParams = new URLSearchParams(window.location.search);
          const utmParams = {};
          if (urlParams.get('utm_source')) utmParams.utm_source = urlParams.get('utm_source');
          if (urlParams.get('utm_medium')) utmParams.utm_medium = urlParams.get('utm_medium');
          if (urlParams.get('utm_campaign')) utmParams.utm_campaign = urlParams.get('utm_campaign');
          if (urlParams.get('utm_term')) utmParams.utm_term = urlParams.get('utm_term');
          if (urlParams.get('utm_content')) utmParams.utm_content = urlParams.get('utm_content');

          gtag('config', 'G-E6572JB840', {
            send_page_view: true,
            ...utmParams
          });
        `}
      </Script>

      <div className="min-h-screen bg-[#050505] text-white font-sans antialiased overflow-x-hidden">
        {/* Navigation */}
        <AppleNavbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Visual Gap (Data Stream Animation) */}
      <DataStreamGap />

      {/* Problem Section */}
      <ProblemSection />

      {/* Visual Gap (Data Stream Animation) */}
      <DataStreamGap />

      {/* Solution Section - Bento Grid */}
      <SolutionBento />

      {/* Visual Gap (Data Stream Animation) */}
      <DataStreamGap />

      {/* Social Proof & Pricing */}
      <SocialProofPricing />

      {/* Visual Gap (Data Stream Animation) */}
      <DataStreamGap />

      {/* Pre-registration Form */}
      <PreRegisterForm />

        {/* Footer */}
        <AppleFooter />
      </div>
    </>
  );
}
