import Link from "next/link";
import { Reveal } from "@/components/Reveal";

/* Hand-tokenised so the highlighting stays monochrome and dependency-free. */
type Tok = { children: React.ReactNode };
const K = ({ children }: Tok) => <span className="tok-k">{children}</span>;
const S = ({ children }: Tok) => <span className="tok-s">{children}</span>;
const C = ({ children }: Tok) => <span className="tok-c">{children}</span>;
const F = ({ children }: Tok) => <span className="tok-f">{children}</span>;
const P = ({ children }: Tok) => <span className="tok-p">{children}</span>;

function Code() {
  return (
    <pre className="fx-code-body">
      <code>
        <K>import</K> {"{ "}<F>MansaFi</F>{" }"} <K>from</K> <S>&quot;@mansafi/sdk&quot;</S>;{"\n"}
        {"\n"}
        <K>const</K> bank = <K>new</K> <F>MansaFi</F>({"{ "}apiKey: process.env.<P>MANSAFI_API_KEY</P>{" }"});{"\n"}
        {"\n"}
        <C>{"// The amount is encrypted on-chain. The response confirms"}</C>{"\n"}
        <C>{"// settlement but never echoes the amount in plaintext."}</C>{"\n"}
        <K>const</K> transfer = <K>await</K> bank.transfers.<F>create</F>({"{"}{"\n"}
        {"  "}to: <S>&quot;@vendor&quot;</S>,{"\n"}
        {"  "}amount: <S>&quot;125.00&quot;</S>,{"\n"}
        {"  "}asset: <S>&quot;USDG&quot;</S>,{"\n"}
        {"  "}memo: <S>&quot;Invoice #4471&quot;</S>,{"\n"}
        {"}"});{"\n"}
        {"\n"}
        <C>{"// Give an agent its own account and a hard budget."}</C>{"\n"}
        <K>const</K> agent = <K>await</K> bank.agents.<F>create</F>({"{"}{"\n"}
        {"  "}handle: <S>&quot;datafetch&quot;</S>,{"\n"}
        {"  "}policy: {"{ "}dailyLimit: <S>&quot;50.00&quot;</S>, maxPerRequest: <S>&quot;5.00&quot;</S>{" }"},{"\n"}
        {"}"});{"\n"}
        {"\n"}
        console.<F>log</F>(transfer.status, agent.address);
      </code>
    </pre>
  );
}

const POINTS = [
  {
    title: "Fully typed, idempotent by default",
    body: "Every create call carries an idempotency key, so retries are safe across process restarts.",
  },
  {
    title: "Webhooks you can trust",
    body: "Signed events for every settlement, policy hit, and agent action, verified with one helper.",
  },
  {
    title: "Test and live keys, no mode flag",
    body: "The client infers the environment from the key prefix. There is nothing to misconfigure.",
  },
];

export function DeveloperSection() {
  return (
    <section id="developers" style={{ backgroundColor: "#0A0A0A", position: "relative", overflow: "hidden" }}>
      <div className="fx-divider" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 40% 50% at 80% 50%, rgba(248,248,248,0.05), transparent 65%)" }}
      />
      <div
        className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        style={{ maxWidth: "1392px", margin: "0 auto", padding: "clamp(72px, 10vw, 128px) clamp(20px, 6vw, 96px)", gap: "clamp(40px, 5vw, 80px)", alignItems: "center" }}
      >
        <Reveal>
          <div className="fx-overline" style={{ marginBottom: "18px" }}>04 / For developers</div>
          <h2 className="fx-h2">
            Ship a private bank
            <br />
            <span className="fx-accent-text">in an afternoon.</span>
          </h2>
          <p style={{ fontSize: "16px", lineHeight: "26px", color: "rgb(140,140,140)", margin: "24px 0 0", maxWidth: "440px" }}>
            A thin, typed SDK over a REST API. Accounts, confidential transfers, agent accounts with spend policies,
            and webhooks, all in one client.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "36px" }}>
            {POINTS.map((p) => (
              <div key={p.title} style={{ display: "flex", gap: "14px" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: "22px",
                    height: "22px",
                    flexShrink: 0,
                    borderRadius: "7px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    display: "grid",
                    placeItems: "center",
                    marginTop: "1px",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="rgb(248,248,248)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6.5 5 9l4.5-6" />
                  </svg>
                </span>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 510, color: "rgb(248,248,248)" }}>{p.title}</div>
                  <div style={{ fontSize: "14px", lineHeight: "22px", color: "rgb(140,140,140)", marginTop: "4px" }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center" style={{ gap: "12px", marginTop: "36px" }}>
            <a href="https://docs.mansafi.xyz" target="_blank" rel="noopener noreferrer" className="fx-btn-primary">
              Read the docs
            </a>
            <Link href="/signup" className="fx-btn-ghost">
              Get an API key
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="fx-code">
            <div className="fx-code-head">
              <div style={{ display: "flex", gap: "6px" }}>
                <span className="fx-dot" />
                <span className="fx-dot" />
                <span className="fx-dot" />
              </div>
              <span className="fx-code-tab">quickstart.ts</span>
              <span className="fx-code-cmd">npm i @mansafi/sdk</span>
            </div>
            <Code />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
