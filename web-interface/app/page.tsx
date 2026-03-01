import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import HowItWorks from "@/components/sections/HowItWorks";
import DetectionBreakdown from "@/components/sections/DetectionBreakdown";
import WhyDifferent from "@/components/sections/WhyDifferent";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <HowItWorks />
      <DetectionBreakdown />
      <WhyDifferent />
      <FinalCTA />
    </main>
  );
}
