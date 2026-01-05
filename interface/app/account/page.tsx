'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  mockUserAccount,
  mockTransactionHistory,
  mockUserSettings,
  getTotalSpentSui,
  Transaction,
} from '@/lib/mock-account';
import {
  DateFormat,
  getDateFormat,
  setDateFormat,
  getDateFormatOptions,
} from '@/lib/format-date';

type TabType = 'overview' | 'settings';

function AccountContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (tabParam && ['overview', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl text-white">
          {mockUserAccount.suinsName ? mockUserAccount.suinsName[1].toUpperCase() : '?'}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            {mockUserAccount.suinsName && (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{mockUserAccount.suinsName}</h1>
            )}
            {mockUserAccount.authMethod === 'google' && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                via Google
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <code className="text-sm">{mockUserAccount.shortAddress}</code>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition" title="Copy address">
              📋
            </button>
            <a
              href={`https://suiscan.xyz/account/${mockUserAccount.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
              title="View on explorer"
            >
              ↗
            </a>
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Member since {new Date(mockUserAccount.stats.memberSince).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-white/[0.06]">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'settings', label: 'Settings' },
        ].map(tab => (
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

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'settings' && <SettingsTab />}

    </div>
  );
}

// Overview Tab
function OverviewTab() {
  const { stats } = mockUserAccount;
  const totalSpent = getTotalSpentSui();

  return (
    <div className="space-y-8">

      {/* Quick stats */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.campaignsCreated}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Campaigns Created</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.campaignsParticipated}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Participated In</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalResponses}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Responses</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalSpent.toFixed(2)} SUI</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Gas Spent</div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <ActionButton href="/campaigns/new" icon="➕" label="New Campaign" />
          <ActionButton href="/campaigns" icon="📋" label="My Campaigns" />
        </div>
      </section>

      {/* Recent transactions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {mockTransactionHistory.map(tx => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </section>

    </div>
  );
}

// Settings Tab
function SettingsTab() {
  const settings = mockUserSettings;
  const [dateFormat, setDateFormatState] = useState<DateFormat>('auto');
  const dateFormatOptions = getDateFormatOptions();

  useEffect(() => {
    setDateFormatState(getDateFormat());
  }, []);

  const handleDateFormatChange = (format: DateFormat) => {
    setDateFormat(format);
    setDateFormatState(format);
  };

  return (
    <div className="space-y-8">

      {/* Theme */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
        <div className="flex gap-3">
          {(['dark', 'light', 'system'] as const).map(theme => (
            <button
              key={theme}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                settings.theme === theme
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      {/* Date Format */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Date Format</h2>
        <div className="flex flex-wrap gap-3">
          {dateFormatOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleDateFormatChange(option.value)}
              className={`px-4 py-2 rounded-lg transition ${
                dateFormat === option.value
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <span>{option.label}</span>
              <span className="ml-2 text-gray-400 dark:text-gray-500 text-sm">({option.example})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Connected accounts */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connected Accounts</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <span className="text-lg">G</span>
              </div>
              <div>
                <div className="text-gray-900 dark:text-white text-sm">Google</div>
                <div className="text-gray-400 dark:text-gray-500 text-xs">{mockUserAccount.email}</div>
              </div>
            </div>
            <span className="text-green-600 dark:text-green-400 text-sm">Connected</span>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-900 dark:text-white">Disconnect Wallet</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">Sign out from this session</div>
          </div>
          <button className="px-4 py-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition">
            Disconnect
          </button>
        </div>
      </section>

    </div>
  );
}

// Helper components
function ActionButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/30 transition text-center"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </Link>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    create_campaign: { icon: '📝', color: 'text-cyan-600 dark:text-cyan-400', label: 'Campaign Creation' },
    respond: { icon: '✍️', color: 'text-green-600 dark:text-green-400', label: 'Response' },
    sponsored_gas: { icon: '⛽', color: 'text-orange-600 dark:text-orange-400', label: 'Sponsored Gas' },
  };

  const config = typeConfig[tx.type] || typeConfig.respond;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <div className="text-gray-900 dark:text-white text-sm">{config.label}</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">
            {tx.description}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-gray-600 dark:text-gray-400">
          -{tx.amount} {tx.symbol}
        </div>
        <a
          href={`https://suiscan.xyz/tx/${tx.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
        >
          View tx ↗
        </a>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-6 py-12">Loading...</div>}>
      <AccountContent />
    </Suspense>
  );
}
