import { Reveal } from "@/components/Reveal";

const FAQS = [
  {
    q: "Is MansaFi anonymous?",
    a: "No, and deliberately so. Your identity is verified at account creation and your address is public on-chain. What stays private is the amount moving through your account: confidentiality, not anonymity.",
  },
  {
    q: "Do I need to understand blockchain to use it?",
    a: "No. You sign up with an email and a passkey, the same way you would set up Face ID for any app. Keys, encryption, and settlement are handled for you, invisibly and automatically.",
  },
  {
    q: "How do agent accounts work?",
    a: "Every agent gets its own smart account on Robinhood Chain and its own Agent ID under your parent account. It transacts under a spend policy you define: daily limits, allowed recipients, time windows, and an optional human approval threshold.",
  },
  {
    q: "Can an agent spend beyond what I authorized?",
    a: "No. Spend policy checks happen before a transaction is ever signed, not as a review after the fact. A policy-violating transaction is never even constructed.",
  },
  {
    q: "What if I need to prove a payment to an auditor?",
    a: "Share a view key. It grants read-only access to exactly the transfers you scope, nothing else, and you can revoke it at any time. Custody never leaves your hands.",
  },
  {
    q: "What does it cost?",
    a: "Nothing during beta. You pay only the underlying Robinhood Chain gas fee, typically a fraction of a cent, and even that is covered automatically from your ETH reserve.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" style={{ backgroundColor: "#0A0A0A", position: "relative" }}>
      <div className="fx-divider" />
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
        style={{ maxWidth: "1392px", margin: "0 auto", padding: "clamp(72px, 10vw, 128px) clamp(20px, 6vw, 96px)", gap: "clamp(32px, 5vw, 80px)" }}
      >
        <Reveal>
          <div className="fx-overline" style={{ marginBottom: "18px" }}>05 / Questions</div>
          <h2 className="fx-h2">Straight answers.</h2>
          <p style={{ fontSize: "15px", lineHeight: "24px", color: "rgb(140,140,140)", margin: "20px 0 0", maxWidth: "360px" }}>
            More in the{" "}
            <a href="https://docs.mansafi.xyz/resources/faq" target="_blank" rel="noopener noreferrer" style={{ color: "rgb(248,248,248)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              full FAQ
            </a>
            .
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="fx-faq">
            {FAQS.map((f) => (
              <details key={f.q} className="fx-faq-item">
                <summary className="fx-faq-q">
                  <span>{f.q}</span>
                  <span className="fx-faq-icon" aria-hidden="true" />
                </summary>
                <p className="fx-faq-a">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
