'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import {
  mockUserAccount,
  mockTransactionHistory,
  getTotalSpentSui,
  Transaction,
} from '@/lib/mock-account';
import {
  DateFormat,
  TimeFormat,
  getDateFormat,
  setDateFormat,
  getDateFormatOptions,
  getTimeFormat,
  setTimeFormat,
  getTimeFormatOptions,
} from '@/lib/format-date';
import { getDataSource, getSuiscanAccountUrl, getSuiscanTxUrl } from '@/lib/sui-config';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, Language, LanguageSetting } from '@/contexts/LanguageContext';
import { fetchUserAccountStats, getSponsorshipStatus, UserAccountStats, SponsorshipStatus } from '@/lib/sui-service';
import { useAuth } from '@/contexts/AuthContext';
import { LastUpdated } from '@/components/LastUpdated';

type TabType = 'overview' | 'settings';

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const { logout } = useAuth();

  // Data source and blockchain state
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet'>('mock');
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [zkLoginEmail, setZkLoginEmail] = useState<string | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<UserAccountStats | null>(null);
  const [sponsorshipStatus, setSponsorshipStatus] = useState<SponsorshipStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get connected address (from wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;
  const isMock = dataSource === 'mock';
  const isZkLogin = !account?.address && !!zkLoginAddress;

  useEffect(() => {
    if (tabParam && ['overview', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Load zkLogin address and data source
  useEffect(() => {
    const address = localStorage.getItem('zklogin_address');
    const email = localStorage.getItem('zklogin_email');
    setZkLoginAddress(address);
    setZkLoginEmail(email);

    const source = getDataSource();
    setDataSourceState(source);
  }, []);

  // Fetch blockchain data
  const fetchData = useCallback(async (showLoading = true) => {
    if (!connectedAddress) return;
    if (showLoading) setIsLoading(true);
    try {
      const [stats, sponsorship] = await Promise.all([
        fetchUserAccountStats(connectedAddress),
        getSponsorshipStatus(connectedAddress),
      ]);
      setBlockchainStats(stats);
      setSponsorshipStatus(sponsorship);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch account data:', error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [connectedAddress]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  // Fetch blockchain data when address is available
  useEffect(() => {
    if (isMock || !connectedAddress) return;

    // Initial fetch with loading state
    fetchData(true);

    // Poll every 5 seconds without loading state
    const interval = setInterval(() => fetchData(false), 5000);

    return () => clearInterval(interval);
  }, [connectedAddress, isMock, fetchData]);

  // Generate short address
  const shortAddress = connectedAddress
    ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
    : mockUserAccount.shortAddress;

  // Calculate stats
  const stats = !isMock && blockchainStats
    ? {
        campaignsCreated: blockchainStats.campaignsCreated,
        campaignsParticipated: blockchainStats.campaignsParticipated,
        totalResponses: blockchainStats.totalResponsesReceived,
        memberSince: blockchainStats.firstActivityDate || new Date().toISOString(),
      }
    : mockUserAccount.stats;

  // Network label
  const networkLabel = dataSource === 'devnet' ? 'Sui Devnet' :
    dataSource === 'testnet' ? 'Sui Testnet' :
    dataSource === 'mainnet' ? 'Sui Mainnet' : 'Mock Data';

  // Handle disconnect
  const handleDisconnect = () => {
    logout();
    router.push('/');
  };

  // Copy address handler
  const copyAddress = async () => {
    if (!connectedAddress) return;
    await navigator.clipboard.writeText(connectedAddress);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        {/* Row 1: Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent mb-2">Account</h1>

        {/* Row 2: Icon + Address + copy + suiscan */}
        <div className="flex items-center gap-2 mb-2">
          {isZkLogin ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          ) : currentWallet?.icon ? (
            <img src={currentWallet.icon} alt={currentWallet.name} className="w-4 h-4 rounded" />
          ) : (
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          )}
          <code className="text-sm text-gray-600 dark:text-gray-300">{shortAddress}</code>
          <button
            onClick={copyAddress}
            className={`transition ${addressCopied ? 'text-green-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            title={addressCopied ? 'Copied!' : 'Copy address'}
          >
            {addressCopied ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {connectedAddress && (
            <a
              href={getSuiscanAccountUrl(connectedAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition text-sm"
            >
              <span>Suiscan</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Row 3: Auth method */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isZkLogin ? (
            <>Signed in as: <span className="text-gray-700 dark:text-gray-300">{zkLoginEmail}</span></>
          ) : (
            <>Connected with: <span className="text-gray-700 dark:text-gray-300">{currentWallet?.name || 'Wallet'}</span></>
          )}
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
      {activeTab === 'overview' && (
        <OverviewTab
          stats={stats}
          isMock={isMock}
          isLoading={isLoading}
          sponsorshipStatus={sponsorshipStatus}
          isZkLogin={isZkLogin}
          onDisconnect={handleDisconnect}
          lastUpdated={lastUpdated}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsTab />
      )}

    </div>
  );
}

// Overview Tab
function OverviewTab({
  stats,
  isMock,
  isLoading,
  sponsorshipStatus,
  isZkLogin,
  onDisconnect,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: {
  stats: { campaignsCreated: number; campaignsParticipated: number; totalResponses: number; memberSince: string };
  isMock: boolean;
  isLoading: boolean;
  sponsorshipStatus: SponsorshipStatus | null;
  isZkLogin: boolean;
  onDisconnect: () => void;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const totalSpent = isMock ? getTotalSpentSui() : 0;

  return (
    <div className="space-y-8">

      {/* First activity */}
      {stats.memberSince && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          First activity: {new Date(stats.memberSince).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      {/* Quick stats */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Summary</h2>
          {!isMock && (
            <LastUpdated
              lastUpdated={lastUpdated}
              onRefresh={onRefresh}
              isLoading={isRefreshing}
            />
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            value={stats.campaignsCreated}
            label="Campaigns Created"
            color="text-cyan-600 dark:text-cyan-400"
            isLoading={isLoading}
          />
          <StatCard
            value={stats.campaignsParticipated}
            label="Participated In"
            color="text-green-600 dark:text-green-400"
            isLoading={isLoading}
          />
          <StatCard
            value={stats.totalResponses}
            label={isMock ? 'Total Responses' : 'Responses Received'}
            color="text-gray-900 dark:text-white"
            isLoading={isLoading}
          />
          {isMock ? (
            <StatCard
              value={`${totalSpent.toFixed(2)} SUI`}
              label="Total Gas Spent"
              color="text-orange-600 dark:text-orange-400"
              isLoading={isLoading}
            />
          ) : sponsorshipStatus ? (
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {sponsorshipStatus.remaining.campaigns}/{sponsorshipStatus.limits.MAX_CAMPAIGNS}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Free Campaigns Left</div>
            </div>
          ) : (
            <StatCard
              value="—"
              label="Free Campaigns Left"
              color="text-purple-600 dark:text-purple-400"
              isLoading={isLoading}
            />
          )}
        </div>
      </section>

      {/* Sponsorship status - only for non-mock */}
      {!isMock && sponsorshipStatus && (
        <section className="p-6 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <h2 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 mb-4">Free Tier Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Campaigns</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${(sponsorshipStatus.used.campaigns / sponsorshipStatus.limits.MAX_CAMPAIGNS) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sponsorshipStatus.used.campaigns}/{sponsorshipStatus.limits.MAX_CAMPAIGNS}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Responses</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${(sponsorshipStatus.used.responses / sponsorshipStatus.limits.MAX_RESPONSES) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {sponsorshipStatus.used.responses}/{sponsorshipStatus.limits.MAX_RESPONSES}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <ActionButton href="/campaigns/new" icon="+" label="New Campaign" />
          <ActionButton href="/campaigns" icon="list" label="My Campaigns" />
        </div>
      </section>

      {/* Recent transactions - only for mock data */}
      {isMock && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
          <div className="space-y-2">
            {mockTransactionHistory.map(tx => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        </section>
      )}

      {/* Disconnect */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-900 dark:text-white">Disconnect {isZkLogin ? 'Account' : 'Wallet'}</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">Sign out from this session</div>
          </div>
          <button
            onClick={onDisconnect}
            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition"
          >
            Disconnect
          </button>
        </div>
      </section>

    </div>
  );
}

// Stat card component
function StatCard({
  value,
  label,
  color,
  isLoading,
}: {
  value: string | number;
  label: string;
  color: string;
  isLoading: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className={`text-2xl font-bold ${color}`}>
        {isLoading ? (
          <span className="inline-block w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

// Settings Tab
function SettingsTab() {
  const { themeMode, setThemeMode } = useTheme();
  const { languageSetting, setLanguage, t } = useLanguage();

  // Date format settings
  const [dateFormat, setDateFormatState] = useState<DateFormat>('auto');
  const dateFormatOptions = getDateFormatOptions();

  // Time format settings
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('auto');
  const timeFormatOptions = getTimeFormatOptions();

  useEffect(() => {
    setDateFormatState(getDateFormat());
    setTimeFormatState(getTimeFormat());
  }, []);

  const handleDateFormatChange = (format: DateFormat) => {
    setDateFormat(format);
    setDateFormatState(format);
  };

  const handleTimeFormatChange = (format: TimeFormat) => {
    setTimeFormat(format);
    setTimeFormatState(format);
  };

  const getThemeLabel = (mode: 'auto' | 'light' | 'dark') => {
    switch (mode) {
      case 'auto': return 'Auto';
      case 'light': return 'Light';
      case 'dark': return 'Dark';
    }
  };

  // Languages split into verified (human-checked) and AI generated (machine translations)
  const [languageGroups] = useState(() => {
    // Fisher-Yates shuffle helper
    const shuffle = <T,>(array: T[]): T[] => {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    // Verified languages: English is always first, others are shuffled
    const englishFirst: { code: Language; key: string } = { code: 'en', key: 'english' };
    const otherVerifiedLanguages: { code: Language; key: string }[] = [
      // Add more verified languages here as they get reviewed
    ];

    // AI generated languages (machine translations, not yet reviewed)
    const aiGeneratedLanguages: { code: Language; key: string }[] = [
      // { code: 'ru', key: 'russian' },
      // { code: 'zh', key: 'chinese' },
      // { code: 'es', key: 'spanish' },
      // { code: 'he', key: 'hebrew' },
      // { code: 'uk', key: 'ukrainian' },
      // { code: 'be', key: 'belarusian' },
      // { code: 'pt', key: 'portuguese' },
      // { code: 'fr', key: 'french' },
      // { code: 'de', key: 'german' },
      // { code: 'ja', key: 'japanese' },
      // { code: 'ko', key: 'korean' },
      // { code: 'it', key: 'italian' },
      // { code: 'tr', key: 'turkish' },
      // { code: 'ca', key: 'catalan' },
    ];

    return {
      auto: { code: 'auto' as const, key: 'auto' as const },
      verified: [englishFirst, ...shuffle(otherVerifiedLanguages)],
      aiGenerated: shuffle(aiGeneratedLanguages),
    };
  });

  return (
    <div className="space-y-8">

      {/* Theme */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h2>
        <div className="flex flex-wrap gap-2">
          {(['auto', 'light', 'dark'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                themeMode === mode
                  ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {getThemeLabel(mode)}
            </button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Language</h2>
        <div className="space-y-4">
          {/* Auto option */}
          <div>
            <button
              onClick={() => setLanguage(languageGroups.auto.code)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                languageSetting === languageGroups.auto.code
                  ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t(`language.${languageGroups.auto.key}`)}
            </button>
          </div>

          {/* Verified languages */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verified</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {languageGroups.verified.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    languageSetting === lang.code
                      ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white'
                      : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t(`language.${lang.key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* AI Generated languages */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">AI Generated</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {languageGroups.aiGenerated.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    languageSetting === lang.code
                      ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white'
                      : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t(`language.${lang.key}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Date Format */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Date Format</h2>
        <div className="flex flex-wrap gap-2">
          {dateFormatOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleDateFormatChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                dateFormat === option.value
                  ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{option.label}</span>
              <span className={`ml-2 text-sm ${dateFormat === option.value ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>({option.example})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Time Format */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Format</h2>
        <div className="flex flex-wrap gap-2">
          {timeFormatOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleTimeFormatChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeFormat === option.value
                  ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{option.label}</span>
              <span className={`ml-2 text-sm ${timeFormat === option.value ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>({option.example})</span>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}

// Helper components
function ActionButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  const iconElement = icon === '+' ? (
    <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ) : (
    <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  return (
    <Link
      href={href}
      className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/30 transition text-center flex flex-col items-center"
    >
      <div className="mb-2">{iconElement}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </Link>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    create_campaign: {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-cyan-600 dark:text-cyan-400',
      label: 'Campaign Creation',
    },
    respond: {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400',
      label: 'Response',
    },
    sponsored_gas: {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-orange-600 dark:text-orange-400',
      label: 'Sponsored Gas',
    },
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
          href={getSuiscanTxUrl(tx.txHash)}
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
    <Suspense fallback={<div className="max-w-6xl mx-auto px-6 py-12">Loading...</div>}>
      <AccountContent />
    </Suspense>
  );
}
