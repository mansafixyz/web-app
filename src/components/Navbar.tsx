"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { label: "Accounts", href: "/#accounts" },
  { label: "Privacy", href: "/#privacy" },
  { label: "For Agents", href: "/#agents" },
  { label: "Protocol", href: "/#protocol" },
  { label: "Docs", href: "https://docs.mansafi.xyz" },
] as const;

function MansaFiLogo() {
  return (
    <span className="flex items-center gap-2">
      <Image src="/images/logo.png" alt="MansaFi" width={35} height={35} />
      <span
        style={{
          fontSize: "17px",
          fontWeight: 400,
          letterSpacing: "-0.2px",
          color: "rgb(248, 248, 248)",
          lineHeight: 1,
        }}
      >
        MansaFi
      </span>
    </span>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1={3} y1={6} x2={17} y2={6} />
      <line x1={3} y1={10} x2={17} y2={10} />
      <line x1={3} y1={14} x2={17} y2={14} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1={4} y1={4} x2={16} y2={16} />
      <line x1={16} y1={4} x2={4} y2={16} />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
      <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 381.109 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.163 519.284Zm-144.999 168.404-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.164 687.688Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width={19} height={19} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.44 7.44 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth={1.4} />
      <path d="M2.5 13.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {/* Floating pill navbar: detached from the edges, glass blur, rounded */}
      <header
        className="fixed top-0 left-0 right-0 z-[100] flex justify-center"
        style={{
          padding: "14px clamp(12px, 3vw, 24px) 0",
          pointerEvents: "none",
        }}
      >
        <div
          className="flex items-center w-full"
          style={{
            pointerEvents: "auto",
            position: "relative",
            maxWidth: "1160px",
            height: "58px",
            padding: "0 12px 0 20px",
            borderRadius: "9999px",
            background: "rgba(10,10,10,0.72)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0"
            style={{ color: "rgb(248, 248, 248)" }}
            aria-label="MansaFi home"
          >
            <MansaFiLogo />
          </Link>

          {/* Center: Nav links, absolutely centered in the pill (hidden on mobile) */}
          <nav
            className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2"
            style={{ gap: "28px" }}
            aria-label="Main navigation"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "text-[14px] font-normal leading-none",
                  "transition-opacity duration-150",
                  "opacity-70 hover:opacity-100"
                )}
                style={{ color: "rgb(248, 248, 248)" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: socials + auth buttons (hidden on mobile) */}
          <div className="hidden md:flex items-center ml-auto" style={{ gap: "18px" }}>
            <Link
              href="https://x.com/mansafixyz"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity duration-150 opacity-70 hover:opacity-100"
              style={{ color: "rgb(248, 248, 248)" }}
              aria-label="X (Twitter)"
            >
              <XIcon />
            </Link>
            <Link
              href="https://github.com/mansafi"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity duration-150 opacity-70 hover:opacity-100"
              style={{ color: "rgb(248, 248, 248)" }}
              aria-label="GitHub"
            >
              <GitHubIcon />
            </Link>
            <span
              aria-hidden="true"
              style={{
                display: "block",
                width: "1px",
                height: "20px",
                background: "rgba(255,255,255,0.2)",
              }}
            />

            {user ? (
              <Link
                href="/app"
                className="flex items-center justify-center gap-2 text-[13px] leading-none transition-opacity duration-150 hover:opacity-90"
                style={{
                  background: "var(--mansafi-accent)",
                  color: "#0A0A0A",
                  borderRadius: "9999px",
                  padding: "0 14px",
                  height: "34px",
                  fontWeight: 600,
                  boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                }}
              >
                <UserIcon />
                Go to app
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[13px] font-normal leading-none transition-opacity duration-150 opacity-70 hover:opacity-100"
                  style={{ color: "rgb(248, 248, 248)" }}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center text-[13px] leading-none transition-opacity duration-150 hover:opacity-90"
                  style={{
                    background: "var(--mansafi-accent)",
                    color: "#0A0A0A",
                    borderRadius: "9999px",
                    padding: "0 14px",
                    height: "34px",
                    fontWeight: 600,
                    boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                  }}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Hamburger button */}
          <button
            className="md:hidden flex items-center justify-center ml-auto transition-opacity duration-150 opacity-70 hover:opacity-100"
            style={{ color: "rgb(248, 248, 248)" }}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[99] md:hidden flex flex-col pt-[88px] overflow-y-auto"
          style={{
            background: "rgba(6, 6, 6, 0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <nav
            className="flex flex-col"
            style={{ padding: "24px 24px 32px" }}
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[18px] font-normal py-4 border-b transition-opacity duration-150 opacity-70 hover:opacity-100"
                style={{
                  color: "rgb(248, 248, 248)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="https://x.com/mansafixyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-4 border-b transition-opacity duration-150 opacity-70 hover:opacity-100"
              style={{
                color: "rgb(248, 248, 248)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="X (Twitter)"
            >
              <XIcon />
              <span className="text-[18px] font-normal">X (Twitter)</span>
            </Link>
            <Link
              href="https://github.com/mansafi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-4 border-b transition-opacity duration-150 opacity-70 hover:opacity-100"
              style={{
                color: "rgb(248, 248, 248)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              onClick={() => setMobileMenuOpen(false)}
              aria-label="GitHub"
            >
              <GitHubIcon />
              <span className="text-[18px] font-normal">GitHub</span>
            </Link>

            <div className="flex items-center gap-4 pt-6">
              {user ? (
                <Link
                  href="/app"
                  className="flex items-center justify-center gap-2 text-[14px] transition-opacity duration-150 hover:opacity-90"
                  style={{
                    background: "#F0F0F0",
                    color: "#0A0A0A",
                    borderRadius: "9999px",
                    padding: "0 16px",
                    height: "36px",
                    fontWeight: 510,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon />
                  Go to app
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[15px] font-normal transition-opacity duration-150 opacity-70 hover:opacity-100"
                    style={{ color: "rgb(248, 248, 248)" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center text-[14px] transition-opacity duration-150 hover:opacity-90"
                    style={{
                      background: "#F0F0F0",
                      color: "#0A0A0A",
                      borderRadius: "9999px",
                      padding: "0 16px",
                      height: "36px",
                      fontWeight: 510,
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
