'use client';

import { securityData } from '@/lib/mock-security';

function FindingBadge({ label, count, color }: { label: string; count: number; color: 'red' | 'orange' | 'yellow' | 'blue' }) {
  const colors = {
    red: 'bg-red-500/20 text-red-600 dark:text-red-400',
    orange: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={`px-2 py-1 rounded text-xs ${colors[color]}`}>
      {count} {label}
    </div>
  );
}

export default function SecurityPage() {
  const { audits, bugBounty, contracts, securityFeatures, github } = securityData;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Security</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Transparency and security are core to Logbook. Here's everything you need to know about how we keep the protocol safe.
        </p>
      </div>

      {/* Security Features */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Model</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {securityFeatures.map(feature => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">{feature.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audits */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Audits</h2>
        <div className="space-y-4">
          {audits.map(audit => (
            <div
              key={audit.id}
              className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900 dark:text-white font-medium">{audit.auditor}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      audit.status === 'completed'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                    }`}>
                      {audit.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{audit.scope}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Date: {audit.date}</p>
                </div>

                {audit.findings && (
                  <div className="flex gap-2 flex-wrap">
                    <FindingBadge label="Critical" count={audit.findings.critical} color="red" />
                    <FindingBadge label="High" count={audit.findings.high} color="orange" />
                    <FindingBadge label="Medium" count={audit.findings.medium} color="yellow" />
                    <FindingBadge label="Low" count={audit.findings.low} color="blue" />
                  </div>
                )}
              </div>

              {audit.reportUrl && (
                <a
                  href={audit.reportUrl}
                  className="inline-flex items-center gap-2 mt-4 text-cyan-600 dark:text-cyan-400 text-sm hover:underline"
                >
                  View Full Report →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bug Bounty */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Bug Bounty Program</h2>
        <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🐛</span>
                <h3 className="text-gray-900 dark:text-white font-medium">Active on {bugBounty.platform}</h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Help us find vulnerabilities and earn rewards. We take security seriously and reward responsible disclosure.
              </p>
              <a
                href={bugBounty.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30 transition text-sm"
              >
                View on {bugBounty.platform} →
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">${bugBounty.maxReward.toLocaleString()}</div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Max Reward</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">${bugBounty.totalPaid.toLocaleString()}</div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Total Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{bugBounty.reportsResolved}</div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Resolved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contracts */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Verified Contracts</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Contract</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Address</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Network</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/[0.06]">
                {contracts.map(contract => (
                  <tr key={contract.name} className="bg-white dark:bg-white/[0.01]">
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{contract.name}</td>
                    <td className="px-6 py-4">
                      <code className="text-cyan-600 dark:text-cyan-400 text-sm">{contract.address}</code>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{contract.network}</td>
                    <td className="px-6 py-4">
                      {contract.verified && (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          ✓ Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* GitHub */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Open Source</h2>
        <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📦</span>
            <a
              href={github.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 dark:text-white font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition"
            >
              github.com/logbook-protocol
            </a>
          </div>

          <div className="space-y-3">
            {github.repos.map(repo => (
              <a
                key={repo.name}
                href={`${github.url}/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition"
              >
                <div>
                  <div className="text-gray-900 dark:text-white font-mono text-sm">{repo.name}</div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">{repo.description}</div>
                </div>
                <div className="text-gray-400 dark:text-gray-400 text-sm">⭐ {repo.stars}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
