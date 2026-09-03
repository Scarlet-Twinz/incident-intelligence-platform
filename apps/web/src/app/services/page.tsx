import AppShell from "@/components/AppShell";

export default function ServicesPage() {
  return (
    <AppShell>
      <div className="page-header">
        <span className="section-kicker">INFRASTRUCTURE</span>
        <h1>Services</h1>
        <p>Understand the health and operational state of your services.</p>
      </div>
      <section className="panel">
        <div className="data-row"><div><strong>payments-api</strong><span>Production API</span></div><small className="healthy">Healthy</small></div>
        <div className="data-row"><div><strong>auth-service</strong><span>Authentication</span></div><small className="warning">Degraded</small></div>
        <div className="data-row"><div><strong>postgres-primary</strong><span>Primary database</span></div><small className="warning">Degraded</small></div>
        <div className="data-row"><div><strong>notification-worker</strong><span>Background processing</span></div><small className="healthy">Healthy</small></div>
      </section>
    </AppShell>
  );
}
