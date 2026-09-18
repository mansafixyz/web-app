"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CardNetwork, VirtualCard } from "@/lib/supabase/database.types";
import { VirtualCardVisual } from "@/components/VirtualCardVisual";

/* ── Design tokens ────────────────────────────────────────────────────────── */

const micro: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "9px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgb(105,105,105)",
};

const panel: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#151515",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "9px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "rgb(248,248,248)",
  outline: "none",
};

/* ── Card number generation (Luhn-valid demo numbers, not issued) ─────────── */

function luhnCheckDigit(payload: number[]): number {
  const sum = payload
    .slice()
    .reverse()
    .reduce((acc, d, i) => {
      if (i % 2 === 0) {
        const doubled = d * 2;
        return acc + (doubled > 9 ? doubled - 9 : doubled);
      }
      return acc + d;
    }, 0);
  return (10 - (sum % 10)) % 10;
}

function generateCardNumber(network: CardNetwork): string {
  const digits: number[] =
    network === "visa" ? [4] : [5, 1 + Math.floor(Math.random() * 5)];
  while (digits.length < 15) digits.push(Math.floor(Math.random() * 10));
  digits.push(luhnCheckDigit(digits));
  return digits.join("");
}

function generateCvv(): string {
  return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
}


/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function CardsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [holderName, setHolderName] = useState("");
  const [network, setNetwork] = useState<CardNetwork>("visa");
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "error">("idle");
  const [createError, setCreateError] = useState("");

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  async function fetchCards() {
    setLoading(true);
    setLoadError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const [{ data: profile }, cardsRes] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("virtual_cards").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (cardsRes.error) {
      setLoadError(
        `Could not load cards: ${cardsRes.error.message}. If the table is missing, apply supabase/migrations/0002_virtual_cards.sql.`
      );
      setCards([]);
    } else {
      setCards((cardsRes.data as VirtualCard[]) ?? []);
    }

    setHolderName((prev) => prev || profile?.display_name || "");
    setLoading(false);
  }

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !holderName.trim()) return;
    setCreateStatus("creating");
    setCreateError("");

    const now = new Date();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("virtual_cards")
      .insert({
        profile_id: userId,
        cardholder_name: holderName.trim(),
        network,
        card_number: generateCardNumber(network),
        expiry_month: now.getMonth() + 1,
        expiry_year: now.getFullYear() + 4,
        cvv: generateCvv(),
      })
      .select()
      .single();

    if (error) {
      setCreateStatus("error");
      setCreateError(error.message);
      return;
    }

    setCards((prev) => [data as VirtualCard, ...prev]);
    setRevealedIds((prev) => new Set(prev).add((data as VirtualCard).id));
    setCreateStatus("idle");
  }

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleFreeze(card: VirtualCard) {
    const nextStatus = card.status === "frozen" ? "active" : "frozen";
    const supabase = createClient();
    const { error } = await supabase.from("virtual_cards").update({ status: nextStatus }).eq("id", card.id);
    if (!error) {
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c)));
    }
  }

  async function removeCard(card: VirtualCard) {
    if (!window.confirm(`Remove the ${card.network} card ending in ${card.card_number.slice(-4)}? This cannot be undone.`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("virtual_cards").delete().eq("id", card.id);
    if (!error) {
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    }
  }

  const ghostBtn: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    color: "rgb(248,248,248)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "9999px",
    padding: "5px 12px",
    fontSize: "11.5px",
    fontWeight: 510,
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px clamp(16px, 3vw, 28px) 48px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "17px", fontWeight: 510, color: "rgb(248,248,248)", letterSpacing: "-0.2px" }}>Cards</div>
        <div style={{ fontSize: "12px", color: "rgb(140,140,140)", marginTop: "4px" }}>
          Virtual debit cards backed by your primary account. Spend anywhere, reveal details only when you need them.
        </div>
      </div>

      {loadError && (
        <div style={{
          ...panel, borderColor: "rgba(240,80,80,0.35)", padding: "12px 16px", marginBottom: "16px",
          fontSize: "12px", color: "rgb(240,120,120)",
        }}>
          {loadError}
        </div>
      )}

      {/* Generate form */}
      <div style={{ ...panel, padding: "18px", marginBottom: "28px" }}>
        <div style={{ ...micro, marginBottom: "14px" }}>Generate a new card</div>
        <form onSubmit={handleGenerate} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 220px", minWidth: "200px" }}>
            <label style={{ ...micro, display: "block", marginBottom: "6px" }}>Cardholder name</label>
            <input
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Name as it appears on the card"
              maxLength={26}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ ...micro, marginBottom: "6px" }}>Network</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["visa", "mastercard"] as CardNetwork[]).map((n) => {
                const active = network === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNetwork(n)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 14px", borderRadius: "9px", cursor: "pointer",
                      fontSize: "12px", fontWeight: 510,
                      color: active ? "var(--mansafi-accent)" : "rgb(140,140,140)",
                      background: active ? "rgba(248,248,248,0.08)" : "#151515",
                      border: `1px solid ${active ? "rgba(248,248,248,0.25)" : "rgba(255,255,255,0.1)"}`,
                      boxShadow: active ? "inset 0 0 0 1px rgba(248,248,248,0.15)" : "none",
                    }}
                  >
                    {n === "visa" ? (
                      <span style={{ fontStyle: "italic", fontWeight: 800, fontSize: "12px" }}>VISA</span>
                    ) : (
                      <svg width="24" height="15" viewBox="0 0 38 24" aria-hidden="true">
                        <circle cx="14" cy="12" r="9" fill="#EB001B" />
                        <circle cx="24" cy="12" r="9" fill="#F79E1B" fillOpacity="0.9" />
                      </svg>
                    )}
                    {n === "visa" ? "Visa" : "Mastercard"}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={createStatus === "creating" || !holderName.trim()}
            style={{
              background: "var(--mansafi-accent)",
              color: "#0A0A0A",
              border: "none",
              borderRadius: "9999px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: createStatus === "creating" || !holderName.trim() ? "not-allowed" : "pointer",
              opacity: createStatus === "creating" || !holderName.trim() ? 0.4 : 1,
              boxShadow: "0 0 16px rgba(248,248,248,0.25)",
            }}
          >
            {createStatus === "creating" ? "Generating..." : "Generate card"}
          </button>
        </form>
        {createStatus === "error" && (
          <div style={{ fontSize: "12px", color: "rgb(240,80,80)", marginTop: "10px" }}>{createError}</div>
        )}
        <div style={{ ...micro, fontSize: "8px", marginTop: "12px", color: "rgb(80,85,95)" }}>
          Card numbers are generated instantly and can be frozen or removed at any time.
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ ...micro }}>Loading cards...</div>
      ) : cards.length === 0 && !loadError ? (
        <div style={{ ...panel, padding: "36px", textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "rgb(140,140,140)" }}>
            No cards yet. Generate your first virtual card above.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
          {cards.map((card) => (
            <div key={card.id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <VirtualCardVisual card={card} revealed={revealedIds.has(card.id)} />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button onClick={() => toggleReveal(card.id)} style={ghostBtn}>
                  {revealedIds.has(card.id) ? "Hide CVV" : "Reveal CVV"}
                </button>
                <button onClick={() => toggleFreeze(card)} style={ghostBtn}>
                  {card.status === "frozen" ? "Unfreeze" : "Freeze"}
                </button>
                <button
                  onClick={() => removeCard(card)}
                  style={{ ...ghostBtn, color: "rgb(240,80,80)", borderColor: "rgba(240,80,80,0.3)", marginLeft: "auto" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
