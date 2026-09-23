"use client";

import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section style={{ backgroundColor: "#0A0A0A" }} className="w-full overflow-hidden relative">
      {/* Background texture, pinned to a fixed height so its bright floor never
          climbs up under the copy on short (mockup-less) mobile layouts. */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0"
        style={{
          height: "min(100%, 1200px)",
          backgroundImage: "url(/images/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Blueprint grid + a soft white glow, a dark veil for contrast, and a
          fade into the page background at the bottom. */}
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-full fx-grid-bg" />
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-full"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0.58), rgba(0,0,0,0.58)), radial-gradient(ellipse 50% 42% at 50% -2%, rgba(248,248,248,0.1), transparent 62%), linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0) 62%, #0A0A0A 96%)",
        }}
      />

      <div
        className="relative"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(140px, 20vw, 200px) clamp(20px, 6vw, 96px) 0",
          textAlign: "center",
        }}
      >
        {/* Announcement chip */}
        <div className="fx-fade-up" style={{ marginBottom: "28px", display: "flex", justifyContent: "center" }}>
          <Link href="/token" className="fx-chip" style={{ textDecoration: "none" }}>
            <span className="fx-overline">$MANSA: 0x6c673ca3d3212ddd1ba355f50631c03a1887c741</span>
            <span aria-hidden="true" style={{ color: "rgb(140,140,140)", fontSize: "12px" }}>→</span>
          </Link>
        </div>

        {/* H1 */}
        <h1
          className="fx-fade-up fx-delay-1"
          style={{
            fontSize: "clamp(38px, 6.4vw, 76px)",
            fontWeight: 510,
            lineHeight: "1.02",
            letterSpacing: "-0.03em",
            color: "rgb(248, 248, 248)",
            margin: "0 auto",
            maxWidth: "1100px",
            textWrap: "balance",
          }}
        >
          The private bank for humans
          <br />
          <span className="fx-accent-text">and their AI agents.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="fx-fade-up fx-delay-2"
          style={{
            fontSize: "clamp(16px, 1.4vw, 19px)",
            fontWeight: 400,
            lineHeight: "1.6",
            color: "rgb(190,190,190)",
            maxWidth: "640px",
            margin: "28px auto 0",
          }}
        >
          Every transfer leaves your account encrypted and settles in 100ms blocks.
          Your agents hold their own accounts, pay natively over x402, and never
          spend a cent beyond the limits you set.
        </p>

        {/* CTA row */}
        <div
          className="fx-fade-up fx-delay-3 flex flex-wrap items-center justify-center"
          style={{ marginTop: "36px", gap: "12px" }}
        >
          <Link href="/signup" className="fx-btn-primary">
            Open your account →
          </Link>
          <a
            href="https://docs.mansafi.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="fx-btn-ghost"
          >
            Read the docs
          </a>
        </div>

        {/* Stat strip */}
        <div className="fx-fade-up fx-delay-3 fx-stats" style={{ margin: "56px auto 0", maxWidth: "880px" }}>
          {HERO_STATS.map((s) => (
            <div key={s.label} className="fx-stat">
              <div className="fx-stat-value">{s.value}</div>
              <div className="fx-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* App UI mockup in a perspective frame — mirrors the real /app shell
            showing the Cards tab: sidebar rail with grouped nav, breadcrumb
            top bar, the generate form, and a grid of virtual cards. */}
        <div className="hidden md:block fx-frame" style={{ marginTop: "72px", textAlign: "left" }}>
          <div
            className="fx-frame-inner flex"
            style={{
              borderRadius: "16px 16px 0 0",
              backgroundColor: "#101010",
              border: "1px solid rgba(255,255,255,0.1)",
              borderBottom: "none",
              height: "720px",
              overflow: "hidden",
              flexDirection: "row",
              boxShadow:
                "0 -1px 0 rgba(248,248,248,0.25), 0 -24px 120px rgba(248,248,248,0.07), 0 40px 120px rgba(0,0,0,0.6)",
            }}
          >
            <MockSidebar />

            {/* Content column */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <MockTopBar />

              {/* Page header */}
              <div style={{
                padding: "16px 22px 13px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}>
                <div style={{ fontSize: "15px", fontWeight: 510, color: "rgb(248,248,248)", letterSpacing: "-0.2px" }}>Cards</div>
                <div style={{ fontSize: "11px", color: "rgb(140,140,140)", marginTop: "4px" }}>
                  Virtual debit cards backed by your primary account. Reveal details only when you need them.
                </div>
              </div>

              {/* Generate form */}
              <div style={{ padding: "14px 22px 0", flexShrink: 0 }}>
                <div style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 14px",
                }}>
                  <div style={{ ...mockMicro, marginBottom: "10px" }}>Generate a new card</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <div style={{ ...mockMicro, fontSize: "7px", marginBottom: "4px" }}>Cardholder name</div>
                      <div style={{
                        backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px", padding: "7px 10px", fontSize: "11px", color: "rgb(248,248,248)",
                      }}>
                        Vlad
                      </div>
                    </div>
                    <div>
                      <div style={{ ...mockMicro, fontSize: "7px", marginBottom: "4px" }}>Network</div>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <span style={{
                          display: "flex", alignItems: "center", gap: "6px", padding: "6px 11px", borderRadius: "8px",
                          fontSize: "10.5px", fontWeight: 510, color: "var(--mansafi-accent)",
                          background: "rgba(248,248,248,0.08)", border: "1px solid rgba(248,248,248,0.25)",
                          boxShadow: "inset 0 0 0 1px rgba(248,248,248,0.15)",
                        }}>
                          <span style={{ fontStyle: "italic", fontWeight: 800, fontSize: "10px" }}>VISA</span> Visa
                        </span>
                        <span style={{
                          display: "flex", alignItems: "center", gap: "6px", padding: "6px 11px", borderRadius: "8px",
                          fontSize: "10.5px", fontWeight: 510, color: "rgb(140,140,140)",
                          background: "#151515", border: "1px solid rgba(255,255,255,0.1)",
                        }}>
                          <svg width="20" height="13" viewBox="0 0 38 24" aria-hidden="true">
                            <circle cx="14" cy="12" r="9" fill="#EB001B" />
                            <circle cx="24" cy="12" r="9" fill="#F79E1B" fillOpacity="0.9" />
                          </svg>
                          Mastercard
                        </span>
                      </div>
                    </div>
                    <span style={{
                      background: "var(--mansafi-accent)", color: "#0A0A0A", borderRadius: "9999px",
                      padding: "8px 16px", fontSize: "11px", fontWeight: 600,
                      boxShadow: "0 0 14px rgba(248,248,248,0.25)",
                    }}>
                      Generate card
                    </span>
                  </div>
                </div>
              </div>

              {/* Card grid */}
              <div style={{
                flex: 1, padding: "14px 22px 16px",
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
                alignContent: "start", overflow: "hidden",
              }}>
                {HERO_CARDS.map((card) => (
                  <MockVirtualCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phone-shaped app UI mockup for mobile — the Cards tab in the real
            app's mobile shell: hamburger + breadcrumb bar, then a single
            column of virtual cards. */}
        <div className="md:hidden" style={{ marginTop: "48px", textAlign: "left" }}>
          <PhoneAppMockup />
        </div>
      </div>
    </section>
  );
}

const HERO_STATS = [
  { value: "120ms", label: "Block settlement" },
  { value: "$0.00", label: "Transfer fees during beta" },
  { value: "0", label: "Plaintext amounts on-chain" },
  { value: "24/7", label: "Agents paying for themselves" },
];

/* ── Mock app shell pieces (mirror src/app/app/layout.tsx) ────────────────── */

const mockMicro: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "8px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgb(105,105,105)",
};

const MOCK_NAV_GROUPS = [
  { label: "Banking", items: [{ label: "Accounts", active: false }, { label: "Send Payment", active: false }, { label: "Cards", active: true }, { label: "Wallet", active: false }] },
  { label: "Agents", items: [{ label: "Agent Accounts", active: false }, { label: "Activity", active: false }, { label: "Analytics", active: false }] },
  { label: "Developer", items: [{ label: "API Keys", active: false }, { label: "Alerts", active: false }, { label: "Status", active: false }] },
];

function MockSidebar() {
  return (
    <aside style={{
      width: "176px", flexShrink: 0, display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)), #0D0D0D",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "14px 12px 12px", flexShrink: 0 }}>
        <Image src="/images/logo.png" alt="MansaFi" width={20} height={20} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: "rgb(248,248,248)" }}>MansaFi</span>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: "2px 8px", display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
        {MOCK_NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <div style={{ ...mockMicro, padding: "0 8px", marginBottom: "4px" }}>{group.label}</div>
            {group.items.map((item) => (
              <span key={item.label} style={{
                display: "block", padding: "5px 8px", borderRadius: "6px", fontSize: "10.5px", whiteSpace: "nowrap",
                fontWeight: item.active ? 500 : 400,
                color: item.active ? "var(--mansafi-accent)" : "rgb(140,140,140)",
                backgroundColor: item.active ? "rgba(248,248,248,0.08)" : "transparent",
                boxShadow: item.active
                  ? "inset 2px 0 0 var(--mansafi-accent), inset 0 0 0 1px rgba(248,248,248,0.15)"
                  : "none",
              }}>
                {item.label}
              </span>
            ))}
          </div>
        ))}
      </nav>

      {/* Chain status */}
      <div style={{ padding: "0 8px 8px", flexShrink: 0 }}>
        <div style={{
          border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)",
          borderRadius: "8px", padding: "7px 9px", display: "flex", alignItems: "center", gap: "7px",
        }}>
          <span className="pulse-dot" style={{ width: "5px", height: "5px", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ ...mockMicro, color: "rgb(140,140,140)" }}>Robinhood Chain</div>
            <div style={{ ...mockMicro, fontSize: "7px" }}>100ms blocks · live</div>
          </div>
        </div>
      </div>

      {/* User card */}
      <div style={{ padding: "0 8px 10px", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "7px",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px", padding: "6px 8px",
        }}>
          <div style={{
            width: "20px", height: "20px", borderRadius: "5px",
            backgroundColor: "var(--mansafi-accent)",
            boxShadow: "0 0 10px rgba(248,248,248,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "8px", fontWeight: 700, color: "#0A0A0A", flexShrink: 0,
          }}>V</div>
          <span style={{ fontSize: "10.5px", color: "rgb(248,248,248)", fontWeight: 500, flex: 1 }}>Vlad</span>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M2 6.5 5 3.5l3 3" stroke="rgb(140,140,140)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </aside>
  );
}

