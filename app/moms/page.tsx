import MomsPageClient from "@/components/moms/MomsPageClient";

export default function MomsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Minutes of Meeting</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">MOM</h2>
        <p className="mt-2 text-sm text-text-muted">
          Capture meeting notes, attendees, and follow-ups in one place.
        </p>
      </div>
      <MomsPageClient />
    </div>
  );
}
