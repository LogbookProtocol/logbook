'use client';

import { useState, useEffect, useCallback } from 'react';
import { protocolStats } from '@/lib/mock-stats';
import { getDataSource } from '@/lib/sui-config';
import { fetchProtocolStats, fetchProtocolGasStats, ProtocolStatsBlockchain, ProtocolGasStats } from '@/lib/sui-service';
import { LastUpdated } from '@/components/LastUpdated';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fetchSuiPriceWithMeta, SuiPriceResult } from '@/lib/sui-gas-price';
import { formatTimeWithSeconds } from '@/lib/format-date';

function StatCard({ label, value, subtitle, isLoading }: { label: React.ReactNode; value: string; subtitle?: string; isLoading?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {isLoading ? (
          <span className="inline-block w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      {subtitle && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

export default function StatsPage() {
  // Initialize to null to avoid flash of wrong content
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet' | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<ProtocolStatsBlockchain | null>(null);
  const [gasStats, setGasStats] = useState<ProtocolGasStats | null>(null);
  const [suiPriceData, setSuiPriceData] = useState<SuiPriceResult>({ price: 0, timestamp: null, isFallback: false });
  const [isPriceRefreshing, setIsPriceRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { currency, currencySymbol } = useCurrency();

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      // Fetch stats independently so one failure doesn't block others
      const [statsResult, gasResult, priceResult] = await Promise.allSettled([
        fetchProtocolStats(),
        fetchProtocolGasStats(),
        fetchSuiPriceWithMeta(currency),
      ]);

      if (statsResult.status === 'fulfilled') {
        setBlockchainStats(statsResult.value);
      } else {
        console.error('Failed to fetch protocol stats:', statsResult.reason);
        setError('Failed to connect to blockchain. Please try again later.');
      }

      if (gasResult.status === 'fulfilled') {
        setGasStats(gasResult.value);
      } else {
        console.error('Failed to fetch gas stats:', gasResult.reason);
        // Don't show error for gas stats - it's optional
      }

      if (priceResult.status === 'fulfilled') {
        setSuiPriceData(priceResult.value);
      } else {
        console.error('Failed to fetch SUI price:', priceResult.reason);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to connect to blockchain. Please try again later.');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currency]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStats(false);
  }, [fetchStats]);

  const handlePriceRefresh = useCallback(async () => {
    setIsPriceRefreshing(true);
    try {
      const result = await fetchSuiPriceWithMeta(currency, true); // force refresh
      setSuiPriceData(result);
    } catch (error) {
      console.error('Failed to refresh SUI price:', error);
    } finally {
      setIsPriceRefreshing(false);
    }
  }, [currency]);

  useEffect(() => {
    const source = getDataSource();
    setDataSourceState(source);

    if (source === 'mock') return;

    // Initial fetch with loading state
    fetchStats(true);

    // Poll every 5 seconds without loading state
    const interval = setInterval(() => fetchStats(false), 5000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Use blockchain stats or mock data
  const isMock = dataSource === 'mock';
  const isInitialized = dataSource !== null;
  const overview = !isMock && blockchainStats
    ? {
        totalCampaigns: blockchainStats.totalCampaigns,
        totalResponses: blockchainStats.totalResponses,
        totalParticipants: blockchainStats.totalParticipants,
      }
    : protocolStats.overview;

  const activeCampaigns = !isMock && blockchainStats
    ? blockchainStats.activeCampaigns
    : 0;

  const { growth, recentActivity } = protocolStats;

  // Calculate growth percentages (mock data only)
  const campaignGrowth = Math.round(((growth.campaignsThisMonth - growth.campaignsLastMonth) / growth.campaignsLastMonth) * 100);
  const responseGrowth = Math.round(((growth.responsesThisMonth - growth.responsesLastMonth) / growth.responsesLastMonth) * 100);

  // Network label
  const networkLabel = dataSource === 'devnet' ? 'Sui Devnet' :
    dataSource === 'testnet' ? 'Sui Testnet' :
    dataSource === 'mainnet' ? 'Sui Mainnet' : 'Mock Data';

  // Show loading state until dataSource is determined
  if (!isInitialized) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Protocol Statistics</h1>
          {!isMock && (
            <LastUpdated
              lastUpdated={lastUpdated}
              onRefresh={handleManualRefresh}
              isLoading={isRefreshing}
            />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isMock ? 'Demo metrics (mock data)' : `All-time statistics from ${networkLabel}`}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={<>Total<br />Campaigns</>}
          value={overview.totalCampaigns.toLocaleString()}
          isLoading={isLoading}
        />
        <StatCard
          label={<>Total<br />Responses</>}
          value={overview.totalResponses.toLocaleString()}
          isLoading={isLoading}
        />
        <StatCard
          label="Unique Participants"
          value={overview.totalParticipants.toLocaleString()}
          isLoading={isLoading}
        />
        {!isMock && (
          <StatCard
            label="Active Campaigns"
            value={activeCampaigns.toLocaleString()}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Gas costs - same style as overview stats */}
      {!isMock && gasStats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            label="Gas on Campaigns"
            value={`${currencySymbol}${(gasStats.totalGasSpentOnCampaigns * suiPriceData.price).toFixed(2)}`}
            subtitle={`${gasStats.totalGasSpentOnCampaigns.toFixed(4)} SUI`}
            isLoading={isLoading}
          />
          <StatCard
            label="Gas on Responses"
            value={`${currencySymbol}${(gasStats.totalGasSpentOnResponses * suiPriceData.price).toFixed(2)}`}
            subtitle={`${gasStats.totalGasSpentOnResponses.toFixed(4)} SUI`}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* SUI Price - compact info line */}
      {!isMock && suiPriceData.price > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>SUI Price: <span className="font-medium text-gray-900 dark:text-white">{currencySymbol}{suiPriceData.price.toFixed(2)}</span></span>
            {suiPriceData.timestamp && (
              <span className="text-xs">(Updated: {formatTimeWithSeconds(suiPriceData.timestamp)})</span>
            )}
          </div>
          <button
            onClick={handlePriceRefresh}
            disabled={isPriceRefreshing}
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 disabled:opacity-50"
            title="Refresh price"
          >
            {isPriceRefreshing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Growth section - only for mock data */}
      {isMock && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Growth</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Campaigns this month</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {growth.campaignsThisMonth.toLocaleString()}
              </div>
              <div className={`text-sm ${campaignGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {campaignGrowth >= 0 ? '↑' : '↓'} {Math.abs(campaignGrowth)}% vs last month
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Responses this month</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {growth.responsesThisMonth.toLocaleString()}
              </div>
              <div className={`text-sm ${responseGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {responseGrowth >= 0 ? '↑' : '↓'} {Math.abs(responseGrowth)}% vs last month
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">New participants</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {growth.newParticipantsThisMonth.toLocaleString()}
              </div>
              <div className="text-xs text-cyan-600 dark:text-cyan-400">This month</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity - only for mock data */}
      {isMock && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity (7 days)</h2>
          <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="grid grid-cols-7 gap-2">
              {recentActivity.map(day => (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="h-20 bg-gray-100 dark:bg-white/5 rounded-lg relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-b-lg"
                      style={{ height: `${(day.responses / 5000) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{day.campaigns}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
              <span>Campaigns per day</span>
              <span>Bar height = responses</span>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain info - only for non-mock */}
      {!isMock && (
        <div className="p-4 rounded-lg bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20">
          <h2 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-2">On-Chain Data</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Statistics are fetched directly from the Sui blockchain ({networkLabel}).
            Data is updated in real-time from the Logbook protocol smart contracts.
            {' '}<a href="/docs?doc=smart-contract" className="text-cyan-600 dark:text-cyan-400 hover:underline">Read more in documentation →</a>
          </p>
        </div>
      )}

    </div>
  );
}
