'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  mockCampaigns,
  mockPortfolioCampaigns,
  mockActivityCampaigns,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  PublicCampaign,
  PortfolioCampaign,
  ActivityCampaign,
  CampaignType,
  CampaignStatus,
} from '@/lib/mock-data';

type TabType = 'all' | 'created' | 'participating';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<CampaignType | null>(null);

  // Counts
  const allCount = mockCampaigns.filter(c => c.visibility === 'public').length;
  const createdCount = mockPortfolioCampaigns.length;
  const participatingCount = mockActivityCampaigns.length;
  const pendingCount = mockActivityCampaigns.filter(
    c => c.participation === 'pending' && (c.status === 'active' || c.status === 'upcoming')
  ).length;

  // Get campaigns based on active tab
  const getCampaigns = () => {
    switch (activeTab) {
      case 'created':
        return mockPortfolioCampaigns;
      case 'participating':
        return mockActivityCampaigns;
      default:
        return mockCampaigns.filter(c => c.visibility === 'public');
    }
  };

  // Apply filters
  const getFilteredCampaigns = () => {
    let campaigns = getCampaigns();
    if (statusFilter) {
      campaigns = campaigns.filter(c => c.status === statusFilter);
    }
    if (typeFilter) {
      campaigns = campaigns.filter(c => c.type === typeFilter);
    }
    return campaigns;
  };

  const filteredCampaigns = getFilteredCampaigns();

  // Stats for each tab
  const getStats = () => {
    switch (activeTab) {
      case 'created':
        return {
          total: mockPortfolioCampaigns.length,
          active: mockPortfolioCampaigns.filter(c => c.status === 'active').length,
          responses: mockPortfolioCampaigns.reduce((sum, c) => sum + (c.responsesCount || 0), 0),
          drafts: mockPortfolioCampaigns.filter(c => c.status === 'draft').length,
        };
      case 'participating':
        return {
          pending: pendingCount,
          completed: mockActivityCampaigns.filter(c => c.participation === 'completed').length,
          rewards: mockActivityCampaigns.filter(c => c.reward).length,
        };
      default:
        return {
          total: allCount,
          active: mockCampaigns.filter(c => c.status === 'active' && c.visibility === 'public').length,
        };
    }
  };

  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'all' && 'Explore public campaigns'}
            {activeTab === 'created' && "Campaigns you've created"}
            {activeTab === 'participating' && "Campaigns you're participating in"}
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
        >
          New Campaign
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton
          active={activeTab === 'all'}
          onClick={() => { setActiveTab('all'); setStatusFilter(null); setTypeFilter(null); }}
          count={allCount}
        >
          All
        </TabButton>
        <TabButton
          active={activeTab === 'created'}
          onClick={() => { setActiveTab('created'); setStatusFilter(null); setTypeFilter(null); }}
          count={createdCount}
        >
          Created
        </TabButton>
        <TabButton
          active={activeTab === 'participating'}
          onClick={() => { setActiveTab('participating'); setStatusFilter(null); setTypeFilter(null); }}
          count={participatingCount}
          pending={pendingCount}
        >
          Participating
        </TabButton>
      </div>

      {/* Stats */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Total Campaigns" value={stats.total as number} />
          <StatCard label="Active Now" value={stats.active as number} color="green" />
        </div>
      )}

      {activeTab === 'created' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={stats.total as number} />
          <StatCard label="Active" value={stats.active as number} color="green" />
          <StatCard label="Responses" value={stats.responses as number} color="cyan" />
          <StatCard label="Drafts" value={stats.drafts as number} color="gray" />
        </div>
      )}

      {activeTab === 'participating' && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Pending Action" value={stats.pending as number} color="orange" />
          <StatCard label="Completed" value={stats.completed as number} color="green" />
          <StatCard label="Rewards" value={stats.rewards as number} color="yellow" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={!statusFilter}
            onClick={() => setStatusFilter(null)}
          >
            All Status
          </FilterButton>
          {activeTab === 'created' && (
            <FilterButton
              active={statusFilter === 'draft'}
              onClick={() => setStatusFilter('draft')}
            >
              Draft
            </FilterButton>
          )}
          <FilterButton
            active={statusFilter === 'upcoming'}
            onClick={() => setStatusFilter('upcoming')}
          >
            Upcoming
          </FilterButton>
          <FilterButton
            active={statusFilter === 'active'}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </FilterButton>
          <FilterButton
            active={statusFilter === 'ended'}
            onClick={() => setStatusFilter('ended')}
          >
            Ended
          </FilterButton>
        </div>

        {/* Type filter (only for All tab) */}
        {activeTab === 'all' && (
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={!typeFilter}
              onClick={() => setTypeFilter(null)}
            >
              All Types
            </FilterButton>
            {(Object.entries(CAMPAIGN_TYPES) as [CampaignType, typeof CAMPAIGN_TYPES[CampaignType]][]).map(([key, { label, icon }]) => (
              <FilterButton
                key={key}
                active={typeFilter === key}
                onClick={() => setTypeFilter(key)}
              >
                {icon} {label}
              </FilterButton>
            ))}
          </div>
        )}
      </div>

      {/* Campaign list */}
      <div className="space-y-4">
        {filteredCampaigns.map(campaign => (
          activeTab === 'participating' ? (
            <ParticipatingCard key={campaign.id} campaign={campaign as ActivityCampaign} />
          ) : activeTab === 'created' ? (
            <CreatedCard key={campaign.id} campaign={campaign as PortfolioCampaign} />
          ) : (
            <PublicCard key={campaign.id} campaign={campaign as PublicCampaign} />
          )
        ))}
      </div>

      {/* Empty state */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-500 mb-4">
            {activeTab === 'all' && 'No campaigns found'}
            {activeTab === 'created' && "You haven't created any campaigns yet"}
            {activeTab === 'participating' && "You haven't participated in any campaigns yet"}
          </div>
          <Link
            href={activeTab === 'created' ? '/campaigns/new' : '/campaigns'}
            className="text-cyan-600 dark:text-cyan-400 hover:underline"
            onClick={activeTab !== 'created' ? () => { setStatusFilter(null); setTypeFilter(null); } : undefined}
          >
            {activeTab === 'created' ? 'Create your first campaign →' : 'Clear filters'}
          </Link>
        </div>
      )}

    </div>
  );
}

