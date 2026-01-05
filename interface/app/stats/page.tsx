'use client';

import { useState, useEffect } from 'react';
import { protocolStats } from '@/lib/mock-stats';
import { getDataSource } from '@/lib/sui-config';
import { fetchProtocolStats, ProtocolStatsBlockchain } from '@/lib/sui-service';

function StatCard({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
        {isLoading ? (
          <span className="inline-block w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export default function StatsPage() {
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet'>('mock');
  const [blockchainStats, setBlockchainStats] = useState<ProtocolStatsBlockchain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = getDataSource();
    setDataSourceState(source);

    if (source !== 'mock') {
      setIsLoading(true);
      setError(null);
      fetchProtocolStats()
        .then(stats => setBlockchainStats(stats))
        .catch(err => {
          console.error('Failed to fetch stats:', err);
          setError('Failed to connect to blockchain. Please try again later.');
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Use blockchain stats or mock data
  const isMock = dataSource === 'mock';
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Protocol Statistics</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isMock ? 'Demo metrics (mock data)' : `Live metrics from ${networkLabel}`}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatCard
          label="Total Campaigns"
          value={overview.totalCampaigns.toLocaleString()}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Responses"
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

      {/* Growth section - only for mock data */}
      {isMock && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Growth</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {growth.campaignsThisMonth.toLocaleString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Campaigns this month</div>
              <div className={`text-sm ${campaignGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {campaignGrowth >= 0 ? '↑' : '↓'} {Math.abs(campaignGrowth)}% vs last month
              </div>
            </div>
            <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {growth.responsesThisMonth.toLocaleString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Responses this month</div>
              <div className={`text-sm ${responseGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {responseGrowth >= 0 ? '↑' : '↓'} {Math.abs(responseGrowth)}% vs last month
              </div>
            </div>
            <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {growth.newParticipantsThisMonth.toLocaleString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">New participants</div>
              <div className="text-cyan-600 dark:text-cyan-400 text-sm">This month</div>
            </div>
          </div>
        </section>
      )}

      {/* Recent activity - only for mock data */}
      {isMock && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity (7 days)</h2>
          <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="grid grid-cols-7 gap-2">
              {recentActivity.map(day => (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-lg relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-b-lg"
                      style={{ height: `${(day.responses / 5000) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{day.campaigns}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-4">
              <span>Campaigns per day</span>
              <span>Bar height = responses</span>
            </div>
          </div>
        </section>
      )}

      {/* Blockchain info - only for non-mock */}
      {!isMock && (
        <section className="p-6 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <h2 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 mb-2">On-Chain Data</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Statistics are fetched directly from the Sui blockchain ({networkLabel}).
            Data is updated in real-time from the Logbook protocol smart contracts.
          </p>
        </section>
      )}

    </div>
  );
}
