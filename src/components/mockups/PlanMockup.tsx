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

export function PlanMockup() {
  const chainRows = [
    { label: "Sender", value: "0x7fA2...e91c", tag: "stealth" },
    { label: "Recipient", value: "0x3bD8...a04f", tag: "stealth" },
    { label: "Amount", value: "███████", tag: null },
    { label: "Memo", value: "███████████", tag: null },
  ];

  const holderRows = [
    { label: "From", value: "alice.mansafi" },
    { label: "To", value: "vendor.mansafi" },
    { label: "Fee", value: "$0.02" },
    { label: "Memo", value: "Invoice #2210" },
    { label: "Submitted", value: "Apr 26 · 14:32:08" },
    { label: "Settled", value: "Apr 26 · 14:32:09" },
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
        <span className="ml-2" style={micro}>Transfer · txn_7a2bk1</span>
      </div>

      {/* Transfer summary bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: innerBorder }}
      >
        <span className="text-[11px] font-medium" style={{ color: "rgb(248,248,248)" }}>
          alice.mansafi
        </span>
        <span className="text-[11px]" style={{ color: "rgb(105,105,105)" }}>→</span>
        <span className="text-[11px] font-medium" style={{ color: "rgb(248,248,248)" }}>
          vendor.mansafi
        </span>
        <span
          className="ml-auto rounded px-1.5 py-0.5"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgb(64,186,128)",
            background: "rgba(64,186,128,0.1)",
            border: "1px solid rgba(64,186,128,0.25)",
          }}
        >
          Settled
        </span>
      </div>

      {/* Two views */}
      <div className="flex flex-1 min-h-0">
        {/* What the chain sees */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ borderRight: innerBorder }}>
          <div className="px-4 py-2" style={{ borderBottom: innerBorder }}>
            <span style={{ ...micro, fontSize: "9px" }}>What the chain sees</span>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
            {chainRows.map((row) => (
              <div key={row.label}>
                <div className="mb-0.5" style={{ ...micro, fontSize: "8px" }}>{row.label}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono" style={{ color: "rgb(140,140,140)" }}>
                    {row.value}
                  </span>
                  {row.tag && (
                    <span
                      className="rounded px-1"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "7px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgb(105,105,105)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {row.tag}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Ciphertext block */}
            <div>
              <div className="mb-1" style={{ ...micro, fontSize: "8px" }}>ElGamal ciphertext</div>
              <div
                className="rounded p-2"
                style={{ background: "rgba(255,255,255,0.03)", border: innerBorder }}
              >
                <div className="text-[8px] font-mono leading-relaxed break-all" style={{ color: "rgb(105,105,105)" }}>
                  0x8f3a2c1d 9e4b7f6a 0c5d8e2f
                  <br />
                  0x1a4b7c9d 3e6f2a1b 8c5d0e4f
                  <br />
                  0x6b2e9f1a 7c43d8e5 b0f4a29c
                </div>
              </div>
            </div>

            {/* zk proof */}
            <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: innerBorder }}>
              <span style={{ ...micro, fontSize: "8px" }}>zk range proof</span>
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgb(64,186,128)",
                  background: "rgba(64,186,128,0.1)",
                  border: "1px solid rgba(64,186,128,0.25)",
                }}
              >
                ✓ Verified
              </span>
            </div>
          </div>
        </div>

        {/* What you see */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: innerBorder }}>
            <span style={{ ...micro, fontSize: "9px" }}>What you see</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--mansafi-accent)",
                background: "rgba(248,248,248,0.08)",
                border: "1px solid rgba(248,248,248,0.25)",
                boxShadow: "0 0 16px rgba(248,248,248,0.12)",
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
                <path d="M12.5 12H21M18 12v3.5M15 12v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              View key
            </span>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">
            {/* Decrypted amount */}
            <div
              className="p-3"
              style={{ background: "#151515", border: innerBorder, borderRadius: "10px" }}
            >
              <div className="mb-1" style={{ ...micro, fontSize: "8px" }}>Amount</div>
              <div className="flex items-end gap-1.5">
                <span className="text-[22px] font-medium leading-none" style={{ color: "rgb(248,248,248)" }}>
                  $1,240.50
                </span>
                <span style={{ ...micro, fontSize: "9px" }}>USDG</span>
              </div>
            </div>

            {holderRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span style={{ ...micro, fontSize: "8px" }}>{row.label}</span>
                <span className="text-[10px]" style={{ color: "rgb(248,248,248)" }}>{row.value}</span>
              </div>
            ))}

            <div className="mt-auto pt-3 text-[9px] leading-relaxed" style={{ borderTop: innerBorder, color: "rgb(105,105,105)" }}>
              Decryption happens client side. The chain never learns the plaintext.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
