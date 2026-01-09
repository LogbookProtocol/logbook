'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useCopyLink } from '@/hooks/useCopyLink';
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
import { formatTime, formatDate } from '@/lib/format-date';
import { getDataSource } from '@/lib/sui-config';
import { fetchCampaignsByCreator, fetchParticipatedCampaigns, ParticipatedCampaign } from '@/lib/sui-service';
import { useAuth } from '@/contexts/AuthContext';
import { saveReferrer } from '@/lib/navigation';
import { LastUpdated } from '@/components/LastUpdated';
import { getStoredPassword, decryptData, storePassword, removeStoredPassword } from '@/lib/crypto';
import {
  tryCreatorAutoUnlock,
  tryParticipantAutoUnlock,
} from '@/lib/encryption-auto-recovery';
import { getUserResponse } from '@/lib/sui-service';
import { usePollingInterval } from '@/contexts/PollingContext';

type TabType = 'created' | 'participated';

function CampaignsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { requireAuth } = useAuth();
  const { copyLink, isCopied } = useCopyLink();
  const { pollingInterval } = usePollingInterval();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Store separate sort state for each tab
  const [createdTabSort, setCreatedTabSort] = useState<{
    field: 'title' | 'responses' | 'created' | 'ended' | null;
    direction: 'asc' | 'desc';
  }>({ field: 'created', direction: 'desc' });

  const [participatedTabSort, setParticipatedTabSort] = useState<{
    field: 'title' | 'responded' | 'ended' | null;
    direction: 'asc' | 'desc';
  }>({ field: 'responded', direction: 'desc' });

  // Current sort state based on active tab
  const sortField = activeTab === 'created' ? createdTabSort.field : participatedTabSort.field;
  const sortDirection = activeTab === 'created' ? createdTabSort.direction : participatedTabSort.direction;

  // Blockchain campaigns state
  const [blockchainCampaigns, setBlockchainCampaigns] = useState<CampaignDetails[]>([]);
  const [participatedCampaigns, setParticipatedCampaigns] = useState<ParticipatedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Decrypted campaign data cache: campaignId -> { title, description }
  const [decryptedCache, setDecryptedCache] = useState<Record<string, { title: string; description: string }>>({});

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

  // Fetch campaigns from blockchain
  const fetchData = useCallback(async (showLoading = true) => {
    if (!connectedAddress) return;
    if (showLoading) setIsLoading(true);
    try {
      // Fetch both created and participated campaigns in parallel
      const [created, participated] = await Promise.all([
        fetchCampaignsByCreator(connectedAddress),
        fetchParticipatedCampaigns(connectedAddress),
      ]);
      setBlockchainCampaigns(created);
      setParticipatedCampaigns(participated);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [connectedAddress]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  // Load data source and fetch campaigns from blockchain if needed
  useEffect(() => {
    const source = getDataSource();
    setDataSourceState(source);

    // Clear campaigns when user disconnects
    if (!connectedAddress) {
      setBlockchainCampaigns([]);
      setParticipatedCampaigns([]);
      setIsLoading(false);
      setLastUpdated(null);
      return;
    }

    if (source !== 'mock') {
      // Initial fetch with loading state
      fetchData(true);

      // Poll based on user's selected interval (in seconds)
      const interval = setInterval(() => fetchData(false), pollingInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [connectedAddress, fetchData, pollingInterval]);

  // Try to decrypt encrypted campaigns using auto-recovery
  useEffect(() => {
    const decryptEncryptedCampaigns = async () => {
      if (!connectedAddress) return;

      // Combine all encrypted campaigns from both lists
      const allCampaigns = [
        ...blockchainCampaigns.filter(c => c.isEncrypted),
        ...participatedCampaigns.filter(c => c.isEncrypted),
      ];

      if (allCampaigns.length === 0) return;

      const newDecrypted: Record<string, { title: string; description: string }> = {};

      for (const campaign of allCampaigns) {
        // Skip if already decrypted
        if (decryptedCache[campaign.id]) continue;

        let password: string | null = null;

        // Priority 1: Check localStorage
        password = getStoredPassword(campaign.id, connectedAddress);

        // Priority 2: Try creator auto-unlock (if user is creator)
        // Only Google zkLogin - no automatic wallet signatures
        if (!password && campaign.campaignSeed && campaign.creator?.address === connectedAddress) {
          try {
            // Don't pass wallet signature function - only Google zkLogin will work automatically
            password = await tryCreatorAutoUnlock(
              campaign.campaignSeed,
              campaign.creator.address,
              connectedAddress,
              undefined // No wallet signature for automatic unlock
            );
            if (password) {
              console.log(`[Auto-Recovery] Creator auto-unlock successful (Google) for campaign ${campaign.id}`);
            }
          } catch (error) {
            console.error(`[Auto-Recovery] Creator auto-unlock failed for campaign ${campaign.id}:`, error);
          }
        }

        // Priority 3: Try participant auto-unlock (if user participated)
        // Only Google zkLogin - no automatic wallet signatures
        if (!password) {
          try {
            const userResponse = await getUserResponse(campaign.id, connectedAddress);
            if (userResponse?.responseSeed) {
              // Don't pass wallet signature function - only Google zkLogin will work automatically
              password = await tryParticipantAutoUnlock(userResponse.responseSeed, undefined);
            }
          } catch (error) {
            console.error(`[Auto-Recovery] Participant auto-unlock failed for campaign ${campaign.id}:`, error);
          }
        }

        // If we have a password, try to decrypt
        if (password) {
          try {
            const [title, description] = await Promise.all([
              decryptData(campaign.title, password),
              decryptData(campaign.description, password),
            ]);
            newDecrypted[campaign.id] = { title, description };

            // Store password for future use
            storePassword(campaign.id, password, connectedAddress);
          } catch (error) {
            console.error(`[Auto-Recovery] Decryption failed for campaign ${campaign.id.substring(0, 8)}...:`, error);
            console.log(`[Auto-Recovery] Failed password: ${password.substring(0, 16)}...`);
            // Remove failed password from storage
            removeStoredPassword(campaign.id, connectedAddress);
          }
        }
      }

      if (Object.keys(newDecrypted).length > 0) {
        setDecryptedCache(prev => ({ ...prev, ...newDecrypted }));
      }
    };

    decryptEncryptedCampaigns();
  }, [blockchainCampaigns, participatedCampaigns, decryptedCache, connectedAddress]);

  // Convert CampaignDetails to PortfolioCampaign format
  const convertToPortfolioCampaign = (c: CampaignDetails): PortfolioCampaign => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    endDate: c.dates.endDate,
    responsesCount: c.stats.responses,
    createdAt: c.dates.created,
    isEncrypted: c.isEncrypted,
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
    isEncrypted: c.isEncrypted,
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
      // Status filter
      if (statusFilter && c.status !== statusFilter) return false;

      // Search filter (by campaign title)
      if (searchQuery) {
        const title = (decryptedCache[c.id]?.title || c.title).toLowerCase();
        if (!title.includes(searchQuery.toLowerCase())) return false;
      }

      return true;
    });
  };

  // Apply sorting
  const getSortedCampaigns = (campaigns: (PortfolioCampaign | ActivityCampaign)[]) => {
    if (!sortField) return campaigns;

    return [...campaigns].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          const aTitle = decryptedCache[a.id]?.title || a.title;
          const bTitle = decryptedCache[b.id]?.title || b.title;
          aValue = aTitle.toLowerCase();
          bValue = bTitle.toLowerCase();
          break;
        case 'responses':
          aValue = 'responsesCount' in a ? (a.responsesCount || 0) : 0;
          bValue = 'responsesCount' in b ? (b.responsesCount || 0) : 0;
          break;
        case 'created':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case 'responded':
          aValue = 'respondedAt' in a ? new Date(a.respondedAt).getTime() : 0;
          bValue = 'respondedAt' in b ? new Date(b.respondedAt).getTime() : 0;
          break;
        case 'ended':
          aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
          bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredCampaigns = getSortedCampaigns(getFilteredCampaigns());

  // Handle sort
  const handleSort = (field: 'title' | 'responses' | 'created' | 'responded' | 'ended') => {
    if (activeTab === 'created') {
      if (createdTabSort.field === field) {
        setCreatedTabSort({ field, direction: createdTabSort.direction === 'asc' ? 'desc' : 'asc' });
      } else {
        setCreatedTabSort({ field: field as typeof createdTabSort.field, direction: 'desc' });
      }
    } else {
      if (participatedTabSort.field === field) {
        setParticipatedTabSort({ field, direction: participatedTabSort.direction === 'asc' ? 'desc' : 'asc' });
      } else {
        setParticipatedTabSort({ field: field as typeof participatedTabSort.field, direction: 'desc' });
      }
    }
  };

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

  // Show loading state until dataSource is determined
  if (dataSource === null) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-white/[0.06]">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
        <button
          onClick={() => {
            const targetPath = '/campaigns/new';
            if (requireAuth(targetPath)) {
              saveReferrer(targetPath);
              router.push(targetPath);
            }
          }}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition"
        >
          New Campaign
        </button>
      </div>

      {/* Tabs + Stats inline */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-white/[0.06]">
        <div className="flex gap-2">
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
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
        {dataSource !== 'mock' && connectedAddress && (
          <LastUpdated
            lastUpdated={lastUpdated}
            onRefresh={handleManualRefresh}
            isLoading={isRefreshing}
          />
        )}
      </div>

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
        />
      </div>

      {/* Campaign list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {/* Mobile header */}
              <tr className="md:hidden border-b border-gray-200 dark:border-white/[0.06]">
                <th
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none w-[70px]"
                  onClick={() => handleSort(activeTab === 'participated' ? 'responded' : 'created')}
                >
                  <div className="flex items-center justify-center gap-1">
                    {activeTab === 'participated' ? 'Resp.' : 'Created'}
                    {sortField === (activeTab === 'participated' ? 'responded' : 'created') && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Campaign
                    {sortField === 'title' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none w-[70px]"
                  onClick={() => handleSort('ended')}
                >
                  <div className="flex items-center justify-center gap-1">
                    End Date
                    {sortField === 'ended' && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
              </tr>

              {/* Desktop header: Single row with all columns */}
              <tr className="hidden md:table-row border-b border-gray-200 dark:border-white/[0.06]">
                <th
                  className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                  onClick={() => handleSort('created')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Created
                    {sortField === 'created' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Campaign
                    {sortField === 'title' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                {activeTab === 'participated' && (
                  <th
                    className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                    onClick={() => handleSort('responded')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Responded
                      {sortField === 'responded' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                )}
                {activeTab === 'created' && (
                  <th
                    className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                    onClick={() => handleSort('responses')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Responses
                      {sortField === 'responses' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortDirection === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                )}
                <th
                  className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                  onClick={() => handleSort('ended')}
                >
                  <div className="flex items-center justify-center gap-1">
                    End Date
                    {sortField === 'ended' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map(campaign => (
                activeTab === 'participated' ? (
                  <ParticipatingRow key={campaign.id} campaign={campaign as ActivityCampaign} copyLink={copyLink} isCopied={isCopied} decrypted={decryptedCache[campaign.id]} />
                ) : (
                  <CreatedRow key={campaign.id} campaign={campaign as PortfolioCampaign} copyLink={copyLink} isCopied={isCopied} decrypted={decryptedCache[campaign.id]} />
                )
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-500 mb-4">
            {isWalletRequired && !isWalletConnected ? (
              "Please log in to view your campaigns"
            ) : (statusFilter || searchQuery) ? (
              // Filters are active but no campaigns match
              "No campaigns match the selected filters"
            ) : activeTab === 'created' ? (
              "You haven't created any campaigns yet"
            ) : (
              "You haven't participated in any campaigns yet"
            )}
          </div>
          {activeTab === 'created' && isWalletConnected && !statusFilter && !searchQuery && (
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



// Card for "Created" tab
function CreatedCard({ campaign, copyLink, isCopied, decrypted }: {
  campaign: PortfolioCampaign;
  copyLink: (id: string, e?: React.MouseEvent) => void;
  isCopied: (id: string) => boolean;
  decrypted?: { title: string; description: string };
}) {
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];
  const mainLink = `/campaigns/${campaign.id}`;

  // For encrypted campaigns without decrypted data, show placeholder
  const isEncryptedLocked = campaign.isEncrypted && !decrypted;
  const displayTitle = isEncryptedLocked ? 'Encrypted Campaign' : (decrypted?.title ?? campaign.title);

  return (
    <Link
      href={mainLink}
      onClick={() => saveReferrer(mainLink)}
      className="block p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/50 transition"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {campaign.isEncrypted ? (
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-base font-medium text-gray-900 dark:text-white truncate">
              {displayTitle}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {statusInfo?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {campaign.responsesCount !== undefined && campaign.responsesCount > 1 && (
              <span><strong className="text-gray-900 dark:text-white">{campaign.responsesCount}</strong> responses</span>
            )}
            {campaign.createdAt && (
              <ClientDate
                dateString={campaign.createdAt}
                prefix="Created "
              />
            )}
            {campaign.endDate && (
              <ClientDate
                dateString={campaign.endDate}
                prefix={`${campaign.status === 'ended' ? 'Ended ' : 'Ends '}`}
              />
            )}
          </div>
        </div>

        <button
          onClick={(e) => copyLink(campaign.id, e)}
          className={`flex items-center gap-1.5 text-sm transition flex-shrink-0 ${
            isCopied(campaign.id)
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={isCopied(campaign.id) ? 'Copied!' : 'Copy link'}
        >
          {isCopied(campaign.id) ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </button>
      </div>
    </Link>
  );
}

// Card for "Participated" tab
function ParticipatingCard({ campaign, copyLink, isCopied, decrypted }: {
  campaign: ActivityCampaign;
  copyLink: (id: string, e?: React.MouseEvent) => void;
  isCopied: (id: string) => boolean;
  decrypted?: { title: string; description: string };
}) {
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];
  const mainLink = `/campaigns/${campaign.id}`;

  // For encrypted campaigns without decrypted data, show placeholder
  const isEncryptedLocked = campaign.isEncrypted && !decrypted;
  const displayTitle = isEncryptedLocked ? 'Encrypted Campaign' : (decrypted?.title ?? campaign.title);

  return (
    <Link
      href={mainLink}
      onClick={() => saveReferrer(mainLink)}
      className="block p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/50 transition"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {campaign.isEncrypted ? (
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-base font-medium text-gray-900 dark:text-white truncate">
              {displayTitle}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${
              campaign.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
              'bg-gray-500/20 text-gray-500'
            }`}>
              {statusInfo?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {campaign.createdAt && (
              <ClientDate
                dateString={campaign.createdAt}
                prefix="Created "
              />
            )}
            <ClientDate dateString={campaign.respondedAt} prefix="Responded " />
            {campaign.endDate && (
              <ClientDate
                dateString={campaign.endDate}
                prefix={`${campaign.status === 'ended' ? 'Ended ' : 'Ends '}`}
              />
            )}
          </div>
        </div>

        <button
          onClick={(e) => copyLink(campaign.id, e)}
          className={`flex items-center gap-1.5 text-sm transition flex-shrink-0 ${
            isCopied(campaign.id)
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={isCopied(campaign.id) ? 'Copied!' : 'Copy link'}
        >
          {isCopied(campaign.id) ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </button>
      </div>
    </Link>
  );
}

// Row for "Created" tab (table format)
function CreatedRow({ campaign, copyLink, isCopied, decrypted }: {
  campaign: PortfolioCampaign;
  copyLink: (id: string, e?: React.MouseEvent) => void;
  isCopied: (id: string) => boolean;
  decrypted?: { title: string; description: string };
}) {
  const mainLink = `/campaigns/${campaign.id}`;
  const router = useRouter();

  // For encrypted campaigns without decrypted data, show placeholder
  const isEncryptedLocked = campaign.isEncrypted && !decrypted;
  const displayTitle = isEncryptedLocked ? 'Encrypted Campaign' : (decrypted?.title ?? campaign.title);

  const handleRowClick = () => {
    saveReferrer(mainLink);
    router.push(mainLink);
  };

  return (
    <>
      {/* Mobile: Single row with Created - Campaign - End Date */}
      <tr
        className="md:hidden border-b border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="px-2 py-4 text-xs w-[70px]">
          {campaign.createdAt ? (
            <div>
              <div className="text-gray-900 dark:text-white">
                {formatDate(campaign.createdAt)}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.createdAt))}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-2 py-4 text-xs">
          <div className="flex items-center gap-2">
            {campaign.isEncrypted ? (
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white break-words">
              {displayTitle}
            </span>
          </div>
        </td>
        <td className="px-2 py-4 text-xs w-[70px]">
          {campaign.endDate ? (
            <div>
              <div className="text-gray-900 dark:text-white">
                {formatDate(campaign.endDate)}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.endDate))}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
      </tr>

      {/* Desktop: Single row */}
      <tr
        className="hidden md:table-row border-b border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="px-4 py-5">
          {campaign.createdAt ? (
            <div>
              <div className="text-sm text-gray-900 dark:text-white">
                {formatDate(campaign.createdAt)}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.createdAt))}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-5">
          <div className="flex items-center gap-2">
            {campaign.isEncrypted ? (
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {displayTitle}
            </span>
          </div>
        </td>
        <td className="px-4 py-5 text-center">
          <span className="text-sm text-gray-900 dark:text-white">
            {campaign.responsesCount !== undefined && campaign.responsesCount > 0 ? campaign.responsesCount : '—'}
          </span>
        </td>
        <td className="px-4 py-5">
          {campaign.endDate ? (
            <div>
              <div className="text-sm text-gray-900 dark:text-white">
                {formatDate(campaign.endDate)}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.endDate))}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
      </tr>
    </>
  );
}

// Row for "Participated" tab (table format)
function ParticipatingRow({ campaign, copyLink, isCopied, decrypted }: {
  campaign: ActivityCampaign;
  copyLink: (id: string, e?: React.MouseEvent) => void;
  isCopied: (id: string) => boolean;
  decrypted?: { title: string; description: string };
}) {
  const mainLink = `/campaigns/${campaign.id}`;
  const router = useRouter();

  // For encrypted campaigns without decrypted data, show placeholder
  const isEncryptedLocked = campaign.isEncrypted && !decrypted;
  const displayTitle = isEncryptedLocked ? 'Encrypted Campaign' : (decrypted?.title ?? campaign.title);

  const handleRowClick = () => {
    saveReferrer(mainLink);
    router.push(mainLink);
  };

  return (
    <>
      {/* Mobile: Single row with Responded - Campaign - End Date */}
      <tr
        className="md:hidden border-b border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="px-2 py-4 text-xs w-[70px]">
          {campaign.respondedAt ? (
            <div>
              <div className="text-gray-900 dark:text-white">
                {formatDate(campaign.respondedAt)}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.respondedAt))}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-2 py-4 text-xs">
          <div className="flex items-center gap-2">
            {campaign.isEncrypted ? (
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white break-words">
              {displayTitle}
            </span>
          </div>
        </td>
        <td className="px-2 py-4 text-xs w-[70px]">
          {campaign.endDate ? (
            <div>
              <div className="text-gray-900 dark:text-white">
                {formatDate(campaign.endDate)}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.endDate))}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
      </tr>

      {/* Desktop: Single row */}
      <tr
        className="hidden md:table-row border-b border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
        onClick={handleRowClick}
      >
        <td className="px-4 py-5">
          {campaign.createdAt ? (
            <div>
              <div className="text-sm text-gray-900 dark:text-white">
                {formatDate(campaign.createdAt)}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.createdAt))}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-5">
          <div className="flex items-center gap-2">
            {campaign.isEncrypted ? (
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {displayTitle}
            </span>
          </div>
        </td>
        <td className="px-4 py-5">
          <div>
            <div className="text-sm text-gray-900 dark:text-white">
              {formatDate(campaign.respondedAt)}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              {formatTime(new Date(campaign.respondedAt))}
            </div>
          </div>
        </td>
        <td className="px-4 py-5">
          {campaign.endDate ? (
            <div>
              <div className="text-sm text-gray-900 dark:text-white">
                {formatDate(campaign.endDate)}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatTime(new Date(campaign.endDate))}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
      </tr>
    </>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-8">Loading...</div>}>
      <CampaignsContent />
    </Suspense>
  );
}
