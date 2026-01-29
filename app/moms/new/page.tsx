import MomCreateClient from "@/components/moms/MomCreateClient";

export default function MomCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">MOM</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">Create MOM</h2>
      </div>
      <MomCreateClient />
    </div>
  );
}
