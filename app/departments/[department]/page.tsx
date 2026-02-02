"use client";

import { useParams } from "next/navigation";
import DepartmentProfileClient from "@/components/departments/DepartmentProfileClient";

export default function DepartmentDetailPage() {
  const params = useParams<{ department: string }>();
  const department = params?.department ? decodeURIComponent(params.department) : undefined;

  return <DepartmentProfileClient department={department} />;
}
