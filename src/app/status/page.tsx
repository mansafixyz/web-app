"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type ServiceStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

interface Service {
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  lastChecked: string;
}

interface IncidentUpdate {
  timestamp: string;
  status: string;
  message: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  affectedServices: string[];
  startTime: string;
  endTime?: string;
  duration?: string;
  updates: IncidentUpdate[];
}

interface StatusResponse {
  overall: ServiceStatus;
  uptime: number;
  uptimePeriod: string;
  avgResponseTime: number;
  avgResponseTimeLabel: string;
  services: Service[];
  incidents: { current: Incident[]; past: Incident[] };
  timestamp: string;
}

const STATUS_META: Record<ServiceStatus, { label: string; color: string }> = {
  operational: { label: "Operational", color: "rgb(64,186,128)" },
  degraded: { label: "Degraded", color: "rgb(234,179,8)" },
  partial_outage: { label: "Partial outage", color: "rgb(249,115,22)" },
  major_outage: { label: "Major outage", color: "rgb(239,68,68)" },
  maintenance: { label: "Maintenance", color: "rgb(96,165,250)" },
};

function metaFor(status: string) {
  return STATUS_META[status as ServiceStatus] ?? { label: status, color: "rgb(140,140,140)" };
}

function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: `0 0 0 3px ${color}22`,
        flexShrink: 0,
      }}
    />
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, paddingTop: "73px" }}>
        <div style={{ padding: "40px 40px 64px", maxWidth: "820px", margin: "0 auto" }}>{children}</div>
      </div>
      <Footer />
    </main>
  );
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: "#141414",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "160px",
        backgroundColor: "#141414",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://api.mansafi.xyz/v1/status", { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = (await res.json()) as StatusResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("We couldn't reach the status service. Refresh the page to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading && !data) {
    return (
      <Shell>
        <p style={{ fontSize: "13px", color: "rgb(140,140,140)" }}>Checking all systems...</p>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <p style={{ fontSize: "13px", color: "rgb(239,68,68)" }}>{error ?? "We couldn't load status data."}</p>
      </Shell>
    );
  }

  const overall = metaFor(data.overall);
  const allOperational = data.overall === "operational";

  return (
    <Shell>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
          System status
        </h1>
        <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
          Real-time health across the MansaFi platform and its services.
        </p>
      </div>

      {/* Overall banner */}
      <Section
        style={{
          border: `1px solid ${overall.color}33`,
          backgroundColor: `${overall.color}0d`,
        }}
      >
        <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Dot color={overall.color} size={11} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: 510, color: "rgb(248,248,248)" }}>
              {allOperational ? "All systems operational" : overall.label}
            </div>
            <div style={{ fontSize: "12px", color: "rgb(140,140,140)", marginTop: "2px" }}>
              Last updated {formatTime(data.timestamp)}
            </div>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <StatCard label="Uptime" value={`${data.uptime}%`} sub={data.uptimePeriod} />
        <StatCard label={data.avgResponseTimeLabel} value={`${data.avgResponseTime}ms`} sub="Average response time" />
      </div>

      {/* Services */}
      <div style={{ fontSize: "12px", fontWeight: 500, color: "rgb(248,248,248)", margin: "24px 0 12px" }}>
        Services
      </div>
      <Section>
        {data.services.map((service, i) => {
          const meta = metaFor(service.status);
          return (
            <div
              key={service.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderBottom: i < data.services.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              <Dot color={meta.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: "rgb(248,248,248)" }}>{service.name}</div>
                <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "2px" }}>
                  {service.uptime}% uptime · {service.responseTime}ms
                </div>
              </div>
              <span style={{ fontSize: "12px", color: meta.color, fontWeight: 500, whiteSpace: "nowrap" }}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </Section>

      {/* Incidents */}
      <div style={{ fontSize: "12px", fontWeight: 500, color: "rgb(248,248,248)", margin: "24px 0 12px" }}>
        Incident history
      </div>

      {data.incidents.current.length === 0 && data.incidents.past.length === 0 ? (
        <Section>
          <div style={{ padding: "20px", fontSize: "13px", color: "rgb(140,140,140)" }}>
            No incidents reported. All quiet.
          </div>
        </Section>
      ) : (
        <>
          {data.incidents.current.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} ongoing />
          ))}
          {data.incidents.past.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </>
      )}
    </Shell>
  );
}

function IncidentCard({ incident, ongoing }: { incident: Incident; ongoing?: boolean }) {
  const [open, setOpen] = useState(Boolean(ongoing));
  const sev = metaFor(ongoing ? "major_outage" : "operational");
  const sevColor = ongoing ? "rgb(239,68,68)" : "rgb(140,140,140)";

  return (
    <Section>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                color: sevColor,
                border: `1px solid ${sevColor}44`,
                borderRadius: "4px",
                padding: "1px 6px",
              }}
            >
              {ongoing ? "Ongoing" : incident.status}
            </span>
            <span style={{ fontSize: "11px", color: "rgb(105,105,105)" }}>
              {formatTime(incident.startTime)}
              {incident.duration ? ` · ${incident.duration}` : ""}
            </span>
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)" }}>{incident.title}</div>
          {incident.affectedServices.length > 0 && (
            <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "4px" }}>
              Affected: {incident.affectedServices.join(", ")}
            </div>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 10 10"
          fill="none"
          style={{ marginTop: "3px", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <path d="M2 4l3 3 3-3" stroke="rgb(140,140,140)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 20px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgb(140,140,140)", margin: "14px 0 16px" }}>
            {incident.description}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {incident.updates.map((update, i) => {
              const uMeta = metaFor(update.status);
              return (
                <div key={i} style={{ display: "flex", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "4px" }}>
                    <Dot color={uMeta.color === "rgb(140,140,140)" ? "rgb(96,165,250)" : uMeta.color} size={7} />
                    {i < incident.updates.length - 1 && (
                      <span style={{ flex: 1, width: "1px", backgroundColor: "rgba(255,255,255,0.1)", marginTop: "4px", minHeight: "16px" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "rgb(248,248,248)", textTransform: "capitalize" }}>
                        {update.status}
                      </span>
                      <span style={{ fontSize: "11px", color: "rgb(105,105,105)" }}>{formatTime(update.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgb(140,140,140)", margin: 0 }}>
                      {update.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}
