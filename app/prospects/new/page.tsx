/**
 * @file app/prospects/new/page.tsx
 * @description 고객사 등록 페이지
 *
 * 새로운 고객사를 등록하는 폼 페이지
 */

import { ProspectForm } from "@/components/prospects/prospect-form";

export default function NewProspectPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-50">고객사 등록</h1>
        <p className="mt-2 text-sm text-zinc-400">
          새로운 고객사 정보를 입력해주세요.
        </p>
      </header>

      <ProspectForm />
    </div>
  );
}
















