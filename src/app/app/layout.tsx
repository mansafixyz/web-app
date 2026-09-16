"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Nav model ─────────────────────────────────────────────────────────── */

type NavItem = { label: string; href: string; icon: React.ReactNode };

const ICON_STROKE = { stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

const icons = {
  accounts: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  send: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <path d="M14 2 7.5 8.5" />
      <path d="M14 2 9.8 14l-2.3-5.5L2 6.2 14 2Z" />
    </svg>
  ),
  wallet: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <rect x="1.5" y="3.5" width="13" height="9.5" rx="2" />
      <path d="M10.5 8.25h2.5" />
      <path d="M1.5 6h13" />
    </svg>
  ),
  cards: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <rect x="1.5" y="3" width="13" height="10" rx="1.8" />
      <path d="M1.5 6.2h13" />
      <path d="M4 10.5h3" />
    </svg>
  ),
  agents: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <rect x="3.5" y="3.5" width="9" height="9" rx="1.6" />
      <path d="M6 1v2.5M10 1v2.5M6 12.5V15M10 12.5V15M1 6h2.5M1 10h2.5M12.5 6H15M12.5 10H15" />
    </svg>
  ),
  activity: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <path d="M1.5 8h3l2-4.5 3 9 2-4.5h3" />
    </svg>
  ),
  analytics: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <path d="M2 14V9M6 14V5M10 14V7.5M14 14V3" />
    </svg>
  ),
  keys: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <circle cx="5" cy="8" r="3.2" />
      <path d="M8.2 8H14.5M12.5 8v2.4M10.4 8v1.7" />
    </svg>
  ),
  alerts: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <path d="M8 2a4.2 4.2 0 0 0-4.2 4.2c0 3-1.3 4.3-1.3 4.3h11s-1.3-1.3-1.3-4.3A4.2 4.2 0 0 0 8 2Z" />
      <path d="M6.6 13a1.6 1.6 0 0 0 2.8 0" />
    </svg>
  ),
  status: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M4.5 8h2l1-2.2 1.6 4.4 1-2.2h1.9" />
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 16 16" {...ICON_STROKE}>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M13.2 9.9a5.6 5.6 0 0 0 0-3.8l1.3-1-1.3-2.2-1.6.5a5.6 5.6 0 0 0-3.3-1.9L8 0h0L7.7 1.5a5.6 5.6 0 0 0-3.3 1.9l-1.6-.5-1.3 2.2 1.3 1a5.6 5.6 0 0 0 0 3.8l-1.3 1 1.3 2.2 1.6-.5a5.6 5.6 0 0 0 3.3 1.9L8 16l.3-1.5a5.6 5.6 0 0 0 3.3-1.9l1.6.5 1.3-2.2-1.3-1Z" />
    </svg>
  ),
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Banking",
    items: [
      { label: "Accounts", href: "/app", icon: icons.accounts },
      { label: "Send Payment", href: "/app/run", icon: icons.send },
      { label: "Cards", href: "/app/cards", icon: icons.cards },
      { label: "Wallet", href: "/app/wallet", icon: icons.wallet },
    ],
  },
  {
    label: "Agents",
    items: [
      { label: "Agent Accounts", href: "/app/dashboard", icon: icons.agents },
      { label: "Activity", href: "/app/executions", icon: icons.activity },
      { label: "Analytics", href: "/app/analytics", icon: icons.analytics },
    ],
  },
  {
    label: "Developer",
    items: [
      { label: "API Keys", href: "/app/keys", icon: icons.keys },
      { label: "Alerts", href: "/app/alerts", icon: icons.alerts },
      { label: "Status", href: "/status", icon: icons.status },
    ],
  },
];

const SETTINGS_ITEM: NavItem = { label: "Settings", href: "/app/settings", icon: icons.settings };

const micro: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "9px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgb(105,105,105)",
};

function pageTitle(pathname: string): string {
  const all = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];
  const match = all
    .filter((i) => (i.href === "/app" ? pathname === "/app" : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "App";
}

/* ── Nav link ──────────────────────────────────────────────────────────── */

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 10px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: active ? 500 : 400,
        color: active ? "var(--mansafi-accent)" : "rgb(140,140,140)",
        backgroundColor: active ? "rgba(248,248,248,0.08)" : "transparent",
        boxShadow: active
          ? "inset 2px 0 0 var(--mansafi-accent), inset 0 0 0 1px rgba(248,248,248,0.15)"
          : "none",
        transition: "background 0.12s, color 0.12s",
      }}
    >
      <span style={{ display: "flex", flexShrink: 0, opacity: active ? 1 : 0.75 }}>{item.icon}</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
    </Link>
  );
}

