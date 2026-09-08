import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

interface SubItem {
  number: string;
  label: string;
  href: string;
}

export interface FeatureSectionProps {
  sectionNumber: string;
  sectionLabel: string;
  sectionHref: string;
  heading: string;
  description: string;
  subItems: SubItem[];
  mockup: ReactNode;
  layout?: "side" | "below";
  className?: string;
}

export function FeatureSection({
  sectionNumber,
  sectionLabel,
  sectionHref,
  heading,
  description,
  subItems,
  mockup,
  layout = "side",
  className,
}: FeatureSectionProps) {
  const headingLines = heading.split("\n");

  const textBlock = (
    <Reveal className={layout === "below" ? "lg:w-[56%]" : "lg:sticky lg:top-28 lg:self-start"}>
      <div className="fx-overline" style={{ marginBottom: "18px" }}>
        {sectionNumber} / {sectionLabel}
      </div>
      <h2 className="fx-h2">
        {headingLines.map((line, i) => (
          <span key={i}>
            {line}
            {i < headingLines.length - 1 && <br />}
          </span>
        ))}
      </h2>

      <p
        style={{
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: "26px",
          color: "rgb(140, 140, 140)",
          marginTop: "24px",
          maxWidth: "460px",
        }}
      >
        {description}
      </p>

      {subItems.length > 0 && (
        <div className="fx-list" style={{ maxWidth: "460px" }}>
          {subItems.map((item) => (
            <a key={item.number} href={item.href} className="fx-list-row">
              <span className="fx-list-num">{item.number}</span>
              <span>{item.label}</span>
              <span className="fx-list-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      )}

      <a href={sectionHref} className="fx-btn-ghost" style={{ marginTop: "32px", padding: "10px 18px", fontSize: "13px" }}>
        Explore {sectionLabel.toLowerCase()} →
      </a>
    </Reveal>
  );

  return (
    <section
      id={sectionLabel.toLowerCase().replace(/\s*\(.*\)/, "").trim()}
      className={className}
      style={{ backgroundColor: "#0A0A0A", position: "relative" }}
    >
      <div className="fx-divider" />
      <div
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          padding: "clamp(72px, 10vw, 128px) clamp(20px, 6vw, 96px)",
        }}
      >
        {layout === "side" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" style={{ gap: "clamp(40px, 5vw, 80px)" }}>
            {textBlock}
            <Reveal delay={120} style={{ minHeight: "600px", position: "relative" }}>
              {mockup}
            </Reveal>
          </div>
        ) : (
          <div className="flex flex-col">
            {textBlock}
            <Reveal delay={120} style={{ marginTop: "56px", minHeight: "560px", position: "relative" }}>
              {mockup}
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Pre-configured section exports ────────────────────────────────────────

export const INTAKE_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "1.0",
  sectionLabel: "Accounts",
  sectionHref: "/signup",
  heading: "One account.\nTwo kinds of principals.",
  description:
    "Human accounts and AI agent accounts live side by side on one protocol. Non-custodial, ZK-shielded, and governed by on-chain spending policies instead of server-side rules. Your money answers to you, not to a database.",
  subItems: [
    { number: "1.1", label: "Human Accounts", href: "#" },
    { number: "1.2", label: "Agent Accounts", href: "#" },
    { number: "1.3", label: "Multi-sig Vaults", href: "#" },
    { number: "1.4", label: ".mansafi Handles", href: "#" },
  ],
};

export const PLAN_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "2.0",
  sectionLabel: "Privacy",
  sectionHref: "/signup",
  layout: "below",
  heading: "Confidential by default.\nAuditable by choice.",
  description:
    "Every amount is encrypted with ElGamal and proven correct by ZK range proofs: hidden from all observers, verifiable by anyone. When you choose to disclose, a view key reveals exactly what you want and nothing more.",
  subItems: [
    { number: "2.1", label: "Confidential Amounts", href: "#" },
    { number: "2.2", label: "Shielded State", href: "#" },
    { number: "2.3", label: "ZK Range Proofs", href: "#" },
    { number: "2.4", label: "View Keys", href: "#" },
  ],
};

export const BUILD_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "3.0",
  sectionLabel: "Agents",
  sectionHref: "/signup",
  heading: "AI agents that pay\nfor themselves.",
  description:
    "Agent accounts resolve x402 payment requests natively, with no human in the loop. Spending policies are enforced on-chain, so an agent can never outspend its mandate, and MPP routing splits every payment for privacy.",
  subItems: [
    { number: "3.1", label: "x402 Protocol", href: "#" },
    { number: "3.2", label: "Spending Policies", href: "#" },
    { number: "3.3", label: "Agent SDK", href: "#" },
    { number: "3.4", label: "MPP Routing", href: "#" },
    { number: "3.5", label: "Agent Hierarchies", href: "#" },
  ],
};

export const DIFFS_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "4.0",
  sectionLabel: "Protocol",
  sectionHref: "/signup",
  layout: "below",
  heading: "Every transaction,\nrouted for privacy.",
  description:
    "Multi-Path Payments split each transfer across parallel routes, so no observer ever sees the whole picture. Settlement stays atomic. Stealth addresses make every receipt unlinkable. Surveillance has nothing left to read.",
  subItems: [],
};

export const MONITOR_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "5.0",
  sectionLabel: "Transparency",
  sectionHref: "/signup",
  heading: "Selective disclosure.\nFull verifiability.",
  description:
    "Every transaction's existence is proven on-chain while amounts stay encrypted. Share a view key to give an auditor read-only access, with nothing exposed to the public and custody never leaving your hands.",
  subItems: [
    { number: "5.1", label: "On-chain Receipts", href: "#" },
    { number: "5.2", label: "Selective Disclosure", href: "#" },
    { number: "5.3", label: "Audit Exports", href: "#" },
  ],
};
