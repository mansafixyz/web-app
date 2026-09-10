import { Reveal } from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Open an account",
    body: "Email and a passkey. Identity is verified once, keys are generated on your device, and nothing about your balances ever leaves it in plaintext.",
    meta: "Under two minutes",
  },
  {
    n: "02",
    title: "Fund it with USDG",
    body: "Deposit Global Dollar on Robinhood Chain or top up from a wallet. A small ETH reserve covers gas automatically so you never think about fees.",
    meta: "Next-block credit",
  },
  {
    n: "03",
    title: "Send privately. Delegate to agents.",
    body: "Pay any @handle with an encrypted amount, or spin up an agent account with a spend policy and let it pay for itself over x402.",
    meta: "100ms settlement",
  },
];

export function HowItWorksSection() {
  return (
    <section style={{ backgroundColor: "#0A0A0A", position: "relative" }}>
      <div className="fx-divider" />
      <div style={{ maxWidth: "1392px", margin: "0 auto", padding: "clamp(72px, 10vw, 128px) clamp(20px, 6vw, 96px)" }}>
        <Reveal>
          <div className="fx-overline" style={{ marginBottom: "18px" }}>03 / How it works</div>
          <h2 className="fx-h2" style={{ maxWidth: "720px" }}>
            From sign-up to your first private transfer in three steps.
          </h2>
        </Reveal>

        <div className="fx-steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="fx-step">
                <div className="fx-step-rail">
                  <span className="fx-step-num">{s.n}</span>
                  <span className="fx-step-line" aria-hidden="true" />
                </div>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 510, color: "rgb(248,248,248)", margin: 0, letterSpacing: "-0.3px" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: "15px", lineHeight: "24px", color: "rgb(140,140,140)", margin: "12px 0 0" }}>{s.body}</p>
                  <div className="fx-overline" style={{ marginTop: "18px", color: "rgb(105,105,105)" }}>
                    {s.meta}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
