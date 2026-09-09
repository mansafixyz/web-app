import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { LogosBar } from "@/components/LogosBar";
import { NewSpeciesSection } from "@/components/NewSpeciesSection";
import { BentoSection } from "@/components/BentoSection";
import {
  FeatureSection,
  INTAKE_SECTION,
  PLAN_SECTION,
  BUILD_SECTION,
  DIFFS_SECTION,
} from "@/components/FeatureSection";
import { IntakeMockup } from "@/components/mockups/IntakeMockup";
import { PlanMockup } from "@/components/mockups/PlanMockup";
import { BuildMockup } from "@/components/mockups/BuildMockup";
import { DiffsMockup } from "@/components/mockups/DiffsMockup";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }}>
      <Navbar />

      <HeroSection />

      <LogosBar />

      <NewSpeciesSection />

      <BentoSection />

      <FeatureSection {...INTAKE_SECTION} mockup={<IntakeMockup />} />

      <FeatureSection {...PLAN_SECTION} mockup={<PlanMockup />} />

      <FeatureSection {...BUILD_SECTION} mockup={<BuildMockup />} />

      <FeatureSection {...DIFFS_SECTION} mockup={<DiffsMockup />} />

      <Footer />
    </main>
  );
}
