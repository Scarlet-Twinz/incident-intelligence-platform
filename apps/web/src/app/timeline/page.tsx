import AppShell from "@/components/AppShell";

export default function TimelinePage() {
  return (
    <AppShell>
      <div className="page-header">
        <span className="section-kicker">SYSTEM HISTORY</span>
        <h1>Timeline</h1>
        <p>Trace incidents, anomalies, deployments, and recoveries over time.</p>
      </div>
      <section className="panel">
        <div className="timeline-row"><time>13:02:41</time><div className="timeline-dot" /><div><strong>Incident correlation created</strong><p>Authentication failures correlated across multiple services.</p></div></div>
        <div className="timeline-row"><time>12:58:16</time><div className="timeline-dot" /><div><strong>Anomaly detected</strong><p>Payment API latency exceeded historical baseline.</p></div></div>
        <div className="timeline-row"><time>12:51:03</time><div className="timeline-dot" /><div><strong>Service recovered</strong><p>notification-worker returned to normal.</p></div></div>
      </section>
    </AppShell>
  );
}
