import { Reveal } from "@/components/Reveal";

export function NewSpeciesSection() {
  return (
    <section style={{ backgroundColor: "#0A0A0A", position: "relative" }}>
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          padding: "clamp(72px, 10vw, 128px) clamp(20px, 6vw, 96px)",
          gap: "clamp(28px, 5vw, 80px)",
          alignItems: "start",
        }}
      >
        <Reveal>
          <div className="fx-overline" style={{ marginBottom: "18px" }}>
            01 / The Agent Economy
          </div>
          <h2 className="fx-h2">
            A new economic species
            <br />
            <span className="fx-accent-text">has arrived.</span>
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <p
            style={{
              fontSize: "clamp(18px, 2vw, 26px)",
              fontWeight: 400,
              lineHeight: "1.45",
              letterSpacing: "-0.01em",
              color: "rgb(140, 140, 140)",
              margin: 0,
              borderLeft: "1px solid rgba(255,255,255,0.12)",
              paddingLeft: "clamp(18px, 2.5vw, 32px)",
            }}
          >
            <span style={{ color: "rgb(248, 248, 248)" }}>
              AI agents already earn, spend, and settle with each other around the clock.
            </span>{" "}
            MansaFi is the private financial layer they run on: a non-custodial neobank where humans and agents
            transact confidentially, and every settlement is verified on Robinhood Chain.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
