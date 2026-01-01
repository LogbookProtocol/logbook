'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { mockCampaignDetails, mockCampaignResponses, mockCampaignResults } from '@/lib/mock-data';
import { getContentByCampaign, mockContent } from '@/lib/mock/content';
import { ContentSelector, ContentSelectorCompact } from '@/components/content/ContentSelector';

type TabType = 'overview' | 'responses' | 'content' | 'settings';

export default function CampaignManagePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const campaign = mockCampaignDetails;
  const responses = mockCampaignResponses;
  const results = mockCampaignResults;

  // Content management
  const attachedContent = getContentByCampaign(params.id);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>(
    attachedContent.map((c) => c.id)
  );
  const [showContentSelector, setShowContentSelector] = useState(false);

  const conversionRate = campaign.stats.viewCount > 0
    ? Math.round((campaign.stats.responses / campaign.stats.viewCount) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Manage Campaign</h1>
            <p className="text-gray-600 dark:text-gray-400">{campaign.title}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/campaigns/${campaign.id}/results`}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition"
            >
              View Results
            </Link>
            <button className="px-4 py-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition">
              End Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-white/[0.06]">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'responses', label: `Responses (${responses.length})` },
          { id: 'content', label: `Content (${selectedContentIds.length})` },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-gray-900 dark:text-white border-cyan-500'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.responses}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Responses</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {campaign.stats.target
                  ? Math.round((campaign.stats.responses / campaign.stats.target) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">of target</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.viewCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Views</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{conversionRate}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Conversion</div>
            </div>
          </div>

          {/* Quick results preview */}
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Results Preview</h2>
              <Link
                href={`/campaigns/${campaign.id}/results`}
                className="text-cyan-600 dark:text-cyan-400 text-sm hover:underline"
              >
                View full results →
              </Link>
            </div>
            {results.questions.slice(0, 2).map((q) => (
              <div key={q.id} className="mb-4 last:mb-0">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{q.question}</div>
                {q.results && q.winner && (
                  <div className="text-gray-900 dark:text-white">
                    👑 {q.results.find((r) => r.id === q.winner)?.label}
                    <span className="text-gray-500 ml-2">
                      ({q.results.find((r) => r.id === q.winner)?.percentage}%)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Share */}
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share Campaign</h2>
            <div className="flex gap-3">
              <input
                type="text"
                readOnly
                value={`https://logbook.zone/campaigns/${campaign.id}`}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-400"
              />
              <button className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition">
                Copy
              </button>
              <button className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition">
                QR
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Responses Tab */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          {/* Export button */}
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition">
              Export CSV
            </button>
          </div>

          {/* Responses table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06]">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Respondent
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Time</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Answers
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/[0.06]">
                {responses.map((resp) => (
                  <tr key={resp.id} className="bg-white dark:bg-white/[0.01]">
                    <td className="px-6 py-4">
                      <code className="text-cyan-600 dark:text-cyan-400 text-sm">{resp.respondent}</code>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(resp.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {Object.keys(resp.answers).length} answers
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://suiscan.xyz/tx/${resp.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 dark:text-cyan-400 text-sm hover:underline"
                      >
                        View ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attached Content</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Content that participants will unlock after completing this campaign
                </p>
              </div>
              <button
                onClick={() => setShowContentSelector(!showContentSelector)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition text-sm"
              >
                {showContentSelector ? (
                  <>
                    <X size={16} />
                    <span>Done</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Content</span>
                  </>
                )}
              </button>
            </div>

            {showContentSelector ? (
              <ContentSelector
                selectedIds={selectedContentIds}
                onChange={setSelectedContentIds}
                availableContent={mockContent}
              />
            ) : selectedContentIds.length > 0 ? (
              <ContentSelectorCompact
                selectedIds={selectedContentIds}
                onChange={setSelectedContentIds}
              />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="mb-4">No content attached to this campaign yet.</p>
                <button
                  onClick={() => setShowContentSelector(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition text-sm"
                >
                  <Plus size={16} />
                  <span>Add your first content</span>
                </button>
              </div>
            )}
          </section>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Note:</strong> Participants who complete this campaign will automatically gain access to all attached content.
            </p>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Campaign info (read-only after creation) */}
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Information</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600 dark:text-green-400">{campaign.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(campaign.dates.created).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">End Date</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {campaign.dates.endDate ? new Date(campaign.dates.endDate).toLocaleDateString() : 'No end date'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Visibility</span>
                <span className="text-gray-600 dark:text-gray-400">{campaign.visibility}</span>
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-900 dark:text-white">End Campaign Early</div>
                  <div className="text-sm text-gray-500">Stop accepting new responses</div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition">
                  End Now
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-900 dark:text-white">Finalize Results</div>
                  <div className="text-sm text-gray-500">Record final results on-chain</div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition">
                  Finalize
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
