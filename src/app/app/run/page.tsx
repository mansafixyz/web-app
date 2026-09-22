"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, AccountPublic, Transaction, PrivacyLayer } from "@/lib/supabase/database.types";

type RunStatus = "idle" | "running" | "complete" | "error";
type PaymentStatus = "none" | "preparing" | "pending" | "verifying" | "expired";

interface HistorySummary {
  count: number;
  total: number;
  last: string | null;
}

const PRIVACY_LAYERS: PrivacyLayer[] = ["Public", "Confidential", "Shielded"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "n/a";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function VerifiedBadge() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="6" fill="rgb(64,186,128)" />
      <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RunPageInner() {
  const searchParams = useSearchParams();
  const initialTo = searchParams.get("to") ?? "";

  // ------------------------------------------------------------------
  // Sender (from account) picker
  // ------------------------------------------------------------------
  const [myAccounts, setMyAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedFromId, setSelectedFromId] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoadingAccounts(false);
        return;
      }
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .order("is_primary", { ascending: false });
      const accounts = data ?? [];
      setMyAccounts(accounts);
      const primary = accounts.find((a) => a.is_primary) ?? accounts[0];
      if (primary) setSelectedFromId(primary.id);
      setLoadingAccounts(false);
    });
  }, []);

  const selectedFromAccount = myAccounts.find((a) => a.id === selectedFromId) ?? null;

  // ------------------------------------------------------------------
  // Recipient search (accounts_public, no balance exposed)
  // ------------------------------------------------------------------
  const [recipientInput, setRecipientInput] = useState(initialTo);
  const [recipientMatch, setRecipientMatch] = useState<AccountPublic | null>(null);
  const [recipientResults, setRecipientResults] = useState<AccountPublic[]>([]);
  const [recipientSearching, setRecipientSearching] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    const cleaned = recipientInput.trim().replace(/^@/, "").replace(/\.mansafi$/i, "");
    if (!cleaned) {
      setRecipientResults([]);
      setRecipientMatch(null);
      setRecipientSearching(false);
      return;
    }
    let cancelled = false;
    setRecipientSearching(true);
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("accounts_public")
        .select("*")
        .ilike("handle", `%${cleaned}%`)
        .limit(6);
      if (cancelled) return;
      const results = (data ?? []).filter((a) => a.id !== selectedFromId);
      setRecipientResults(results);
      const exact = results.find((a) => a.handle.toLowerCase() === cleaned.toLowerCase());
      setRecipientMatch(exact ?? null);
      setRecipientSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [recipientInput, selectedFromId]);

  const handleSelectRecipient = useCallback((acct: AccountPublic) => {
    setRecipientInput(acct.handle);
    setRecipientMatch(acct);
    setRecipientResults([]);
    setInputFocused(false);
  }, []);

  const showDropdown = inputFocused && recipientResults.length > 0;

  // ------------------------------------------------------------------
  // Payment history with this recipient (only visible via my own from-side rows)
  // ------------------------------------------------------------------
  const [history, setHistory] = useState<HistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [txResult, setTxResult] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!recipientMatch || !selectedFromId) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    const supabase = createClient();
    supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("from_account_id", selectedFromId)
      .eq("to_account_id", recipientMatch.id)
      .eq("status", "settled")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data ?? [];
        setHistory({
          count: rows.length,
          total: rows.reduce((sum, r) => sum + Number(r.amount), 0),
          last: rows[0]?.created_at ?? null,
        });
        setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipientMatch, selectedFromId, txResult]);

  // ------------------------------------------------------------------
  // Amount / memo / privacy layer
  // ------------------------------------------------------------------
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [privacyLayer, setPrivacyLayer] = useState<PrivacyLayer>("Confidential");

  const amountNum = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0;
  const insufficientBalance = !!selectedFromAccount && amountValid && amountNum > selectedFromAccount.balance;

  // ------------------------------------------------------------------
  // Run / pipeline state
  // ------------------------------------------------------------------
  const [status, setStatus] = useState<RunStatus>("idle");
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Payment review/confirm state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("none");
  const [paymentSecondsLeft, setPaymentSecondsLeft] = useState(300);
  const paymentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startPaymentTimer() {
    setPaymentSecondsLeft(300);
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    paymentTimerRef.current = setInterval(() => {
      setPaymentSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(paymentTimerRef.current!);
          setPaymentStatus("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    };
  }, []);

  const canSend =
    !loadingAccounts &&
    !!selectedFromId &&
    recipientInput.trim() !== "" &&
    amountValid &&
    !insufficientBalance &&
    status !== "running" &&
    paymentStatus === "none";

  function handleSend() {
    if (!canSend) return;
    setStatus("idle");
    setOutputLines([]);
    setTxResult(null);
    setErrorMessage(null);
    setPaymentStatus("preparing");
    setTimeout(() => {
      setPaymentStatus("pending");
      startPaymentTimer();
    }, 900);
  }

  function handleCancelPayment() {
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    setPaymentStatus("none");
    setPaymentSecondsLeft(300);
  }

  async function handleConfirmPayment() {
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    if (!selectedFromId) return;

    setPaymentStatus("verifying");
    setStatus("running");
    setOutputLines([]);

    const startedAt = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);

    const atmosphericLines = [
      `[mansafi] preparing ${privacyLayer.toLowerCase()} transfer...`,
      `[mansafi] resolving recipient "${recipientInput.trim()}"...`,
      `[client]    generating ElGamal ciphertext of amount`,
      `[client]    computing ZK range proof...`,
      `[client]    proof generated`,
      `[client]    encoding ConfidentialToken.transfer calldata`,
      `[robinhood] submitting transaction to sequencer`,
      `[robinhood] verifying ZK range proof on-chain...`,
    ];

    const animate = async () => {
      for (const line of atmosphericLines) {
        await sleep(170 + Math.random() * 150);
        setOutputLines((prev) => [...prev, line]);
      }
    };

    const supabase = createClient();
    const paymentPromise = supabase.rpc("send_payment", {
      p_from_account_id: selectedFromId,
      p_recipient: recipientInput.trim(),
      p_amount: amountNum,
      p_memo: memo.trim() || null,
      p_privacy_layer: privacyLayer,
    });

    const [, result] = await Promise.all([animate(), paymentPromise]);

    if (timerRef.current) clearInterval(timerRef.current);
    setPaymentStatus("none");
    setPaymentSecondsLeft(300);

    if (result.error) {
      setOutputLines((prev) => [...prev, "", `[mansafi] ERROR: ${result.error.message}`, `[mansafi] transfer not settled`]);
      setErrorMessage(result.error.message);
      setStatus("error");
      return;
    }

    const tx = result.data;
    setTxResult(tx);
    setOutputLines((prev) => [
      ...prev,
      `[robinhood] proof verified, transfer authorized`,
      `[robinhood] finalized in ${tx.finality_ms ?? "n/a"}ms`,
      `[recipient] balance updated`,
      "",
      `[mansafi] transaction hash: ${tx.tx_sig ?? "n/a"}`,
      `[mansafi] proof hash: ${tx.proof_hash ?? "n/a"}`,
      `[mansafi] settlement complete`,
    ]);
    setStatus("complete");
  }

  const paymentMins = String(Math.floor(paymentSecondsLeft / 60)).padStart(2, "0");
  const paymentSecs = String(paymentSecondsLeft % 60).padStart(2, "0");

  const statusColor = status === "complete" ? "rgb(64,186,128)" : status === "running" ? "rgb(240,180,60)" : status === "error" ? "rgb(240,80,80)" : "rgb(105,105,105)";
  const statusLabel = status === "complete" ? "Settled" : status === "running" ? "Sending" : status === "error" ? "Failed" : "Ready";

  const breadcrumbLabel = recipientMatch ? recipientMatch.name : recipientInput.trim() ? recipientInput.trim() : "Send Payment";

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px", fontSize: "13px", color: "rgb(105,105,105)" }}>
        <Link href="/app" style={{ color: "rgb(105,105,105)", textDecoration: "none" }} className="hover:text-[rgb(248,248,248)] transition-colors">
          Accounts
        </Link>
        <span>/</span>
        <span style={{ color: "rgb(248,248,248)" }}>{breadcrumbLabel}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "start" }}>
        {/* Left: send panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Recipient search / resolution */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px", padding: "20px", position: "relative",
          }}>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", display: "block", marginBottom: "8px" }}>
              Pay to
            </label>
            <input
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setTimeout(() => setInputFocused(false), 150)}
              placeholder="@handle or external domain"
              disabled={status === "running"}
              style={{
                width: "100%", backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "9px", padding: "10px 12px", fontSize: "13px",
                color: "rgb(248,248,248)", outline: "none", boxSizing: "border-box",
                opacity: status === "running" ? 0.5 : 1,
              }}
            />

            {showDropdown && (
              <div style={{
                position: "absolute", left: "20px", right: "20px", top: "76px", zIndex: 10,
                backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                {recipientResults.map((r) => (
                  <div
                    key={r.id}
                    onMouseDown={() => handleSelectRecipient(r)}
                    style={{
                      padding: "9px 12px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", color: "rgb(248,248,248)" }}>{r.name}</div>
                      <div style={{ fontSize: "11px", color: "rgb(105,105,105)", fontFamily: "var(--font-mono)" }}>@{r.handle}</div>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgb(105,105,105)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "14px" }}>
              {recipientSearching ? (
                <div style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>Searching...</div>
              ) : recipientMatch ? (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 510, color: "rgb(248,248,248)" }}>{recipientMatch.name}</span>
                      <VerifiedBadge />
                    </div>
                    <div style={{ fontSize: "11px", color: "rgb(105,105,105)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                      @{recipientMatch.handle}
                    </div>
                    <p style={{ fontSize: "12px", color: "rgb(140,140,140)", marginTop: "6px", lineHeight: "18px" }}>
                      {recipientMatch.description ?? "n/a"}
                    </p>
                  </div>
                </div>
              ) : recipientInput.trim() ? (
                <p style={{ fontSize: "12px", color: "rgb(140,140,140)", margin: 0, lineHeight: "18px" }}>
                  No MansaFi account found for &quot;{recipientInput.trim()}&quot;. This will be sent as an external transfer.
                </p>
              ) : (
                <p style={{ fontSize: "12px", color: "rgb(105,105,105)", margin: 0 }}>
                  Search for a MansaFi @handle, or type an external domain / label.
                </p>
              )}
            </div>
          </div>

          {/* From account picker */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px", padding: "20px",
          }}>
            <label style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", display: "block", marginBottom: "10px" }}>
              From account
            </label>
            {loadingAccounts ? (
              <div style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>Loading your accounts...</div>
            ) : myAccounts.length === 0 ? (
              <div style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>n/a, no active accounts found.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {myAccounts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => status !== "running" && setSelectedFromId(a.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: "9px", cursor: status === "running" ? "default" : "pointer",
                      backgroundColor: a.id === selectedFromId ? "rgba(248,248,248,0.08)" : "transparent",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: a.id === selectedFromId ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", color: "rgb(248,248,248)" }}>
                        {a.name}
                        {a.is_primary && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", color: "rgb(105,105,105)", marginLeft: "6px" }}>PRIMARY</span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgb(105,105,105)", fontFamily: "var(--font-mono)" }}>
                        @{a.handle} · {a.type}
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)" }}>{formatUsd(a.balance)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount / privacy / memo */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px",
          }}>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", display: "block", marginBottom: "8px" }}>
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={status === "running"}
                style={{
                  width: "100%", backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "9px", padding: "10px 12px", fontSize: "15px",
                  color: "rgb(248,248,248)", outline: "none", boxSizing: "border-box",
                  opacity: status === "running" ? 0.5 : 1,
                }}
              />
              {insufficientBalance && (
                <p style={{ fontSize: "11px", color: "rgb(240,80,80)", margin: "6px 0 0" }}>
                  Insufficient balance in this account.
                </p>
              )}
            </div>

            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", display: "block", marginBottom: "8px" }}>
                Privacy layer
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {PRIVACY_LAYERS.map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => status !== "running" && setPrivacyLayer(layer)}
                    disabled={status === "running"}
                    style={{
                      flex: 1, padding: "8px 10px", borderRadius: "9999px", fontSize: "12px",
                      cursor: status === "running" ? "default" : "pointer",
                      backgroundColor: privacyLayer === layer ? "rgba(248,248,248,0.08)" : "transparent",
                      color: privacyLayer === layer ? "var(--mansafi-accent)" : "rgb(140,140,140)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: privacyLayer === layer ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
                      fontWeight: privacyLayer === layer ? 510 : 400,
                      transition: "background 0.1s, color 0.1s",
                    }}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", display: "block", marginBottom: "8px" }}>
                Memo (optional)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="What's this payment for?"
                disabled={status === "running"}
                rows={3}
                style={{
                  width: "100%", backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "9px", padding: "10px 12px", fontSize: "13px",
                  color: "rgb(248,248,248)", outline: "none", resize: "vertical",
                  lineHeight: "20px", boxSizing: "border-box",
                  opacity: status === "running" ? 0.5 : 1,
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: statusColor }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: statusColor }}>{statusLabel}</span>
                {status === "running" && (
                  <span style={{ fontSize: "11px", color: "rgb(105,105,105)", fontFamily: "var(--font-mono)" }}>
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  backgroundColor: "var(--mansafi-accent)",
                  color: "#0A0A0A",
                  border: "none", borderRadius: "9999px", padding: "9px 22px",
                  fontSize: "13px", fontWeight: 600, cursor: canSend ? "pointer" : "not-allowed",
                  opacity: canSend ? 1 : 0.4,
                  boxShadow: canSend ? "0 0 16px rgba(248,248,248,0.25)" : "none",
                  transition: "all 0.15s", display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                {status === "running" ? "Sending..." : paymentStatus === "preparing" ? (
                  <>
                    <span style={{
                      width: "12px", height: "12px", borderRadius: "50%",
                      border: "2px solid rgba(16,19,20,0.25)",
                      borderTopColor: "#0A0A0A",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Preparing...
                  </>
                ) : "Send payment  →"}
              </button>
            </div>
          </div>

          {/* Payment review / confirm card */}
          {(paymentStatus === "pending" || paymentStatus === "verifying" || paymentStatus === "expired") && (
            <div style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
              border: `1px solid ${paymentStatus === "expired" ? "rgba(240,80,80,0.3)" : paymentStatus === "verifying" ? "rgba(64,186,128,0.3)" : "rgba(240,180,60,0.3)"}`,
              borderRadius: "14px", overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              animation: "paymentSlideIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
            }}>
            <style>{`
              @keyframes paymentSlideIn {
                from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                to   { opacity: 1; transform: translateY(0)    scale(1); }
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
              {/* Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${paymentStatus === "expired" ? "rgba(240,80,80,0.15)" : paymentStatus === "verifying" ? "rgba(64,186,128,0.15)" : "rgba(240,180,60,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {paymentStatus === "verifying" ? (
                    <span style={{
                      width: "10px", height: "10px", borderRadius: "50%",
                      border: "2px solid rgba(64,186,128,0.3)",
                      borderTopColor: "rgb(64,186,128)",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                      flexShrink: 0,
                    }} />
                  ) : (
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      backgroundColor: paymentStatus === "expired" ? "rgb(240,80,80)" : "rgb(240,180,60)",
                      boxShadow: paymentStatus === "expired" ? undefined : "0 0 6px rgba(240,180,60,0.6)",
                    }} />
                  )}
                  <span style={{ fontSize: "13px", fontWeight: 510, color: "rgb(248,248,248)" }}>
                    {paymentStatus === "expired" ? "Review expired" : paymentStatus === "verifying" ? "Submitting transfer..." : "Review confidential transfer"}
                  </span>
                </div>
                {paymentStatus === "pending" && (
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600,
                    color: paymentSecondsLeft < 60 ? "rgb(240,80,80)" : "rgb(240,180,60)",
                  }}>
                    {paymentMins}:{paymentSecs}
                  </div>
                )}
              </div>

              {paymentStatus === "verifying" ? (
                <div style={{ padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    border: "3px solid rgba(64,186,128,0.2)",
                    borderTopColor: "rgb(64,186,128)",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 510, color: "rgb(248,248,248)", marginBottom: "4px" }}>Verifying ZK range proof and settling transfer</div>
                    <div style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>This usually takes a moment...</div>
                  </div>
                </div>
              ) : paymentStatus === "expired" ? (
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                  <p style={{ fontSize: "13px", color: "rgb(140,140,140)", margin: 0, textAlign: "center" }}>
                    This review window has closed. Start a new payment to try again.
                  </p>
                  <button
                    onClick={handleCancelPayment}
                    style={{
                      backgroundColor: "transparent", color: "rgb(248,248,248)",
                      border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px",
                      padding: "8px 20px", fontSize: "13px", cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Amount */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>Amount</span>
                    <span style={{ fontSize: "20px", fontWeight: 510, color: "rgb(248,248,248)" }}>
                      {formatUsd(amountNum)} <span style={{ fontSize: "12px", color: "rgb(105,105,105)", fontWeight: 400 }}>USDG</span>
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{
                    backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px", padding: "4px 14px",
                  }}>
                    {[
                      { label: "From", value: selectedFromAccount ? `@${selectedFromAccount.handle}` : "n/a" },
                      { label: "To", value: recipientMatch ? `@${recipientMatch.handle}` : recipientInput.trim() || "n/a" },
                      { label: "Memo", value: memo.trim() || "n/a" },
                      { label: "Privacy layer", value: privacyLayer },
                    ].map((row) => (
                      <div key={row.label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>{row.label}</span>
                        <span style={{ fontSize: "12px", color: "rgb(248,248,248)", fontFamily: row.label === "From" || row.label === "To" ? "var(--font-mono)" : undefined }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notice */}
                  <p style={{ fontSize: "11px", color: "rgb(105,105,105)", margin: 0, lineHeight: "17px" }}>
                    Confirming submits a <strong style={{ color: "rgb(248,248,248)" }}>{formatUsd(amountNum)} USDG</strong> {privacyLayer.toLowerCase()} transfer. This action is final once settled.
                  </p>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleConfirmPayment}
                      style={{
                        flex: 1, backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
                        border: "none", borderRadius: "9999px", padding: "10px",
                        fontSize: "13px", fontWeight: 600, cursor: "pointer",
                        boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                      }}
                    >
                      Confirm &amp; send →
                    </button>
                    <button
                      onClick={handleCancelPayment}
                      style={{
                        backgroundColor: "transparent", color: "rgb(140,140,140)",
                        border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "10px 18px",
                        fontSize: "13px", cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Output terminal */}
          {(outputLines.length > 0 || status !== "idle") && (
            <div style={{
              backgroundColor: "#101010", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", overflow: "hidden",
            }}>
              {/* Terminal header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgb(255,95,87)" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgb(254,188,46)" }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgb(40,200,64)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginLeft: "4px" }}>
                    Pipeline · {txResult ? txResult.id.slice(0, 8) : "…"}
                  </span>
                </div>
                {status === "complete" && (
                  <span style={{ fontSize: "10px", color: "rgb(64,186,128)", fontFamily: "var(--font-mono)" }}>
                    {(elapsedMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
              {/* Output body */}
              <div
                ref={outputRef}
                style={{
                  padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "11px",
                  lineHeight: "19px", maxHeight: "360px", overflowY: "auto",
                  display: "flex", flexDirection: "column", gap: "1px",
                }}
              >
                {outputLines.map((line, i) => {
                  const l = line ?? "";
                  return <div key={i} style={{
                    color: l.startsWith("[mansafi] ERROR") ? "rgb(240,80,80)"
                      : l.startsWith("[mansafi]") ? "rgb(153,120,255)"
                      : l.startsWith("[robinhood]") ? "rgb(100,150,240)"
                      : l.startsWith("[recipient]") ? "rgb(64,186,128)"
                      : l.startsWith("[client]") ? "rgb(140,140,140)"
                      : l.includes("complete") || l.includes("committed") ? "rgb(64,186,128)"
                      : "rgb(140,140,140)",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {line || " "}
                  </div>;
                })}
                {status === "running" && (
                  <div style={{ color: "rgb(248,248,248)" }}>▋</div>
                )}
              </div>

              {/* Error message */}
              {status === "error" && errorMessage && (
                <div style={{
                  borderTop: "1px solid rgba(240,80,80,0.15)", padding: "12px 16px",
                  fontSize: "12px", color: "rgb(240,80,80)",
                }}>
                  {errorMessage}
                </div>
              )}

              {/* On-chain receipt */}
              {status === "complete" && txResult && (
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "2px" }}>Transaction hash</div>
                    <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "rgb(140,140,140)" }}>
                      {(txResult.tx_sig ?? "n/a").slice(0, 48)}
                    </div>
                  </div>
                  <Link href="/app/executions" style={{ textDecoration: "none", flexShrink: 0 }}>
                    <span style={{
                      fontSize: "11px", color: "rgb(64,186,128)",
                      backgroundColor: "rgba(64,186,128,0.08)", border: "1px solid rgba(64,186,128,0.2)",
                      borderRadius: "9999px", padding: "4px 12px", cursor: "pointer",
                    }}>
                      View receipt
                    </span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: recipient meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Recipient details */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: "rgb(105,105,105)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Recipient details
            </div>
            {recipientMatch ? (
              [
                { label: "Account type", value: recipientMatch.type === "agent" ? "Agent account" : "Human account" },
                { label: "Privacy tier", value: recipientMatch.privacy_tier.charAt(0).toUpperCase() + recipientMatch.privacy_tier.slice(1) },
                { label: "Member since", value: formatDate(recipientMatch.created_at) },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>{s.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "rgb(248,248,248)" }}>{s.value}</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: "12px", color: "rgb(105,105,105)", margin: 0, lineHeight: "18px" }}>
                {recipientInput.trim()
                  ? "Not a registered MansaFi handle. Routed as an external transfer."
                  : "Search for a recipient to see account details."}
              </p>
            )}
          </div>

          {/* Payment history with this recipient */}
          {recipientMatch && (
            <div style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: "rgb(105,105,105)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Your history with this recipient
              </div>
              {historyLoading ? (
                <span style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>…</span>
              ) : (
                [
                  { label: "Payments sent", value: history ? history.count.toLocaleString() : "n/a" },
                  { label: "Total sent", value: history ? formatUsd(history.total) : "n/a" },
                  { label: "Last payment", value: history ? formatDate(history.last) : "n/a" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>{s.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "rgb(248,248,248)" }}>{s.value}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Fee breakdown */}
          <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "16px",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, color: "rgb(105,105,105)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>
              Fee breakdown
            </div>
            {[
              { label: "Payment amount", value: amountValid ? formatUsd(amountNum) : "n/a" },
              { label: "Network fee", value: amountValid ? formatUsd(0) : "n/a" },
              { label: "Recipient receives", value: amountValid ? formatUsd(amountNum) : "n/a", highlight: true },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "5px 0",
                borderTop: row.label === "Recipient receives" ? "1px solid rgba(255,255,255,0.06)" : undefined,
                marginTop: row.label === "Recipient receives" ? "4px" : undefined,
                paddingTop: row.label === "Recipient receives" ? "9px" : undefined,
              }}>
                <span style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>{row.label}</span>
                <span style={{ fontSize: "12px", fontWeight: row.highlight ? 510 : 400, color: row.highlight ? "rgb(248,248,248)" : "rgb(140,140,140)" }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div style={{ fontSize: "10px", color: "rgb(60,65,75)", marginTop: "10px", lineHeight: "15px" }}>
              MansaFi does not charge a network fee on transfers.
            </div>
          </div>

          {/* Browse more */}
          <Link href="/app" style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "9999px", padding: "10px 16px", textAlign: "center",
              fontSize: "13px", color: "rgb(140,140,140)", cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}>
              Browse all accounts
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RunPage() {
  return (
    <Suspense>
      <RunPageInner />
    </Suspense>
  );
}
