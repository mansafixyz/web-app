import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Roadmap | MansaFi",
  description:
    "Where MansaFi is headed: from confidential transfers and agent accounts live today to shielded state, multi-chain routing, full privacy, and DAO governance.",
};

type PhaseStatus = "live" | "next" | "planned";

const PHASES: {
  tag: string;
  status: PhaseStatus;
  title: string;
  description: string;
  items: string[];
}[] = [
  {
    tag: "Beta · Live now",
    status: "live",
    title: "The private core",
    description:
      "The foundation is on mainnet today: confidential money that humans and agents already use.",
    items: [
      "Confidential transfers with encrypted amounts and ZK range proofs",
      "Agent accounts with on-chain spend policies",
      "Native x402 payments and MPP routing",
      "Agent SDK and REST API with webhooks",
      "Virtual Visa and Mastercard debit cards",
      "$MANSA live on Robinhood Chain with staking fee discounts",
    ],
  },
  {
    tag: "v1.0 · Up next",
    status: "next",
    title: "Banking for everyone",
    description:
      "The bridge between the old rails and the new: money in, money out, privacy the whole way through.",
    items: [
      "Fiat on and off ramp",
      "Mobile app",
      "Layer 3 shielded state: Merkle-committed balances and stealth addresses",
    ],
  },
  {
    tag: "v1.5 · Planned",
    status: "planned",
    title: "Enterprise and interop",
    description:
      "The private financial layer grows beyond a single chain and into serious organizations.",
    items: [
      "Enterprise tier with bulk agent deployment",
      "Compliance API for view-key based disclosure at scale",
      "Multi-chain routing: Ethereum, Arbitrum One, Base",
    ],
  },
  {
    tag: "v2.0 · Planned",
    status: "planned",
    title: "Full privacy",
    description:
      "The endgame for confidentiality: entire account states shielded, with compliance still provable on demand.",
    items: [
      "Layer 4 full privacy for verified enterprise accounts",
      "Shielded pools with association sets",
      "DeFi yield integration on idle USDG balances",
    ],
  },
  {
    tag: "Future · Exploring",
    status: "planned",
    title: "Protocol, owned by its users",
    description:
      "Control of the protocol moves outward, to the people and agents who run on it.",
    items: [
      "DAO-governed protocol parameters",
      "Expanded $MANSA governance and fee rebates",
    ],
  },
];

function statusStyle(status: PhaseStatus): React.CSSProperties {
  if (status === "live") {
    return {
      color: "var(--mansafi-accent)",
      background: "rgba(248,248,248,0.08)",
      border: "1px solid rgba(248,248,248,0.25)",
    };
  }
  if (status === "next") {
    return {
      color: "rgb(248,248,248)",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.15)",
    };
  }
  return {
    color: "rgb(140,140,140)",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
}

export default function RoadmapPage() {
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
              "radial-gradient(ellipse 55% 40% at 50% -5%, rgba(248,248,248,0.08), transparent 62%)",
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
          <div className="fx-overline" style={{ marginBottom: "20px" }}>
            The path ahead
          </div>
          <h1
            style={{
              fontSize: "clamp(34px, 6vw, 60px)",
              fontWeight: 510,
              lineHeight: "1.08",
              letterSpacing: "-1.2px",
              color: "rgb(248,248,248)",
              maxWidth: "820px",
            }}
          >
            Building the financial layer of the <span className="fx-accent-text">agent economy</span>.
          </h1>
          <p
            style={{
              fontSize: "16px",
              lineHeight: "26px",
              color: "rgb(190,190,190)",
              maxWidth: "640px",
              marginTop: "24px",
            }}
          >
            Privacy shipped first. Everything that follows widens who can use it:
            from crypto-native builders today to every human and every agent with
            money to move. Here is where MansaFi goes next.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          padding: "0 clamp(20px, 6vw, 96px) clamp(72px, 10vw, 112px)",
        }}
      >
        <div style={{ position: "relative", maxWidth: "860px" }}>
          {/* Rail */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "11px",
              top: "8px",
              bottom: "8px",
              width: "1px",
              background:
                "linear-gradient(180deg, rgba(248,248,248,0.5), rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.06))",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {PHASES.map((phase) => (
              <div key={phase.tag} style={{ position: "relative", paddingLeft: "48px" }}>
                {/* Node */}
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "7px",
                    top: "26px",
                    width: "9px",
                    height: "9px",
                    borderRadius: "9999px",
                    backgroundColor:
                      phase.status === "live" ? "var(--mansafi-accent)" : phase.status === "next" ? "rgb(248,248,248)" : "rgb(105,105,105)",
                    boxShadow:
                      phase.status === "live" ? "0 0 14px rgba(248,248,248,0.6)" : "none",
                  }}
                />

                <div className="fx-glass-card" style={{ padding: "24px 26px" }}>
                  <span
                    style={{
                      ...statusStyle(phase.status),
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      borderRadius: "9999px",
                      padding: "4px 12px",
                      display: "inline-block",
                    }}
                  >
                    {phase.tag}
                  </span>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 510,
                      color: "rgb(248,248,248)",
                      letterSpacing: "-0.3px",
                      marginTop: "14px",
                    }}
                  >
                    {phase.title}
                  </h2>
                  <p style={{ fontSize: "14px", lineHeight: "22px", color: "rgb(140,140,140)", marginTop: "6px", maxWidth: "560px" }}>
                    {phase.description}
                  </p>
                  <ul style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {phase.items.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <span
                          aria-hidden="true"
                          style={{
                            marginTop: "7px",
                            width: "5px",
                            height: "5px",
                            borderRadius: "9999px",
                            flexShrink: 0,
                            backgroundColor:
                              phase.status === "live" ? "rgba(248,248,248,0.8)" : "rgba(138,143,152,0.6)",
                          }}
                        />
                        <span style={{ fontSize: "13.5px", lineHeight: "21px", color: "rgb(190,190,190)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(105,105,105)",
            marginTop: "36px",
          }}
        >
          The roadmap reflects current direction and ships when it is ready, not on a fixed date.
        </p>

        {/* CTA */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "48px" }}>
          <Link href="/signup" className="fx-btn-primary">
            Join the beta →
          </Link>
          <Link href="/token" className="fx-btn-ghost">
            Explore $MANSA
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
