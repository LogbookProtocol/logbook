'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  mockUserAccount,
  mockWalletAssets,
  mockLogbookDeposit,
  mockTransactionHistory,
  mockUserSettings,
  Transaction,
} from '@/lib/mock-account';
import { TokenIcon } from '@/components/TokenIcon';

type TabType = 'overview' | 'assets' | 'deposit' | 'settings';

function AccountContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (tabParam && ['overview', 'assets', 'deposit', 'settings'].includes(tabParam)) {
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

        {/* Total balance */}
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${mockWalletAssets.totalUsdValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-white/[0.06]">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'assets', label: 'Assets' },
          { id: 'deposit', label: 'Logbook Deposit' },
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
      {activeTab === 'assets' && <AssetsTab />}
      {activeTab === 'deposit' && <DepositTab />}
      {activeTab === 'settings' && <SettingsTab />}

    </div>
  );
}

// Overview Tab
function OverviewTab() {
  const { stats } = mockUserAccount;

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
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.spacesJoined}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Spaces Joined</div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton href="/campaigns/new" icon="➕" label="New Campaign" />
          <ActionButton href="/campaigns" icon="📋" label="My Campaigns" />
          <ActionButton href="/spaces" icon="👥" label="My Spaces" />
          <ActionButton href="/campaigns" icon="🔍" label="Explore" />
        </div>
      </section>

      {/* Recent transactions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <button className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline">View all</button>
        </div>
        <div className="space-y-2">
          {mockTransactionHistory.slice(0, 3).map(tx => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </section>

    </div>
  );
}

// Assets Tab
function AssetsTab() {
  const { sui, tokens, totalUsdValue } = mockWalletAssets;

  return (
    <div className="space-y-8">

      {/* Total value */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Portfolio Value</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">${totalUsdValue.toLocaleString()}</div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 transition text-center">
          <div className="text-xl mb-1">↑</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Send</div>
        </button>
        <button className="flex-1 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 transition text-center">
          <div className="text-xl mb-1">↓</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Receive</div>
        </button>
        <button className="flex-1 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 transition text-center">
          <div className="text-xl mb-1">⇄</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Swap</div>
        </button>
        <button className="flex-1 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 transition text-center">
          <div className="text-xl mb-1">💳</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Buy</div>
        </button>
      </div>

      {/* Token list */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tokens</h2>
        <div className="space-y-2">
          {/* SUI */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <TokenIcon symbol={sui.symbol} size={40} />
              <div>
                <div className="text-gray-900 dark:text-white font-medium">{sui.name}</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">{sui.symbol}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-900 dark:text-white font-medium">{sui.balance.toFixed(2)} {sui.symbol}</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">${sui.usdValue.toFixed(2)}</div>
            </div>
          </div>

          {/* Other tokens */}
          {tokens.map(token => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <TokenIcon symbol={token.symbol} size={40} />
                <div>
                  <div className="text-gray-900 dark:text-white font-medium">{token.name}</div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">{token.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-900 dark:text-white font-medium">{token.balance.toFixed(2)} {token.symbol}</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">${token.usdValue.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

// Deposit Tab
function DepositTab() {
  const deposit = mockLogbookDeposit;

  return (
    <div className="space-y-8">

      {/* Deposit balance */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Logbook Deposit Balance</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{deposit.balance.toFixed(2)} SUI</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">${deposit.usdValue.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sponsored Transactions</div>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{deposit.sponsoredTransactions}</div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex gap-3">
          <div className="text-blue-500 dark:text-blue-400">ℹ️</div>
          <div>
            <div className="text-gray-900 dark:text-white font-medium mb-1">What is Logbook Deposit?</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Deposit SUI to sponsor gas fees for your campaign participants.
              When someone responds to your campaign via zkLogin, gas is paid from your deposit
              so they don't need a wallet or tokens.
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition">
          Deposit SUI
        </button>
        <button className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition">
          Withdraw
        </button>
      </div>

      {/* Deposit history */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deposit History</h2>
        <div className="space-y-2">
          {mockTransactionHistory
            .filter(tx => tx.type === 'deposit' || tx.type === 'sponsor')
            .map(tx => (
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

      {/* Notifications */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Email notifications"
            description="Receive notifications via email"
            enabled={settings.notifications.email}
          />
          <ToggleSetting
            label="Campaign start"
            description="When a campaign you're invited to starts"
            enabled={settings.notifications.campaignStart}
          />
          <ToggleSetting
            label="Campaign end"
            description="When a campaign you participated in ends"
            enabled={settings.notifications.campaignEnd}
          />
          <ToggleSetting
            label="New responses"
            description="When someone responds to your campaign"
            enabled={settings.notifications.newResponse}
          />
          <ToggleSetting
            label="Weekly digest"
            description="Summary of your activity"
            enabled={settings.notifications.weeklyDigest}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy</h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Public profile"
            description="Allow others to see your profile"
            enabled={settings.privacy.showProfile}
          />
          <ToggleSetting
            label="Show statistics"
            description="Display your activity stats on profile"
            enabled={settings.privacy.showStats}
          />
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
    deposit: { icon: '↓', color: 'text-green-600 dark:text-green-400', label: 'Deposit' },
    withdraw: { icon: '↑', color: 'text-red-600 dark:text-red-400', label: 'Withdraw' },
    send: { icon: '↑', color: 'text-red-600 dark:text-red-400', label: 'Sent' },
    receive: { icon: '↓', color: 'text-green-600 dark:text-green-400', label: 'Received' },
    sponsor: { icon: '⛽', color: 'text-cyan-600 dark:text-cyan-400', label: 'Sponsored' },
  };

  const config = typeConfig[tx.type] || typeConfig.send;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <div className="text-gray-900 dark:text-white text-sm">{config.label}</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs">
            {tx.description || new Date(tx.timestamp).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-medium ${
          tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'sponsor'
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400'
        }`}>
          {tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'sponsor' ? '-' : '+'}
          {tx.amount} {tx.symbol}
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

function ToggleSetting({
  label,
  description,
  enabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-gray-900 dark:text-white text-sm">{label}</div>
        <div className="text-gray-400 dark:text-gray-500 text-xs">{description}</div>
      </div>
      <button
        className={`w-12 h-6 rounded-full transition relative ${
          enabled ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-300 dark:bg-white/20'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
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
