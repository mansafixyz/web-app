"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthError } from "@/components/AuthShell";

type Status = "idle" | "loading" | "error" | "success";

const ROLES = [
  { value: "human", label: "Personal" },
  { value: "agent", label: "Agents" },
  { value: "both", label: "Both" },
];

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [role, setRole] = useState("both");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const name = [form.firstName, form.lastName].filter(Boolean).join(" ");

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("success");
  }

  const loading = status === "loading";

  if (status === "success") {
    return (
      <AuthShell eyebrow="One more step" title="Check your email." width={440}>
        <div className="fx-auth-success-icon">
          <svg width="22" height="22" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 6.5l3 3 6-6" stroke="rgb(64,186,128)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontSize: "14px", lineHeight: "22px", color: "rgb(140,140,140)", margin: 0 }}>
          We sent a confirmation link to{" "}
          <span style={{ color: "rgb(248,248,248)" }}>{form.email}</span>. One click and your account goes live.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "24px" }}>
          <Link href="/" className="fx-btn-ghost" style={{ padding: "10px 18px", fontSize: "13px" }}>
            Back to home
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Open an account"
      title="Private by default. Yours in minutes."
      subtitle="Email and a password to start. Keys are generated on your device."
      width={480}
      aside={{
        heading: (
          <>
            The private bank for humans <span className="fx-accent-text">and their AI agents.</span>
          </>
        ),
        points: [
          "Transfer amounts encrypted by default, verified by zero-knowledge proofs.",
          "Give your agents their own accounts, governed by on-chain spending policies.",
          "Disclose activity on your terms with view keys, without giving up custody.",
          "Fully non-custodial: your keys, your money, on your device at all times.",
        ],
      }}
      footer={
        <>
          Already have an account? <Link href="/login">Log in</Link>
        </>
      }
    >
      {status === "error" && <AuthError>{errorMessage}</AuthError>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "12px" }}>
          <div className="fx-field">
            <label htmlFor="first-name" className="fx-label">First name</label>
            <input
              id="first-name"
              type="text"
              className="fx-input"
              placeholder="Ada"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="fx-field">
            <label htmlFor="last-name" className="fx-label">Last name</label>
            <input
              id="last-name"
              type="text"
              className="fx-input"
              placeholder="Lovelace"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              disabled={loading}
            />
          </div>
        </div>

        <div className="fx-field">
          <label htmlFor="email" className="fx-label">Email</label>
          <input
            id="email"
            type="email"
            className="fx-input"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            disabled={loading}
          />
        </div>

        <div className="fx-field">
          <label htmlFor="password" className="fx-label">Password</label>
          <input
            id="password"
            type="password"
            className="fx-input"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            disabled={loading}
          />
        </div>

        <div className="fx-field">
          <span className="fx-label">I&apos;m here for</span>
          <div className="fx-segment" role="radiogroup" aria-label="Account type">
            {ROLES.map((opt) => (
              <label key={opt.value} className={role === opt.value ? "is-active" : undefined}>
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                  disabled={loading}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="fx-btn-primary fx-btn-block" style={{ marginTop: "6px" }}>
          {loading ? "Creating account…" : "Create account →"}
        </button>

        <p style={{ fontSize: "12px", lineHeight: "18px", color: "rgb(105,105,105)", margin: 0, textAlign: "center" }}>
          Free during beta. Identity is verified once, then never shared.
        </p>
      </form>
    </AuthShell>
  );
}
