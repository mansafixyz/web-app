"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApiKey, ApiKeyEnvironment, Webhook } from "@/lib/supabase/database.types";

const WEBHOOK_EVENT_OPTIONS = ["transfer.settled", "transfer.failed", "payment.received", "policy.limit_reached"];

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatDate(iso: string | null): string {
  if (!iso) return "n/a";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function KeysPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEnv, setNewEnv] = useState<ApiKeyEnvironment>("live");
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "error">("idle");
  const [createError, setCreateError] = useState("");

  const [revealedKey, setRevealedKey] = useState<{ id: string; secret: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "creating" | "error">("idle");
  const [webhookError, setWebhookError] = useState("");

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);
    const [keysRes, webhooksRes] = await Promise.all([
      supabase.from("api_keys").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }),
      supabase.from("webhooks").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }),
    ]);
    setKeys((keysRes.data as ApiKey[]) ?? []);
    setWebhooks((webhooksRes.data as Webhook[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // The plaintext secret only ever exists in memory, between generation and
  // dismissal. It is never written to the database or to storage, so once
  // this clears (dismiss, or the component unmounts) it is genuinely gone.
  useEffect(() => {
    return () => setRevealedKey(null);
  }, []);

  async function handleGenerate() {
    if (!newName.trim() || !userId) return;
    setCreateStatus("creating");
    setCreateError("");
    try {
      const supabase = createClient();
      const randomBytes = crypto.getRandomValues(new Uint8Array(24));
      const randomHex = toHex(randomBytes);
      const prefix = newEnv === "live" ? "hc_live_" : "hc_test_";
      const fullKey = `${prefix}${randomHex}`;
      const digestBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fullKey));
      const keyHash = toHex(new Uint8Array(digestBuf));
      const keyLast4 = fullKey.slice(-4);

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          profile_id: userId,
          name: newName.trim(),
          key_prefix: prefix,
          key_last4: keyLast4,
          key_hash: keyHash,
          environment: newEnv,
          active: true,
        } as never)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const created = data as ApiKey;
      setKeys((prev) => [created, ...prev]);
      setRevealedKey({ id: created.id, secret: fullKey });
      setNewName("");
      setNewEnv("live");
      setShowNew(false);
      setCreateStatus("idle");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong");
      setCreateStatus("error");
    }
  }

  async function handleRevoke(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("api_keys").update({ active: false } as never).eq("id", id);
    if (!error) {
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: false } : k)));
    }
  }

  async function handleCopySecret() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey.secret);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      // clipboard API unavailable, nothing more we can do here
    }
  }

  function toggleWebhookEvent(evt: string) {
    setNewWebhookEvents((prev) => (prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]));
  }

  async function handleAddWebhook() {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0 || !userId) return;
    setWebhookStatus("creating");
    setWebhookError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("webhooks")
        .insert({ profile_id: userId, url: newWebhookUrl.trim(), events: newWebhookEvents, active: true } as never)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setWebhooks((prev) => [data as Webhook, ...prev]);
      setNewWebhookUrl("");
      setNewWebhookEvents([]);
      setShowAddWebhook(false);
      setWebhookStatus("idle");
    } catch (err) {
      setWebhookError(err instanceof Error ? err.message : "Something went wrong");
      setWebhookStatus("error");
    }
  }

  async function handleToggleWebhook(id: string, active: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("webhooks").update({ active: !active } as never).eq("id", id);
    if (!error) {
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, active: !active } : w)));
    }
  }

  async function handleDeleteWebhook(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("webhooks").delete().eq("id", id);
    if (!error) {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    }
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: "820px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
            API Keys
          </h1>
          <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
            Manage keys for initiating transfers and configuring agent payment policies.
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          style={{
            backgroundColor: "var(--mansafi-accent)",
            color: "#0A0A0A",
            border: "none",
            borderRadius: "9999px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 0 16px rgba(248,248,248,0.25)",
            cursor: "pointer",
          }}
        >
          + New key
        </button>
      </div>

      {/* One-time secret reveal */}
      {revealedKey && (
        <div
          style={{
            backgroundColor: "rgba(248,248,248,0.08)",
            border: "1px solid rgba(248,248,248,0.25)",
            borderRadius: "12px",
            padding: "18px 20px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--mansafi-accent)", marginBottom: "6px" }}>
            Your new API key
          </div>
          <p style={{ fontSize: "11px", color: "rgb(140,140,140)", marginBottom: "12px" }}>
            This is the only time this key will be shown. Copy it now and store it securely.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#151515",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "10px 12px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "rgb(248,248,248)", flex: 1, wordBreak: "break-all" }}>
              {revealedKey.secret}
            </span>
            <button
              onClick={handleCopySecret}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#0A0A0A",
                backgroundColor: "var(--mansafi-accent)",
                border: "none",
                borderRadius: "9999px",
                padding: "5px 12px",
                boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {copyStatus === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            style={{
              fontSize: "12px",
              color: "rgb(140,140,140)",
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "9999px",
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >
            I've saved it, dismiss
          </button>
        </div>
      )}

      {/* New key form */}
      {showNew && (
        <div
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)", marginBottom: "14px" }}>Create new API key</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Key name (e.g. Production)"
              style={{
                flex: 1,
                backgroundColor: "#151515",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "rgb(248,248,248)",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", overflow: "hidden" }}>
              {(["live", "test"] as ApiKeyEnvironment[]).map((env) => (
                <button
                  key={env}
                  onClick={() => setNewEnv(env)}
                  style={{
                    fontSize: "12px",
                    textTransform: "capitalize",
                    padding: "8px 14px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: newEnv === env ? "rgba(248,248,248,0.08)" : "#151515",
                    boxShadow: newEnv === env ? "inset 0 0 0 1px rgba(248,248,248,0.2)" : "none",
                    color: newEnv === env ? "var(--mansafi-accent)" : "rgb(140,140,140)",
                  }}
                >
                  {env}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              disabled={!newName.trim() || createStatus === "creating"}
              style={{
                backgroundColor: "var(--mansafi-accent)",
                color: "#0A0A0A",
                border: "none",
                borderRadius: "9999px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                cursor: !newName.trim() || createStatus === "creating" ? "default" : "pointer",
                opacity: !newName.trim() || createStatus === "creating" ? 0.6 : 1,
              }}
            >
              {createStatus === "creating" ? "Generating…" : "Generate"}
            </button>
          </div>
          {createStatus === "error" && (
            <p style={{ fontSize: "11px", color: "rgb(240,80,80)", marginBottom: "6px" }}>{createError}</p>
          )}
          <p style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "4px" }}>
            The key will be shown once. Store it securely, since you cannot retrieve it again.
          </p>
        </div>
      )}

      {/* Keys list */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgb(105,105,105)",
          }}
        >
          API keys
        </div>
        {loading ? (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>
            No API keys yet. Click "+ New key" to create one.
          </div>
        ) : (
          keys.map((key, i) => (
            <div
              key={key.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "14px 20px",
                borderBottom: i < keys.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)" }}>{key.name}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgb(140,140,140)",
                    }}
                  >
                    {key.environment}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      backgroundColor: key.active ? "rgba(64,186,128,0.1)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${key.active ? "rgba(64,186,128,0.2)" : "rgba(255,255,255,0.08)"}`,
                      color: key.active ? "rgb(64,186,128)" : "rgb(105,105,105)",
                    }}
                  >
                    {key.active ? "Active" : "Revoked"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgb(140,140,140)" }}>
                  {key.key_prefix}
                  {"•".repeat(4)}
                  {key.key_last4}
                </div>
                <div style={{ fontSize: "10px", color: "rgb(105,105,105)", marginTop: "3px" }}>
                  Created {formatDate(key.created_at)} · Last used {formatDate(key.last_used_at)}
                </div>
              </div>
              {key.active && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  style={{
                    fontSize: "11px",
                    color: "rgb(240,80,80)",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(240,80,80,0.25)",
                    borderRadius: "9999px",
                    padding: "4px 12px",
                    cursor: "pointer",
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Webhooks */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>Webhooks</span>
          <button
            onClick={() => setShowAddWebhook(!showAddWebhook)}
            style={{
              fontSize: "11px",
              color: "rgb(140,140,140)",
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "9999px",
              padding: "4px 12px",
              cursor: "pointer",
            }}
          >
            + Add endpoint
          </button>
        </div>

        {showAddWebhook && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://example.com/mansafi/webhook"
              style={{
                width: "100%",
                backgroundColor: "#151515",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "rgb(248,248,248)",
                outline: "none",
                marginBottom: "10px",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {WEBHOOK_EVENT_OPTIONS.map((evt) => {
                const selected = newWebhookEvents.includes(evt);
                return (
                  <button
                    key={evt}
                    onClick={() => toggleWebhookEvent(evt)}
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      backgroundColor: selected ? "rgba(248,248,248,0.08)" : "transparent",
                      border: selected ? "1px solid rgba(248,248,248,0.25)" : "1px solid rgba(255,255,255,0.1)",
                      color: selected ? "var(--mansafi-accent)" : "rgb(105,105,105)",
                    }}
                  >
                    {evt}
                  </button>
                );
              })}
            </div>
            {webhookStatus === "error" && (
              <p style={{ fontSize: "11px", color: "rgb(240,80,80)", marginBottom: "8px" }}>{webhookError}</p>
            )}
            <button
              onClick={handleAddWebhook}
              disabled={!newWebhookUrl.trim() || newWebhookEvents.length === 0 || webhookStatus === "creating"}
              style={{
                backgroundColor: "var(--mansafi-accent)",
                color: "#0A0A0A",
                border: "none",
                borderRadius: "9999px",
                padding: "7px 16px",
                fontSize: "12px",
                fontWeight: 600,
                boxShadow: "0 0 16px rgba(248,248,248,0.25)",
                cursor:
                  !newWebhookUrl.trim() || newWebhookEvents.length === 0 || webhookStatus === "creating"
                    ? "default"
                    : "pointer",
                opacity: !newWebhookUrl.trim() || newWebhookEvents.length === 0 || webhookStatus === "creating" ? 0.6 : 1,
              }}
            >
              {webhookStatus === "creating" ? "Adding…" : "Add webhook"}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>Loading…</div>
        ) : webhooks.length === 0 ? (
          <div style={{ padding: "24px 20px", fontSize: "13px", color: "rgb(105,105,105)" }}>
            No webhooks configured yet.
          </div>
        ) : (
          webhooks.map((wh, i) => (
            <div
              key={wh.id}
              style={{
                padding: "14px 20px",
                borderBottom: i < webhooks.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgb(248,248,248)", marginBottom: "6px" }}>
                    {wh.url}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {wh.events.length === 0 ? (
                      <span style={{ fontSize: "9px", color: "rgb(105,105,105)" }}>n/a</span>
                    ) : (
                      wh.events.map((e) => (
                        <span
                          key={e}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "9px",
                            color: "rgb(105,105,105)",
                            backgroundColor: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "4px",
                            padding: "1px 6px",
                          }}
                        >
                          {e}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleWebhook(wh.id, wh.active)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor: wh.active ? "rgba(64,186,128,0.1)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${wh.active ? "rgba(64,186,128,0.2)" : "rgba(255,255,255,0.08)"}`,
                      color: wh.active ? "rgb(64,186,128)" : "rgb(105,105,105)",
                    }}
                  >
                    {wh.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => handleDeleteWebhook(wh.id)}
                    style={{
                      fontSize: "11px",
                      color: "rgb(240,80,80)",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(240,80,80,0.25)",
                      borderRadius: "9999px",
                      padding: "4px 12px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Docs callout */}
      <div
        className="fx-glass-card"
        style={{
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "rgb(248,248,248)", marginBottom: "3px" }}>API documentation</div>
          <div style={{ fontSize: "12px", color: "rgb(140,140,140)" }}>Integrate MansaFi into your product with our REST API or MCP server.</div>
        </div>
        <button
          style={{
            fontSize: "12px",
            color: "rgb(248,248,248)",
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "9999px",
            padding: "7px 16px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          View docs
        </button>
      </div>
    </div>
  );
}
