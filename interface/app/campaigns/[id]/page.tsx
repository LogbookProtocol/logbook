'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { mockCampaignDetails, CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from '@/lib/mock-data';
import { getContentByCampaign } from '@/lib/mock/content';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentPreviewLocked } from '@/components/content/ContentPreview';

export default function CampaignViewPage({ params }: { params: { id: string } }) {
  const campaign = mockCampaignDetails;
  const typeInfo = CAMPAIGN_TYPES[campaign.type];
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];

  // Get attached content
  const attachedContent = getContentByCampaign(params.id);
  const hasAccess = false; // Mock: user hasn't completed campaign yet

  const progress = campaign.stats.target
    ? Math.round((campaign.stats.responses / campaign.stats.target) * 100)
    : 0;

  const daysLeft = campaign.dates.endDate
    ? Math.ceil((new Date(campaign.dates.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/campaigns" className="hover:text-gray-900 dark:hover:text-white transition">
          Campaigns
        </Link>
        <span>/</span>
        <span className="text-gray-400 dark:text-gray-500">{campaign.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{campaign.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  campaign.status === 'active'
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : campaign.status === 'upcoming'
                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                    : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                }`}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <span>
                {typeInfo.icon} {typeInfo.label}
              </span>
              {campaign.space && (
                <Link
                  href={`/spaces/${campaign.space.id}`}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                >
                  {campaign.space.icon} {campaign.space.name}
                </Link>
              )}
              <span>by {campaign.creator.name || campaign.creator.address}</span>
            </div>
          </div>

          {/* CTA */}
          {campaign.status === 'active' && (
            <Link
              href={`/campaigns/${campaign.id}/participate`}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
            >
              Participate
            </Link>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.responses}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Responses</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{progress}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">of target ({campaign.stats.target})</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.questions.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d` : 'Ended') : '∞'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {daysLeft !== null && daysLeft > 0 ? 'Days left' : 'Duration'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {campaign.stats.target && (
        <div className="mb-8">
          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <section className="mb-8 p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About this campaign</h2>
        <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{campaign.description}</div>
      </section>

      {/* Questions preview */}
      <section className="mb-8 p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Questions ({campaign.questions.length})
        </h2>
        <div className="space-y-4">
          {campaign.questions.map((q, index) => (
            <div key={q.id} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="text-gray-900 dark:text-white">{q.question}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {q.type === 'single-choice' && `Single choice • ${q.options?.length} options`}
                  {q.type === 'multiple-choice' && `Multiple choice • ${q.options?.length} options`}
                  {q.type === 'text' && 'Text answer'}
                  {q.required && ' • Required'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="mb-8 p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requirements</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-green-500 dark:text-green-400">✓</span>
            <span className="text-gray-600 dark:text-gray-400">
              {campaign.requirements.authentication === 'any' && 'Wallet or Google sign-in'}
              {campaign.requirements.authentication === 'wallet' && 'Wallet connection required'}
              {campaign.requirements.authentication === 'zklogin' && 'Google sign-in required'}
            </span>
          </div>
          {campaign.requirements.payment ? (
            <div className="flex items-center gap-3">
              <span className="text-yellow-500 dark:text-yellow-400">💰</span>
              <span className="text-gray-600 dark:text-gray-400">
                {campaign.requirements.payment.amount} {campaign.requirements.payment.token} fee
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-green-500 dark:text-green-400">✓</span>
              <span className="text-gray-600 dark:text-gray-400">Free to participate</span>
            </div>
          )}
          {campaign.requirements.whitelist ? (
            <div className="flex items-center gap-3">
              <span className="text-orange-500 dark:text-orange-400">🔒</span>
              <span className="text-gray-600 dark:text-gray-400">Whitelist only</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-green-500 dark:text-green-400">✓</span>
              <span className="text-gray-600 dark:text-gray-400">Open to everyone</span>
            </div>
          )}
        </div>
      </section>

      {/* Attached Content */}
      {attachedContent.length > 0 && (
        <section className="mb-8 p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attached Content ({attachedContent.length})
            </h2>
            {!hasAccess && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Lock size={14} />
                <span>Complete campaign to unlock</span>
              </div>
            )}
          </div>

          {hasAccess ? (
            <div className="space-y-3">
              {attachedContent.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  href={`/content/${content.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {attachedContent.map((content) => (
                <ContentPreviewLocked
                  key={content.id}
                  content={content}
                  message="Complete the campaign to unlock this content"
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* On-chain info */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">On-chain Record</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Object ID</span>
            <code className="text-cyan-600 dark:text-cyan-400">{campaign.onChain.objectId}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Creation TX</span>
            <a
              href={`https://suiscan.xyz/tx/${campaign.onChain.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              {campaign.onChain.txHash.slice(0, 16)}... ↗
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Network</span>
            <span className="text-gray-600 dark:text-gray-400">{campaign.onChain.network}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
