export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Settings</p>
        <h2 className="mt-2 font-display text-3xl text-text-primary">System Settings</h2>
        <p className="mt-2 text-sm text-text-muted">
          Configure preferences, roles, and system-wide controls.
        </p>
      </div>

      <div className="rounded-xl bg-surface-card p-6 shadow-card">
        <p className="text-sm text-text-muted">Settings modules will appear here.</p>
      </div>
    </div>
  );
}
