import type { CSSProperties } from "react";

const frame: CSSProperties = {
  background: "#101010",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "14px",
  boxShadow:
    "0 -1px 0 rgba(248,248,248,0.2), 0 -12px 64px rgba(248,248,248,0.06), 0 24px 64px rgba(0,0,0,0.5)",
};

const micro: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgb(105,105,105)",
};

const innerBorder = "1px solid rgba(255,255,255,0.07)";

export function MonitorMockup() {
  const grantRows = [
    { label: "Auditor", value: "auditor.mansafi" },
    { label: "Scope", value: "Q1 2026 transfers" },
    { label: "Access", value: "Read-only" },
    { label: "Expires", value: "Apr 30 2026" },
  ];

  const checks = [
    { text: "Existence proof on-chain", detail: "142 of 142 transfers anchored" },
    { text: "ZK range proofs valid", detail: "verified without decryption" },
    { text: "Amounts decrypted for auditor only", detail: "scoped view key, client side" },
    { text: "Nothing exposed publicly", detail: "chain state unchanged" },
  ];

  return (
    <div className="w-full h-full min-h-[600px] overflow-hidden flex flex-col" style={frame}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2" style={micro}>Disclosure Center</span>
        <span className="ml-auto" style={{ ...micro, fontSize: "9px" }}>142 transfers in scope</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* View key grant */}
        <div
          className="flex flex-col p-4 gap-3 overflow-auto"
          style={{ width: "46%", borderRight: innerBorder }}
        >
          <div
            className="p-3 flex flex-col gap-2.5"
            style={{ background: "#151515", border: innerBorder, borderRadius: "10px" }}
          >
            <div className="flex items-center justify-between">
              <span style={{ ...micro, fontSize: "8px" }}>View key grant</span>
              <span
                className="rounded px-1.5 py-0.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgb(140,140,140)",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Revocable
              </span>
            </div>

            {grantRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-1"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span className="text-[9px]" style={{ color: "rgb(140,140,140)" }}>{row.label}</span>
                <span className="text-[10px] font-mono" style={{ color: "rgb(248,248,248)" }}>{row.value}</span>
              </div>
            ))}

            <button
              className="w-full text-center rounded-md py-2 mt-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "#0A0A0A",
                background: "var(--mansafi-accent)",
                border: "none",
                boxShadow: "0 0 20px rgba(248,248,248,0.25)",
              }}
            >
              Share view key
            </button>
            <div className="text-[8px] text-center" style={{ color: "rgb(105,105,105)" }}>
              Grants decrypt access to scoped transfers only. Revoke anytime.
            </div>
          </div>

          <div className="text-[9px] leading-relaxed mt-auto" style={{ color: "rgb(105,105,105)" }}>
            The auditor sees exactly what you disclose. Everyone else sees ciphertext.
          </div>
        </div>

        {/* Verification checklist */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-4 py-2" style={{ borderBottom: innerBorder }}>
            <span style={{ ...micro, fontSize: "9px" }}>Verification</span>
          </div>

          <div className="flex-1 overflow-auto">
            {checks.map((c) => (
              <div
                key={c.text}
                className="flex items-start gap-2.5 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0 rounded-full"
                  style={{
                    width: "14px",
                    height: "14px",
                    marginTop: "1px",
                    fontSize: "8px",
                    color: "rgb(64,186,128)",
                    background: "rgba(64,186,128,0.1)",
                    border: "1px solid rgba(64,186,128,0.25)",
                  }}
                >
                  ✓
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px]" style={{ color: "rgb(248,248,248)" }}>{c.text}</div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgb(105,105,105)" }}>
                    {c.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Export row */}
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: innerBorder }}>
            <div
              className="flex items-center gap-2.5 px-3 py-2"
              style={{ background: "rgba(255,255,255,0.03)", border: innerBorder, borderRadius: "8px" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ color: "rgb(105,105,105)" }}>
                <path
                  d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <span className="text-[9px] font-mono truncate" style={{ color: "rgb(248,248,248)" }}>
                audit-export-q1.csv
              </span>
              <span className="text-[9px] font-mono" style={{ color: "rgb(105,105,105)" }}>38 KB</span>
              <span
                className="ml-auto rounded px-1.5 py-0.5 flex-shrink-0"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgb(64,186,128)",
                  background: "rgba(64,186,128,0.1)",
                  border: "1px solid rgba(64,186,128,0.25)",
                }}
              >
                Signed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
