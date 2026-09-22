"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileSettings } from "@/lib/supabase/database.types";

type ToggleKey = "requireConfirm" | "autoTopup" | "streamResults" | "saveHistory" | "dataSharing";

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        width: "32px", height: "18px", borderRadius: "9px",
        backgroundColor: on ? "var(--mansafi-accent)" : "rgba(255,255,255,0.1)",
        boxShadow: on ? "0 0 12px rgba(248,248,248,0.25)" : "none",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0, transition: "background 0.15s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        position: "absolute", top: "3px",
        left: on ? "16px" : "3px",
        width: "12px", height: "12px", borderRadius: "50%",
        backgroundColor: on ? "#0A0A0A" : "#fff", transition: "left 0.15s",
      }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px", overflow: "hidden", marginBottom: "16px",
    }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(105,105,105)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div>
        <div style={{ fontSize: "13px", color: "rgb(248,248,248)" }}>{label}</div>
        {sublabel && <div style={{ fontSize: "11px", color: "rgb(105,105,105)", marginTop: "2px" }}>{sublabel}</div>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "#151515", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px", padding: "6px 10px", fontSize: "12px",
  color: "rgb(248,248,248)", outline: "none",
};

const DEFAULT_PREFS: Record<ToggleKey, boolean> = {
  requireConfirm: true,
  autoTopup: false,
  streamResults: true,
  saveHistory: true,
  dataSharing: false,
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [walletStatus, setWalletStatus] = useState<"idle" | "saving" | "saved" | "error" | "invalid">("idle");

  const [daily, setDaily] = useState("0");
  const [monthly, setMonthly] = useState("0");
  const [limitsStatus, setLimitsStatus] = useState<"idle" | "saving" | "saved" | "error" | "invalid">("idle");

  const [prefs, setPrefs] = useState<Record<ToggleKey, boolean>>(DEFAULT_PREFS);
  const [togglingKey, setTogglingKey] = useState<ToggleKey | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setProfileLoading(true);
      setProfileError(null);
      const supabase = createClient();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (!cancelled) {
          setProfileError("You need to sign in to view settings.");
          setProfileLoading(false);
        }
        return;
      }
      if (!cancelled) setEmail(userData.user.email ?? "");

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (cancelled) return;

      if (profileErr || !profileData) {
        setProfileError("Could not load your profile. Try refreshing the page.");
        setProfileLoading(false);
        return;
      }

      setProfile(profileData);
      setDisplayName(profileData.display_name ?? "");
      setWalletAddress(profileData.wallet_address ?? "");
      setDaily(String(profileData.settings?.dailyLimit ?? 0));
      setMonthly(String(profileData.settings?.monthlyLimit ?? 0));
      setPrefs({
        requireConfirm: profileData.settings?.requireConfirm ?? true,
        autoTopup: profileData.settings?.autoTopup ?? false,
        streamResults: profileData.settings?.streamResults ?? true,
        saveHistory: profileData.settings?.saveHistory ?? true,
        dataSharing: profileData.settings?.dataSharing ?? false,
      });
      setProfileLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaveStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", profile.id);
    if (error) {
      setSaveStatus("error");
      return;
    }
    setProfile((p) => (p ? { ...p, display_name: displayName } : p));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  function isValidWalletAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  async function handleSaveWallet() {
    if (!profile) return;
    if (walletAddress && !isValidWalletAddress(walletAddress)) {
      setWalletStatus("invalid");
      return;
    }
    setWalletStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ wallet_address: walletAddress || null }).eq("id", profile.id);
    if (error) {
      setWalletStatus("error");
      return;
    }
    setProfile((p) => (p ? { ...p, wallet_address: walletAddress || null } : p));
    setWalletStatus("saved");
    setTimeout(() => setWalletStatus("idle"), 1500);
  }

  async function handleSaveLimits() {
    if (!profile) return;
    const dailyNum = Number(daily);
    const monthlyNum = Number(monthly);
    if (!Number.isFinite(dailyNum) || dailyNum < 0 || !Number.isFinite(monthlyNum) || monthlyNum < 0) {
      setLimitsStatus("invalid");
      return;
    }
    setLimitsStatus("saving");
    const supabase = createClient();
    const newSettings: ProfileSettings = { ...profile.settings, dailyLimit: dailyNum, monthlyLimit: monthlyNum };
    const { error } = await supabase.from("profiles").update({ settings: newSettings }).eq("id", profile.id);
    if (error) {
      setLimitsStatus("error");
      return;
    }
    setProfile((p) => (p ? { ...p, settings: newSettings } : p));
    setLimitsStatus("saved");
    setTimeout(() => setLimitsStatus("idle"), 1500);
  }

  async function handleToggle(key: ToggleKey) {
    if (!profile || togglingKey) return;
    const newValue = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newValue }));
    setTogglingKey(key);
    setToggleError(null);
    const supabase = createClient();
    const newSettings: ProfileSettings = { ...profile.settings, [key]: newValue };
    const { error } = await supabase.from("profiles").update({ settings: newSettings }).eq("id", profile.id);
    setTogglingKey(null);
    if (error) {
      setPrefs((p) => ({ ...p, [key]: !newValue }));
      setToggleError("Could not save that change. Try again.");
      setTimeout(() => setToggleError(null), 2500);
      return;
    }
    setProfile((p) => (p ? { ...p, settings: newSettings } : p));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleExport() {
    if (!profile) return;
    setExportStatus("exporting");
    try {
      const supabase = createClient();
      const [accountsRes, transactionsRes, alertsRes, apiKeysRes, webhooksRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("owner_id", profile.id),
        supabase.from("transactions").select("*"),
        supabase.from("alerts").select("*").eq("profile_id", profile.id),
        supabase.from("api_keys").select("*").eq("profile_id", profile.id),
        supabase.from("webhooks").select("*").eq("profile_id", profile.id),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        profile,
        accounts: accountsRes.data ?? [],
        transactions: transactionsRes.data ?? [],
        alerts: alertsRes.data ?? [],
        api_keys: apiKeysRes.data ?? [],
        webhooks: webhooksRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mansafi-export-${profile.handle}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus("idle");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleDeleteAccount() {
    if (!profile) return;
    if (deleteStatus !== "confirming") {
      setDeleteStatus("confirming");
      return;
    }
    setDeleteStatus("deleting");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) {
      setDeleteStatus("error");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (profileLoading) {
    return (
      <div style={{ padding: "32px 40px", maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ fontSize: "13px", color: "rgb(140,140,140)" }}>Loading settings...</p>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div style={{ padding: "32px 40px", maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ fontSize: "13px", color: "rgb(240,80,80)" }}>{profileError ?? "Could not load your profile."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: "720px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 510, letterSpacing: "-0.4px", color: "rgb(248,248,248)", margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: "14px", color: "rgb(140,140,140)", marginTop: "6px" }}>
          Manage your account, wallet, and preferences.
        </p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <Row label="Handle" sublabel="Your permanent MansaFi identity, cannot be changed">
          <span style={{ ...inputStyle, width: "180px", fontFamily: "monospace", opacity: 0.7, display: "inline-block", boxSizing: "border-box" }}>
            @{profile.handle}.mansafi
          </span>
        </Row>
        <Row label="Display name" sublabel="Shown on your public creator profile">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ ...inputStyle, width: "180px" }}
          />
        </Row>
        <Row label="Email" sublabel="For execution receipts and alerts">
          <input
            value={email}
            disabled
            style={{ ...inputStyle, width: "200px", opacity: 0.5, cursor: "not-allowed" }}
          />
        </Row>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            style={{
              backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
              boxShadow: "0 0 16px rgba(248,248,248,0.25)",
              border: "none", borderRadius: "9999px", padding: "8px 18px",
              fontSize: "13px", fontWeight: 600, cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
              opacity: saveStatus === "saving" ? 0.6 : 1,
            }}
          >
            {saveStatus === "saving" ? "Saving..." : "Save changes"}
          </button>
          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: "transparent", color: "rgb(140,140,140)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "8px 18px",
              fontSize: "13px", cursor: "pointer",
            }}
          >
            Sign out
          </button>
          {saveStatus === "saved" && (
            <span style={{ fontSize: "12px", color: "rgb(64,186,128)" }}>Saved</span>
          )}
          {saveStatus === "error" && (
            <span style={{ fontSize: "12px", color: "rgb(240,80,80)" }}>Something went wrong</span>
          )}
        </div>
      </Section>

      {/* Wallet */}
      <Section title="Connected wallet">
        <Row label="Wallet address" sublabel="Your Robinhood Chain wallet address for payouts and on-chain activity">
          <input
            value={walletAddress}
            onChange={(e) => { setWalletAddress(e.target.value); setWalletStatus("idle"); }}
            placeholder="e.g. 0x4A9e...c7F2"
            style={{ ...inputStyle, width: "240px", fontFamily: "monospace", fontSize: "11px" }}
          />
        </Row>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleSaveWallet}
            disabled={walletStatus === "saving"}
            style={{
              backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
              boxShadow: "0 0 16px rgba(248,248,248,0.25)",
              border: "none", borderRadius: "9999px", padding: "8px 18px",
              fontSize: "13px", fontWeight: 600, cursor: walletStatus === "saving" ? "not-allowed" : "pointer",
              opacity: walletStatus === "saving" ? 0.6 : 1,
            }}
          >
            {walletStatus === "saving" ? "Saving..." : "Save wallet"}
          </button>
          {walletStatus === "saved" && <span style={{ fontSize: "12px", color: "rgb(64,186,128)" }}>Saved</span>}
          {walletStatus === "invalid" && <span style={{ fontSize: "12px", color: "rgb(240,80,80)" }}>Invalid wallet address</span>}
          {walletStatus === "error" && <span style={{ fontSize: "12px", color: "rgb(240,80,80)" }}>Something went wrong</span>}
        </div>
      </Section>

      {/* Spending limits */}
      <Section title="Spending limits">
        <Row label="Daily limit" sublabel="Block sends once your daily total reaches this. Set to 0 for no limit">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>$</span>
            <input
              value={daily}
              onChange={(e) => { setDaily(e.target.value); setLimitsStatus("idle"); }}
              type="number"
              min={0}
              style={{ ...inputStyle, width: "80px" }}
            />
          </div>
        </Row>
        <Row label="Monthly limit" sublabel="Hard cap for the calendar month. Set to 0 for no limit">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "rgb(105,105,105)" }}>$</span>
            <input
              value={monthly}
              onChange={(e) => { setMonthly(e.target.value); setLimitsStatus("idle"); }}
              type="number"
              min={0}
              style={{ ...inputStyle, width: "80px" }}
            />
          </div>
        </Row>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleSaveLimits}
            disabled={limitsStatus === "saving"}
            style={{
              backgroundColor: "var(--mansafi-accent)", color: "#0A0A0A",
              boxShadow: "0 0 16px rgba(248,248,248,0.25)",
              border: "none", borderRadius: "9999px", padding: "8px 18px",
              fontSize: "13px", fontWeight: 600, cursor: limitsStatus === "saving" ? "not-allowed" : "pointer",
              opacity: limitsStatus === "saving" ? 0.6 : 1,
            }}
          >
            {limitsStatus === "saving" ? "Saving..." : "Save limits"}
          </button>
          {limitsStatus === "saved" && <span style={{ fontSize: "12px", color: "rgb(64,186,128)" }}>Saved</span>}
          {limitsStatus === "invalid" && <span style={{ fontSize: "12px", color: "rgb(240,80,80)" }}>Enter a valid non-negative amount</span>}
          {limitsStatus === "error" && <span style={{ fontSize: "12px", color: "rgb(240,80,80)" }}>Something went wrong</span>}
        </div>
        <Row label="Require confirmation" sublabel="Show a confirmation modal before any payment over $0.50">
          <Toggle on={prefs.requireConfirm} onToggle={() => handleToggle("requireConfirm")} disabled={togglingKey === "requireConfirm"} />
        </Row>
        <Row label="Auto top-up" sublabel="Automatically top up your primary account when its balance runs low">
          <Toggle on={prefs.autoTopup} onToggle={() => handleToggle("autoTopup")} disabled={togglingKey === "autoTopup"} />
        </Row>
      </Section>

      {/* Execution preferences */}
      <Section title="Execution preferences">
        <Row label="Stream results" sublabel="Show output as it arrives instead of waiting for completion">
          <Toggle on={prefs.streamResults} onToggle={() => handleToggle("streamResults")} disabled={togglingKey === "streamResults"} />
        </Row>
        <Row label="Save execution history" sublabel="Store all run outputs and receipts in your account">
          <Toggle on={prefs.saveHistory} onToggle={() => handleToggle("saveHistory")} disabled={togglingKey === "saveHistory"} />
        </Row>
        <Row label="Share anonymised usage data" sublabel="Help improve agent quality. No input content is shared.">
          <Toggle on={prefs.dataSharing} onToggle={() => handleToggle("dataSharing")} disabled={togglingKey === "dataSharing"} />
        </Row>
        {toggleError && (
          <div style={{ padding: "10px 20px", fontSize: "12px", color: "rgb(240,80,80)" }}>{toggleError}</div>
        )}
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <Row label="Export all data" sublabel="Download a full JSON export of your accounts, transactions, alerts, API keys, and webhooks">
          <button
            onClick={handleExport}
            disabled={exportStatus === "exporting"}
            style={{
              fontSize: "11px", color: "rgb(140,140,140)", backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px",
              padding: "4px 12px", cursor: exportStatus === "exporting" ? "not-allowed" : "pointer",
              opacity: exportStatus === "exporting" ? 0.6 : 1,
            }}
          >
            {exportStatus === "exporting" ? "Exporting..." : "Export"}
          </button>
        </Row>
        {exportStatus === "error" && (
          <div style={{ padding: "0 20px 10px", fontSize: "12px", color: "rgb(240,80,80)" }}>
            Something went wrong preparing your export. Try again.
          </div>
        )}
        <div style={{ padding: "14px 20px" }}>
          {profile.deletion_requested_at ? (
            <p style={{ fontSize: "12px", color: "rgb(240,80,80)" }}>
              Account deletion requested on {new Date(profile.deletion_requested_at).toLocaleDateString()}. Contact support to cancel.
            </p>
          ) : (
            <>
              <p style={{ fontSize: "11px", color: "rgb(105,105,105)", marginBottom: "10px", maxWidth: "480px" }}>
                Requesting deletion signs you out immediately and schedules your account and all its data for
                permanent removal within 30 days. Contact support before then if you change your mind.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteStatus === "deleting"}
                  style={{
                    fontSize: "12px", color: "rgb(240,80,80)", backgroundColor: "transparent",
                    border: "1px solid rgba(240,80,80,0.25)", borderRadius: "9999px",
                    padding: "7px 16px", cursor: deleteStatus === "deleting" ? "not-allowed" : "pointer",
                    opacity: deleteStatus === "deleting" ? 0.6 : 1,
                  }}
                >
                  {deleteStatus === "deleting"
                    ? "Deleting..."
                    : deleteStatus === "confirming"
                    ? "Click again to confirm"
                    : "Delete account"}
                </button>
                {deleteStatus === "confirming" && (
                  <button
                    onClick={() => setDeleteStatus("idle")}
                    style={{
                      fontSize: "12px", color: "rgb(140,140,140)", backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.15)", borderRadius: "9999px",
                      padding: "7px 16px", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
                {deleteStatus === "error" && (
                  <span style={{ fontSize: "12px", color: "rgb(240,80,80)" }}>Something went wrong</span>
                )}
              </div>
            </>
          )}
        </div>
      </Section>
    </div>
  );
}
