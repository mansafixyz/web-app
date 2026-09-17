"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database as RawDatabase, Account, SpendPolicy, AccountType, PrivacyTier, AccountStatus } from "@/lib/supabase/database.types";
import { ListAgentDrawer, ListAgentDrawerShell } from "@/components/ListAgentDrawer";

const ACCOUNT_TYPES: ("All" | "Human" | "Agent")[] = ["All", "Human", "Agent"];

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

type AccountRow = Account & { spend_policies: SpendPolicy | null };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function displayHandle(account: AccountRow): string {
  return account.type === "human" ? `@${account.handle}.mansafi` : `${account.handle}.mansafi`;
}

function slugifyHandle(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "account";
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 1.5l11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M1 7s2.5-4.5 6-4.5c1.1 0 2.1.28 2.98.74M13 7s-1 1.8-2.8 3.1M4.2 4.2C2.3 5.2 1 7 1 7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function privacyTierColor(tier: PrivacyTier) {
  if (tier === "confidential") return { color: "rgb(153,120,255)", bg: "rgba(153,120,255,0.12)", border: "rgba(153,120,255,0.2)" };
  if (tier === "shielded") return { color: "rgb(100,150,240)", bg: "rgba(100,150,240,0.1)", border: "rgba(100,150,240,0.2)" };
  return { color: "rgb(228,200,60)", bg: "rgba(228,200,60,0.1)", border: "rgba(228,200,60,0.2)" };
}

function statusColor(status: AccountStatus) {
  if (status === "active") return "rgb(64,186,128)";
  if (status === "paused") return "rgb(240,180,60)";
  return "rgb(240,80,80)";
}

const microLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.14em",
  textTransform: "uppercase", color: "rgb(105,105,105)",
};

