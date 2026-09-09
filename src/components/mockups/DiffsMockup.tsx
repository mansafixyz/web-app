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

export function DiffsMockup() {
  const routes = [
    { addr: "0x7f3a...c19b", amount: "███" },
    { addr: "0x2e8d...41f6", amount: "███" },
    { addr: "0x9c04...b7e2", amount: "███" },
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
        <span className="ml-2" style={micro}>MPP Router</span>
        <span className="ml-auto" style={{ ...micro, fontSize: "9px" }}>multi-path privacy</span>
      </div>

      {/* Route diagram: the SVG and the card row are both pinned to the same
          box so the connector endpoints line up with the card columns even
          though the frame's height comes from min-height. */}
      <div className="flex-1 min-h-0 relative">
        {/* Connecting paths */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[
            "M 28 50 C 34 50, 34 13, 40 13",
            "M 28 50 C 34 50, 34 50, 40 50",
            "M 28 50 C 34 50, 34 87, 40 87",
            "M 60 13 C 66 13, 66 50, 72 50",
            "M 60 50 C 66 50, 66 50, 72 50",
            "M 60 87 C 66 87, 66 50, 72 50",
          ].map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex items-stretch justify-between gap-2 px-4 py-6">
          {/* Sender */}
          <div className="flex flex-col justify-center" style={{ width: "27%" }}>
            <div
              className="p-3"
              style={{ background: "#151515", border: innerBorder, borderRadius: "10px" }}
            >
              <div className="mb-1" style={{ ...micro, fontSize: "8px" }}>Sender</div>
              <div className="text-[10px] font-medium truncate" style={{ color: "rgb(248,248,248)" }}>
                alice.mansafi
              </div>
              <div
                className="text-[16px] font-medium mt-1.5"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--mansafi-accent)",
                  textShadow: "0 0 16px rgba(248,248,248,0.3)",
                }}
              >
                $4.00
              </div>
              <div className="text-[8px] mt-1" style={{ color: "rgb(105,105,105)" }}>
                visible only to you
              </div>
              <div className="text-[8px] font-mono mt-0.5" style={{ color: "rgb(105,105,105)" }}>
                observers see •••••
              </div>
            </div>
          </div>

          {/* Stealth routes */}
          <div className="flex flex-col justify-between py-1" style={{ width: "23%" }}>
            {routes.map((r) => (
              <div
                key={r.addr}
                className="p-2"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: innerBorder,
                  borderRadius: "8px",
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ ...micro, fontSize: "7px" }}>Stealth</span>
                  <span className="text-[8px] font-mono" style={{ color: "rgb(140,140,140)" }}>{r.amount}</span>
                </div>
                <div className="text-[8px] font-mono truncate" style={{ color: "rgb(105,105,105)" }}>
                  {r.addr}
                </div>
                <div className="text-[7px] mt-0.5" style={{ color: "rgba(105,105,105,0.7)" }}>
                  one-time address
                </div>
              </div>
            ))}
          </div>

          {/* Recipient */}
          <div className="flex flex-col justify-center" style={{ width: "27%" }}>
            <div
              className="p-3"
              style={{ background: "#151515", border: innerBorder, borderRadius: "10px" }}
            >
              <div className="mb-1" style={{ ...micro, fontSize: "8px" }}>Recipient</div>
              <div className="text-[10px] font-medium truncate" style={{ color: "rgb(248,248,248)" }}>
                vendor.mansafi
              </div>
              <div className="mt-1.5">
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
                  ✓ Settled
                </span>
              </div>
              <div className="text-[8px] mt-1.5" style={{ color: "rgb(105,105,105)" }}>
                full amount, one balance
              </div>
              <div className="text-[8px] font-mono mt-0.5" style={{ color: "rgb(105,105,105)" }}>
                routes never linked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Atomic settlement bar */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div
          className="flex items-center gap-3 px-3 py-2.5"
          style={{
            background: "#151515",
            border: innerBorder,
            borderLeft: "2px solid rgba(248,248,248,0.7)",
            borderRadius: "8px",
          }}
        >
          <span style={{ ...micro, fontSize: "8px" }}>Atomic settlement</span>
          <span className="text-[9px] font-mono truncate" style={{ color: "rgb(248,248,248)" }}>
            0x9e2d6b0a4f81c53e7a9d2f60...
          </span>
          <span
            className="ml-auto flex-shrink-0"
            style={{ ...micro, fontSize: "8px", color: "rgb(140,140,140)" }}
          >
            3 routes · 1 block · unlinkable
          </span>
        </div>
      </div>
    </div>
  );
}