// Tab button component
function TabButton({
  children,
  active,
  onClick,
  count,
  pending,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
  pending?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
        active
          ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-gray-300 dark:bg-white/20' : 'bg-gray-200 dark:bg-white/10'
        }`}>
          {count}
        </span>
      )}
      {pending !== undefined && pending > 0 && (
        <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400">
          {pending}
        </span>
      )}
    </button>
  );
}

// Filter button component
function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition ${
        active
          ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
      }`}
    >
      {children}
    </button>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: number;
  color?: 'white' | 'green' | 'cyan' | 'orange' | 'yellow' | 'gray';
}) {
  const colorClasses = {
    white: 'text-gray-900 dark:text-white',
    green: 'text-green-600 dark:text-green-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    orange: 'text-orange-600 dark:text-orange-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    gray: 'text-gray-500 dark:text-gray-400',
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

// Card for "All" tab - public campaigns
function PublicCard({ campaign }: { campaign: PublicCampaign }) {
  const typeInfo = CAMPAIGN_TYPES[campaign.type];
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/30 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{campaign.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              campaign.status === 'upcoming' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {statusInfo?.label}
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-1">{campaign.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <span>{typeInfo?.icon} {typeInfo?.label}</span>
            {campaign.space && (
              <span>{campaign.space.icon} {campaign.space.name}</span>
            )}
            <span>by {campaign.creator}</span>
          </div>
        </div>

        <div className="text-right text-sm text-gray-500 dark:text-gray-500 shrink-0">
          {campaign.status === 'active' && campaign.endDate && (
            <div>Ends {campaign.endDate}</div>
          )}
          {campaign.status === 'upcoming' && campaign.startDate && (
            <div>Starts {campaign.startDate}</div>
          )}
          {campaign.responsesCount > 0 && (
            <div className="text-gray-900 dark:text-white font-medium">{campaign.responsesCount.toLocaleString()} responses</div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Card for "Created" tab
function CreatedCard({ campaign }: { campaign: PortfolioCampaign }) {
  const typeInfo = CAMPAIGN_TYPES[campaign.type];
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];
  const progress = campaign.participantsTarget
    ? Math.round((campaign.responsesCount / campaign.participantsTarget) * 100)
    : 0;

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition truncate"
            >
              {campaign.title}
            </Link>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              campaign.status === 'upcoming' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
              campaign.status === 'draft' ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {statusInfo?.label}
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-1">{campaign.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <span>{typeInfo?.icon} {typeInfo?.label}</span>
            {campaign.space && (
              <span>{campaign.space.icon} {campaign.space.name}</span>
            )}
            {campaign.endDate && (
              <span>{campaign.status === 'ended' ? 'Ended' : 'Ends'}: {campaign.endDate}</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.responsesCount || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {campaign.participantsTarget && `/ ${campaign.participantsTarget}`} responses
          </div>
          {campaign.participantsTarget && campaign.status !== 'draft' && (
            <div className="mt-2 w-32 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.06]">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
        >
          View
        </Link>
        {campaign.status !== 'ended' && (
          <Link
            href={`/campaigns/${campaign.id}/manage`}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
          >
            Manage
          </Link>
        )}
        {(campaign.status === 'active' || campaign.status === 'ended') && (
          <Link
            href={`/campaigns/${campaign.id}/results`}
            className="px-3 py-1.5 rounded-lg text-sm bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30 transition"
          >
            Results
          </Link>
        )}
        {campaign.status === 'draft' && (
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="px-3 py-1.5 rounded-lg text-sm bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30 transition"
          >
            Edit Draft
          </Link>
        )}
      </div>
    </div>
  );
}

// Card for "Participating" tab
function ParticipatingCard({ campaign }: { campaign: ActivityCampaign }) {
  const typeInfo = CAMPAIGN_TYPES[campaign.type];
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];
  const isPending = campaign.participation === 'pending';
  const canParticipate = isPending && campaign.status === 'active';

  return (
    <div className={`p-6 rounded-xl border transition ${
      canParticipate
        ? 'bg-cyan-500/[0.03] dark:bg-cyan-500/[0.03] border-cyan-500/20 hover:border-cyan-500/40'
        : 'bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition truncate"
            >
              {campaign.title}
            </Link>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              campaign.status === 'upcoming' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {statusInfo?.label}
            </span>
            {campaign.participation === 'completed' && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                ✓ Participated
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-1">{campaign.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500 flex-wrap">
            <span>{typeInfo?.icon} {typeInfo?.label}</span>
            {campaign.space && (
              <span>{campaign.space.icon} {campaign.space.name}</span>
            )}
            {campaign.endDate && (
              <span>{campaign.status === 'ended' ? 'Ended' : 'Ends'}: {campaign.endDate}</span>
            )}
            {campaign.respondedAt && (
              <span>Responded: {campaign.respondedAt}</span>
            )}
          </div>

          {campaign.reward && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-yellow-500 dark:text-yellow-400">🎁</span>
              <span className="text-sm text-yellow-600 dark:text-yellow-400">{campaign.reward}</span>
            </div>
          )}
        </div>

        <div className="shrink-0">
          {canParticipate ? (
            <Link
              href={`/campaigns/${campaign.id}/participate`}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
            >
              Participate
            </Link>
          ) : campaign.status === 'upcoming' ? (
            <div className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm">
              Starts {campaign.startDate}
            </div>
          ) : campaign.participation === 'completed' ? (
            <Link
              href={`/campaigns/${campaign.id}/results`}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition text-sm"
            >
              View Results
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
