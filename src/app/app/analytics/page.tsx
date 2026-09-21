"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, PrivacyLayer, Transaction } from "@/lib/supabase/database.types";

type RangeOption = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<RangeOption, number> = { "7d": 7, "30d": 30, "90d": 90 };

const LAYER_ORDER: PrivacyLayer[] = ["Confidential", "Shielded", "Public"];
const LAYER_COLOR: Record<PrivacyLayer, string> = {
  Confidential: "rgba(248,248,248,0.9)",
  Shielded: "rgb(153,120,255)",
  Public: "rgb(59,130,246)",
};
const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// JS Date#getDay(): 0 = Sun ... 6 = Sat. Remap so Monday is index 0.
function mondayFirstDow(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

function DeltaLabel({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <div style={{ fontSize: "11px", color: positive ? "rgb(64,186,128)" : "rgb(240,80,80)", marginTop: "4px" }}>
      {positive ? "+" : ""}
      {value.toFixed(1)}
      {suffix} vs last period
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeOption>("7d");
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([]);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setAuthed(false); setAccounts([]); setTransactions([]); setPrevTransactions([]); setLoading(false); }
        return;
      }

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("*")
        .eq("owner_id", user.id);
      const userAccounts = (accountsData as Account[]) ?? [];

      if (userAccounts.length === 0) {
        if (!cancelled) { setAuthed(true); setAccounts([]); setTransactions([]); setPrevTransactions([]); setLoading(false); }
        return;
      }

      const days = RANGE_DAYS[range];
      const now = Date.now();
      const cutoffIso = new Date(now - days * 86400000).toISOString();
      const prevCutoffIso = new Date(now - 2 * days * 86400000).toISOString();
      const idList = userAccounts.map((a) => a.id).join(",");
      const orFilter = `from_account_id.in.(${idList}),to_account_id.in.(${idList})`;

      const [{ data: currentData }, { data: prevData }] = await Promise.all([
        supabase.from("transactions").select("*").or(orFilter).gte("created_at", cutoffIso).order("created_at", { ascending: true }),
        supabase.from("transactions").select("*").or(orFilter).gte("created_at", prevCutoffIso).lt("created_at", cutoffIso),
      ]);

      if (cancelled) return;
      setAuthed(true);
      setAccounts(userAccounts);
      setTransactions((currentData as Transaction[]) ?? []);
      setPrevTransactions((prevData as Transaction[]) ?? []);
      setLoading(false);
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, [range]);

  // ---- KPIs ----
  const totalTransfers = transactions.length;
  const totalVolume = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const avgAmount = totalTransfers > 0 ? totalVolume / totalTransfers : 0;
  const settledCount = transactions.filter((t) => t.status === "settled").length;
  const settledRate = totalTransfers > 0 ? (settledCount / totalTransfers) * 100 : null;

  const prevTotalTransfers = prevTransactions.length;
  const prevTotalVolume = prevTransactions.reduce((s, t) => s + Number(t.amount), 0);
  const prevAvgAmount = prevTotalTransfers > 0 ? prevTotalVolume / prevTotalTransfers : 0;
  const prevSettledCount = prevTransactions.filter((t) => t.status === "settled").length;
  const prevSettledRate = prevTotalTransfers > 0 ? (prevSettledCount / prevTotalTransfers) * 100 : null;

  const transfersDelta = pctDelta(totalTransfers, prevTotalTransfers);
  const volumeDelta = pctDelta(totalVolume, prevTotalVolume);
  const avgDelta = pctDelta(avgAmount, prevAvgAmount);
  const settledDelta = settledRate !== null && prevSettledRate !== null ? settledRate - prevSettledRate : null;

  const kpis: { label: string; value: string; delta: number | null; suffix?: string }[] = [
    { label: "Total transfers", value: totalTransfers.toLocaleString(), delta: transfersDelta },
    { label: "Total volume", value: `$${totalVolume.toFixed(2)}`, delta: volumeDelta },
    { label: "Avg transfer amount", value: totalTransfers > 0 ? `$${avgAmount.toFixed(2)}` : "n/a", delta: avgDelta },
    { label: "Settled rate", value: settledRate !== null ? `${settledRate.toFixed(1)}%` : "n/a", delta: settledDelta, suffix: "pts" },
  ];

  // ---- Transfers per day ----
  const days = RANGE_DAYS[range];
  const dayBuckets: { key: string; label: string; count: number; volume: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = range === "7d"
      ? d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    dayBuckets.push({ key, label, count: 0, volume: 0 });
  }
  const dayBucketMap = new Map(dayBuckets.map((b) => [b.key, b]));
  transactions.forEach((t) => {
    const key = t.created_at.slice(0, 10);
    const bucket = dayBucketMap.get(key);
    if (bucket) { bucket.count += 1; bucket.volume += Number(t.amount); }
  });
  const maxDayCount = Math.max(1, ...dayBuckets.map((d) => d.count));
  // For 90d, thin the x-axis labels so they don't collide.
  const labelEvery = range === "90d" ? 10 : range === "30d" ? 5 : 1;

  // ---- Volume by account ----
  const accountTotals = new Map<string, { name: string; handle: string; type: Account["type"]; count: number; volume: number }>();
  accounts.forEach((a) => accountTotals.set(a.id, { name: a.name, handle: a.handle, type: a.type, count: 0, volume: 0 }));
  transactions.forEach((t) => {
    if (t.from_account_id && accountTotals.has(t.from_account_id)) {
      const e = accountTotals.get(t.from_account_id)!;
      e.count += 1;
      e.volume += Number(t.amount);
    }
    if (t.to_account_id && accountTotals.has(t.to_account_id)) {
      const e = accountTotals.get(t.to_account_id)!;
      e.count += 1;
      e.volume += Number(t.amount);
    }
  });
  const accountRows = Array.from(accountTotals.values())
    .filter((e) => e.count > 0)
    .sort((a, b) => b.volume - a.volume);
  const maxAccountVolume = Math.max(1, ...accountRows.map((a) => a.volume));

  // ---- Volume by privacy layer ----
  const layerTotals = new Map<PrivacyLayer, number>();
  transactions.forEach((t) => layerTotals.set(t.privacy_layer, (layerTotals.get(t.privacy_layer) ?? 0) + Number(t.amount)));
  const layerRows = LAYER_ORDER.map((layer) => ({
    category: layer,
    spend: layerTotals.get(layer) ?? 0,
    color: LAYER_COLOR[layer],
  }));

  // ---- Activity heatmap: [day-of-week Mon..Sun][hour 0..23] ----
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxCell = 0;
  transactions.forEach((t) => {
    const d = new Date(t.created_at);
    const dow = mondayFirstDow(d);
    const hour = d.getHours();
    heatmap[dow][hour] += 1;
    if (heatmap[dow][hour] > maxCell) maxCell = heatmap[dow][hour];
  });
  function cellAlpha(count: number): number {
    if (maxCell === 0 || count === 0) return 0.05;
    const ratio = count / maxCell;
    return ratio < 0.3 ? 0.2 : ratio < 0.6 ? 0.45 : ratio < 0.85 ? 0.7 : 0.95;
  }

  const hasData = totalTransfers > 0;

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
            Analytics
          </h1>
          <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
            Your transfer volume and privacy layer breakdown.
          </p>
        </div>
        <div style={{ display: "flex", gap: "4px", backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9999px", padding: "3px" }}>
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} disabled={loading} style={{
              padding: "5px 12px", borderRadius: "9999px", fontSize: "12px", cursor: loading ? "default" : "pointer", border: "none",
              backgroundColor: range === r ? "rgba(248,248,248,0.08)" : "transparent",
              boxShadow: range === r ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
              color: range === r ? "var(--mansafi-accent)" : "rgb(105,105,105)",
              fontWeight: range === r ? 500 : 400,
            }}>{r}</button>
          ))}
        </div>
      </div>

      {!authed ? (
        <div style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "24px", fontSize: "13px", color: "rgb(105,105,105)" }}>
          Sign in to see your analytics.
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {kpis.map((k) => (
              <div key={k.label} className="fx-glass-card" style={{
                borderRadius: "12px", padding: "18px",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "8px" }}>{k.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 510, color: "rgb(248,248,248)", letterSpacing: "-0.5px" }}>
                  {loading ? "…" : k.value}
                </div>
                {!loading && <DeltaLabel value={k.delta} suffix={k.suffix} />}
              </div>
            ))}
          </div>

          {/* Volume chart */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "20px", marginBottom: "16px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "20px" }}>Transfers per day</div>
            {loading ? (
              <div style={{ fontSize: "13px", color: "rgb(105,105,105)", padding: "20px 0" }}>Loading…</div>
            ) : !hasData ? (
              <div style={{ fontSize: "13px", color: "rgb(105,105,105)", padding: "20px 0" }}>Not enough activity in this range yet.</div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: range === "90d" ? "2px" : "10px", height: "120px" }}>
                {dayBuckets.map((d, i) => (
                  <div key={d.key} title={`${d.label}: ${d.count} transfer${d.count !== 1 ? "s" : ""}, $${d.volume.toFixed(2)}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                      <div style={{
                        width: "100%",
                        height: `${(d.count / maxDayCount) * 100}%`,
                        backgroundColor: d.count > 0 ? "rgba(248,248,248,0.7)" : "rgba(255,255,255,0.1)",
                        borderRadius: "3px 3px 0 0",
                        minHeight: "4px",
                      }} />
                    </div>
                    <div style={{ fontSize: "10px", color: "rgb(105,105,105)" }}>{i % labelEvery === 0 ? d.label : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {/* Volume by account */}
            <div style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "20px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "16px" }}>Transfer volume by account</div>
              {loading ? (
                <div style={{ fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
              ) : accountRows.length === 0 ? (
                <div style={{ fontSize: "13px", color: "rgb(105,105,105)" }}>Not enough activity in this range yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {accountRows.map((a) => (
                    <div key={a.handle}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontSize: "12px", color: "rgb(248,248,248)" }}>{a.name} <span style={{ color: "rgb(105,105,105)" }}>@{a.handle}</span></span>
                        <span style={{ fontSize: "11px", color: "rgb(105,105,105)" }}>{a.count} transfer{a.count !== 1 ? "s" : ""} · ${a.volume.toFixed(2)}</span>
                      </div>
                      <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                        <div style={{ height: "100%", width: `${(a.volume / maxAccountVolume) * 100}%`, backgroundColor: "rgba(248,248,248,0.7)", borderRadius: "2px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Volume by privacy layer */}
            <div style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "20px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "16px" }}>Volume by privacy layer</div>
              {loading ? (
                <div style={{ fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
              ) : !hasData ? (
                <div style={{ fontSize: "13px", color: "rgb(105,105,105)" }}>Not enough activity in this range yet.</div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {layerRows.map((c) => (
                      <div key={c.category} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: c.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", color: "rgb(248,248,248)", flex: 1 }}>{c.category}</span>
                        <span style={{ fontSize: "12px", color: "rgb(105,105,105)", fontFamily: "monospace" }}>${c.spend.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>Total</span>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "rgb(248,248,248)" }}>${totalVolume.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hourly heatmap */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "20px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "16px" }}>Activity heatmap</div>
            {loading ? (
              <div style={{ fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
            ) : !hasData ? (
              <div style={{ fontSize: "13px", color: "rgb(105,105,105)" }}>Not enough activity in this range yet to show a pattern.</div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {heatmap.map((row, dowIdx) => (
                    <div key={DOW_LABELS[dowIdx]} style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: "rgb(105,105,105)", width: "26px", flexShrink: 0 }}>{DOW_LABELS[dowIdx]}</span>
                      {row.map((count, hourIdx) => (
                        <div key={hourIdx} title={`${DOW_LABELS[dowIdx]} ${hourIdx}:00, ${count} transfer${count !== 1 ? "s" : ""}`} style={{
                          width: "12px", height: "12px", borderRadius: "2px",
                          backgroundColor: `rgba(248,248,248,${cellAlpha(count)})`,
                        }} />
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "10px", paddingLeft: "30px" }}>
                  <span style={{ fontSize: "10px", color: "rgb(105,105,105)" }}>Less</span>
                  {[0.05, 0.2, 0.45, 0.7, 0.95].map((a) => (
                    <div key={a} style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: `rgba(248,248,248,${a})` }} />
                  ))}
                  <span style={{ fontSize: "10px", color: "rgb(105,105,105)" }}>More</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
