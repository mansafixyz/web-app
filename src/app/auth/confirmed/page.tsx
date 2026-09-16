import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

export default function EmailConfirmedPage() {
  return (
    <AuthShell eyebrow="Account activated" title="You're all set." width={440}>
      <div className="fx-auth-success-icon">
        <svg width="22" height="22" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M2 6.5l3 3 6-6" stroke="rgb(64,186,128)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ fontSize: "14px", lineHeight: "22px", color: "rgb(140,140,140)", margin: 0 }}>
        Email confirmed and your account is live. Log in and experience banking that keeps your business yours.
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "24px" }}>
        <Link href="/app" className="fx-btn-primary">
          Open the app →
        </Link>
        <Link href="/" className="fx-btn-ghost">
          Back to site
        </Link>
      </div>
    </AuthShell>
  );
}
