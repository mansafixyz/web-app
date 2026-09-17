"use client";

import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Database as RawDatabase,
  Account,
  SpendPolicy,
  AccountStatus,
  Transaction,
} from "@/lib/supabase/database.types";
import { ListAgentDrawer, ListAgentDrawerShell } from "@/components/ListAgentDrawer";

// ---------------------------------------------------------------------------
// database.types.ts's `Relationships` arrays are empty (this project doesn't
// use the Supabase CLI to generate them), so a nested embed like
// `accounts.select("*, spend_policies(*)")` types the embedded field as a
// `SelectQueryError` even though PostgREST resolves the real foreign key at
// runtime just fine. This re-declares the one relationship this page needs,
// locally, without touching the shared types file.
// ---------------------------------------------------------------------------
type SpendPolicyRelationships = [
  {
    foreignKeyName: "spend_policies_account_id_fkey";
    columns: ["account_id"];
    isOneToOne: true;
    referencedRelation: "accounts";
    referencedColumns: ["id"];
  }
];
type TableRelOverrides = { spend_policies: SpendPolicyRelationships };
type WithRelationships<T> = {
  [K in keyof T]: Omit<T[K], "Relationships"> & {
    Relationships: K extends keyof TableRelOverrides ? TableRelOverrides[K] : [];
  };
};
type FixedDatabase = {
  public: {
    Tables: WithRelationships<RawDatabase["public"]["Tables"]>;
    Views: WithRelationships<RawDatabase["public"]["Views"]>;
    Functions: RawDatabase["public"]["Functions"];
  };
};

function db(): SupabaseClient<FixedDatabase> {
  return createClient() as unknown as SupabaseClient<FixedDatabase>;
}

type AgentAccount = Account & { spend_policies: SpendPolicy | null };

