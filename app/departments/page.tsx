import DepartmentsPageClient from "@/components/departments/DepartmentsPageClient";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">People</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Departments</h2>
        <p className="mt-2 text-sm text-text-muted">
          Review team distribution and task load by department.
        </p>
      </div>

      <DepartmentsPageClient />
    </div>
  );
}
