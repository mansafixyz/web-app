"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database as RawDatabase, Transaction, TransactionStatus, PrivacyLayer } from "@/lib/supabase/database.types";

type TxStatus = TransactionStatus;

type Direction = "in" | "out";

// database.types.ts's Tables/Views entries don't carry a `Relationships` array,
// which recent @supabase/supabase-js versions require for the schema generic to
// resolve (otherwise every `.from()`/`.rpc()` call silently types as `never`).
// This re-shapes the schema locally, for this file only, without touching the
// shared types file or client factory.
type WithRelationships<T> = { [K in keyof T]: T[K] & { Relationships: [] } };
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

const STATUS_CFG: Record<TxStatus, { label: string; color: string; bg: string; border: string }> = {
  settled: { label: "Settled", color: "rgb(64,186,128)", bg: "rgba(64,186,128,0.1)", border: "rgba(64,186,128,0.2)" },
  pending: { label: "Pending", color: "rgb(240,180,60)", bg: "rgba(240,180,60,0.1)", border: "rgba(240,180,60,0.2)" },
  failed: { label: "Failed", color: "rgb(240,80,80)", bg: "rgba(240,80,80,0.1)", border: "rgba(240,80,80,0.2)" },
};

const PRIVACY_CFG: Record<PrivacyLayer, { color: string; bg: string; border: string }> = {
  Public: { color: "rgb(140,140,140)", bg: "rgba(138,143,152,0.08)", border: "rgba(138,143,152,0.18)" },
  Confidential: { color: "rgb(153,120,255)", bg: "rgba(153,120,255,0.1)", border: "rgba(153,120,255,0.22)" },
  Shielded: { color: "rgb(100,150,240)", bg: "rgba(100,150,240,0.1)", border: "rgba(100,150,240,0.22)" },
};

