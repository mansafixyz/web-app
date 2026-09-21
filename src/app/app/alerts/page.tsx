"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Alert, AlertPreference } from "@/lib/supabase/database.types";

const TYPE_CFG: Record<Alert["type"], { color: string; bg: string; label: string }> = {
  transfer: { color: "rgb(153,120,255)", bg: "rgba(153,120,255,0.1)", label: "Transfer" },
  policy: { color: "rgb(228,200,60)", bg: "rgba(228,200,60,0.1)", label: "Policy" },
  security: { color: "rgb(88,166,255)", bg: "rgba(88,166,255,0.1)", label: "Security" },
  system: { color: "rgb(105,105,105)", bg: "rgba(255,255,255,0.05)", label: "System" },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div style={{
      width: "32px", height: "18px", borderRadius: "9px",
      backgroundColor: on ? "var(--mansafi-accent)" : "rgba(255,255,255,0.1)",
      boxShadow: on ? "0 0 10px rgba(248,248,248,0.25)" : "none",
      position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s, box-shadow 0.15s",
    }}>
      <div style={{
        position: "absolute", top: "3px",
        left: on ? "16px" : "3px",
        width: "12px", height: "12px", borderRadius: "50%",
        backgroundColor: on ? "#0A0A0A" : "#fff", transition: "left 0.15s, background 0.15s",
      }} />
    </div>
  );
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setSignedIn(false);
          setLoading(false);
        }
        return;
      }

      const [{ data: alertRows }, { data: prefRows }] = await Promise.all([
        supabase
          .from("alerts")
          .select("*")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("alert_preferences")
          .select("*")
          .eq("profile_id", user.id),
      ]);

      if (cancelled) return;
      setNotifications(alertRows ?? []);
      setRules(prefRows ?? []);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const supabase = createClient();
    const { error } = await supabase.from("alerts").update({ read: true }).eq("id", id);
    if (error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const supabase = createClient();
    const { error } = await supabase.from("alerts").update({ read: true }).in("id", unreadIds);
    if (error) {
      setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: false } : n)));
    }
  }

  async function toggleRule(rule: AlertPreference) {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
    const supabase = createClient();
    const { error } = await supabase
      .from("alert_preferences")
      .update({ enabled: !rule.enabled })
      .eq("id", rule.id);
    if (error) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r)));
    }
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: "820px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
          Alerts
        </h1>
        <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
          {loading ? "Loading notifications and alert preferences." : "Notifications and alert preferences."}
        </p>
      </div>

      {/* Notifications */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", overflow: "hidden", marginBottom: "24px",
      }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["all", "unread"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize: "12px", padding: "4px 12px", borderRadius: "9999px", cursor: "pointer",
                border: filter === f ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
                backgroundColor: filter === f ? "rgba(248,248,248,0.08)" : "transparent",
                color: filter === f ? "var(--mansafi-accent)" : "rgb(105,105,105)",
                boxShadow: filter === f ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
                textTransform: "capitalize",
                transition: "background 0.1s, color 0.1s",
              }}>
                {f}{f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            ))}
          </div>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: unreadCount === 0 ? "rgb(60,65,75)" : "rgb(105,105,105)",
              backgroundColor: "transparent",
              border: "none",
              cursor: unreadCount === 0 ? "default" : "pointer",
            }}
          >
            Mark all read
          </button>
        </div>

        {loading && (
          <div style={{ padding: "48px", textAlign: "center", color: "rgb(105,105,105)", fontSize: "13px" }}>
            Loading notifications…
          </div>
        )}

        {!loading && !signedIn && (
          <div style={{ padding: "48px", textAlign: "center", color: "rgb(105,105,105)", fontSize: "13px" }}>
            Sign in to see your notifications.
          </div>
        )}

        {!loading && signedIn && visible.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "rgb(105,105,105)", fontSize: "13px" }}>
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </div>
        )}

        {!loading && signedIn && visible.map((n, i) => {
          const cfg = TYPE_CFG[n.type];
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                display: "flex", gap: "14px", padding: "14px 20px",
                borderBottom: i < visible.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                backgroundColor: !n.read ? "rgba(255,255,255,0.015)" : "transparent",
                cursor: n.read ? "default" : "pointer",
              }}
            >
              {/* Unread dot */}
              <div style={{ paddingTop: "5px", flexShrink: 0 }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  backgroundColor: !n.read ? "var(--mansafi-accent)" : "transparent",
                  boxShadow: !n.read ? "0 0 8px rgba(248,248,248,0.5)" : "none",
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "1px 7px", borderRadius: "9999px",
                    backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`,
                  }}>{cfg.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)" }}>{n.title}</span>
                </div>
                <div style={{ fontSize: "12px", color: "rgb(140,140,140)", lineHeight: "18px" }}>{n.body}</div>
                <div style={{ fontSize: "10px", color: "rgb(60,65,75)", marginTop: "4px" }}>{timeAgo(n.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert rules */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", overflow: "hidden",
      }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>
          Notification preferences
        </div>
        {loading && (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>
            Loading preferences…
          </div>
        )}
        {!loading && signedIn && rules.length === 0 && (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>
            No alert preferences configured yet.
          </div>
        )}
        {!loading && signedIn && rules.map((rule, i) => (
          <div
            key={rule.id}
            onClick={() => toggleRule(rule)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", cursor: "pointer",
              borderBottom: i < rules.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}
          >
            <span style={{ fontSize: "13px", color: "rgb(248,248,248)" }}>{rule.label}</span>
            <Toggle on={rule.enabled} />
          </div>
        ))}
      </div>
    </div>
  );
}
