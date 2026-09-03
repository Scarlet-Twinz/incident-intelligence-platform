import AppShell from "@/components/AppShell";

export default function EventsPage() {
  return (
    <AppShell>
      <div className="page-header">
        <span className="section-kicker">EVENT STREAM</span>
        <h1>Events</h1>
        <p>Monitor incoming system events and signals in real time.</p>
      </div>
      <section className="panel">
        <div className="event-console">
          <div><span>13:02:41</span> auth-service <strong>authentication.failed</strong></div>
          <div><span>13:02:37</span> payments-api <strong>latency.threshold_exceeded</strong></div>
          <div><span>13:02:29</span> gateway <strong>request.error</strong></div>
          <div><span>13:02:18</span> notification-worker <strong>service.recovered</strong></div>
          <div><span>13:02:03</span> postgres-primary <strong>query.latency</strong></div>
        </div>
      </section>
    </AppShell>
  );
}
