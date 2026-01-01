'use client';

import { protocolStats } from '@/lib/mock-stats';
import { CAMPAIGN_TYPES } from '@/lib/mock-data';
import { SPACE_TYPES } from '@/lib/mock-spaces';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export default function StatsPage() {
  const { overview, growth, byType, bySpaceType, recentActivity, topSpaces } = protocolStats;

  // Calculate growth percentages
  const campaignGrowth = Math.round(((growth.campaignsThisMonth - growth.campaignsLastMonth) / growth.campaignsLastMonth) * 100);
  const responseGrowth = Math.round(((growth.responsesThisMonth - growth.responsesLastMonth) / growth.responsesLastMonth) * 100);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Protocol Statistics</h1>
        <p className="text-gray-500 dark:text-gray-400">Real-time metrics from the Logbook protocol</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <StatCard
          label="Total Campaigns"
          value={overview.totalCampaigns.toLocaleString()}
        />
        <StatCard
          label="Total Responses"
          value={overview.totalResponses.toLocaleString()}
        />
        <StatCard
          label="Unique Participants"
          value={overview.totalParticipants.toLocaleString()}
        />
        <StatCard
          label="Active Spaces"
          value={overview.totalSpaces.toLocaleString()}
        />
        <StatCard
          label="Total Volume"
          value={`$${(overview.totalVolume / 1000000).toFixed(1)}M`}
        />
      </div>

      {/* Growth section */}
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

      {/* By type section */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Campaigns by Type</h2>
        <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="space-y-4">
            {byType.map(item => {
              const typeInfo = CAMPAIGN_TYPES[item.type];
              return (
                <div key={item.type} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-500 dark:text-gray-400">
                    {typeInfo?.icon} {typeInfo?.label}
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm">
                    <span className="text-gray-900 dark:text-white">{item.count.toLocaleString()}</span>
                    <span className="text-gray-500 ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* By space type section */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Activity by Space Type</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bySpaceType.slice(0, 4).map(item => {
            const typeInfo = SPACE_TYPES[item.type];
            return (
              <div key={item.type} className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                <div className="text-2xl mb-2">{typeInfo?.icon}</div>
                <div className="text-gray-900 dark:text-white font-medium">{typeInfo?.label}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  {item.spaces} spaces • {item.campaigns.toLocaleString()} campaigns
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
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

      {/* Top spaces */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Spaces</h2>
        <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="space-y-4">
            {topSpaces.map((space, index) => {
              const typeInfo = SPACE_TYPES[space.type];
              return (
                <div key={space.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 dark:text-white font-medium">{space.name}</div>
                    <div className="text-gray-500 dark:text-gray-500 text-sm">{typeInfo?.icon} {typeInfo?.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-white">{space.responses.toLocaleString()} responses</div>
                    <div className="text-gray-500 dark:text-gray-500 text-sm">{space.campaigns} campaigns</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
