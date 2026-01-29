import MomDetailClient from "@/components/moms/MomDetailClient";

interface MomDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MomDetailPage({ params }: MomDetailPageProps) {
  const { id } = await params;
  return <MomDetailClient momId={id} />;
}
