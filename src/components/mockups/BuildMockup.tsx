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

export function BuildMockup() {
  type TraceLine = {
    time: string;
    text: string;
    kind: "req" | "deny" | "policy" | "check" | "out" | "ok";
    chip?: string;
  };

  const trace: TraceLine[] = [
    { time: "14:32:01.204", text: "GET api.marketfeed.io/v1/market-data", kind: "req" },
    { time: "14:32:01.219", text: "response", kind: "deny", chip: "402 Payment Required" },
    { time: "14:32:01.220", text: "x402 quote · 0.25 USDG per request", kind: "out" },
    { time: "14:32:01.221", text: "POLICY CHECK · spend policy v3", kind: "policy" },
    { time: "", text: "max per request · 0.25 <= 5.00", kind: "check" },
    { time: "", text: "domain api.marketfeed.io allowlisted", kind: "check" },
    { time: "", text: "daily budget · 12.40 / 50.00", kind: "check" },
    { time: "14:32:01.240", text: "confidential transfer submitted · amount hidden from observers", kind: "out" },
    { time: "14:32:01.341", text: "settled · 1 block · 100ms", kind: "out" },
    { time: "14:32:01.355", text: "GET retry with X-Payment header", kind: "req" },
    { time: "14:32:01.402", text: "response · 4.1 KB payload", kind: "ok", chip: "200 OK" },
  ];

  const lineColor = (kind: TraceLine["kind"]): string => {
    switch (kind) {
      case "req":
        return "rgb(248,248,248)";
      case "deny":
        return "rgb(140,140,140)";
      case "policy":
        return "rgb(140,140,140)";
      case "check":
        return "rgb(64,186,128)";
      case "ok":
        return "var(--mansafi-accent)";
      default:
        return "rgb(140,140,140)";
    }
  };

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
        <span className="ml-2" style={micro}>datafetch.mansafi</span>
        <span
          className="rounded px-1.5 py-0.5"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--mansafi-accent)",
            background: "rgba(248,248,248,0.08)",
            border: "1px solid rgba(248,248,248,0.25)",
          }}
        >
          Autonomous
        </span>
        <span className="ml-auto" style={{ ...micro, fontSize: "9px" }}>no human in the loop</span>
      </div>

      {/* Trace meta bar */}
      <div className="flex items-center gap-4 px-4 py-2 flex-shrink-0" style={{ borderBottom: innerBorder }}>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "rgb(64,186,128)", boxShadow: "0 0 6px rgba(64,186,128,0.5)" }}
          />
          <span style={{ ...micro, fontSize: "9px" }}>x402 payment trace · live</span>
        </div>
        <span className="ml-auto text-[9px] font-mono" style={{ color: "rgb(105,105,105)" }}>
          session 0x4c19...ab27
        </span>
      </div>

      {/* Console */}
      <div className="flex-1 min-h-0 p-4 overflow-auto" style={{ background: "#151515" }}>
        {trace.map((line, i) => (
          <div key={i} className="flex items-baseline gap-2.5 py-[3px]">
            <span
              className="w-[84px] flex-shrink-0 text-[9px]"
              style={{ fontFamily: "var(--font-mono)", color: "rgba(105,105,105,0.6)" }}
            >
              {line.time}
            </span>
            {line.kind === "check" ? (
              <span
                className="text-[10px] leading-[16px] pl-3"
                style={{ fontFamily: "var(--font-mono)", color: "rgb(64,186,128)" }}
              >
                ✓ {line.text}
              </span>
            ) : (
              <span
                className="text-[10px] leading-[16px] flex items-baseline gap-2 flex-wrap"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: lineColor(line.kind),
                  ...(line.kind === "ok" ? { textShadow: "0 0 16px rgba(248,248,248,0.35)" } : {}),
                }}
              >
                {line.text}
                {line.chip && (
                  <span
                    className="rounded px-1.5 py-px"
                    style={
                      line.kind === "ok"
                        ? {
                            fontSize: "8px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--mansafi-accent)",
                            background: "rgba(248,248,248,0.08)",
                            border: "1px solid rgba(248,248,248,0.25)",
                            textShadow: "none",
                          }
                        : {
                            fontSize: "8px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "rgb(240,140,40)",
                            background: "rgba(240,140,40,0.1)",
                            border: "1px solid rgba(240,140,40,0.2)",
                          }
                    }
                  >
                    {line.chip}
                  </span>
                )}
              </span>
            )}
          </div>
        ))}
        <div className="flex items-baseline gap-2.5 py-[3px]">
          <span className="w-[84px] flex-shrink-0" />
          <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "rgb(248,248,248)" }}>
            _
          </span>
        </div>
      </div>

      {/* Footer summary */}
      <div className="flex items-center gap-4 px-4 py-2.5 flex-shrink-0" style={{ borderTop: innerBorder }}>
        <span style={{ ...micro, fontSize: "8px" }}>Paid</span>
        <span className="text-[10px] font-mono" style={{ color: "rgb(248,248,248)" }}>0.25 USDG</span>
        <span style={{ ...micro, fontSize: "8px" }}>Budget left</span>
        <span className="text-[10px] font-mono" style={{ color: "rgb(248,248,248)" }}>$37.35</span>
        <span className="ml-auto text-[9px]" style={{ color: "rgb(105,105,105)" }}>
          Policy enforced on-chain. Every request pays its own way.
        </span>
      </div>
    </div>
  );
}
