"use client";

import { useParams } from "next/navigation";
import MomEditClient from "@/components/moms/MomEditClient";

export default function MomEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return <MomEditClient momId={id} />;
}