/* ── Sidebar content (shared by desktop rail and mobile drawer) ────────── */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
  }

  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "9px",
          color: "rgb(248,248,248)",
          padding: "18px 16px 16px",
          flexShrink: 0,
        }}
      >
        <Image src="/images/logo.png" alt="MansaFi" width={26} height={26} />
        <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.2px" }}>MansaFi</span>
      </Link>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 10px 12px", display: "flex", flexDirection: "column", gap: "22px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ ...micro, padding: "0 10px", marginBottom: "6px" }}>{group.label}</div>
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div style={{ padding: "0 10px 10px", flexShrink: 0 }}>
        <NavLink item={SETTINGS_ITEM} active={isActive(SETTINGS_ITEM.href)} onNavigate={onNavigate} />
      </div>
    </>
  );
}

/* ── User card (bottom of sidebar) ─────────────────────────────────────── */

function UserCard() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, wallet_address, handle")
        .eq("id", data.user.id)
        .single();
      const name = profile?.display_name || data.user.email || "";
      setDisplayName(name);
      setWalletAddress(profile?.wallet_address || "");
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div ref={menuRef} style={{ position: "relative", padding: "0 10px 12px", flexShrink: 0 }}>
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "10px",
            right: "10px",
            backgroundColor: "#161616",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "6px",
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {walletAddress && (
            <div
              style={{
                padding: "8px 10px 10px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                marginBottom: "6px",
              }}
            >
              <div style={{ ...micro, marginBottom: "3px" }}>Wallet</div>
              <div style={{ fontSize: "11px", color: "rgb(140,140,140)", fontFamily: "var(--font-mono)" }}>
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "8px 10px",
              borderRadius: "6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgb(140,140,140)",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
              <path d="M6 2H2.5A1.5 1.5 0 0 0 1 3.5v8A1.5 1.5 0 0 0 2.5 13H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M10 10l3-2.5L10 5M13 7.5H5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </div>
      )}

      <button
        onClick={() => setMenuOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          width: "100%",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          padding: "8px 10px",
          cursor: "pointer",
          color: "rgb(248,248,248)",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            backgroundColor: "var(--mansafi-accent)",
            boxShadow: "0 0 12px rgba(248,248,248,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "9px",
            fontWeight: 700,
            color: "#0A0A0A",
            flexShrink: 0,
          }}
        >
          {initials || "?"}
        </div>
        <span
          style={{
            fontSize: "12.5px",
            fontWeight: 500,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "left",
          }}
        >
          {displayName || "Account"}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 6.5 5 3.5l3 3" stroke="rgb(140,140,140)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/* ── Top bar (breadcrumb + mobile menu) ────────────────────────────────── */

function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();

  return (
    <header
      style={{
        height: "48px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        backgroundColor: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Mobile: hamburger + logo */}
      <button
        className="flex md:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "7px",
          padding: "5px 7px",
          cursor: "pointer",
          color: "rgb(248,248,248)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
          <line x1={3} y1={6} x2={17} y2={6} />
          <line x1={3} y1={10} x2={17} y2={10} />
          <line x1={3} y1={14} x2={17} y2={14} />
        </svg>
      </button>
      <span className="flex md:hidden" style={{ alignItems: "center", gap: "7px" }}>
        <Image src="/images/logo.png" alt="MansaFi" width={20} height={20} />
      </span>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <span style={micro}>App</span>
        <span style={{ ...micro, color: "rgba(105,105,105,0.5)" }}>/</span>
        <span style={{ ...micro, color: "var(--mansafi-accent)" }}>{pageTitle(pathname)}</span>
      </div>

      {/* Right: private-by-default badge */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          className="hidden sm:inline-flex"
          style={{
            ...micro,
            alignItems: "center",
            gap: "6px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "9999px",
            padding: "4px 10px",
            color: "rgb(140,140,140)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="5" width="8" height="5.5" rx="1.2" stroke="rgb(140,140,140)" strokeWidth="1.2" />
            <path d="M4 5V3.8a2 2 0 0 1 4 0V5" stroke="rgb(140,140,140)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Private by default
        </span>
      </div>
    </header>
  );
}

/* ── Layout ────────────────────────────────────────────────────────────── */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", display: "flex" }}>
      {/* Desktop sidebar rail */}
      <aside
        className="hidden md:flex"
        style={{
          width: "228px",
          flexShrink: 0,
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)) , #0D0D0D",
        }}
      >
        <SidebarContent />
        <UserCard />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div
            onClick={() => setMobileNavOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "248px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#0D0D0D",
              borderRight: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "8px 0 48px rgba(0,0,0,0.5)",
            }}
          >
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            <UserCard />
          </div>
        </div>
      )}

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main style={{ flex: 1, minHeight: "calc(100vh - 48px)" }}>{children}</main>
      </div>
    </div>
  );
}
