'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import {
  mockPortfolioCampaigns,
  mockActivityCampaigns,
  CAMPAIGN_STATUSES,
  PortfolioCampaign,
  ActivityCampaign,
  CampaignStatus,
  CampaignDetails,
} from '@/lib/mock-data';
import { ClientDate } from '@/components/ClientDate';
import { getDataSource } from '@/lib/sui-config';
import { fetchCampaignsByCreator, fetchParticipatedCampaigns, ParticipatedCampaign } from '@/lib/sui-service';
import { useAuth } from '@/contexts/AuthContext';
import { saveReferrer } from '@/lib/navigation';

type TabType = 'created' | 'participated';

function CampaignsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const { requireAuth } = useAuth();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | null>(null);

  // Blockchain campaigns state
  const [blockchainCampaigns, setBlockchainCampaigns] = useState<CampaignDetails[]>([]);
  const [participatedCampaigns, setParticipatedCampaigns] = useState<ParticipatedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet'>('mock');

  // zkLogin address from localStorage
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkZkLogin = () => {
        const stored = localStorage.getItem('zklogin_address');
        setZkLoginAddress(stored);
      };

      checkZkLogin();

      // Listen for zkLogin changes (login/logout)
      window.addEventListener('zklogin-changed', checkZkLogin);
      window.addEventListener('storage', checkZkLogin);

      return () => {
        window.removeEventListener('zklogin-changed', checkZkLogin);
        window.removeEventListener('storage', checkZkLogin);
      };
    }
  }, []);

  // Connected address (wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;

  useEffect(() => {
    if (tabParam && ['created', 'participated'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Auto-switch to "Participated" tab if user has no created campaigns but has participated
  useEffect(() => {
    // Only auto-switch if no explicit tab param and not loading
    if (tabParam || isLoading) return;

    if (dataSource === 'mock') {
      if (mockPortfolioCampaigns.length === 0 && mockActivityCampaigns.length > 0) {
        setActiveTab('participated');
      }
    } else {
      if (blockchainCampaigns.length === 0 && participatedCampaigns.length > 0) {
        setActiveTab('participated');
      }
    }
  }, [tabParam, isLoading, dataSource, blockchainCampaigns.length, participatedCampaigns.length]);

  // Load data source and fetch campaigns from blockchain if needed
  useEffect(() => {
    const source = getDataSource();
    setDataSourceState(source);

    // Clear campaigns when user disconnects
    if (!connectedAddress) {
      setBlockchainCampaigns([]);
      setParticipatedCampaigns([]);
      setIsLoading(false);
      return;
    }

    if (source !== 'mock') {
      setIsLoading(true);
      const fetchData = async () => {
        try {
          // Fetch both created and participated campaigns in parallel
          const [created, participated] = await Promise.all([
            fetchCampaignsByCreator(connectedAddress),
            fetchParticipatedCampaigns(connectedAddress),
          ]);
          setBlockchainCampaigns(created);
          setParticipatedCampaigns(participated);
        } catch (error) {
          console.error('Failed to fetch campaigns:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [connectedAddress]);

  // Convert CampaignDetails to PortfolioCampaign format
  const convertToPortfolioCampaign = (c: CampaignDetails): PortfolioCampaign => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    endDate: c.dates.endDate,
    responsesCount: c.stats.responses,
    createdAt: c.dates.created,
  });

  // Check if wallet is connected (for non-mock mode)
  const isWalletRequired = dataSource !== 'mock';
  const isWalletConnected = !!connectedAddress;

  // Counts - show 0 if wallet not connected in blockchain mode
  const createdCount = dataSource === 'mock'
    ? mockPortfolioCampaigns.length
    : (isWalletConnected ? blockchainCampaigns.length : 0);
  const participatingCount = dataSource === 'mock'
    ? mockActivityCampaigns.length
    : (isWalletConnected ? participatedCampaigns.length : 0);

  // Convert ParticipatedCampaign to ActivityCampaign format
  const convertToActivityCampaign = (c: ParticipatedCampaign): ActivityCampaign => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    endDate: c.dates.endDate,
    respondedAt: c.respondedAt,
    createdAt: c.dates.created,
  });

  // Get campaigns based on active tab
  const getCampaigns = (): (PortfolioCampaign | ActivityCampaign)[] => {
    if (dataSource !== 'mock') {
      // Require wallet connection for blockchain mode
      if (!isWalletConnected) {
        return [];
      }
      if (activeTab === 'participated') {
        return participatedCampaigns.map(convertToActivityCampaign);
      }
      return blockchainCampaigns.map(convertToPortfolioCampaign);
    }

    switch (activeTab) {
      case 'participated':
        return mockActivityCampaigns;
      default:
        return mockPortfolioCampaigns;
    }
  };

  // Apply filters
  const getFilteredCampaigns = () => {
    const campaigns = getCampaigns();
    return campaigns.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
  };

  const filteredCampaigns = getFilteredCampaigns();

  // Stats for each tab
  const getStats = () => {
    if (dataSource !== 'mock') {
      // Show zeros if wallet not connected
      if (!isWalletConnected) {
        return { total: 0, active: 0, responses: 0 };
      }
      switch (activeTab) {
        case 'participated':
          return {
            total: participatedCampaigns.length,
            active: participatedCampaigns.filter(c => c.status === 'active').length,
          };
        default:
          return {
            total: blockchainCampaigns.length,
            active: blockchainCampaigns.filter(c => c.status === 'active').length,
            responses: blockchainCampaigns.reduce((sum, c) => sum + c.stats.responses, 0),
          };
      }
    }

    switch (activeTab) {
      case 'participated':
        return {
          total: mockActivityCampaigns.length,
          active: mockActivityCampaigns.filter(c => c.status === 'active').length,
        };
      default:
        return {
          total: mockPortfolioCampaigns.length,
          active: mockPortfolioCampaigns.filter(c => c.status === 'active').length,
          responses: mockPortfolioCampaigns.reduce((sum, c) => sum + (c.responsesCount || 0), 0),
        };
    }
  };

  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1 mb-2">Campaigns</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'created' && "Campaigns you've created"}
            {activeTab === 'participated' && "Campaigns you've participated in"}
          </p>
        </div>
        <button
          onClick={() => {
            const targetPath = '/campaigns/new';
            if (requireAuth(targetPath)) {
              saveReferrer(targetPath);
              router.push(targetPath);
            }
          }}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
        >
          New Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton
          active={activeTab === 'created'}
          onClick={() => { setActiveTab('created'); setStatusFilter(null); }}
          count={createdCount}
        >
          Created
        </TabButton>
        <TabButton
          active={activeTab === 'participated'}
          onClick={() => { setActiveTab('participated'); setStatusFilter(null); }}
          count={participatingCount}
        >
          Participated
        </TabButton>
      </div>

      {/* Stats */}
      {activeTab === 'created' && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total" value={stats.total as number} />
          <StatCard label="Active" value={stats.active as number} color="green" />
          <StatCard label="Responses" value={stats.responses as number} color="cyan" />
        </div>
      )}

      {activeTab === 'participated' && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Total" value={stats.total as number} />
          <StatCard label="Still Active" value={stats.active as number} color="green" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterButton
          active={!statusFilter}
          onClick={() => setStatusFilter(null)}
        >
          All
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

      {/* Campaign list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          filteredCampaigns.map(campaign => (
            activeTab === 'participated' ? (
              <ParticipatingCard key={campaign.id} campaign={campaign as ActivityCampaign} />
            ) : (
              <CreatedCard key={campaign.id} campaign={campaign as PortfolioCampaign} />
            )
          ))
        )}
      </div>

      {/* Empty state */}
      {!isLoading && filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-500 mb-4">
            {isWalletRequired && !isWalletConnected ? (
              "Please connect your wallet to view your campaigns"
            ) : activeTab === 'created' ? (
              "You haven't created any campaigns yet"
            ) : (
              "You haven't participated in any campaigns yet"
            )}
          </div>
          {activeTab === 'created' && isWalletConnected && (
            <button
              onClick={() => {
                const targetPath = '/campaigns/new';
                if (requireAuth(targetPath)) {
                  saveReferrer(targetPath);
                  router.push(targetPath);
                }
              }}
              className="text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Create your first campaign →
            </button>
          )}
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
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
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
  color?: 'white' | 'green' | 'cyan' | 'orange' | 'gray';
}) {
  const colorClasses = {
    white: 'text-gray-900 dark:text-white',
    green: 'text-green-600 dark:text-green-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    orange: 'text-orange-600 dark:text-orange-400',
    gray: 'text-gray-500 dark:text-gray-400',
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

// Card for "Created" tab
function CreatedCard({ campaign }: { campaign: PortfolioCampaign }) {
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];
  const mainLink = `/campaigns/${campaign.id}`;

  return (
    <Link
      href={mainLink}
      onClick={() => saveReferrer(mainLink)}
      className="block p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/50 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {campaign.title}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {statusInfo?.label}
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-1">{campaign.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            {campaign.endDate && (
              <ClientDate
                dateString={campaign.endDate}
                prefix={`${campaign.status === 'ended' ? 'Ended' : 'Ends'}: `}
              />
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.responsesCount || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-500">responses</div>
        </div>
      </div>
    </Link>
  );
}

// Card for "Participated" tab
function ParticipatingCard({ campaign }: { campaign: ActivityCampaign }) {
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];
  const mainLink = `/campaigns/${campaign.id}`;
  const resultsLink = `/campaigns/${campaign.id}?tab=results`;

  return (
    <div className="block p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/50 transition">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={mainLink}
          onClick={() => saveReferrer(mainLink)}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {campaign.title}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {statusInfo?.label}
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-1">{campaign.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500 flex-wrap">
            <ClientDate dateString={campaign.respondedAt} prefix="Responded: " />
            {campaign.endDate && (
              <ClientDate
                dateString={campaign.endDate}
                prefix={`${campaign.status === 'ended' ? 'Ended' : 'Ends'}: `}
              />
            )}
          </div>
        </Link>

        <Link
          href={resultsLink}
          onClick={() => saveReferrer(resultsLink)}
          className="shrink-0 text-cyan-600 dark:text-cyan-400 text-sm hover:underline"
        >
          View Results →
        </Link>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-6 py-12">Loading...</div>}>
      <CampaignsContent />
    </Suspense>
  );
}
