"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PrivacyTier } from "@/lib/supabase/database.types";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export const PRIVACY_TIERS: { value: PrivacyTier; label: string }[] = [
  { value: "confidential", label: "Confidential" },
  { value: "shielded", label: "Shielded" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#151515",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "9px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "rgb(248,248,248)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgb(105,105,105)",
  display: "block",
  marginBottom: "6px",
};

export function ListAgentDrawer({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    privacyTier: "confidential" as PrivacyTier,
    maxPerRequest: "",
    maxPerDay: "",
    initialFunding: "",
    allowedDomains: "",
    webhookUrl: "",
  });
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdHandle, setCreatedHandle] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitStatus("submitting");
    setErrorMsg("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const maxPerRequest = parseFloat(form.maxPerRequest);
      const maxPerDay = parseFloat(form.maxPerDay);
      if (!Number.isFinite(maxPerRequest) || maxPerRequest < 0) {
        throw new Error("Enter a valid max per request amount.");
      }
      if (!Number.isFinite(maxPerDay) || maxPerDay < 0) {
        throw new Error("Enter a valid max per day amount.");
      }

      const allowedDomains = form.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const initialFunding = form.initialFunding ? parseFloat(form.initialFunding) : 0;

      const { data, error } = await supabase.rpc("create_agent_account", {
        p_name: form.name,
        p_description: form.description || null,
        p_privacy_tier: form.privacyTier,
        p_max_per_request: maxPerRequest,
        p_max_per_day: maxPerDay,
        p_initial_funding: Number.isFinite(initialFunding) ? initialFunding : 0,
        p_allowed_domains: allowedDomains,
        p_webhook_url: form.webhookUrl || null,
      });

      if (error) throw new Error(error.message);
      setCreatedHandle(data?.handle ?? "");
      setSubmitStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "16px", padding: "40px" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          backgroundColor: "rgba(64,186,128,0.1)", border: "1px solid rgba(64,186,128,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5l3 3 6-6" stroke="rgb(64,186,128)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 510, color: "rgb(248,248,248)", marginBottom: "6px" }}>Agent account created</div>
          <div style={{ fontSize: "13px", color: "rgb(140,140,140)" }}>
            {createdHandle ? `${createdHandle}.mansafi is active and ready to spend under its policy.` : "Your agent account is active and ready to spend under its policy."}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
            border: "none", borderRadius: "9999px", padding: "9px 24px",
            fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "8px",
            boxShadow: "0 0 16px rgba(248,248,248,0.25)",
          }}
        >
          Done
        </button>
      </div>
    );
  }

  const submitting = submitStatus === "submitting";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1, padding: "24px" }}>

      {submitStatus === "error" && (
        <div style={{
          padding: "10px 14px", backgroundColor: "rgba(240,80,80,0.08)",
          border: "1px solid rgba(240,80,80,0.2)", borderRadius: "8px",
          fontSize: "13px", color: "rgb(240,100,100)",
        }}>
          {errorMsg}
        </div>
      )}

      {/* Name */}
      <div>
        <label style={labelStyle}>Account name <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
        <input required value={form.name} onChange={e => set("name", e.target.value)}
          placeholder="e.g. my-data-agent" disabled={submitting} style={inputStyle} />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
        <textarea required value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="What does this agent do? What does it pay for?"
          disabled={submitting} rows={4}
          style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }} />
      </div>

      {/* Privacy tier + Initial funding */}
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Privacy tier</label>
          <select value={form.privacyTier} onChange={e => set("privacyTier", e.target.value as PrivacyTier)}
            disabled={submitting} style={{ ...inputStyle, cursor: "pointer" }}>
            {PRIVACY_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Initial funding (USDG) <span style={{ color: "rgb(75,80,90)", fontWeight: 400 }}>(optional)</span></label>
          <input type="number" min="0" step="0.01"
            value={form.initialFunding} onChange={e => set("initialFunding", e.target.value)}
            placeholder="e.g. 100" disabled={submitting} style={inputStyle} />
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "-10px" }}>
        Initial funding is debited from your primary account and credited to this agent account immediately.
      </div>

      {/* Spending policy */}
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Max per request (USDG) <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
          <input required type="number" min="0" step="0.01"
            value={form.maxPerRequest} onChange={e => set("maxPerRequest", e.target.value)}
            placeholder="e.g. 0.10" disabled={submitting} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Max per day (USDG) <span style={{ color: "rgb(240,80,80)" }}>*</span></label>
          <input required type="number" min="0" step="0.01"
            value={form.maxPerDay} onChange={e => set("maxPerDay", e.target.value)}
            placeholder="e.g. 50.00" disabled={submitting} style={inputStyle} />
        </div>
      </div>

      {/* Allowed domains */}
      <div>
        <label style={labelStyle}>Allowed domains <span style={{ color: "rgb(75,80,90)", fontWeight: 400 }}>(comma-separated, optional)</span></label>
        <input value={form.allowedDomains} onChange={e => set("allowedDomains", e.target.value)}
          placeholder="api.datavendor.com, api.othervendor.com"
          disabled={submitting} style={inputStyle} />
      </div>

      {/* Webhook URL */}
      <div>
        <label style={labelStyle}>Webhook URL <span style={{ color: "rgb(75,80,90)", fontWeight: 400 }}>(optional, for payment notifications)</span></label>
        <input value={form.webhookUrl} onChange={e => set("webhookUrl", e.target.value)}
          placeholder="https://your-service.com/webhooks/mansafi"
          disabled={submitting} style={inputStyle} />
      </div>

      {/* Submit */}
      <button type="submit" disabled={submitting} style={{
        backgroundColor: submitting ? "rgba(248,248,248,0.4)" : "var(--mansafi-accent)",
        color: submitting ? "rgba(16,19,20,0.6)" : "#0A0A0A",
        border: "none", borderRadius: "9999px", padding: "11px 16px",
        fontSize: "13px", fontWeight: 600,
        boxShadow: submitting ? "none" : "0 0 16px rgba(248,248,248,0.25)",
        cursor: submitting ? "not-allowed" : "pointer",
        marginTop: "4px", transition: "all 0.15s",
      }}>
        {submitting ? "Creating…" : "Create agent account"}
      </button>
    </form>
  );
}

export function ListAgentDrawerShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "480px", backgroundColor: "#141414",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 510, color: "rgb(248,248,248)" }}>Create agent account</div>
            <div style={{ fontSize: "12px", color: "rgb(105,105,105)", marginTop: "2px" }}>
              Fill in the details to provision a new agent account with a spending policy.
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgb(105,105,105)", padding: "4px", lineHeight: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
