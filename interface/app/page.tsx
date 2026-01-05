import { HeroSection } from '@/components/home/HeroSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { SolutionSection } from '@/components/home/SolutionSection';
import { ComparisonSection } from '@/components/home/ComparisonSection';
import { UseCasesSection } from '@/components/home/UseCasesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { CTASection } from '@/components/home/CTASection';

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ComparisonSection />
      <UseCasesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}
