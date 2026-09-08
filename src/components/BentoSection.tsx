import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";

/* ── Micro-visuals: small, monochrome, CSS/SVG only ─────────────────────── */

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgb(105,105,105)",
};

function MaskedTransferVisual() {
  const rows = [
    { who: "Observers see", value: "▮▮▮▮▮▮", dim: true },
    { who: "You see", value: "$1,240.50", dim: false },
    { who: "Auditor with view key", value: "$1,240.50", dim: false },
  ];
  return (
    <div className="fx-tile-visual" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rows.map((r) => (
        <div
          key={r.who}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <span style={mono}>{r.who}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              letterSpacing: r.dim ? "2px" : "0",
              color: r.dim ? "rgba(248,248,248,0.25)" : "rgb(248,248,248)",
            }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SpendPolicyVisual() {
  const bars = [
    { label: "Daily limit", used: 12.4, max: 50 },
    { label: "Per request", used: 0.25, max: 5 },
    { label: "Allowed domains", used: 2, max: 2, text: "2 of 2" },
  ];
  return (
    <div className="fx-tile-visual" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {bars.map((b) => {
        const pct = Math.min(100, (b.used / b.max) * 100);
        return (
          <div key={b.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={mono}>{b.label}</span>
              <span style={{ ...mono, color: "rgb(190,190,190)" }}>
                {b.text ?? `$${b.used.toFixed(2)} / $${b.max.toFixed(2)}`}
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: "9999px",
                  background: "linear-gradient(90deg, rgba(248,248,248,0.45), rgb(248,248,248))",
                }}
              />
            </div>
          </div>
        );
      })}
      <div style={{ ...mono, marginTop: "2px", color: "rgb(140,140,140)" }}>
        Enforced on-chain · overspend reverts at the protocol
      </div>
    </div>
  );
}

function CardVisual() {
  return (
    <div
      className="fx-tile-visual"
      style={{
        aspectRatio: "1.586",
        width: "100%",
        maxWidth: "260px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "linear-gradient(115deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.2)), radial-gradient(ellipse at 20% 0%, #232323, #161616 55%, #0E0E0E)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...mono, fontSize: "8px" }}>Debit · Virtual</span>
        <Image src="/images/logo.png" alt="MansaFi" width={28} height={28} style={{ display: "block", margin: "-5px -3px -8px 0" }} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          letterSpacing: "2px",
          color: "rgb(248,248,248)",
        }}
      >
        <span>••••</span>
        <span>••••</span>
        <span>••••</span>
        <span>1092</span>
      </div>
    </div>
  );
}

function X402Visual() {
  const lines = [
    { t: "GET api.marketfeed.io/v1/market-data", c: "rgb(190,190,190)" },
    { t: "← 402 Payment Required · 0.25 USDG", c: "rgb(140,140,140)" },
    { t: "policy ok · confidential transfer · 1 block", c: "rgb(140,140,140)" },
    { t: "→ retry with X-Payment · 200 OK", c: "rgb(248,248,248)" },
  ];
  return (
    <div
      className="fx-tile-visual"
      style={{
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.35)",
        padding: "12px 14px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        lineHeight: "20px",
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={{ color: l.c, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ color: "rgb(90,90,90)", marginRight: "10px" }}>{String(i + 1).padStart(2, "0")}</span>
          {l.t}
        </div>
      ))}
    </div>
  );
}

function ViewKeyVisual() {
  return (
    <div className="fx-tile-visual" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(248,248,248)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="12" r="4" />
          <path d="M12 12h9M18 12v3M15 12v2" />
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "13px", color: "rgb(248,248,248)", fontWeight: 500 }}>auditor.mansafi</div>
        <div style={{ ...mono, marginTop: "4px" }}>Q1 transfers · read-only · revocable</div>
      </div>
    </div>
  );
}

