"use client";

import { useParams } from "next/navigation";
import AgentProfileClient from "@/components/team/AgentProfileClient";

export default function AgentProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return <AgentProfileClient teamMemberId={id} />;
}
