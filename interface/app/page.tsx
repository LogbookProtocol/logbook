import { HeroSection } from '@/components/home/HeroSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { SolutionSection } from '@/components/home/SolutionSection';
import { UseCasesSection } from '@/components/home/UseCasesSection';
import { SpacesSection } from '@/components/home/SpacesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { PricingSection } from '@/components/home/PricingSection';
import { CTASection } from '@/components/home/CTASection';

export default function Home() {
  return (
    <div className="w-full">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <UseCasesSection />
      <SpacesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
