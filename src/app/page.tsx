import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { LogosBar } from "@/components/LogosBar";
import { NewSpeciesSection } from "@/components/NewSpeciesSection";
import { BentoSection } from "@/components/BentoSection";
import {
  FeatureSection,
  INTAKE_SECTION,
  PLAN_SECTION,
} from "@/components/FeatureSection";
import { IntakeMockup } from "@/components/mockups/IntakeMockup";
import { PlanMockup } from "@/components/mockups/PlanMockup";
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

      <Footer />
    </main>
  );
}
