import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "$MANSA Token | MansaFi",
  description:
    "What $MANSA does: hold and stake the token to cut protocol fees on confidential transfers and agent payments, with staking counted at full weight and governance on the roadmap.",
};

const TOKEN_ADDRESS = "";

const micro: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgb(105,105,105)",
};

const UTILITIES = [
  {
    title: "Fee discounts",
    body:
      "The core utility. Protocol fees start at 0.10% per confidential transfer, capped at 5 USDG. The more $MANSA an account is tied to, the less it pays: up to 75% off, enforced by the fee controller on-chain.",
  },
  {
    title: "Staking",
    body:
      "Stake into the on-chain staking vault and every token counts at full weight toward your discount tier. Tokens merely held in your wallet still count, at half weight. Loyalty is measured by the chain, not by a points program.",
  },
  {
    title: "Agent fee coverage",
    body:
      "Your agents inherit your discount. When an agent account settles an x402 payment, the protocol prices its fee against the owning profile's $MANSA weight, so one treasury position lowers costs across your whole fleet.",
  },
  {
    title: "Governance and rebates",
    body:
      "On the roadmap: DAO-governed protocol parameters and fee rebates for long-term holders. The protocol's dials move outward, into the hands of the people and agents who use it.",
  },
];

const TIERS = [
  { tier: "Tier 1", weight: "1,000", discount: "10% off", fee: "0.090%" },
  { tier: "Tier 2", weight: "10,000", discount: "25% off", fee: "0.075%" },
  { tier: "Tier 3", weight: "100,000", discount: "50% off", fee: "0.050%" },
  { tier: "Tier 4", weight: "1,000,000", discount: "75% off", fee: "0.025%" },
];

export default function TokenPage() {
  return (
    <main style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 fx-grid-bg" />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 50% -5%, rgba(248,248,248,0.1), transparent 62%)",
          }}
        />
        <div
          style={{
            maxWidth: "1392px",
            margin: "0 auto",
            padding: "clamp(130px, 20vw, 190px) clamp(20px, 6vw, 96px) clamp(48px, 8vw, 72px)",
            position: "relative",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <span className="fx-chip">
              <span className="pulse-dot" style={{ width: "6px", height: "6px" }} />
              <span className="fx-overline">Live on Robinhood Chain</span>
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(34px, 6vw, 60px)",
              fontWeight: 510,
              lineHeight: "1.08",
              letterSpacing: "-1.2px",
              color: "rgb(248,248,248)",
              maxWidth: "860px",
            }}
          >
            <span className="fx-accent-text">$MANSA</span>. Loyalty that lowers the cost of privacy.
          </h1>
          <p
            style={{
              fontSize: "16px",
              lineHeight: "26px",
              color: "rgb(190,190,190)",
              maxWidth: "660px",
              marginTop: "24px",
            }}
          >
            One token, one job: the more of the protocol your accounts are tied to,
            the less the protocol charges you. Hold it, stake it, and watch every
            confidential transfer and every agent payment get cheaper, with the
            discount enforced on-chain rather than promised in a pricing page.
          </p>

          {/* Contract address */}
          <div style={{ marginTop: "28px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
            <span style={micro}>Token contract</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "rgb(190,190,190)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "9999px",
                padding: "6px 14px",
                wordBreak: "break-all",
              }}
            >
              {TOKEN_ADDRESS}
            </span>
          </div>
          <p style={{ ...micro, fontSize: "9px", marginTop: "10px" }}>
            Always verify the address against official MansaFi channels before interacting.
          </p>
        </div>
      </section>

      {/* Utility grid */}
      <section
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          padding: "0 clamp(20px, 6vw, 96px) clamp(56px, 8vw, 80px)",
        }}
      >
        <div className="fx-overline" style={{ marginBottom: "20px" }}>
          01 / What the token does
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "18px" }}>
          {UTILITIES.map((u) => (
            <div key={u.title} className="fx-glass-card" style={{ padding: "26px 28px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 510, color: "rgb(248,248,248)", letterSpacing: "-0.2px" }}>
                {u.title}
              </h2>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "rgb(140,140,140)", marginTop: "10px" }}>
                {u.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Discount tiers */}
      <section
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          padding: "0 clamp(20px, 6vw, 96px) clamp(72px, 10vw, 112px)",
        }}
      >
        <div className="fx-overline" style={{ marginBottom: "20px" }}>
          02 / Discount tiers
        </div>
        <div className="fx-glass-card" style={{ padding: "0", overflow: "hidden", maxWidth: "860px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
              <thead>
                <tr>
                  {["Tier", "$MANSA weight", "Discount", "Effective fee"].map((h) => (
                    <th
                      key={h}
                      style={{
                        ...micro,
                        textAlign: "left",
                        padding: "14px 20px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t, i) => (
                  <tr key={t.tier}>
                    <td style={{ padding: "13px 20px", fontSize: "13px", color: "rgb(248,248,248)", borderBottom: i < TIERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      {t.tier}
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: "13px", fontFamily: "var(--font-mono)", color: "rgb(190,190,190)", borderBottom: i < TIERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      {t.weight}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: i < TIERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--mansafi-accent)",
                          background: "rgba(248,248,248,0.08)",
                          border: "1px solid rgba(248,248,248,0.25)",
                          borderRadius: "9999px",
                          padding: "3px 10px",
                        }}
                      >
                        {t.discount}
                      </span>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: "13px", fontFamily: "var(--font-mono)", color: "rgb(190,190,190)", borderBottom: i < TIERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      {t.fee}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ maxWidth: "860px", marginTop: "22px" }}>
          <p style={{ fontSize: "14px", lineHeight: "22px", color: "rgb(140,140,140)" }}>
            Your tier is set by loyalty weight: staked $MANSA counts at 100%,
            held $MANSA counts at 50%. The base fee is 0.10% per confidential
            transfer, capped at 5 USDG, and every discount is applied automatically
            by the on-chain fee controller. Stake 10,000 $MANSA and every
            transfer you or your agents make is priced at 0.075% from the next
            block onward. No coupons, no sales calls, no fine print.
          </p>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "48px" }}>
          <Link href="/signup" className="fx-btn-primary">
            Open your account →
          </Link>
          <Link href="/roadmap" className="fx-btn-ghost">
            See the roadmap
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
