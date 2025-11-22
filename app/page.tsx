/**
 * @file app/page.tsx
 * @description Linkpitch 랜딩 페이지
 *
 * Hero 섹션, 3단계 섹션, CTA 버튼을 포함하는 랜딩 페이지
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)]">
      {/* Hero 섹션 */}
      <section className="flex items-center justify-center px-8 py-16 lg:py-24">
        <div className="w-full max-w-7xl mx-auto text-center space-y-8">
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
            콜드메일 작성 시간을<br />
            <span className="text-primary">6시간 → 10분</span>으로
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
            퍼포먼스 마케터를 위한 AI 수주 비서 Linkpitch
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-in">
              <Button size="lg" className="text-lg px-8">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3단계 섹션 */}
      <section className="px-8 py-16 lg:py-24 bg-muted/50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            어떻게 동작하나요?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-primary">1</div>
              <h3 className="text-xl font-semibold">입력</h3>
              <p className="text-muted-foreground">
                Prospect 정보와 Step 타입을 입력하세요
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-primary">2</div>
              <h3 className="text-xl font-semibold">생성</h3>
              <p className="text-muted-foreground">
                AI가 인사이트와 콜드메일 초안을 생성합니다
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-primary">3</div>
              <h3 className="text-xl font-semibold">관리</h3>
              <p className="text-muted-foreground">
                발송 이력과 관여도를 한눈에 확인하세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="px-8 py-16 lg:py-24">
        <div className="w-full max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-muted-foreground">
            Linkpitch로 콜드메일 작성 시간을 단축하세요
          </p>
          <Link href="/sign-in">
            <Button size="lg" className="text-lg px-8">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
