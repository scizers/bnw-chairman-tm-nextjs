"use client";

import { useParams } from "next/navigation";
import MomDetailClient from "@/components/moms/MomDetailClient";

export default function MomDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return <MomDetailClient momId={id} />;
}
