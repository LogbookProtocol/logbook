'use client';

export function PricingSection() {
  return (
    <section className="py-24 px-6 bg-gray-100/50 dark:bg-white/[0.02]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Start free, scale as you grow
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-12">
          First 10 responses per campaign are completely free. After that, fees as low as Sui gas
          itself.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 text-left">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Free Tier</h3>
            <p className="text-4xl font-bold text-cyan-500 mb-6">$0</p>
            <ul className="text-gray-600 dark:text-gray-400 space-y-3">
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                10 free responses per campaign
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                All campaign types
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                zkLogin for participants
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                On-chain results
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-500/20 text-left relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium">
              Popular
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Growth</h3>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
              $0.03–$0.003
              <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">/response</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Scales with campaign volume</p>
            <ul className="text-gray-600 dark:text-gray-400 space-y-3">
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Unlimited responses
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Protocol fee = Sui gas × multiplier
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Multiplier: 1x → 0.1x (scales with volume)
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                1% fee on money flows
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Priority support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
