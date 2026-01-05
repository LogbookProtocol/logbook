'use client';

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center">
      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export function SolutionSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Don't trust. Verify.
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Truth isn't what someone tells you — it's what you can verify yourself.
            <br />
            Every vote recorded on Sui blockchain. Every result mathematically provable.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <FeatureCard
            title="Rules = Code"
            description="Voting logic in smart contract. No platform can change the rules mid-vote."
          />
          <FeatureCard
            title="Results = Blockchain State"
            description="Every response has a transaction hash. Count yourself on Sui Explorer — don't trust our UI."
          />
          <FeatureCard
            title="History = Permanent"
            description="Decisions recorded forever. Build institutional memory. Reference past votes as facts."
          />
        </div>

        <p className="text-center text-lg text-gray-600 dark:text-gray-400">
          Code enforces rules. Blockchain proves results. History stays forever.
        </p>
      </div>
    </section>
  );
}