const TAB_LABELS: Record<"overview" | "agents" | "payouts", string> = {
  overview: "Overview",
  agents: "Agent accounts",
  payouts: "Settlements",
};

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "n/a";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "payouts">("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentAccount | null>(null);
  const [revokeAgent, setRevokeAgent] = useState<AgentAccount | null>(null);
  const [agents, setAgents] = useState<AgentAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const supabase = db();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAgents([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { data: agentData, error: agentError } = await supabase
      .from("accounts")
      .select("*, spend_policies(*)")
      .eq("owner_id", user.id)
      .eq("type", "agent")
      .order("created_at", { ascending: false });

    if (agentError) {
      setLoadError(agentError.message);
      setAgents([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const agentRows = agentData ?? [];
    setAgents(agentRows);

    const agentIds = agentRows.map((a) => a.id);
    if (agentIds.length > 0) {
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .in("from_account_id", agentIds)
        .order("created_at", { ascending: false });

      if (txError) {
        setLoadError(txError.message);
        setTransactions([]);
      } else {
        setTransactions(txData ?? []);
      }
    } else {
      setTransactions([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function handleStatusChange(agentId: string, newStatus: "active" | "paused") {
    setActionError(null);
    setBusyId(agentId);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("set_agent_status", { p_account_id: agentId, p_status: newStatus });
    setBusyId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    if (data) {
      setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, ...data } : a)));
    }
  }

  async function handleRevoke(agent: AgentAccount) {
    setActionError(null);
    setBusyId(agent.id);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("revoke_agent_account", { p_account_id: agent.id });
    setBusyId(null);
    setRevokeAgent(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    if (data) {
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, ...data } : a)));
    }
  }

  const totalBalance = agents.reduce((s, a) => s + a.balance, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const settledTxs = transactions.filter((t) => t.status === "settled");
  const totalSettled = settledTxs.reduce((s, t) => s + t.amount, 0);
  const totalPayments = settledTxs.length;

  function onDrawerClose(refresh?: boolean) {
    setDrawerOpen(false);
    setEditAgent(null);
    if (refresh) fetchAgents();
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
            Agent Accounts
          </h1>
          <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
            {loading ? "Loading…" : `${activeAgents} active agent account${activeAgents !== 1 ? "s" : ""} under policy`}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
            border: "none", borderRadius: "9999px", padding: "9px 18px",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 0 16px rgba(248,248,248,0.25)",
          }}
        >
          + Create agent account
        </button>
      </div>

      {loadError && (
        <div style={{
          backgroundColor: "rgba(240,80,80,0.08)", border: "1px solid rgba(240,80,80,0.2)",
          borderRadius: "8px", padding: "10px 14px", marginBottom: "20px",
          fontSize: "13px", color: "rgb(240,100,100)",
        }}>
          {loadError}
        </div>
      )}

      {actionError && (
        <div style={{
          backgroundColor: "rgba(240,80,80,0.08)", border: "1px solid rgba(240,80,80,0.2)",
          borderRadius: "8px", padding: "10px 14px", marginBottom: "20px",
          fontSize: "13px", color: "rgb(240,100,100)",
        }}>
          {actionError}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total balance", value: loading ? "…" : formatUsd(totalBalance) },
          { label: "Active agent accounts", value: loading ? "…" : String(activeAgents) },
          { label: "Settled (all-time)", value: loading ? "…" : formatUsd(totalSettled) },
          { label: "Total payments", value: loading ? "…" : totalPayments.toLocaleString() },
        ].map((kpi) => (
          <div key={kpi.label} className="fx-glass-card" style={{
            borderRadius: "12px", padding: "16px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "8px" }}>{kpi.label}</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
              <span style={{ fontSize: "22px", fontWeight: 510, color: "rgb(248,248,248)", lineHeight: 1 }}>{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
        {(["overview", "agents", "payouts"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: activeTab === tab ? "rgba(248,248,248,0.08)" : "none",
            border: activeTab === tab ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "9999px", cursor: "pointer",
            padding: "6px 14px", fontSize: "13px",
            color: activeTab === tab ? "var(--mansafi-accent)" : "rgb(105,105,105)",
            fontWeight: activeTab === tab ? 500 : 400,
            boxShadow: activeTab === tab ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
            transition: "background 0.1s, color 0.1s",
          }}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Agent summary */}
          <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: "rgb(105,105,105)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Your agent accounts</div>
            {loading ? (
              <div style={{ padding: "24px 18px", fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
            ) : agents.filter((a) => a.status === "active").length === 0 ? (
              <div style={{ padding: "24px 18px", fontSize: "13px", color: "rgb(105,105,105)" }}>No active agent accounts yet.</div>
            ) : agents.filter((a) => a.status === "active").map((agent, i, arr) => {
              const agentTxs = settledTxs.filter((t) => t.from_account_id === agent.id);
              const agentSettled = agentTxs.reduce((s, t) => s + t.amount, 0);
              return (
                <div key={agent.id} style={{ display: "grid", gridTemplateColumns: "1fr repeat(3, auto)", gap: "24px", alignItems: "center", padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)" }}>{agent.name}</div>
                    <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "2px" }}>
                      {agent.spend_policies ? `${formatUsd(agent.spend_policies.max_per_request)} max/request` : "n/a"}
                    </div>
                  </div>
                  <StatCell label="Payments" value={agentTxs.length.toLocaleString()} />
                  <StatCell label="Settled" value={formatUsd(agentSettled)} highlight />
                  <StatCell label="Balance" value={formatUsd(agent.balance)} green />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "agents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading ? (
            <div style={{ fontSize: "13px", color: "rgb(105,105,105)", padding: "8px 0" }}>Loading…</div>
          ) : agents.length === 0 ? (
            <div style={{ fontSize: "13px", color: "rgb(105,105,105)", padding: "8px 0" }}>No agent accounts yet. Click &quot;Create agent account&quot; to get started.</div>
          ) : agents.map((agent) => {
            const agentTxs = settledTxs.filter((t) => t.from_account_id === agent.id);
            const agentSettled = agentTxs.reduce((s, t) => s + t.amount, 0);
            const isBusy = busyId === agent.id;
            return (
              <div key={agent.id} className="fx-glass-card" style={{ borderRadius: "12px", padding: "18px", display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 510, color: "rgb(248,248,248)" }}>{agent.name}</span>
                    <StatusBadge status={agent.status} />
                  </div>
                  <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "3px" }}>
                    {agent.handle}.mansafi{agent.spend_policies ? ` · ${formatUsd(agent.spend_policies.max_per_request)} max per request` : ""}
                  </div>
                </div>
                {agent.status !== "revoked" && (
                  <>
                    <StatCell label="Payments" value={agentTxs.length.toLocaleString()} />
                    <StatCell label="Settled" value={formatUsd(agentSettled)} highlight />
                    <StatCell label="Balance" value={formatUsd(agent.balance)} green />
                  </>
                )}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  {agent.status !== "revoked" && (
                    <button
                      onClick={() => setEditAgent(agent)}
                      disabled={isBusy}
                      style={{ backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "6px 14px", fontSize: "12px", color: "rgb(140,140,140)", cursor: isBusy ? "not-allowed" : "pointer" }}
                    >
                      Edit
                    </button>
                  )}
                  {agent.status === "paused" && (
                    <button
                      onClick={() => handleStatusChange(agent.id, "active")}
                      disabled={isBusy}
                      style={{ backgroundColor: "transparent", border: "1px solid rgba(64,186,128,0.3)", borderRadius: "9999px", padding: "6px 14px", fontSize: "12px", color: "rgb(64,186,128)", cursor: isBusy ? "not-allowed" : "pointer" }}
                    >
                      {isBusy ? "…" : "Resume"}
                    </button>
                  )}
                  {agent.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(agent.id, "paused")}
                      disabled={isBusy}
                      style={{ backgroundColor: "transparent", border: "1px solid rgba(240,180,60,0.3)", borderRadius: "9999px", padding: "6px 14px", fontSize: "12px", color: "rgb(240,180,60)", cursor: isBusy ? "not-allowed" : "pointer" }}
                    >
                      {isBusy ? "…" : "Pause"}
                    </button>
                  )}
                  {agent.status !== "revoked" && (
                    <button
                      onClick={() => setRevokeAgent(agent)}
                      disabled={isBusy}
                      style={{ backgroundColor: "transparent", border: "1px solid rgba(240,80,80,0.2)", borderRadius: "9999px", padding: "6px 14px", fontSize: "12px", color: "rgb(240,80,80)", cursor: isBusy ? "not-allowed" : "pointer" }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "payouts" && (
        <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "24px 18px", fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: "24px 18px", fontSize: "13px", color: "rgb(105,105,105)" }}>No settlements yet. Payments made from your agent accounts will appear here.</div>
          ) : transactions.map((tx, i) => {
            const agent = agents.find((a) => a.id === tx.from_account_id);
            return (
              <div key={tx.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: i < transactions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", color: "rgb(248,248,248)" }}>
                    {agent?.name ?? tx.from_display} → {tx.to_display}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "2px" }}>
                    {formatTimestamp(tx.created_at)}{tx.memo ? ` · ${tx.memo}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <TxStatusBadge status={tx.status} />
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)" }}>{formatUsd(tx.amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create agent account drawer */}
      {drawerOpen && (
        <ListAgentDrawerShell onClose={() => onDrawerClose(false)}>
          <ListAgentDrawer onClose={() => onDrawerClose(true)} />
        </ListAgentDrawerShell>
      )}

      {/* Edit agent drawer */}
      {editAgent && (
        <ListAgentDrawerShell onClose={() => onDrawerClose(false)}>
          <EditAgentDrawer agent={editAgent} onClose={(refresh) => onDrawerClose(refresh)} />
        </ListAgentDrawerShell>
      )}

      {/* Revoke confirmation */}
      {revokeAgent && (
        <RevokeConfirmModal
          agent={revokeAgent}
          busy={busyId === revokeAgent.id}
          onCancel={() => setRevokeAgent(null)}
          onConfirm={() => handleRevoke(revokeAgent)}
        />
      )}
    </div>
  );
}

function RevokeConfirmModal({ agent, busy, onCancel, onConfirm }: { agent: AgentAccount; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      <div onClick={busy ? undefined : onCancel} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 201,
        width: "400px", backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 510, color: "rgb(248,248,248)" }}>Revoke {agent.name}?</div>
          <div style={{ fontSize: "13px", color: "rgb(140,140,140)", marginTop: "8px", lineHeight: "19px" }}>
            This is permanent. {agent.handle}.mansafi will no longer be able to receive or send payments, and its
            balance of {formatUsd(agent.balance)} USDG will be swept back to your primary account. This cannot be undone.
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCancel} disabled={busy} style={{
            flex: 1, backgroundColor: "transparent", color: "rgb(140,140,140)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "11px 16px",
            fontSize: "13px", fontWeight: 510, cursor: busy ? "not-allowed" : "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} style={{
            flex: 1, backgroundColor: busy ? "rgba(240,80,80,0.4)" : "rgba(240,80,80,0.9)",
            color: "#0A0A0A",
            border: "none", borderRadius: "9999px", padding: "11px 16px",
            fontSize: "13px", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer",
          }}>
            {busy ? "Revoking…" : "Revoke permanently"}
          </button>
        </div>
      </div>
    </>
  );
}

function EditAgentDrawer({ agent, onClose }: { agent: AgentAccount; onClose: (refresh?: boolean) => void }) {
  const [form, setFormState] = useState({
    name: agent.name,
    description: agent.description ?? "",
    maxPerRequest: agent.spend_policies ? String(agent.spend_policies.max_per_request) : "0",
    maxPerDay: agent.spend_policies ? String(agent.spend_policies.max_per_day) : "0",
    allowedDomains: agent.spend_policies ? agent.spend_policies.allowed_domains.join(", ") : "",
    webhookUrl: agent.spend_policies?.webhook_url ?? "",
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(key: keyof typeof form, value: string) {
    setFormState((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitStatus("submitting");
    setErrorMsg("");

    try {
      const supabase = createClient();

      const maxPerRequest = parseFloat(form.maxPerRequest);
      const maxPerDay = parseFloat(form.maxPerDay);
      if (!Number.isFinite(maxPerRequest) || maxPerRequest < 0) throw new Error("Enter a valid max per request amount.");
      if (!Number.isFinite(maxPerDay) || maxPerDay < 0) throw new Error("Enter a valid max per day amount.");

      const allowedDomains = form.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const { error: accountError } = await supabase
        .from("accounts")
        .update({ name: form.name, description: form.description || null })
        .eq("id", agent.id);
      if (accountError) throw new Error(accountError.message);

      const { error: policyError } = await supabase
        .from("spend_policies")
        .update({
          max_per_request: maxPerRequest,
          max_per_day: maxPerDay,
          allowed_domains: allowedDomains,
          webhook_url: form.webhookUrl || null,
        })
        .eq("account_id", agent.id);
      if (policyError) throw new Error(policyError.message);

      setSubmitStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setSubmitStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#151515",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "9px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "rgb(248,248,248)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: 500,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgb(140,140,140)",
    display: "block",
    marginBottom: "6px",
  };

  if (submitStatus === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "16px", padding: "40px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(64,186,128,0.1)", border: "1px solid rgba(64,186,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5l3 3 6-6" stroke="rgb(64,186,128)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 510, color: "rgb(248,248,248)", marginBottom: "6px" }}>Agent account updated</div>
          <div style={{ fontSize: "13px", color: "rgb(140,140,140)" }}>Your spending policy changes have been saved.</div>
        </div>
        <button
          onClick={() => onClose(true)}
          style={{ backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A", border: "none", borderRadius: "9999px", padding: "9px 22px", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "8px", boxShadow: "0 0 16px rgba(248,248,248,0.25)" }}
        >
          Done
        </button>
      </div>
    );
  }

  const submitting = submitStatus === "submitting";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1, padding: "24px" }}>
      {submitStatus === "error" && (
        <div style={{ padding: "10px 14px", backgroundColor: "rgba(240,80,80,0.08)", border: "1px solid rgba(240,80,80,0.2)", borderRadius: "8px", fontSize: "13px", color: "rgb(240,100,100)" }}>
          {errorMsg}
        </div>
      )}

      <div>
        <label style={labelStyle}>Agent name <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
        <input required value={form.name} onChange={e => set("name", e.target.value)} disabled={submitting} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)} disabled={submitting} rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }} />
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Max per request (USDG) <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
          <input required type="number" min="0" step="0.01" value={form.maxPerRequest} onChange={e => set("maxPerRequest", e.target.value)} disabled={submitting} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Max per day (USDG) <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
          <input required type="number" min="0" step="0.01" value={form.maxPerDay} onChange={e => set("maxPerDay", e.target.value)} disabled={submitting} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Allowed domains <span style={{ color: "rgb(60,65,75)", fontWeight: 400 }}>(comma-separated, optional)</span></label>
        <input value={form.allowedDomains} onChange={e => set("allowedDomains", e.target.value)} disabled={submitting} style={inputStyle} placeholder="api.datavendor.com, api.othervendor.com" />
      </div>

      <div>
        <label style={labelStyle}>Webhook URL <span style={{ color: "rgb(60,65,75)", fontWeight: 400 }}>(optional, for payment notifications)</span></label>
        <input value={form.webhookUrl} onChange={e => set("webhookUrl", e.target.value)} disabled={submitting} style={inputStyle} placeholder="https://your-service.com/webhooks/mansafi" />
      </div>

      <button type="submit" disabled={submitting} style={{ backgroundColor: submitting ? "rgba(248,248,248,0.35)" : "var(--mansafi-accent)", color: "#0A0A0A", border: "none", borderRadius: "9999px", padding: "11px 16px", fontSize: "13px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", marginTop: "4px", transition: "all 0.15s", boxShadow: submitting ? "none" : "0 0 16px rgba(248,248,248,0.25)" }}>
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function StatCell({ label, value, highlight, green }: { label: string; value: string; highlight?: boolean; green?: boolean }) {
  return (
    <div style={{ minWidth: "80px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 500, color: green ? "rgb(64,186,128)" : highlight ? "rgb(248,248,248)" : "rgb(140,140,140)" }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const cfg: Record<AccountStatus, { label: string; color: string; bg: string; border: string }> = {
    active: { label: "Active", color: "rgb(64,186,128)", bg: "rgba(64,186,128,0.1)", border: "rgba(64,186,128,0.25)" },
    paused: { label: "Paused", color: "rgb(240,180,60)", bg: "rgba(240,180,60,0.1)", border: "rgba(240,180,60,0.25)" },
    revoked: { label: "Revoked", color: "rgb(240,80,80)", bg: "rgba(240,80,80,0.1)", border: "rgba(240,80,80,0.25)" },
  };
  const c = cfg[status];
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 510, letterSpacing: "0.12em", color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: "9999px", padding: "2px 8px", textTransform: "uppercase" }}>
      {c.label}
    </span>
  );
}

function TxStatusBadge({ status }: { status: Transaction["status"] }) {
  const cfg: Record<Transaction["status"], { color: string; bg: string; border: string }> = {
    settled: { color: "rgb(64,186,128)", bg: "rgba(64,186,128,0.1)", border: "rgba(64,186,128,0.2)" },
    pending: { color: "rgb(240,180,60)", bg: "rgba(240,180,60,0.1)", border: "rgba(240,180,60,0.2)" },
    failed: { color: "rgb(240,80,80)", bg: "rgba(240,80,80,0.1)", border: "rgba(240,80,80,0.2)" },
  };
  const c = cfg[status];
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 510, letterSpacing: "0.12em",
      color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}`,
      borderRadius: "9999px", padding: "2px 8px", textTransform: "uppercase",
    }}>
      {capitalize(status)}
    </span>
  );
}
