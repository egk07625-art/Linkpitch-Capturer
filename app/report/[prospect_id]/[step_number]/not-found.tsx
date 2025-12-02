/**
 * @file app/report/[prospect_id]/[step_number]/not-found.tsx
 * @description 리포트 뷰어 404 페이지
 */

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-semibold text-zinc-50 mb-4">
          리포트를 찾을 수 없습니다
        </h1>
        <p className="text-zinc-400 mb-6">
          요청하신 리포트가 존재하지 않거나 아직 생성되지 않았습니다.
        </p>
        <div className="text-sm text-zinc-500">
          <p>가능한 원인:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>리포트 링크가 잘못되었습니다</li>
            <li>리포트가 아직 생성 중입니다</li>
            <li>리포트가 삭제되었습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

