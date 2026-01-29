import MomEditClient from "@/components/moms/MomEditClient";

interface MomEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function MomEditPage({ params }: MomEditPageProps) {
  const { id } = await params;
  return <MomEditClient momId={id} />;
}
