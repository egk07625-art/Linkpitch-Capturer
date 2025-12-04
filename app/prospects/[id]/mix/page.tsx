import React from 'react';
import { notFound } from 'next/navigation';
import WorkspaceClient from '@/components/mixer/WorkspaceClient';
import { getWorkspaceData } from '@/actions/workspace';

export default async function InsightMixerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: prospectId } = await params;

  // 서버에서 데이터 로드
  const { data, error } = await getWorkspaceData(prospectId);

  if (error || !data?.prospect) {
    notFound();
  }

  return (
    <WorkspaceClient
      prospectId={prospectId}
      prospect={data.prospect}
      visionData={data.visionData}
      initialUserAssets={data.userAssets}
      initialGeneratedEmails={data.generatedEmails}
    />
  );
}
