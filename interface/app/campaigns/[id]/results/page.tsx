'use client';

import Link from 'next/link';
import { mockCampaignDetails, mockCampaignResults } from '@/lib/mock-data';

export default function CampaignResultsPage({ params }: { params: { id: string } }) {
  const campaign = mockCampaignDetails;
  const results = mockCampaignResults;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4 inline-block"
        >
          ← Back to campaign
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Results</h1>
            <p className="text-gray-600 dark:text-gray-400">{campaign.title}</p>
          </div>
          {results.finalizedOnChain && (
            <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-sm">
              ✓ Finalized on-chain
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{results.totalResponses}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Responses</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{results.completionRate}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.questions.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
        </div>
      </div>

      {/* Results by question */}
      <div className="space-y-6">
        {results.questions.map((q, index) => (
          <div
            key={q.id}
            className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 dark:text-white font-medium">{q.question}</h3>
                <div className="text-sm text-gray-500 mt-1">{q.totalVotes || q.totalResponses} responses</div>
              </div>
            </div>

            {/* Choice results */}
            {(q.type === 'single-choice' || q.type === 'multiple-choice') && q.results && (
              <div className="space-y-3">
                {q.results.map((option) => (
                  <div key={option.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span
                        className={
                          option.id === q.winner
                            ? 'text-cyan-600 dark:text-cyan-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300'
                        }
                      >
                        {option.id === q.winner && '👑 '}
                        {option.label}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {option.votes} ({option.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          option.id === q.winner
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            : 'bg-gray-400 dark:bg-white/30'
                        }`}
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text results summary */}
            {q.type === 'text' && (
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {q.totalResponses} text responses collected
                <span className="text-gray-500 ml-2">(Not displayed publicly)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Response timeline */}
      <section className="mt-8 p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Timeline</h2>
        <div className="h-32 flex items-end gap-1">
          {results.timeline.map((day, i) => {
            const maxResponses = Math.max(...results.timeline.map((d) => d.responses));
            const height = (day.responses / maxResponses) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('en', { day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* On-chain verification */}
      {results.finalizedOnChain && (
        <section className="mt-8 p-6 rounded-xl bg-green-500/5 border border-green-500/20">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">On-chain Verification</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Finalization TX</span>
              <a
                href={`https://suiscan.xyz/tx/${results.finalizationTx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {results.finalizationTx} ↗
              </a>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Results are permanently recorded on the Sui blockchain and can be independently verified.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