function formatTimestamp(iso: string | null) {
  if (!iso) return "n/a";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "n/a";
  const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart} · ${timePart}`;
}

function formatFinality(ms: number | null) {
  return ms == null ? "n/a" : `${ms}ms`;
}

export default function ExecutionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownedAccountIds, setOwnedAccountIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filter, setFilter] = useState<TxStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [disclosureDetailOpen, setDisclosureDetailOpen] = useState<Set<string>>(new Set());
  const [disclosureLoading, setDisclosureLoading] = useState<string | null>(null);
  const [disclosureError, setDisclosureError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setLoadError(null);
    const supabase = db();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTransactions([]);
      setOwnedAccountIds(new Set());
      setLoading(false);
      return;
    }

    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select("id")
      .eq("owner_id", user.id);

    if (accountsError) {
      setLoadError(accountsError.message);
      setLoading(false);
      return;
    }

    const ownedIds = new Set((accountsData ?? []).map((a) => a.id));
    setOwnedAccountIds(ownedIds);

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (txError) {
      setLoadError(txError.message);
      setLoading(false);
      return;
    }

    setTransactions(txData ?? []);
    setLoading(false);
  }

  function directionOf(tx: Transaction): Direction {
    const fromOwned = tx.from_account_id != null && ownedAccountIds.has(tx.from_account_id);
    const toOwned = tx.to_account_id != null && ownedAccountIds.has(tx.to_account_id);
    if (fromOwned) return "out";
    if (toOwned) return "in";
    return "out";
  }

  function isInternal(tx: Transaction) {
    const fromOwned = tx.from_account_id != null && ownedAccountIds.has(tx.from_account_id);
    const toOwned = tx.to_account_id != null && ownedAccountIds.has(tx.to_account_id);
    return fromOwned && toOwned;
  }

  function counterpartyOf(tx: Transaction) {
    return directionOf(tx) === "out" ? tx.to_display : tx.from_display;
  }

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.status === filter);
  const selectedTx = selected ? transactions.find((t) => t.id === selected) ?? null : null;

  const totalVolume = transactions.filter((t) => t.status === "settled").reduce((s, t) => s + t.amount, 0);

  function toggleReveal(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function formatAmount(tx: Transaction) {
    if (tx.privacy_layer === "Public" || revealed.has(tx.id)) {
      return `$${tx.amount.toFixed(2)}`;
    }
    return "••••• USDG";
  }

  async function handleGenerateDisclosure(tx: Transaction) {
    setDisclosureLoading(tx.id);
    setDisclosureError(null);
    try {
      const supabase = db();
      const { data, error } = await supabase.rpc("generate_disclosure", { p_transaction_id: tx.id });
      if (error) throw new Error(error.message);
      if (data) {
        setTransactions((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      }
    } catch (err) {
      setDisclosureError(err instanceof Error ? err.message : "Failed to generate compliance disclosure");
    } finally {
      setDisclosureLoading(null);
    }
  }

  function toggleDisclosureDetail(id: string) {
    setDisclosureDetailOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectTx(id: string) {
    setSelected((prev) => (prev === id ? null : id));
    setDisclosureError(null);
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
          Activity
        </h1>
        <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
          {loading
            ? "Loading transactions…"
            : `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} · $${totalVolume.toFixed(2)} settled volume · amounts confidential by default, verified on Robinhood Chain`}
        </p>
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

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Settled", value: loading ? "…" : transactions.filter((t) => t.status === "settled").length, color: "rgb(64,186,128)" },
          { label: "Pending", value: loading ? "…" : transactions.filter((t) => t.status === "pending").length, color: "rgb(240,180,60)" },
          { label: "Failed", value: loading ? "…" : transactions.filter((t) => t.status === "failed").length, color: "rgb(240,80,80)" },
          { label: "Settled volume", value: loading ? "…" : `$${totalVolume.toFixed(2)}`, color: "rgb(248,248,248)" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "14px 16px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 510, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        {(["all", "settled", "pending", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "5px 12px", borderRadius: "9999px", fontSize: "12px",
              cursor: "pointer", border: "1px solid",
              backgroundColor: filter === f ? "rgba(248,248,248,0.08)" : "transparent",
              borderColor: filter === f ? "transparent" : "rgba(255,255,255,0.1)",
              boxShadow: filter === f ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
              color: filter === f ? "var(--mansafi-accent)" : "rgb(140,140,140)",
              fontWeight: filter === f ? 500 : 400,
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedTx ? "1fr 320px" : "1fr", gap: "16px", alignItems: "start" }}>
        {/* Table */}
        <div style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto auto auto auto",
            gap: "12px", padding: "10px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgb(105,105,105)",
            letterSpacing: "0.14em", textTransform: "uppercase",
          }}>
            <span>Status</span><span>Memo</span><span>Counterparty</span><span>Privacy</span><span>Amount</span><span>Time</span>
          </div>

          {loading && (
            <div style={{ padding: "40px 18px", textAlign: "center", color: "rgb(105,105,105)", fontSize: "13px" }}>
              Loading transactions…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "40px 18px", textAlign: "center", color: "rgb(105,105,105)", fontSize: "13px" }}>
              No transactions found.
            </div>
          )}

          {!loading && filtered.map((tx, i) => {
            const sc = STATUS_CFG[tx.status];
            const pc = PRIVACY_CFG[tx.privacy_layer];
            const isSelected = selected === tx.id;
            const direction = directionOf(tx);
            const counterparty = counterpartyOf(tx);
            const internal = isInternal(tx);
            return (
              <div
                key={tx.id}
                onClick={() => selectTx(tx.id)}
                style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto auto auto auto",
                  gap: "12px", alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                  backgroundColor: isSelected ? "rgba(255,255,255,0.03)" : "transparent",
                  cursor: "pointer", transition: "background 0.1s",
                }}
              >
                {/* Status */}
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em",
                  color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
                  borderRadius: "4px", padding: "2px 7px", textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  {sc.label}
                </span>

                {/* Memo */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: "rgb(248,248,248)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.memo ?? "n/a"}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgb(105,105,105)", fontFamily: "var(--font-mono)", marginTop: "1px" }}>
                    {tx.id.slice(0, 8)} · {formatTimestamp(tx.created_at)}{internal ? " · internal transfer" : ""}
                  </div>
                </div>

                {/* Counterparty */}
                <span style={{ fontSize: "11px", color: "rgb(140,140,140)", whiteSpace: "nowrap", fontFamily: tx.counterparty_type === "human" ? undefined : "var(--font-mono)" }}>
                  {direction === "out" ? "→ " : "← "}{counterparty}
                </span>

                {/* Privacy layer */}
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: pc.color, backgroundColor: pc.bg,
                  border: `1px solid ${pc.border}`, borderRadius: "4px", padding: "2px 7px",
                  whiteSpace: "nowrap",
                }}>
                  {tx.privacy_layer}
                </span>

                {/* Amount */}
                <span
                  onClick={tx.privacy_layer !== "Public" ? (e) => toggleReveal(tx.id, e) : undefined}
                  style={{
                    fontSize: "12px", fontWeight: 500,
                    color: "rgb(248,248,248)",
                    whiteSpace: "nowrap",
                    cursor: tx.privacy_layer !== "Public" ? "pointer" : "default",
                    fontFamily: revealed.has(tx.id) || tx.privacy_layer === "Public" ? undefined : "var(--font-mono)",
                  }}
                  title={tx.privacy_layer !== "Public" ? "Click to reveal" : undefined}
                >
                  {formatAmount(tx)}
                </span>

                {/* Time (finality) */}
                <span style={{ fontSize: "11px", color: "rgb(105,105,105)", whiteSpace: "nowrap" }}>{formatFinality(tx.finality_ms)}</span>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedTx && (() => {
          const sc = STATUS_CFG[selectedTx.status];
          const pc = PRIVACY_CFG[selectedTx.privacy_layer];
          const direction = directionOf(selectedTx);
          const counterparty = counterpartyOf(selectedTx);
          const detailOpen = disclosureDetailOpen.has(selectedTx.id);
          const isGeneratingThis = disclosureLoading === selectedTx.id;

          return (
            <div style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", overflow: "hidden", position: "sticky", top: "24px",
            }}>
              {/* Detail header */}
              <div style={{
                padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>
                  Transaction receipt
                </span>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgb(105,105,105)", fontSize: "16px", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Status */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10px",
                    color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
                    borderRadius: "4px", padding: "3px 8px", textTransform: "uppercase", letterSpacing: "0.14em",
                  }}>
                    {sc.label}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10px",
                    color: pc.color, backgroundColor: pc.bg, border: `1px solid ${pc.border}`,
                    borderRadius: "4px", padding: "3px 8px", textTransform: "uppercase", letterSpacing: "0.14em",
                  }}>
                    {selectedTx.privacy_layer}
                  </span>
                </div>

                {/* Fields */}
                {[
                  { label: "Transaction ID", value: selectedTx.id, mono: true },
                  { label: "Counterparty", value: `${direction === "out" ? "To" : "From"} ${counterparty}${isInternal(selectedTx) ? " (internal transfer)" : ""}` },
                  { label: "Timestamp", value: formatTimestamp(selectedTx.created_at) },
                  { label: "Finality", value: formatFinality(selectedTx.finality_ms) },
                  { label: "Amount", value: `$${selectedTx.amount.toFixed(2)} USDG` },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgb(105,105,105)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: "12px", color: mono ? "rgb(140,140,140)" : "rgb(248,248,248)", fontFamily: mono ? "var(--font-mono)" : undefined }}>
                      {value}
                    </span>
                  </div>
                ))}

                {/* Memo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgb(105,105,105)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Memo
                  </span>
                  <span style={{ fontSize: "12px", color: "rgb(248,248,248)", lineHeight: "18px" }}>
                    {selectedTx.memo ?? "n/a"}
                  </span>
                </div>

                {/* Proof hash */}
                {selectedTx.proof_hash != null && (
                  <div style={{
                    backgroundColor: "#101010", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px", padding: "10px 12px",
                  }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgb(105,105,105)", marginBottom: "5px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      ZK proof hash (Robinhood Chain)
                    </div>
                    <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "rgb(140,140,140)", wordBreak: "break-all", lineHeight: "16px" }}>
                      {selectedTx.proof_hash}
                    </div>
                  </div>
                )}

                {/* Tx sig */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgb(105,105,105)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Transaction
                  </span>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: selectedTx.tx_sig != null ? "rgb(100,150,240)" : "rgb(105,105,105)", wordBreak: "break-all" }}>
                    {selectedTx.tx_sig ?? "n/a"}
                  </span>
                </div>

                {/* Compliance disclosure for settled */}
                {selectedTx.status === "settled" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={() => {
                        if (selectedTx.disclosed) toggleDisclosureDetail(selectedTx.id);
                        else handleGenerateDisclosure(selectedTx);
                      }}
                      disabled={isGeneratingThis}
                      style={{
                        backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "9999px", padding: "8px", fontSize: "12px",
                        color: isGeneratingThis ? "rgb(105,105,105)" : "rgb(248,248,248)",
                        cursor: isGeneratingThis ? "not-allowed" : "pointer",
                      }}
                    >
                      {isGeneratingThis
                        ? "Generating…"
                        : selectedTx.disclosed
                          ? (detailOpen ? "Hide compliance disclosure" : "View compliance disclosure")
                          : "Generate compliance disclosure"}
                    </button>

                    {disclosureError && (
                      <div style={{
                        backgroundColor: "rgba(240,80,80,0.08)", border: "1px solid rgba(240,80,80,0.2)",
                        borderRadius: "8px", padding: "8px 10px",
                        fontSize: "11px", color: "rgb(240,100,100)", lineHeight: "16px",
                      }}>
                        {disclosureError}
                      </div>
                    )}

                    {selectedTx.disclosed && detailOpen && (
                      <div style={{
                        backgroundColor: "#101010", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px", padding: "10px 12px",
                        fontSize: "11px", color: "rgb(140,140,140)", lineHeight: "17px",
                      }}>
                        Disclosed {formatTimestamp(selectedTx.disclosed_at)}. A view key for this transaction's full proof and settlement details has been generated for compliance review.
                      </div>
                    )}
                  </div>
                )}

                {/* Pending notice */}
                {selectedTx.status === "pending" && (
                  <div style={{
                    backgroundColor: "rgba(240,180,60,0.08)", border: "1px solid rgba(240,180,60,0.2)",
                    borderRadius: "8px", padding: "10px 12px",
                    fontSize: "12px", color: "rgb(240,180,60)", lineHeight: "18px",
                  }}>
                    Awaiting on-chain confirmation of the ZK range proof. Balance will update once the validator finalizes the block.
                  </div>
                )}

                {/* Failed notice */}
                {selectedTx.status === "failed" && (
                  <div style={{
                    backgroundColor: "rgba(240,80,80,0.08)", border: "1px solid rgba(240,80,80,0.2)",
                    borderRadius: "8px", padding: "10px 12px",
                    fontSize: "12px", color: "rgb(240,100,100)", lineHeight: "18px",
                  }}>
                    This transaction did not settle. No balance was moved.
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
