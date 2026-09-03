import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="page-header">
        <span className="section-kicker">CONFIGURATION</span>
        <h1>Settings</h1>
        <p>Manage your Incident Intelligence workspace.</p>
      </div>
      <section className="panel settings-panel">
        <div><strong>Workspace</strong><span>Production</span></div>
        <div><strong>Environment</strong><span>Production monitoring</span></div>
        <div><strong>Detection engine</strong><span>Enabled</span></div>
        <div><strong>Realtime stream</strong><span>Connected</span></div>
      </section>
    </AppShell>
  );
}
