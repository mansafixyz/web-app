import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";

export function CTASection() {
  return (
    <section style={{ background: "#0A0A0A", position: "relative", overflow: "hidden" }}>
      <div className="fx-divider" />
      {/* Glow + grid backdrop */}
      <div aria-hidden="true" className="absolute inset-0 fx-grid-bg" style={{ transform: "scaleY(-1)" }} />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 50% at 50% 110%, rgba(248,248,248,0.09), transparent 65%)",
        }}
      />

      <div
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          padding: "clamp(96px, 16vw, 160px) clamp(20px, 6vw, 96px) 120px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Floating card with the ghost behind it */}
        <Reveal>
          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: "44px" }}>
            <div
              aria-hidden="true"
              className="fx-ghost-watermark"
              style={{ position: "absolute", top: "-60px", width: "clamp(220px, 26vw, 360px)", opacity: 0.09 }}
            >
              <Image src="/images/logo.png" alt="" width={360} height={360} style={{ width: "100%", height: "auto" }} />
            </div>
            {/* The float animation owns transform, so the tilt lives on the img */}
            <div className="fx-float" style={{ position: "relative" }}>
              <img
                src="/images/card.png"
                alt="The MansaFi card"
                width={430}
                height={271}
                style={{
                  display: "block",
                  width: "clamp(240px, 30vw, 380px)",
                  height: "auto",
                  transform: "rotate(-8deg)",
                  filter:
                    "drop-shadow(0 28px 48px rgba(0,0,0,0.6)) drop-shadow(0 0 48px rgba(248,248,248,0.1))",
                }}
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="fx-overline" style={{ marginBottom: "24px", letterSpacing: "0.24em" }}>
            The next era of banking
          </div>

          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(40px, 8.5vw, 92px)",
              fontWeight: 510,
              letterSpacing: "-0.035em",
              lineHeight: "1.0",
              color: "rgb(248, 248, 248)",
              margin: 0,
            }}
          >
            The agent economy
            <br />
            <span className="fx-accent-text">banks here.</span>
          </h2>

          <p style={{ fontSize: "16px", lineHeight: "26px", color: "rgb(140,140,140)", maxWidth: "520px", margin: "24px auto 0" }}>
            Open an account in minutes. Free during beta, private from the first transfer.
          </p>

          <div
            style={{
              marginTop: "40px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/signup" className="fx-btn-primary">
              Open your account →
            </Link>
            <a
              href="https://docs.mansafi.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="fx-btn-ghost"
            >
              Read the docs
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
