"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, Profile, Transaction } from "@/lib/supabase/database.types";

const TOPUP_PRESETS = ["10", "25", "50", "100"];
const DEPOSIT_ADDRESS = process.env.NEXT_PUBLIC_DEPOSIT_ADDRESS ?? "";

type TopUpStep = "amount" | "deposit" | "verifying" | "success";

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spentThisMonth, setSpentThisMonth] = useState<number | null>(null);
  const [totalToppedUp, setTotalToppedUp] = useState<number | null>(null);

  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState("50");
  const [topUpStep, setTopUpStep] = useState<TopUpStep>("amount");
  const [topUpStatus, setTopUpStatus] = useState<"idle" | "error">("idle");
  const [topUpError, setTopUpError] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);
    };
  }, []);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: profileData }, { data: accountData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
      supabase.from("accounts").select("*").eq("owner_id", user.id).eq("is_primary", true).single<Account>(),
    ]);

    setProfile(profileData ?? null);
    setAccount(accountData ?? null);

    if (accountData) {
      const primaryId = accountData.id;
      const [{ data: txData }, { data: spentData }, { data: toppedUpData }] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .or(`from_account_id.eq.${primaryId},to_account_id.eq.${primaryId}`)
          .order("created_at", { ascending: false })
          .limit(50)
          .returns<Transaction[]>(),
        supabase
          .from("transactions")
          .select("amount")
          .eq("from_account_id", primaryId)
          .eq("status", "settled")
          .gte("created_at", startOfCurrentMonthIso())
          .returns<{ amount: number }[]>(),
        supabase
          .from("transactions")
          .select("amount")
          .eq("to_account_id", primaryId)
          .eq("counterparty_type", "external")
          .returns<{ amount: number }[]>(),
      ]);

      setTransactions(txData ?? []);
      setSpentThisMonth((spentData ?? []).reduce((sum, row) => sum + Number(row.amount), 0));
      setTotalToppedUp((toppedUpData ?? []).reduce((sum, row) => sum + Number(row.amount), 0));
    } else {
      setTransactions([]);
      setSpentThisMonth(null);
      setTotalToppedUp(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const avgSettlementMs = useMemo(() => {
    const settled = transactions.filter((t) => t.status === "settled" && t.finality_ms != null);
    if (settled.length === 0) return null;
    const total = settled.reduce((sum, t) => sum + (t.finality_ms ?? 0), 0);
    return Math.round(total / settled.length);
  }, [transactions]);

  function resetTopUp() {
    setShowTopUp(false);
    setTopUpStep("amount");
    setTopUpStatus("idle");
    setTopUpError("");
    setDepositAddress("");
    setCopyStatus("idle");
  }

  function handleContinueToDeposit() {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setTopUpStatus("error");
      setTopUpError("Enter an amount greater than zero.");
      return;
    }
    setTopUpStatus("idle");
    setTopUpError("");
    setDepositAddress(DEPOSIT_ADDRESS);
    setTopUpStep("deposit");
  }

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      // clipboard API unavailable, nothing more we can do here
    }
  }

  function handleConfirmTransferred() {
    setTopUpStep("verifying");
    const delayMs = 5000 + Math.random() * 5000;
    verifyTimerRef.current = setTimeout(async () => {
      if (!account) return;
      const parsed = parseFloat(amount);
      const supabase = createClient();
      const { error } = await supabase.rpc("simulate_topup", {
        p_account_id: account.id,
        p_amount: parsed,
      });

      if (error) {
        setTopUpStatus("error");
        setTopUpError(error.message);
        setTopUpStep("amount");
        return;
      }

      setTopUpStep("success");
      await fetchWalletData();
    }, delayMs);
  }

  const stats = [
    { label: "Spent this month", value: loading ? "…" : spentThisMonth != null ? formatUsd(spentThisMonth) : "n/a" },
    { label: "Total topped up", value: loading ? "…" : totalToppedUp != null ? formatUsd(totalToppedUp) : "n/a" },
    { label: "Avg settlement time", value: loading ? "…" : avgSettlementMs != null ? `${avgSettlementMs}ms` : "n/a" },
  ];

  return (
    <div style={{ padding: "32px 40px", maxWidth: "820px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
          Wallet
        </h1>
        <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
          Your USDG balance and transaction history.
        </p>
      </div>

      {/* Balance card */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", padding: "24px", marginBottom: "16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "rgb(105,105,105)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.14em" }}>Available balance</div>
          <div style={{ fontSize: "36px", fontWeight: 510, color: "rgb(248,248,248)", letterSpacing: "-1px" }}>
            {loading ? "…" : account ? account.balance.toFixed(2) : "n/a"} <span style={{ fontSize: "18px", color: "rgb(105,105,105)" }}>USDG</span>
          </div>
          <div style={{ fontSize: "11px", color: "rgb(140,140,140)", marginTop: "6px", fontFamily: "monospace" }}>
            {loading
              ? "…"
              : profile?.wallet_address
                ? `${truncateAddress(profile.wallet_address)} · Robinhood Chain wallet`
                : "No wallet linked, add one in Settings"}
          </div>
        </div>
        <button
          disabled={loading || !account}
          style={{
            backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
            border: "none", borderRadius: "9999px", padding: "10px 22px",
            boxShadow: "0 0 16px rgba(248,248,248,0.25)",
            fontSize: "13px", fontWeight: 600, cursor: loading || !account ? "not-allowed" : "pointer",
            opacity: loading || !account ? 0.6 : 1,
          }}
        >
          Top up
        </button>
      </div>

      {/* Top-up panel */}
      {showTopUp && (
        <div style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", padding: "20px", marginBottom: "16px",
        }}>
          {topUpStep === "amount" && (
            <>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "14px" }}>Add USDG</div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                {TOPUP_PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => { setAmount(v); setTopUpStatus("idle"); setTopUpError(""); }}
                    style={{
                      padding: "6px 14px", borderRadius: "9999px", fontSize: "12px", cursor: "pointer", border: "1px solid",
                      backgroundColor: amount === v ? "rgba(248,248,248,0.08)" : "transparent",
                      borderColor: amount === v ? "rgba(248,248,248,0.25)" : "rgba(255,255,255,0.1)",
                      color: amount === v ? "var(--mansafi-accent)" : "rgb(140,140,140)",
                    }}
                  >
                    ${v}
                  </button>
                ))}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setTopUpStatus("idle"); setTopUpError(""); }}
                  style={{
                    flex: 1, backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px", padding: "6px 10px", fontSize: "12px",
                    color: "rgb(248,248,248)", outline: "none",
                  }}
                  placeholder="Custom"
                />
              </div>
              {topUpStatus === "error" && (
                <div style={{ fontSize: "12px", color: "rgb(240,80,80)", marginBottom: "10px" }}>{topUpError || "n/a"}</div>
              )}
              <button
                onClick={handleContinueToDeposit}
                disabled={!account}
                style={{
                  width: "100%", backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
                  border: "none", borderRadius: "9999px", padding: "10px", fontSize: "13px",
                  boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                  fontWeight: 600, cursor: !account ? "not-allowed" : "pointer",
                }}
              >
                Continue
              </button>
            </>
          )}

          {topUpStep === "deposit" && (
            <>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)", marginBottom: "4px" }}>
                Send ${amount || "0"} USDG to this address
              </div>
              <p style={{ fontSize: "12px", color: "rgb(140,140,140)", lineHeight: "18px", margin: "0 0 14px" }}>
                Send from any Robinhood Chain wallet, like MetaMask, Rabby, or Robinhood Wallet. Once your transfer is on its way, confirm below and we'll verify it.
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", padding: "10px 12px", marginBottom: "10px",
              }}>
                <span style={{ flex: 1, fontSize: "12px", fontFamily: "monospace", color: "rgb(140,140,140)", wordBreak: "break-all" }}>
                  {depositAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  style={{
                    flexShrink: 0, backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "9999px", padding: "5px 12px", fontSize: "11px", color: "rgb(248,248,248)", cursor: "pointer",
                  }}
                >
                  {copyStatus === "copied" ? "Copied" : "Copy"}
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setTopUpStep("amount")}
                  style={{
                    flex: 1, backgroundColor: "transparent", color: "rgb(140,140,140)",
                    border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "10px",
                    fontSize: "13px", fontWeight: 510, cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmTransferred}
                  style={{
                    flex: 2, backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
                    border: "none", borderRadius: "9999px", padding: "10px", fontSize: "13px",
                    boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                    fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Transferred
                </button>
              </div>
            </>
          )}

          {topUpStep === "verifying" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", textAlign: "center" }}>
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginBottom: "14px" }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="rgb(248, 248, 248)" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)", marginBottom: "4px" }}>
                Verifying transaction
              </div>
              <p style={{ fontSize: "12px", color: "rgb(140,140,140)", margin: 0 }}>
                Confirming your deposit of ${amount || "0"} USDG on Robinhood Chain. This usually takes a few seconds.
              </p>
            </div>
          )}

          {topUpStep === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", textAlign: "center" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%", marginBottom: "12px",
                backgroundColor: "rgba(64,186,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="rgb(64,186,128)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)", marginBottom: "4px" }}>
                Top up complete
              </div>
              <p style={{ fontSize: "12px", color: "rgb(140,140,140)", margin: "0 0 16px" }}>
                ${amount || "0"} USDG has been added to your account.
              </p>
              <button
                onClick={resetTopUp}
                style={{
                  backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
                  border: "none", borderRadius: "9999px", padding: "9px 22px", fontSize: "13px",
                  boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {stats.map((s) => (
          <div key={s.label} className="fx-glass-card" style={{
            borderRadius: "12px", padding: "16px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 510, color: "rgb(248,248,248)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>
          Transaction history
        </div>
        {loading ? (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
        ) : !account || transactions.length === 0 ? (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>No transactions yet.</div>
        ) : transactions.map((tx, i) => {
          const isCredit = tx.to_account_id === account.id;
          const shownAmount = isCredit ? tx.amount : -tx.amount;
          const counterpartyLabel = isCredit ? tx.from_display : tx.to_display;
          const description = tx.memo ? `${counterpartyLabel} · ${tx.memo}` : counterpartyLabel;

          return (
            <div key={tx.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: i < transactions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                  backgroundColor: isCredit ? "rgba(64,186,128,0.12)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", color: isCredit ? "rgb(64,186,128)" : "rgb(140,140,140)",
                }}>
                  {isCredit ? "↓" : "↑"}
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "rgb(248,248,248)" }}>{description || "n/a"}</div>
                  <div style={{ fontSize: "10px", color: "rgb(105,105,105)", marginTop: "2px" }}>
                    {formatTimestamp(tx.created_at)}
                    {tx.status !== "settled" ? ` · ${tx.status}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: isCredit ? "rgb(64,186,128)" : "rgb(248,248,248)" }}>
                  {isCredit ? "+" : ""}{shownAmount.toFixed(2)} USDG
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
