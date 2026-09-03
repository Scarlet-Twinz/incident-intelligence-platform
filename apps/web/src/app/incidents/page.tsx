"use client";

import AppShell from "@/components/AppShell";
import { FormEvent, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Incident = {
  id: string;
  title: string;
  description: string;
  service: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadIncidents() {
    try {
      setError("");

      const response = await fetch(`${API_URL}/incidents`);

      if (!response.ok) {
        throw new Error("Failed to load incidents");
      }

      const data = await response.json();

      setIncidents(data.incidents ?? []);
    } catch (err) {
      console.error(err);
      setError("Unable to load incidents from the API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  async function createIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      service: String(formData.get("service") ?? ""),
      severity: String(formData.get("severity") ?? "MEDIUM"),
    };

    setCreating(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create incident");
      }

      await response.json();

      form.reset();

      await loadIncidents();

      setShowCreate(false);
    } catch (err) {
      console.error(err);
      setError("Unable to create incident.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <div className="page-header incidents-header">
        <div>
          <span className="section-kicker">INCIDENT MANAGEMENT</span>
          <h1>Incidents</h1>
          <p>
            Investigate, correlate, and resolve operational incidents.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowCreate(true)}
        >
          + Create incident
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            border: "1px solid rgba(255, 80, 80, 0.3)",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      <section className="incident-summary">
        <div>
          <span>OPEN</span>
          <strong>
            {incidents.filter((item) => item.status === "OPEN").length}
          </strong>
        </div>

        <div>
          <span>INVESTIGATING</span>
          <strong>
            {
              incidents.filter(
                (item) => item.status === "INVESTIGATING"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>MONITORING</span>
          <strong>
            {
              incidents.filter(
                (item) => item.status === "MONITORING"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>TOTAL</span>
          <strong>{incidents.length}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-kicker">ACTIVE RESPONSE</span>
            <h2>Incident queue</h2>
          </div>

          <span className="streaming">LIVE</span>
        </div>

        <div className="incident-table">
          {loading ? (
            <div className="incident-card">
              <div className="incident-card-main">
                <p>Loading incidents...</p>
              </div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="incident-card">
              <div className="incident-card-main">
                <p>No incidents found.</p>
              </div>
            </div>
          ) : (
            incidents.map((incident) => (
              <div className="incident-card" key={incident.id}>
                <div
                  className={`severity-indicator ${incident.severity.toLowerCase()}`}
                />

                <div className="incident-card-main">
                  <div className="incident-card-title">
                    <span>{incident.id}</span>
                    <h3>{incident.title}</h3>
                  </div>

                  <p>{incident.description}</p>

                  <div className="incident-meta">
                    <span>{incident.service}</span>
                    <span>{incident.severity}</span>
                    <span>{incident.status}</span>
                    <span>
                      {new Date(incident.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button className="incident-action" type="button">
                  View
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {showCreate && (
        <div className="modal-backdrop">
          <div className="incident-modal">
            <div className="modal-header">
              <div>
                <span className="section-kicker">NEW INCIDENT</span>
                <h2>Create incident</h2>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() => setShowCreate(false)}
              >
                X
              </button>
            </div>

            <form onSubmit={createIncident} className="incident-form">
              <label>
                Incident title
                <input
                  name="title"
                  required
                  placeholder="e.g. Payment API latency"
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe what is happening..."
                />
              </label>

              <label>
                Service
                <select name="service" defaultValue="payments-api">
                  <option value="payments-api">payments-api</option>
                  <option value="auth-service">auth-service</option>
                  <option value="postgres-primary">
                    postgres-primary
                  </option>
                  <option value="gateway">gateway</option>
                  <option value="notification-worker">
                    notification-worker
                  </option>
                </select>
              </label>

              <label>
                Severity
                <select name="severity" defaultValue="MEDIUM">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}