'use client';

import { AppleNavbar } from '@/components/landing/apple-navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { ProblemSection } from '@/components/landing/problem-section';
import { DataStreamGap } from '@/components/landing/data-stream-gap';
import { SolutionBento } from '@/components/landing/solution-bento';
import { SocialProofPricing } from '@/components/landing/social-proof-pricing';
import { PreRegisterForm } from '@/components/landing/pre-register-form';
import { AppleFooter } from '@/components/landing/apple-footer';

export default function LandingPage() {
  return (
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

      {/* Social Proof & Pricing */}
      <SocialProofPricing />

      {/* Pre-registration Form */}
      <PreRegisterForm />

      {/* Footer */}
      <AppleFooter />
    </div>
  );
}
