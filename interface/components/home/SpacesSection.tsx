'use client';

function Line() {
  return <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />;
}

function SpaceHierarchyVisual() {
  const lineWidth = 58;
  const lineHeight = 24;

  return (
    <div className="p-8 flex flex-col items-center">
      {/* Root */}
      <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/25">
        Nexus DAO
      </div>

      {/* Diagonal lines to level 1 */}
      <div className="flex">
        <svg width={lineWidth} height={lineHeight} viewBox={`0 0 ${lineWidth} ${lineHeight}`} className="text-gray-300 dark:text-gray-600">
          <line x1={lineWidth} y1="0" x2="0" y2={lineHeight} stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg width={lineWidth} height={lineHeight} viewBox={`0 0 ${lineWidth} ${lineHeight}`} className="text-gray-300 dark:text-gray-600">
          <line x1="0" y1="0" x2={lineWidth} y2={lineHeight} stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Level 1 */}
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300">
            Engineering
          </div>
          <Line />
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300">
            Frontend
          </div>
          <Line />
          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-600 dark:text-cyan-400">
            UI Team
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300">
            Marketing
          </div>
          <Line />
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-gray-300">
            Growth
          </div>
        </div>
      </div>
    </div>
  );
}

export function SpacesSection() {
  return (
    <section className="py-24 px-6 bg-gray-100/50 dark:bg-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Organize with{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Spaces
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Create hierarchical spaces for your organization. Universities, DAOs, companies —
              with departments, teams, and projects nested inside.
            </p>

            <div className="space-y-2 font-mono text-sm bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
              <div className="text-cyan-600 dark:text-cyan-400 font-semibold">
                Nexus DAO
              </div>
              <div className="pl-4 text-gray-600 dark:text-gray-400">
                ├── Engineering
              </div>
              <div className="pl-8 text-gray-500 dark:text-gray-500">├── Frontend</div>
              <div className="pl-12 text-gray-400 dark:text-gray-600">└── UI Team</div>
              <div className="pl-4 text-gray-600 dark:text-gray-400">└── Marketing</div>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              Membership inherits up — join a team, automatically part of the DAO.
            </p>
          </div>

          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
            <SpaceHierarchyVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
