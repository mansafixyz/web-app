import Image from "next/image";
import type { VirtualCard } from "@/lib/supabase/database.types";

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

/* ── Virtual card visual ──────────────────────────────────────────────────────
   A pure HTML/CSS recreation of the brand card (see /images/card.png for the
   reference art direction): brushed black metal, ghost mark
   top right, metallic chip on the left. Fixed pixel sizing, tuned for the
   300-430px card widths the grid produces. */

function BrushedChip() {
  return (
    <svg viewBox="0 0 34 26" aria-hidden="true" style={{ width: "48px", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="chipMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EFEAD9" />
          <stop offset="0.35" stopColor="#C9C0AA" />
          <stop offset="0.6" stopColor="#A79D86" />
          <stop offset="1" stopColor="#E3DCC8" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="33" height="25" rx="4.5" fill="url(#chipMetal)" stroke="rgba(0,0,0,0.45)" />
      <path
        d="M12 0.5v7a3.5 3.5 0 0 1-3.5 3.5H0.5M22 0.5v7a3.5 3.5 0 0 0 3.5 3.5h7.5M12 25.5v-6a3.5 3.5 0 0 0-3.5-3.5H0.5M22 25.5v-6a3.5 3.5 0 0 1 3.5-3.5h7.5M12 11.5h10M12 15.5h10"
        stroke="rgba(60,52,38,0.55)"
        strokeWidth="0.9"
        fill="none"
      />
    </svg>
  );
}

export function VirtualCardVisual({
  card,
  revealed,
}: {
  card: VirtualCard;
  revealed: boolean;
}) {
  const frozen = card.status === "frozen";

  const overlayMicro: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(190,190,190,0.7)",
  };

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1.586",
        width: "100%",
        maxWidth: "430px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.09)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "18px 20px 20px",
        // Brushed black metal: base tone, fine horizontal brush lines, a
        // diagonal sheen, and a corner vignette.
        background: [
          "linear-gradient(115deg, rgba(255,255,255,0.07), rgba(255,255,255,0.015) 38%, rgba(0,0,0,0.12) 100%)",
          "repeating-linear-gradient(178deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0) 3px)",
          "radial-gradient(ellipse 120% 90% at 20% 0%, #232323 0%, #161616 55%, #0E0E0E 100%)",
        ].join(", "),
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 48px rgba(0,0,0,0.5), 0 -1px 0 rgba(248,248,248,0.15)",
        filter: frozen ? "grayscale(0.85)" : "none",
        opacity: frozen ? 0.7 : 1,
        transition: "filter 0.2s, opacity 0.2s",
      }}
    >
      {/* Top row: Debit · Virtual left, wordmark right (mirrors the brand card) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ ...overlayMicro, fontSize: "9px" }}>Debit · Virtual</span>
          {frozen && (
            <span
              style={{
                ...overlayMicro,
                fontSize: "8.5px",
                color: "rgb(120,165,245)",
                border: "1px solid rgba(100,150,240,0.4)",
                background: "rgba(100,150,240,0.12)",
                borderRadius: "4px",
                padding: "2px 6px",
              }}
            >
              Frozen
            </span>
          )}
        </div>
        <Image src="/images/logo.png" alt="MansaFi" width={48} height={48} style={{ display: "block", margin: "-8px -6px -12px 0" }} />
      </div>

      {/* Chip + contactless, centered in the free space between the header
          and the number so it can never collide with either */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
        <BrushedChip />
        <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ width: "17px", height: "auto" }}>
          <path d="M5 3.5C7.5 6.5 7.5 11.5 5 14.5M8.5 2C11.8 6 11.8 12 8.5 16M12 0.5c4 5 4 12 0 17" stroke="rgba(248,248,248,0.45)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>

      {/* Number: always masked to the last four digits, groups justified
          across the full card width */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: "18px",
          letterSpacing: "2px",
          color: "rgb(248,248,248)",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        }}
      >
        {["••••", "••••", "••••", card.card_number.slice(-4)].map((group, i) => (
          <span key={i}>{group}</span>
        ))}
      </div>

      {/* Bottom row: cardholder, expiry, cvv, network mark */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ ...overlayMicro, fontSize: "7.5px" }}>Cardholder</div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "rgb(248,248,248)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: "3px",
            }}
          >
            {card.cardholder_name}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ ...overlayMicro, fontSize: "7.5px" }}>Expires</div>
          <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "rgb(248,248,248)", marginTop: "3px" }}>
            {formatExpiry(card.expiry_month, card.expiry_year)}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ ...overlayMicro, fontSize: "7.5px" }}>CVV</div>
          <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "rgb(248,248,248)", marginTop: "3px" }}>
            {revealed ? card.cvv : "•••"}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {card.network === "mastercard" ? (
            <svg viewBox="0 0 38 24" aria-label="Mastercard" style={{ width: "36px", height: "auto" }}>
              <circle cx="14" cy="12" r="9" fill="#EB001B" />
              <circle cx="24" cy="12" r="9" fill="#F79E1B" fillOpacity="0.9" />
              <path d="M19 4.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8Z" fill="#F16522" />
            </svg>
          ) : (
            <span
              aria-label="Visa"
              style={{
                fontStyle: "italic",
                fontWeight: 800,
                fontSize: "16px",
                letterSpacing: "0.5px",
                color: "rgb(248,248,248)",
              }}
            >
              VISA
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
