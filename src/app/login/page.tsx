"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthError } from "@/components/AuthShell";

type Status = "idle" | "loading" | "error";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message === "Invalid login credentials"
          ? "That email and password didn't match our records. Double-check them and try again."
          : error.message
      );
      return;
    }

    router.push("/app");
    router.refresh();
  }

  const loading = status === "loading";

  return (
    <AuthShell
      eyebrow="Log in"
      title="Welcome back."
      subtitle="Pick up right where you left off."
      aside={{
        heading: (
          <>
            Your money,
            <br />
            <span className="fx-accent-text">still yours.</span>
          </>
        ),
        points: [
          "Balances and transfer amounts stay encrypted end to end.",
          "Your keys never leave your device. We only ever see ciphertext.",
          "Agents keep working under the spend limits you set, around the clock.",
        ],
      }}
      footer={
        <>
          No account? <Link href="/signup">Open one</Link>
        </>
      }
    >
      {status === "error" && <AuthError>{errorMessage}</AuthError>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
          <div className="fx-label-row">
            <label htmlFor="password" className="fx-label">Password</label>
            <Link href="#">Forgot password?</Link>
          </div>
          <input
            id="password"
            type="password"
            className="fx-input"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="fx-btn-primary fx-btn-block" style={{ marginTop: "6px" }}>
          {loading ? "Signing in…" : "Log in →"}
        </button>
      </form>
    </AuthShell>
  );
}