function SettlementVisual() {
  const blocks = [0.35, 0.5, 0.65, 0.8, 1];
  return (
    <div className="fx-tile-visual" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ display: "flex", gap: "5px", alignItems: "flex-end", height: "34px" }}>
        {blocks.map((o, i) => (
          <span
            key={i}
            style={{
              width: "10px",
              height: `${12 + i * 5}px`,
              borderRadius: "3px",
              background: `rgba(248,248,248,${o})`,
            }}
          />
        ))}
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "rgb(248,248,248)", lineHeight: 1 }}>100ms</div>
        <div style={{ ...mono, marginTop: "6px" }}>blocks · secured by Ethereum</div>
      </div>
    </div>
  );
}

/* ── Tiles ──────────────────────────────────────────────────────────────── */

type Tile = {
  title: string;
  body: string;
  href: string;
  visual: React.ReactNode;
  span: "lg" | "sm";
};

const TILES: Tile[] = [
  {
    title: "Confidential transfers",
    body: "Amounts are encrypted with ElGamal and proven correct with ZK range proofs. The chain verifies every transfer without ever learning the number.",
    href: "#privacy",
    visual: <MaskedTransferVisual />,
    span: "lg",
  },
  {
    title: "Agent accounts with on-chain spend policies",
    body: "Give every agent its own account, its own limits, and no way to exceed them. Policy checks run before a transaction is ever signed.",
    href: "#agents",
    visual: <SpendPolicyVisual />,
    span: "lg",
  },
  {
    title: "Virtual cards",
    body: "Spend from your private balance anywhere. Freeze, rotate, and reveal details only when you need them.",
    href: "#accounts",
    visual: <CardVisual />,
    span: "sm",
  },
  {
    title: "Native x402 payments",
    body: "Agents pay for APIs per request, with no human in the loop and every payment logged.",
    href: "#agents",
    visual: <X402Visual />,
    span: "sm",
  },
  {
    title: "View keys",
    body: "Disclose exactly what an auditor needs and nothing more. Read-only, scoped, revocable.",
    href: "#transparency",
    visual: <ViewKeyVisual />,
    span: "sm",
  },
  {
    title: "Settled on Robinhood Chain",
    body: "Next-block finality at a fraction of a cent, anchored to Ethereum.",
    href: "#protocol",
    visual: <SettlementVisual />,
    span: "sm",
  },
];

export function BentoSection() {
  return (
    <section id="features" style={{ backgroundColor: "#0A0A0A", position: "relative" }}>
      <div className="fx-divider" />
      <div style={{ maxWidth: "1392px", margin: "0 auto", padding: "clamp(72px, 10vw, 128px) clamp(20px, 6vw, 96px) 0" }}>
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between" style={{ gap: "24px", marginBottom: "48px" }}>
            <div>
              <div className="fx-overline" style={{ marginBottom: "18px" }}>02 / Capabilities</div>
              <h2 className="fx-h2">
                Everything a private bank needs.
                <br />
                <span className="fx-accent-text">Nothing it shouldn&apos;t see.</span>
              </h2>
            </div>
            <p style={{ fontSize: "16px", lineHeight: "26px", color: "rgb(140,140,140)", maxWidth: "440px", margin: 0 }}>
              One protocol for people and their agents. Every capability below is enforced by the chain, not by a
              policy document.
            </p>
          </div>
        </Reveal>

        <div className="fx-bento">
          {TILES.map((tile, i) => (
            <Reveal key={tile.title} className={tile.span === "lg" ? "fx-bento-lg" : "fx-bento-sm"} delay={(i % 3) * 80}>
              <Link href={tile.href} className="fx-tile" style={{ textDecoration: "none" }}>
                <div className="fx-tile-inner">
                  <div style={{ flex: 1 }}>{tile.visual}</div>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 510, color: "rgb(248,248,248)", margin: 0, letterSpacing: "-0.2px" }}>
                      {tile.title}
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: "22px", color: "rgb(140,140,140)", margin: "8px 0 0" }}>{tile.body}</p>
                  </div>
                </div>
                <span className="fx-tile-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
