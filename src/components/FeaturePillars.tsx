function LayeredDiskIllustration() {
  // FIG 0.2 — "Built for purpose": layered disk/platform stack with dome on top
  return (
    <svg viewBox="0 0 280 280" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Base platform — widest disk */}
      <ellipse cx="140" cy="220" rx="90" ry="18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="50" y1="220" x2="50" y2="208" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="230" y1="220" x2="230" y2="208" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <ellipse cx="140" cy="208" rx="90" ry="18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />

      {/* Mid platform */}
      <ellipse cx="140" cy="190" rx="68" ry="14" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <line x1="72" y1="190" x2="72" y2="178" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <line x1="208" y1="190" x2="208" y2="178" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <ellipse cx="140" cy="178" rx="68" ry="14" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />

      {/* Upper platform */}
      <ellipse cx="140" cy="162" rx="48" ry="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      <line x1="92" y1="162" x2="92" y2="152" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      <line x1="188" y1="162" x2="188" y2="152" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      <ellipse cx="140" cy="152" rx="48" ry="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />

      {/* Dome top — hemisphere above the top platform */}
      <path
        d="M 100 148 Q 100 98 140 96 Q 180 98 180 148"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.2"
      />
      {/* Dome ellipse base */}
      <ellipse cx="140" cy="148" rx="40" ry="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
      {/* Dome horizontal rings */}
      <path d="M 102 130 Q 140 122 178 130" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <path d="M 103 114 Q 140 108 177 114" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />

      {/* Vertical centerline on dome */}
      <line x1="140" y1="96" x2="140" y2="148" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
    </svg>
  );
}