function MockTopBar() {
  return (
    <header style={{
      height: "40px", borderBottom: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "center", gap: "8px", padding: "0 22px", flexShrink: 0,
    }}>
      <span style={mockMicro}>App</span>
      <span style={{ ...mockMicro, color: "rgba(105,105,105,0.5)" }}>/</span>
      <span style={{ ...mockMicro, color: "var(--mansafi-accent)" }}>Cards</span>
      <span style={{
        ...mockMicro, marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "5px",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9999px", padding: "3px 9px",
        color: "rgb(140,140,140)",
      }}>
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="5" width="8" height="5.5" rx="1.2" stroke="rgb(140,140,140)" strokeWidth="1.2" />
          <path d="M4 5V3.8a2 2 0 0 1 4 0V5" stroke="rgb(140,140,140)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Private by default
      </span>
    </header>
  );
}

function PhoneAppMockup() {
  const cards = HERO_CARDS.slice(0, 3);

  return (
    <div
      style={{
        borderRadius: "20px",
        backgroundColor: "#101010",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 -1px 0 rgba(248,248,248,0.2), 0 -12px 64px rgba(248,248,248,0.06), 0 24px 64px rgba(0,0,0,0.5)",
      }}
    >
      {/* Compact top bar: hamburger + logo + breadcrumb + generate */}
      <div
        style={{
          height: "44px",
          padding: "0 14px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "9px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <span style={{
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px",
          padding: "4px 5px", display: "flex", color: "rgb(248,248,248)",
        }}>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <line x1={3} y1={6} x2={17} y2={6} />
            <line x1={3} y1={10} x2={17} y2={10} />
            <line x1={3} y1={14} x2={17} y2={14} />
          </svg>
        </span>
        <Image src="/images/logo.png" alt="MansaFi" width={18} height={18} />
        <span style={mockMicro}>App</span>
        <span style={{ ...mockMicro, color: "rgba(105,105,105,0.5)" }}>/</span>
        <span style={{ ...mockMicro, color: "var(--mansafi-accent)" }}>Cards</span>
        <span style={{
          marginLeft: "auto",
          background: "var(--mansafi-accent)", color: "#0A0A0A", borderRadius: "9999px",
          padding: "6px 12px", fontSize: "10.5px", fontWeight: 600,
          boxShadow: "0 0 14px rgba(248,248,248,0.25)",
        }}>
          + Generate
        </span>
      </div>

      {/* Stacked virtual cards — single column */}
      <div style={{ padding: "14px 14px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {cards.map((card) => (
          <MockVirtualCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

/* ── Mock virtual card (mirrors VirtualCardVisual in src/app/app/cards) ───── */

export type HeroCard = {
  id: string;
  network: "visa" | "mastercard";
  last4: string;
  holder: string;
  expires: string;
  frozen?: boolean;
};

export function MockVirtualCard({ card }: { card: HeroCard }) {
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
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.09)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "13px 15px 15px",
        background: [
          "linear-gradient(115deg, rgba(255,255,255,0.07), rgba(255,255,255,0.015) 38%, rgba(0,0,0,0.12) 100%)",
          "repeating-linear-gradient(178deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0) 3px)",
          "radial-gradient(ellipse 120% 90% at 20% 0%, #232323 0%, #161616 55%, #0E0E0E 100%)",
        ].join(", "),
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 28px rgba(0,0,0,0.45)",
        filter: card.frozen ? "grayscale(0.85)" : "none",
        opacity: card.frozen ? 0.7 : 1,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ ...overlayMicro, fontSize: "8px" }}>Debit · Virtual</span>
          {card.frozen && (
            <span style={{
              ...overlayMicro, fontSize: "7.5px", color: "rgb(120,165,245)",
              border: "1px solid rgba(100,150,240,0.4)", background: "rgba(100,150,240,0.12)",
              borderRadius: "3px", padding: "1px 4px",
            }}>
              Frozen
            </span>
          )}
        </div>
        <Image src="/images/logo.png" alt="MansaFi" width={36} height={36} style={{ display: "block", margin: "-6px -4px -10px 0" }} />
      </div>

      {/* Chip + contactless, centered in the free space between the header
          and the number so it can never collide with either */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "9px" }}>
        <svg viewBox="0 0 34 26" aria-hidden="true" style={{ width: "38px", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id={`chip-${card.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#EFEAD9" />
              <stop offset="0.35" stopColor="#C9C0AA" />
              <stop offset="0.6" stopColor="#A79D86" />
              <stop offset="1" stopColor="#E3DCC8" />
            </linearGradient>
          </defs>
          <rect x="0.5" y="0.5" width="33" height="25" rx="4.5" fill={`url(#chip-${card.id})`} stroke="rgba(0,0,0,0.45)" />
          <path
            d="M12 0.5v7a3.5 3.5 0 0 1-3.5 3.5H0.5M22 0.5v7a3.5 3.5 0 0 0 3.5 3.5h7.5M12 25.5v-6a3.5 3.5 0 0 0-3.5-3.5H0.5M22 25.5v-6a3.5 3.5 0 0 1 3.5-3.5h7.5M12 11.5h10M12 15.5h10"
            stroke="rgba(60,52,38,0.55)"
            strokeWidth="0.9"
            fill="none"
          />
        </svg>
        <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ width: "15px", height: "auto" }}>
          <path d="M5 3.5C7.5 6.5 7.5 11.5 5 14.5M8.5 2C11.8 6 11.8 12 8.5 16M12 0.5c4 5 4 12 0 17" stroke="rgba(248,248,248,0.45)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>

      {/* Number: masked groups justified across the full width */}
      <div style={{
        width: "100%", display: "flex", justifyContent: "space-between",
        fontFamily: "var(--font-mono)", fontSize: "15px", letterSpacing: "2px",
        color: "rgb(248,248,248)", textShadow: "0 1px 2px rgba(0,0,0,0.6)",
      }}>
        {["••••", "••••", "••••", card.last4].map((group, i) => (
          <span key={i}>{group}</span>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "9px", marginTop: "10px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...overlayMicro, fontSize: "7px" }}>Cardholder</div>
          <div style={{
            fontSize: "11px", fontWeight: 500, color: "rgb(248,248,248)", textTransform: "uppercase",
            letterSpacing: "0.06em", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {card.holder}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ ...overlayMicro, fontSize: "7px" }}>Expires</div>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "rgb(248,248,248)", marginTop: "2px" }}>
            {card.expires}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ ...overlayMicro, fontSize: "7px" }}>CVV</div>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "rgb(248,248,248)", marginTop: "2px" }}>
            •••
          </div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {card.network === "mastercard" ? (
            <svg viewBox="0 0 38 24" aria-label="Mastercard" style={{ width: "34px", height: "auto" }}>
              <circle cx="14" cy="12" r="9" fill="#EB001B" />
              <circle cx="24" cy="12" r="9" fill="#F79E1B" fillOpacity="0.9" />
              <path d="M19 4.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8Z" fill="#F16522" />
            </svg>
          ) : (
            <span aria-label="Visa" style={{ fontStyle: "italic", fontWeight: 800, fontSize: "14px", letterSpacing: "0.5px", color: "rgb(248,248,248)" }}>
              VISA
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */

export const HERO_CARDS: HeroCard[] = [
  { id: "c1", network: "visa", last4: "1092", holder: "Vlad", expires: "07/30" },
  { id: "c2", network: "mastercard", last4: "4471", holder: "Vlad", expires: "07/30" },
  { id: "c3", network: "visa", last4: "8236", holder: "Vlad", expires: "07/30", frozen: true },
  { id: "c4", network: "mastercard", last4: "5518", holder: "Vlad", expires: "07/30" },
  { id: "c5", network: "visa", last4: "3049", holder: "Vlad", expires: "07/30" },
  { id: "c6", network: "mastercard", last4: "7723", holder: "Vlad", expires: "07/30" },
];
