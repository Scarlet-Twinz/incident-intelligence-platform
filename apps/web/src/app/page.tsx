"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Analytics = {
  totalIncidents: number;
  openIncidents: number;
  priority: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  severity: Array<{
    severity: string;
    count: number;
  }>;
  categories: Array<{
    category: string;
    count: number;
  }>;
  services: Array<{
    service: string;
    count: number;
  }>;
  assignment: {
    assigned: number;
    unassigned: number;
  };
  aiProcessing: {
    processed: number;
    pending: number;
  };
};

type Incident = {
  id: string;
  title: string;
  description: string;
  service: string;
  severity: string;
  status: string;
  category: string;
  priority: string;
  assignee: string | null;
  ai_summary: string | null;
  created_at: string;
};

export default function OverviewPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  async function loadDashboard() {
    try {
      const [analyticsResponse, incidentsResponse] = await Promise.all([
        fetch(`${API_URL}/analytics`),
        fetch(`${API_URL}/incidents`),
      ]);

      if (!analyticsResponse.ok) {
        throw new Error("Failed to load analytics");
      }

      if (!incidentsResponse.ok) {
        throw new Error("Failed to load incidents");
      }

      const analyticsData = await analyticsResponse.json();
      const incidentsData = await incidentsResponse.json();

      setAnalytics(analyticsData.analytics);
      setIncidents(incidentsData.incidents ?? []);
    } catch (error) {
      console.error("Dashboard loading failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const eventSource = new EventSource(`${API_URL}/realtime`);

    eventSource.addEventListener("connected", () => {
      console.log("VANTA realtime connected");
      setRealtimeConnected(true);
    });

    eventSource.addEventListener("incident.created", () => {
      console.log("Realtime incident.created received");
      loadDashboard();
    });

    eventSource.addEventListener("incident.assigned", () => {
      console.log("Realtime incident.assigned received");
      loadDashboard();
    });

    eventSource.onerror = () => {
      console.warn("VANTA realtime connection lost");
      setRealtimeConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const activeIncidents = analytics?.openIncidents ?? 0;
  const totalIncidents = analytics?.totalIncidents ?? 0;
  const criticalIncidents = analytics?.priority.CRITICAL ?? 0;
  const servicesMonitored = analytics?.services.length ?? 0;

  return (
    <AppShell>
      <section className="hero">
        <div>
          <span className="section-kicker">INCIDENT INTELLIGENCE</span>

          <h1>Understand what is happening.</h1>

          <p>
            Correlate events, detect anomalies, and understand incidents
            before they become outages.
          </p>
        </div>

        <span className="live-badge">
          {realtimeConnected ? "● LIVE" : "○ CONNECTING"}
        </span>
      </section>

      <section className="metrics-grid">
        <Metric
          label="Active incidents"
          value={loading ? "—" : String(activeIncidents).padStart(2, "0")}
          detail={`${totalIncidents} total incidents`}
        />

        <Metric
          label="Critical priority"
          value={loading ? "—" : String(criticalIncidents).padStart(2, "0")}
          detail="Requires immediate attention"
        />

        <Metric
          label="AI processed"
          value={
            loading
              ? "—"
              : String(analytics?.aiProcessing.processed ?? 0)
          }
          detail={
            loading
              ? "Loading intelligence"
              : `${analytics?.aiProcessing.pending ?? 0} pending`
          }
        />

        <Metric
          label="Services monitored"
          value={loading ? "—" : String(servicesMonitored).padStart(2, "0")}
          detail={
            realtimeConnected
              ? "Realtime connected"
              : "Realtime reconnecting"
          }
        />
      </section>

      <section className="content-grid">
        <div className="panel incidents-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">ACTIVE RESPONSE</span>
              <h2>Current incidents</h2>
            </div>

            <a href="/incidents">View all →</a>
          </div>

          {incidents.filter((incident) => incident.status === "OPEN")
            .length === 0 ? (
            <div className="empty-state">
              <strong>No active incidents</strong>
              <span>VANTA has no open incidents right now.</span>
            </div>
          ) : (
            incidents
              .filter((incident) => incident.status === "OPEN")
              .slice(0, 5)
              .map((incident) => (
                <Incident
                  key={incident.id}
                  title={incident.title}
                  service={incident.service}
                  time={formatRelativeTime(incident.created_at)}
                  priority={incident.priority}
                />
              ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">PRIORITY ANALYTICS</span>
              <h2>Operational priority</h2>
            </div>

            <span className="streaming">
              {realtimeConnected ? "● LIVE" : "○ OFFLINE"}
            </span>
          </div>

          <div className="priority-list">
            <PriorityRow
              label="Critical"
              value={analytics?.priority.CRITICAL ?? 0}
            />

            <PriorityRow
              label="High"
              value={analytics?.priority.HIGH ?? 0}
            />

            <PriorityRow
              label="Medium"
              value={analytics?.priority.MEDIUM ?? 0}
            />

            <PriorityRow
              label="Low"
              value={analytics?.priority.LOW ?? 0}
            />
          </div>

          <div className="analytics-summary">
            <div>
              <span>Total</span>
              <strong>{loading ? "—" : totalIncidents}</strong>
            </div>

            <div>
              <span>Assigned</span>
              <strong>
                {loading ? "—" : analytics?.assignment.assigned ?? 0}
              </strong>
            </div>

            <div>
              <span>Unassigned</span>
              <strong>
                {loading ? "—" : analytics?.assignment.unassigned ?? 0}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">CATEGORY ANALYTICS</span>
              <h2>Incident categories</h2>
            </div>
          </div>

          {analytics?.categories.length ? (
            <div className="analytics-list">
              {analytics.categories.slice(0, 6).map((item) => (
                <AnalyticsRow
                  key={item.category}
                  label={item.category}
                  value={item.count}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No category data</strong>
              <span>Incident categories will appear here.</span>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">SERVICE ANALYTICS</span>
              <h2>Most affected services</h2>
            </div>
          </div>

          {analytics?.services.length ? (
            <div className="analytics-list">
              {analytics.services.slice(0, 6).map((item) => (
                <AnalyticsRow
                  key={item.service}
                  label={item.service}
                  value={item.count}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No service data</strong>
              <span>Services will appear as incidents are created.</span>
            </div>
          )}
        </div>
      </section>

      <section className="panel intelligence-panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">CORRELATION ENGINE</span>
            <h2>Recent intelligence</h2>
          </div>

          <span className="engine-status">
            {realtimeConnected ? "● ENGINE ONLINE" : "○ RECONNECTING"}
          </span>
        </div>

        {incidents.slice(0, 5).map((incident) => (
          <TimelineItem
            key={incident.id}
            time={formatTime(incident.created_at)}
            title={`${incident.priority} priority incident detected`}
            description={
              incident.ai_summary ||
              `${incident.category} incident detected on ${incident.service}. AI analysis is processing.`
            }
          />
        ))}

        {incidents.length === 0 && (
          <div className="empty-state">
            <strong>No intelligence events yet</strong>
            <span>
              Create an incident and VANTA will begin analyzing it.
            </span>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Incident({
  title,
  service,
  time,
  priority,
}: {
  title: string;
  service: string;
  time: string;
  priority: string;
}) {
  return (
    <a href="/incidents" className="incident-row">
      <div
        className={`incident-severity priority-${priority.toLowerCase()}`}
      />

      <div className="incident-info">
        <strong>{title}</strong>
        <span>
          {service} · {priority}
        </span>
      </div>

      <time>{time}</time>
    </a>
  );
}

function PriorityRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="priority-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="priority-bar">
        <div
          className="priority-bar-fill"
          style={{
            width: `${Math.min(value * 20, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function AnalyticsRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="analytics-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TimelineItem({
  time,
  title,
  description,
}: {
  time: string;
  title: string;
  description: string;
}) {
  return (
    <div className="timeline-row">
      <time>{time}</time>

      <div className="timeline-dot" />

      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: string) {
  const created = new Date(timestamp).getTime();
  const now = Date.now();

  const minutes = Math.max(
    0,
    Math.floor((now - created) / 60000)
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes === 1) {
    return "1 min ago";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours === 1) {
    return "1 hr ago";
  }

  if (hours < 24) {
    return `${hours} hrs ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}