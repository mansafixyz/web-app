import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Shared frame for the auth pages: the homepage's textured black backdrop,
 * blueprint grid and white glow, a brand column on wide screens, and a glass
 * panel that holds the form. Pages supply the panel's heading and body.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  aside,
  width = 440,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: { heading: ReactNode; points: string[] };
  width?: number;
}) {
  return (
    <div className="fx-auth">
      {/* Backdrop: texture, grid, glow, veil */}
      <div aria-hidden="true" className="fx-auth-texture" />
      <div aria-hidden="true" className="absolute inset-0 fx-grid-bg" />
      <div aria-hidden="true" className="fx-auth-veil" />

      {/* Top bar: logo home link + back link */}
      <header className="fx-auth-bar">
        <Link href="/" aria-label="MansaFi home" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "rgb(248,248,248)" }}>
          <Image src="/images/logo.png" alt="" width={30} height={30} />
          <span style={{ fontSize: "15px", letterSpacing: "-0.2px" }}>MansaFi</span>
        </Link>
        <Link href="/" className="fx-auth-back">
          ← Back to site
        </Link>
      </header>

      <main className={`fx-auth-main${aside ? " fx-auth-main--split" : ""}`}>
        {aside && (
          <aside className="fx-auth-aside">
            <div className="fx-overline" style={{ marginBottom: "18px" }}>{eyebrow}</div>
            <h2 className="fx-h2" style={{ fontSize: "clamp(30px, 3.4vw, 46px)" }}>{aside.heading}</h2>
            <ul className="fx-auth-points">
              {aside.points.map((p) => (
                <li key={p}>
                  <span className="fx-auth-check" aria-hidden="true">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="rgb(248,248,248)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.5 5 9l4.5-6" />
                    </svg>
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="fx-auth-aside-foot">
              <span className="pulse-dot" style={{ width: "6px", height: "6px" }} />
              <span className="fx-overline" style={{ color: "rgb(105,105,105)" }}>Live on Robinhood Chain · secured by Ethereum</span>
            </div>
          </aside>
        )}

        <section className="fx-auth-panel fx-fade-up" style={{ maxWidth: `${width}px` }}>
          {!aside && <div className="fx-overline" style={{ marginBottom: "14px" }}>{eyebrow}</div>}
          {aside && <div className="fx-overline lg:hidden" style={{ marginBottom: "14px" }}>{eyebrow}</div>}
          <h1 className="fx-auth-title">{title}</h1>
          {subtitle && <p className="fx-auth-subtitle">{subtitle}</p>}
          <div style={{ marginTop: "28px" }}>{children}</div>
          {footer && <div className="fx-auth-foot">{footer}</div>}
        </section>
      </main>
    </div>
  );
}

/** Inline error banner used by the forms. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="fx-auth-error">
      {children}
    </div>
  );
}