function AccountCard({ account }: { account: AccountRow }) {
  const [revealed, setRevealed] = useState(false);
  const tierStyle = privacyTierColor(account.privacy_tier);
  const policy = account.spend_policies;
  const isRevoked = account.status === "revoked";
  const typeColor = account.type === "agent" ? "rgb(153,120,255)" : "rgb(90,160,255)";
  const typeBg = account.type === "agent" ? "rgba(153,120,255,0.12)" : "rgba(90,160,255,0.12)";
  const typeBorder = account.type === "agent" ? "rgba(153,120,255,0.25)" : "rgba(90,160,255,0.25)";

  return (
    <div className="fx-glass-card" style={{
      position: "relative", overflow: "hidden",
      borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px",
      minHeight: "272px", opacity: isRevoked ? 0.6 : 1,
    }}>
      {/* Privacy-tier hairline */}
      <div aria-hidden="true" style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${tierStyle.color}, transparent 70%)`, opacity: 0.7,
      }} />

      {/* Identity row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 600,
          color: account.is_primary ? "#0A0A0A" : typeColor,
          background: account.is_primary ? "var(--mansafi-accent)" : typeBg,
          border: account.is_primary ? "none" : `1px solid ${typeBorder}`,
          boxShadow: account.is_primary ? "0 0 14px rgba(248,248,248,0.25)" : "none",
        }}>
          {account.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
            <span style={{ fontSize: "14px", fontWeight: 510, color: "rgb(248,248,248)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {account.name}
            </span>
            {account.is_primary && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "8px", fontWeight: 600, color: "var(--mansafi-accent)",
                backgroundColor: "rgba(248,248,248,0.08)", border: "1px solid rgba(248,248,248,0.25)",
                borderRadius: "4px", padding: "1px 5px", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0,
              }}>Primary</span>
            )}
          </div>
          <div style={{ fontSize: "10.5px", color: "rgb(105,105,105)", fontFamily: "var(--font-mono)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayHandle(account)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "9999px",
            backgroundColor: statusColor(account.status),
            boxShadow: `0 0 8px ${statusColor(account.status)}`,
          }} />
          <span style={{ ...microLabelStyle, fontSize: "8px" }}>{account.type}</span>
        </div>
      </div>

      {/* Encrypted balance panel */}
      <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={microLabelStyle}>Balance</span>
          <button
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide balance" : "Reveal balance"}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex",
              color: revealed ? "var(--mansafi-accent)" : "rgb(105,105,105)",
            }}
          >
            <EyeIcon open={revealed} />
          </button>
        </div>
        <div style={{
          fontSize: "20px", fontWeight: 510, color: "rgb(248,248,248)",
          fontFamily: "var(--font-mono)", letterSpacing: revealed ? "0" : "2px",
          marginTop: "4px", lineHeight: 1.2,
        }}>
          {revealed ? formatUsd(account.balance) : "•••••"}
        </div>
        <div style={{ ...microLabelStyle, fontSize: "8px", marginTop: "4px" }}>
          USDG · {revealed ? "decrypted client side" : "visible with your view key only"}
        </div>
      </div>

      {/* Body: agent spend-policy readout, or description for human accounts */}
      {account.type === "agent" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            <div>
              <div style={{ ...microLabelStyle, fontSize: "8px", marginBottom: "2px" }}>Per request</div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "rgb(248,248,248)" }}>
                {policy ? formatUsd(policy.max_per_request) : "n/a"}
              </div>
            </div>
            <div>
              <div style={{ ...microLabelStyle, fontSize: "8px", marginBottom: "2px" }}>Daily limit</div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "rgb(248,248,248)" }}>
                {policy ? formatUsd(policy.max_per_day) : "n/a"}
              </div>
            </div>
            <div>
              <div style={{ ...microLabelStyle, fontSize: "8px", marginBottom: "2px" }}>Domains</div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "rgb(248,248,248)" }}>
                {policy && policy.allowed_domains.length > 0 ? policy.allowed_domains.length : "any"}
              </div>
            </div>
          </div>
          <span style={{
            alignSelf: "flex-start",
            fontFamily: "var(--font-mono)", fontSize: "8px", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--mansafi-accent)", backgroundColor: "rgba(248,248,248,0.07)",
            border: "1px solid rgba(248,248,248,0.2)", borderRadius: "4px", padding: "2px 6px",
          }}>
            Enforced on-chain
          </span>
        </div>
      ) : (
        <p style={{
          fontSize: "12.5px", color: "rgb(140,140,140)", lineHeight: "19px", margin: 0, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {account.description ?? "n/a"}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "8px", fontWeight: 600, color: tierStyle.color,
          backgroundColor: tierStyle.bg, border: `1px solid ${tierStyle.border}`,
          borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {capitalize(account.privacy_tier)}
        </span>
        {isRevoked ? (
          <span style={{ ...microLabelStyle, color: "rgb(240,80,80)" }}>Revoked</span>
        ) : (
          <Link href={`/app/run?to=${account.handle}`} style={{ textDecoration: "none" }}>
            <button style={{
              backgroundColor: "transparent", color: "rgb(248,248,248)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px",
              padding: "6px 14px", fontSize: "12px", fontWeight: 510, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "6px",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              Send payment
              <span aria-hidden="true">→</span>
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create human sub-account modal
// ---------------------------------------------------------------------------

function CreateHumanAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [privacyTier, setPrivacyTier] = useState<PrivacyTier>("confidential");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setErrorMsg("Not authenticated");
      return;
    }

    const base = slugifyHandle(name);
    let attempt = 0;
    let lastError: string | null = null;

    while (attempt < 5) {
      const handle = attempt === 0 ? base : `${base.slice(0, 36)}-${attempt}`;
      const { error } = await supabase.from("accounts").insert({
        owner_id: user.id,
        type: "human",
        name: name.trim(),
        handle,
        privacy_tier: privacyTier,
      });

      if (!error) {
        onCreated();
        onClose();
        return;
      }

      if (error.code === "23505") {
        lastError = error.message;
        attempt += 1;
        continue;
      }

      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("error");
    setErrorMsg(lastError ?? "Could not generate a unique handle, try a different name.");
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
    fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.14em",
    textTransform: "uppercase", color: "rgb(105,105,105)", display: "block", marginBottom: "6px",
  };
  const submitting = status === "submitting";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 201,
        width: "400px", backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: "15px", fontWeight: 510, color: "rgb(248,248,248)" }}>Create human account</div>
          <div style={{ fontSize: "12px", color: "rgb(105,105,105)", marginTop: "2px" }}>
            A secondary account under your name, for example a savings or treasury account. Starts at a zero balance.
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
          {status === "error" && (
            <div style={{ padding: "10px 14px", backgroundColor: "rgba(240,80,80,0.08)", border: "1px solid rgba(240,80,80,0.2)", borderRadius: "8px", fontSize: "13px", color: "rgb(240,100,100)" }}>
              {errorMsg}
            </div>
          )}
          <div>
            <label style={labelStyle}>Account name <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Treasury" disabled={submitting} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Privacy tier</label>
            <select value={privacyTier} onChange={(e) => setPrivacyTier(e.target.value as PrivacyTier)}
              disabled={submitting} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="confidential">Confidential</option>
              <option value="shielded">Shielded</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{
              flex: 1, backgroundColor: "transparent", color: "rgb(140,140,140)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "11px 16px",
              fontSize: "13px", fontWeight: 510, cursor: submitting ? "not-allowed" : "pointer",
            }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{
              flex: 1, backgroundColor: submitting ? "rgba(248,248,248,0.4)" : "var(--mansafi-accent)",
              color: submitting ? "rgba(16,19,20,0.6)" : "#0A0A0A",
              border: "none", borderRadius: "9999px", padding: "11px 16px",
              fontSize: "13px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "0 0 16px rgba(248,248,248,0.25)",
            }}>
              {submitting ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccountsPage() {
  const [activeType, setActiveType] = useState<"All" | "Human" | "Agent">("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [humanModalOpen, setHumanModalOpen] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const supabase = db();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("accounts")
      .select("*, spend_policies(*)")
      .eq("owner_id", user.id)
      .order("created_at");

    if (error) {
      setLoadError(error.message);
      setAccounts([]);
      setLoading(false);
      return;
    }

    setAccounts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const typeFilterValue: AccountType | null = activeType === "Human" ? "human" : activeType === "Agent" ? "agent" : null;

  const filtered = accounts
    .filter((a) => typeFilterValue === null || a.type === typeFilterValue)
    .filter((a) =>
      search === "" ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.handle.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "balance-desc") return b.balance - a.balance;
      if (sortBy === "balance-asc") return a.balance - b.balance;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // "recent": preserve the created_at ascending order from the query, newest last -> reverse for newest first
      return 0;
    });

  if (sortBy === "recent") filtered.reverse();

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
            Accounts
          </h1>
          <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
            {loading ? "Loading accounts…" : `${filtered.length} account${filtered.length !== 1 ? "s" : ""} · balances confidential by default, settled on Robinhood Chain.`}
          </p>
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setCreateMenuOpen((v) => !v)}
            style={{
              backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
              border: "none", borderRadius: "9999px", padding: "9px 18px",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 0 16px rgba(248,248,248,0.25)",
            }}
          >
            + Create account
          </button>
          {createMenuOpen && (
            <>
              <div onClick={() => setCreateMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 91,
                backgroundColor: "#141414", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", overflow: "hidden", width: "190px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                <button
                  onClick={() => { setCreateMenuOpen(false); setAgentDrawerOpen(true); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "13px", color: "rgb(248,248,248)",
                  }}
                >
                  Agent account
                </button>
                <button
                  onClick={() => { setCreateMenuOpen(false); setHumanModalOpen(true); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                    background: "none", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
                    fontSize: "13px", color: "rgb(248,248,248)",
                  }}
                >
                  Human account
                </button>
              </div>
            </>
          )}
        </div>
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

      {/* Search + sort */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: "8px",
          backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "9px", padding: "0 12px", height: "38px",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: "rgb(105,105,105)" }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search accounts, handles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "rgb(248,248,248)" }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "9px", padding: "0 12px", height: "38px",
            fontSize: "13px", color: "rgb(140,140,140)", outline: "none", cursor: "pointer",
          }}
        >
          <option value="recent">Most recent</option>
          <option value="balance-desc">Balance: high to low</option>
          <option value="balance-asc">Balance: low to high</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Account type pills */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "28px" }}>
        {ACCOUNT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            style={{
              padding: "5px 12px", borderRadius: "9999px", fontSize: "12px",
              cursor: "pointer", border: "1px solid",
              fontWeight: activeType === type ? 500 : 400,
              backgroundColor: activeType === type ? "rgba(248,248,248,0.08)" : "transparent",
              borderColor: activeType === type ? "transparent" : "rgba(255,255,255,0.1)",
              boxShadow: activeType === type ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
              color: activeType === type ? "var(--mansafi-accent)" : "rgb(140,140,140)",
              transition: "all 0.1s",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Account grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px", padding: "18px", height: "220px",
              opacity: 0.4, animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
          {filtered.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", padding: "48px 0", textAlign: "center", color: "rgb(105,105,105)", fontSize: "14px" }}>
              {accounts.length === 0 ? "No accounts yet." : `No accounts found${search ? ` for "${search}"` : ""}.`}
            </div>
          )}
        </div>
      )}

      {agentDrawerOpen && (
        <ListAgentDrawerShell onClose={() => setAgentDrawerOpen(false)}>
          <ListAgentDrawer onClose={() => { setAgentDrawerOpen(false); fetchAccounts(); }} />
        </ListAgentDrawerShell>
      )}

      {humanModalOpen && (
        <CreateHumanAccountModal onClose={() => setHumanModalOpen(false)} onCreated={fetchAccounts} />
      )}
    </div>
  );
}
