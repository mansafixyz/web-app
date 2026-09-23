import Link from "next/link";
import Image from "next/image";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

const columns: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "App", href: "/app" },
      { label: "Sign up", href: "/signup" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "$MANSA Token", href: "/token" },
      { label: "Smart contracts", href: "https://explorer.testnet.chain.robinhood.com/address/0x7b5Ff1373608CF16fEf673222D0A7716F45b30c6" },

    ],
  },
  {
    heading: "Features",
    links: [
      { label: "Human Accounts", href: "/#accounts" },
      { label: "Agent Accounts", href: "/#accounts" },
      { label: "Confidential Transfers", href: "/#privacy" },
      { label: "ZK Proofs", href: "/#privacy" },
      { label: "x402 Payments", href: "/#agents" },
      { label: "MPP Routing", href: "/#protocol" },
      { label: "On-chain Receipts", href: "/#transparency" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "https://docs.mansafi.xyz/", external: true },
      { label: "Anatomy of a Transfer", href: "https://docs.mansafi.xyz/start-here/anatomy-of-a-transfer", external: true },
      { label: "Choosing an Account", href: "https://docs.mansafi.xyz/start-here/choosing-an-account", external: true },
      { label: "Agent Wallets", href: "https://docs.mansafi.xyz/agents/agent-wallets", external: true },
      { label: "API Reference", href: "https://docs.mansafi.xyz/api-reference/auth-and-keys", external: true },
      { label: "System Design", href: "https://docs.mansafi.xyz/protocol/system-design", external: true },
      { label: "Beta Access", href: "/signup" },
      { label: "FAQ", href: "https://docs.mansafi.xyz/resources/faq", external: true },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Contact us", href: "mailto:contact@mansafi.xyz" },
      { label: "X (Twitter)", href: "https://x.com/mansafixyz" },
      { label: "GitHub", href: "https://github.com/mansafixyz" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{
        background: "#0A0A0A",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          padding: "clamp(48px, 8vw, 72px) clamp(20px, 6vw, 96px) 0",
        }}
      >
        {/* Top row: logo + 4 columns */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 md:[grid-template-columns:auto_repeat(4,1fr)]"
          style={{
            gap: "40px",
          }}
        >
          {/* Logo column */}
          <div className="col-span-2 sm:col-span-4 md:col-span-1" style={{ paddingRight: "24px" }}>
            <Image src="/images/logo.png" alt="MansaFi" width={56} height={56} />
            <p style={{ fontSize: "13px", lineHeight: "20px", color: "rgb(140,140,140)", margin: "16px 0 0", maxWidth: "220px" }}>
              The private bank for humans and their AI agents. Built on Robinhood Chain, secured by Ethereum.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 510,
                  color: "rgb(248, 248, 248)",
                  margin: 0,
                }}
              >
                {col.heading}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    style={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "rgb(140, 140, 140)",
                      textDecoration: "none",
                    }}
                    className="hover:text-[rgb(248,248,248)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          style={{
            marginTop: "56px",
            padding: "20px 0",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            gap: "12px",
            fontSize: "12px",
            color: "rgb(105,105,105)",
          }}
        >
          <span>© {new Date().getFullYear()} MansaFi. Private by default. Verifiable by design.</span>
          <div style={{ display: "flex", gap: "18px" }}>
            <Link href="/status" className="hover:text-[rgb(248,248,248)] transition-colors" style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span className="pulse-dot" style={{ width: "6px", height: "6px" }} />
              All systems operational
            </Link>
            <Link href="/roadmap" className="hover:text-[rgb(248,248,248)] transition-colors" style={{ color: "inherit", textDecoration: "none" }}>
              Roadmap
            </Link>
          </div>
        </div>

        {/* Giant faint wordmark, clipped at the page's bottom edge */}
        <div aria-hidden="true" style={{ marginTop: "8px", marginBottom: "-0.12em", overflow: "hidden" }}>
          <div className="fx-wordmark">MansaFi</div>
        </div>
      </div>
    </footer>
  );
}
