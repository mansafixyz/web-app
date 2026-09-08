import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { LogosBar } from "@/components/LogosBar";
import { NewSpeciesSection } from "@/components/NewSpeciesSection";
import { BentoSection } from "@/components/BentoSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }}>
      <Navbar />

      <HeroSection />

      <LogosBar />

      <NewSpeciesSection />

      <BentoSection />

      <Footer />
    </main>
  );
}
