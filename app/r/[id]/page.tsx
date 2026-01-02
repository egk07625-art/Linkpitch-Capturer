import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { preprocessMarkdown } from "@/lib/markdown-preprocess";
import { ArrowRight, Download, Share2, MessageSquare } from "lucide-react";

// Types
interface ReportPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface GeneratedEmail {
  id: string;
  report_title: string;
  store_name: string;
  category: string;
  report_markdown: string;
  consultation_url: string | null;
  created_at: string;
  prospect_id: string;
}

// Supabase Utilities specifically for this public page
// We don't use the standard Auth client because this is a public link accessible without login
const getPublicClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export default async function ReportViewerPage({ params }: ReportPageProps) {
  const { id: prospectId } = await params;
  const supabase = getPublicClient();

  // 1. Fetch Latest Report
  const { data: emailData, error } = await supabase
    .from("generated_emails")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !emailData) {
    console.error("Report Fetch Error:", error);
    
    // Custom Error / Empty State
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">리포트를 찾을 수 없습니다</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            요청하신 리포트가 존재하지 않거나 만료되었습니다.<br />
            유효한 링크인지 다시 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  const report = emailData as GeneratedEmail;

  // 2. Track Visit (Server-side)
  // Non-blocking fire-and-forget style
  const sessionId = crypto.randomUUID();
  await supabase.from("report_tracking_logs").insert({
    prospect_id: prospectId,
    session_id: sessionId,
    created_at: new Date().toISOString(),
    user_agent: "server-side-visit", // In real world we'd parse headers()
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans antialiased text-slate-800">
      
      {/* 1. Global Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-sm">
              {report.store_name}
            </span>
            <span className="w-px h-3 bg-slate-300 mx-1" />
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
              LinkPitch AI 분석 결과
            </span>
          </div>
          {/* Optional Header Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-xs text-slate-400">
              Generated {new Date(report.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-[800px] mx-auto px-4 py-8 md:py-12 pb-32">
        
        {/* Report Card */}
        <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          {/* Cover / Header Section */}
          <div className="px-8 md:px-12 py-10 border-b border-slate-50 bg-gradient-to-br from-white to-slate-50/50">
            <div className="mb-4 text-slate-500 text-xs font-bold tracking-widest uppercase">
              Strategic Insight Report
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A2B3C] leading-tight mb-6">
              {report.report_title || `${report.store_name} 성장 전략 리포트`}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-md">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-slate-700">{report.category}</span>
              </div>
            </div>
          </div>

          {/* Markdown Body */}
          <div className="px-8 md:px-12 py-10">
            <div className="prose prose-slate max-w-none 
              prose-headings:font-bold prose-headings:text-[#1A2B3C] prose-headings:tracking-tight
              prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-l-4 prose-h2:border-[#1A2B3C] prose-h2:pl-3
              prose-h3:text-lg prose-h3:text-slate-700
              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-4
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-ul:my-4 prose-li:my-1 prose-li:text-slate-600
              prose-blockquote:border-l-4 prose-blockquote:border-[#1A2B3C] prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:rounded-r-lg
              prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-sm
              prose-thead:bg-slate-50 prose-thead:border-b-2 prose-thead:border-slate-100
              prose-th:p-3 prose-th:text-left prose-th:font-bold prose-th:text-slate-700
              prose-td:p-3 prose-td:border-b prose-td:border-slate-50 prose-td:text-slate-600
              prose-hr:border-slate-100 prose-hr:my-8
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {preprocessMarkdown(report.report_markdown)}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="px-8 md:px-12 py-8 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
              본 리포트는 LinkPitch AI와 퍼포먼스 마케터의 협업으로 작성되었습니다.<br />
              제공된 데이터는 외부 공개된 정보를 기반으로 분석되었으며, 실제 내부 현황과 다를 수 있습니다.
            </p>
          </div>
        </article>

      </main>

      {/* 3. Sticky CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
        <a 
          href={report.consultation_url || "#"} 
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between w-full p-1 pl-5 pr-1.5 bg-[#1A2B3C] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#152332] transition-all duration-300 overflow-hidden"
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider mb-0.5">LinkPitch Insight</span>
            <span className="text-sm font-bold">전문가에게 상세 상담 받기</span>
          </div>
          <span className="w-10 h-10 bg-white text-[#1A2B3C] rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
            <ArrowRight className="w-5 h-5" />
          </span>
        </a>
      </div>

    </div>
  );
}
