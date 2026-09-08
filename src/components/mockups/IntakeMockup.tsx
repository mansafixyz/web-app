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

const typeBadge: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "8px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgb(140,140,140)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "4px",
  padding: "2px 6px",
};

export function IntakeMockup() {
  const humanActivity = [
    { label: "vendor.mansafi", dir: "sent", amount: "•••••", time: "2h ago" },
    { label: "payroll.mansafi", dir: "received", amount: "•••••", time: "1d ago" },
    { label: "datafetch.mansafi", dir: "funded", amount: "•••••", time: "3d ago" },
  ];

  const policyRows = [
    { label: "Max per request", value: "$5.00" },
    { label: "Daily limit", value: "$50.00" },
    { label: "Allowed domains", value: "2" },
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
        <span className="ml-2" style={micro}>Accounts</span>
        <span className="ml-auto" style={{ ...micro, fontSize: "9px" }}>2 principals · 1 protocol</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Human account panel */}
        <div className="flex-1 min-w-0 p-4 flex flex-col gap-3 overflow-auto">
          <div className="flex items-center justify-between">
            <span style={typeBadge}>Human</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "rgb(64,186,128)", boxShadow: "0 0 6px rgba(64,186,128,0.5)" }}
            />
          </div>

          <div>
            <div className="text-[14px] font-medium" style={{ color: "rgb(248,248,248)" }}>
              @alice.mansafi
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span
                style={{
                  ...typeBadge,
                  color: "rgb(64,186,128)",
                  background: "rgba(64,186,128,0.1)",
                  border: "1px solid rgba(64,186,128,0.25)",
                }}
              >
                Confidential tier
              </span>
              <span style={typeBadge}>Safe multisig 2-of-3</span>
            </div>
          </div>

          {/* Balance */}
          <div
            className="p-3"
            style={{ background: "#151515", border: innerBorder, borderRadius: "10px" }}
          >
            <div className="mb-1" style={{ ...micro, fontSize: "8px" }}>Balance</div>
            <div className="flex items-end gap-1.5">
              <span className="text-[22px] font-medium leading-none" style={{ color: "rgb(248,248,248)" }}>
                •••••
              </span>
              <span style={{ ...micro, fontSize: "9px" }}>USDG</span>
            </div>
            <div className="text-[9px] mt-1.5" style={{ color: "rgb(105,105,105)" }}>
              Visible with your view key only
            </div>
          </div>

          {/* Recent activity */}
          <div className="flex-1">
            <div className="mb-2" style={{ ...micro, fontSize: "8px" }}>Recent activity</div>
            {humanActivity.map((a) => (
              <div
                key={a.label + a.time}
                className="flex items-center gap-2 py-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] truncate" style={{ color: "rgb(248,248,248)" }}>{a.label}</div>
                  <div style={{ ...micro, fontSize: "8px" }}>{a.dir}</div>
                </div>
                <span className="text-[10px] font-mono" style={{ color: "rgb(140,140,140)" }}>{a.amount}</span>
                <span className="text-[9px] flex-shrink-0" style={{ color: "rgb(105,105,105)" }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center divider */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ width: "30px", borderLeft: innerBorder, borderRight: innerBorder }}
        >
          <span
            style={{
              ...micro,
              fontSize: "8px",
              letterSpacing: "0.34em",
              writingMode: "vertical-rl",
            }}
          >
            One protocol
          </span>
        </div>

        {/* Agent account panel */}
        <div className="flex-1 min-w-0 p-4 flex flex-col gap-3 overflow-auto">
          <div className="flex items-center justify-between">
            <span style={typeBadge}>Agent</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "rgb(64,186,128)", boxShadow: "0 0 6px rgba(64,186,128,0.5)" }}
            />
          </div>

          <div>
            <div className="text-[14px] font-medium" style={{ color: "rgb(248,248,248)" }}>
              datafetch.mansafi
            </div>
            <div className="text-[9px] font-mono mt-1" style={{ color: "rgb(105,105,105)" }}>
              owned by @alice.mansafi
            </div>
          </div>

          {/* Spend policy */}
          <div
            className="p-3"
            style={{ background: "#151515", border: innerBorder, borderRadius: "10px" }}
          >
            <div className="mb-2" style={{ ...micro, fontSize: "8px" }}>Spend policy</div>
            {policyRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-1.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span className="text-[9px]" style={{ color: "rgb(140,140,140)" }}>{row.label}</span>
                <span className="text-[10px] font-mono" style={{ color: "rgb(248,248,248)" }}>{row.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[9px]" style={{ color: "rgb(140,140,140)" }}>Policy source</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--mansafi-accent)",
                  background: "rgba(248,248,248,0.08)",
                  border: "1px solid rgba(248,248,248,0.25)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                }}
              >
                Enforced on-chain
              </span>
            </div>
          </div>

          {/* Parent budget */}
          <div className="flex-1">
            <div className="mb-2" style={{ ...micro, fontSize: "8px" }}>Parent budget · today</div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: "25%",
                  background: "rgba(248,248,248,0.7)",
                  boxShadow: "0 0 10px rgba(248,248,248,0.2)",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] font-mono" style={{ color: "rgb(140,140,140)" }}>
                $12.40 of $50.00
              </span>
              <span className="text-[9px]" style={{ color: "rgb(105,105,105)" }}>resets 00:00 UTC</span>
            </div>
            <div className="text-[9px] mt-3 leading-relaxed" style={{ color: "rgb(105,105,105)" }}>
              Overspend attempts revert at the protocol level. No custodian, no override.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
