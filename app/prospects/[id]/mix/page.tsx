import InsightMixerClient from './insight-mixer-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InsightMixerPage({ params }: PageProps) {
  const { id } = await params;
  
  return <InsightMixerClient prospectId={id} />;
}