function StackedCubesIllustration() {
  // FIG 0.3 — "Powered by AI agents": stacked cubes in L-shape
  // Isometric cube helper: draw one cube given its top-left-front corner in isometric space
  // We'll manually place cubes in an L-shape

  const cubeSize = 44;
  const isoX = cubeSize * Math.cos(Math.PI / 6); // ~38
  const isoY = cubeSize * Math.sin(Math.PI / 6); // ~22

  type CubeProps = {
    cx: number;
    cy: number;
    opacity: number;
  };

  // Each "cube" is centered at cx, cy (top face center)
  const Cube = ({ cx, cy, opacity }: CubeProps) => {
    // Top face (rhombus)
    const topFace = [
      `${cx},${cy}`,
      `${cx + isoX},${cy + isoY}`,
      `${cx},${cy + cubeSize / 2}`,
      `${cx - isoX},${cy + isoY}`,
    ].join(" ");

    // Left face
    const leftFace = [
      `${cx - isoX},${cy + isoY}`,
      `${cx},${cy + cubeSize / 2}`,
      `${cx},${cy + cubeSize / 2 + cubeSize / 2}`,
      `${cx - isoX},${cy + isoY + cubeSize / 2}`,
    ].join(" ");

    // Right face
    const rightFace = [
      `${cx + isoX},${cy + isoY}`,
      `${cx},${cy + cubeSize / 2}`,
      `${cx},${cy + cubeSize / 2 + cubeSize / 2}`,
      `${cx + isoX},${cy + isoY + cubeSize / 2}`,
    ].join(" ");

    const strokeColor = `rgba(255,255,255,${opacity})`;

    return (
      <g>
        <polygon points={topFace} stroke={strokeColor} strokeWidth="1.2" fill="none" />
        <polygon points={leftFace} stroke={strokeColor} strokeWidth="1.2" fill="none" />
        <polygon points={rightFace} stroke={strokeColor} strokeWidth="1.2" fill="none" />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 280 280" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom row: 3 cubes in a row (left to right in iso space) */}
      {/* Bottom-left cube */}
      <Cube cx={90} cy={200} opacity={0.45} />
      {/* Bottom-middle cube */}
      <Cube cx={90 + isoX} cy={200 - isoY} opacity={0.5} />
      {/* Bottom-right cube */}
      <Cube cx={90 + 2 * isoX} cy={200 - 2 * isoY} opacity={0.55} />

      {/* Middle row: 2 cubes stacked above bottom-left and bottom-middle */}
      {/* Left side of L — second level on left column */}
      <Cube cx={90} cy={200 - cubeSize} opacity={0.55} />
      {/* Right-most of second row */}
      <Cube cx={90 + isoX} cy={200 - isoY - cubeSize} opacity={0.6} />

      {/* Top cube — on left column */}
      <Cube cx={90} cy={200 - 2 * cubeSize} opacity={0.75} />

      {/* Small accent cube on top-right */}
      <Cube cx={90 + 2 * isoX} cy={200 - 2 * isoY - cubeSize} opacity={0.65} />
    </svg>
  );
}

function StackedPlatesIllustration() {
  // FIG 0.4 — "Designed for speed": stacked rectangular plates/layers
  const plates = [
    { y: 215, width: 160, depth: 14, opacity: 0.4 },
    { y: 196, width: 140, depth: 12, opacity: 0.48 },
    { y: 179, width: 124, depth: 11, opacity: 0.54 },
    { y: 163, width: 108, depth: 10, opacity: 0.6 },
    { y: 148, width: 90, depth: 9, opacity: 0.65 },
    { y: 134, width: 72, depth: 8, opacity: 0.72 },
    { y: 121, width: 54, depth: 7, opacity: 0.8 },
    { y: 109, width: 38, depth: 6, opacity: 0.88 },
  ];

  const cx = 140;
  const isoShear = 0.4; // horizontal taper per unit of depth

  return (
    <svg viewBox="0 0 280 280" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {plates.map((p, i) => {
        const hw = p.width / 2;
        const d = p.depth;
        const shear = d * isoShear;
        const stroke = `rgba(255,255,255,${p.opacity})`;

        // Top face of plate (parallelogram, slightly angled)
        const topPoints = [
          `${cx - hw + shear},${p.y - d}`,
          `${cx + hw + shear},${p.y - d}`,
          `${cx + hw - shear},${p.y}`,
          `${cx - hw - shear},${p.y}`,
        ].join(" ");

        // Front face (rectangle)
        const frontPoints = [
          `${cx - hw - shear},${p.y}`,
          `${cx + hw - shear},${p.y}`,
          `${cx + hw - shear},${p.y + 4}`,
          `${cx - hw - shear},${p.y + 4}`,
        ].join(" ");

        return (
          <g key={i}>
            <polygon points={topPoints} stroke={stroke} strokeWidth="1" fill="none" />
            <polygon points={frontPoints} stroke={stroke} strokeWidth="1" fill="none" />
          </g>
        );
      })}

      {/* Speed lines emanating right */}
      <line x1="210" y1="155" x2="248" y2="148" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <line x1="212" y1="163" x2="252" y2="163" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
      <line x1="210" y1="171" x2="246" y2="178" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
    </svg>
  );
}

interface PillarData {
  fig: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
}

const pillars: PillarData[] = [
  {
    fig: "FIG 0.2",
    title: "Private by default",
    description:
      "Every transfer is confidential from the instant it leaves your account. Amounts are sealed with zero-knowledge encryption: fully verifiable on-chain, completely invisible to observers.",
    illustration: <LayeredDiskIllustration />,
  },
  {
    fig: "FIG 0.3",
    title: "Built for AI agents",
    description:
      "Agent accounts settle x402 payment requests entirely on their own, no human in the loop. Programmable spending policies, MPP routing, and DID-based identity are enforced by the chain itself.",
    illustration: <StackedCubesIllustration />,
  },
  {
    fig: "FIG 0.4",
    title: "Settled on Robinhood Chain",
    description:
      "Settlement lands in 100ms blocks for a fraction of a cent, secured by Ethereum. Every transaction is permanently recorded on radically transparent rails. Your activity stays yours.",
    illustration: <StackedPlatesIllustration />,
  },
];

export function FeaturePillars() {
  return (
    <section
    id="features"
      className="w-full"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{
          maxWidth: "1392px",
          margin: "0 auto",
          gap: "20px",
          padding: "0 clamp(20px, 6vw, 96px)",
        }}
      >
        {pillars.map((pillar) => (
          <div
            key={pillar.fig}
            className="flex flex-col fx-glass-card"
            style={{
              padding: "32px clamp(20px, 3vw, 32px)",
            }}
          >
            {/* FIG label */}
            <span
              className="fx-overline"
              style={{
                color: "rgba(248,248,248, 0.75)",
                marginBottom: "32px",
              }}
            >
              {pillar.fig}
            </span>

            {/* 3D Illustration */}
            <div style={{ height: "280px", flexShrink: 0 }}>
              {pillar.illustration}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 510,
                color: "rgb(248, 248, 248)",
                marginTop: "32px",
              }}
            >
              {pillar.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "rgb(140, 140, 140)",
                lineHeight: "22px",
                marginTop: "8px",
              }}
            >
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
