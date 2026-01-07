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
import { useCurrency, CurrencySetting } from '@/contexts/CurrencyContext';
import { fetchUserAccountStats, getSponsorshipStatus, fetchSuiBalance, requestFaucet, fetchUserTransactions, UserAccountStats, SponsorshipStatus, UserTransaction } from '@/lib/sui-service';
import { fetchSuiPrice } from '@/lib/sui-gas-price';
import { useAuth } from '@/contexts/AuthContext';
import { Currency } from '@/contexts/CurrencyContext';
import { LastUpdated } from '@/components/LastUpdated';

type TabType = 'overview' | 'free-tier' | 'settings';

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
  const [suiBalance, setSuiBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get connected address (from wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;
  const isMock = dataSource === 'mock';
  const isZkLogin = !account?.address && !!zkLoginAddress;

  useEffect(() => {
    if (tabParam && ['overview', 'free-tier', 'settings'].includes(tabParam)) {
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
      const [stats, sponsorship, balance] = await Promise.all([
        fetchUserAccountStats(connectedAddress),
        getSponsorshipStatus(connectedAddress),
        fetchSuiBalance(connectedAddress),
      ]);
      setBlockchainStats(stats);
      setSponsorshipStatus(sponsorship);
      setSuiBalance(balance);
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
        {/* Row 1: Title + Disconnect button */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent">Account</h1>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Disconnect
          </button>
        </div>

        {/* Row 2: Icon + Address + copy + Suiscan */}
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
          <button
            onClick={copyAddress}
            className={`flex items-center gap-1 transition ${addressCopied ? 'text-green-500' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            title={addressCopied ? 'Copied!' : 'Copy address'}
          >
            <code className="text-sm">{shortAddress}</code>
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
      <div className="flex items-end justify-between mb-8 border-b border-gray-200 dark:border-white/[0.06]">
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'free-tier', label: 'Free Tier' },
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
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          stats={stats}
          isMock={isMock}
          isLoading={isLoading}
          onRefresh={handleManualRefresh}
          suiBalance={suiBalance}
          connectedAddress={connectedAddress}
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
        />
      )}
      {activeTab === 'free-tier' && (
        <FreeTierTab
          sponsorshipStatus={sponsorshipStatus}
          isMock={isMock}
          isLoading={isLoading}
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
  onRefresh,
  suiBalance,
  connectedAddress,
  lastUpdated,
  isRefreshing,
}: {
  stats: { campaignsCreated: number; campaignsParticipated: number; totalResponses: number; memberSince: string };
  isMock: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  suiBalance: string;
  connectedAddress: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
}) {
  const totalSpent = isMock ? getTotalSpentSui() : 0;
  const [suiPrice, setSuiPrice] = useState<number | null>(null);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  const { currency, currencySymbol } = useCurrency();

  useEffect(() => {
    fetchSuiPrice(currency).then(price => setSuiPrice(price)).catch(() => {});
  }, [currency]);

  // Fetch transactions
  useEffect(() => {
    if (!connectedAddress || isMock) {
      setIsLoadingTxs(false);
      return;
    }

    setIsLoadingTxs(true);
    fetchUserTransactions(connectedAddress)
      .then(txs => setTransactions(txs))
      .finally(() => setIsLoadingTxs(false));
  }, [connectedAddress, isMock]);

  // Calculate gas statistics
  const totalGasSpent = transactions.reduce((sum, tx) => sum + tx.gasCost, 0);
  const userPaidGas = transactions.filter(tx => tx.gasPayedBy === 'user').reduce((sum, tx) => sum + tx.gasCost, 0);
  const logbookPaidGas = transactions.filter(tx => tx.gasPayedBy === 'logbook').reduce((sum, tx) => sum + tx.gasCost, 0);

  const totalGasFiat = suiPrice ? (totalGasSpent * suiPrice).toFixed(2) : null;
  const userPaidFiat = suiPrice ? (userPaidGas * suiPrice).toFixed(2) : null;
  const logbookPaidFiat = suiPrice ? (logbookPaidGas * suiPrice).toFixed(2) : null;

  const handleFaucet = async () => {
    if (!connectedAddress) return;
    setIsFaucetLoading(true);
    setFaucetMessage(null);
    const result = await requestFaucet(connectedAddress);
    setIsFaucetLoading(false);
    if (result.success) {
      setFaucetMessage({ type: 'success', text: 'SUI received! Refreshing balance...' });
      setTimeout(() => {
        onRefresh();
        setFaucetMessage(null);
      }, 2000);
    } else {
      setFaucetMessage({ type: 'error', text: result.error || 'Failed to request SUI' });
    }
  };

  const balanceInFiat = suiPrice ? (parseFloat(suiBalance) * suiPrice).toFixed(2) : null;

  return (
    <div className="space-y-8">

      {/* Assets */}
      {!isMock && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assets</h2>
            <div className="flex items-center gap-3">
              <LastUpdated
                lastUpdated={lastUpdated}
                onRefresh={onRefresh}
                isLoading={isRefreshing}
              />
              {faucetMessage && (
                <span className={`text-sm ${faucetMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {faucetMessage.text}
                </span>
              )}
              <button
                onClick={handleFaucet}
                disabled={isFaucetLoading || !connectedAddress}
                className="px-3 py-1.5 rounded-lg text-sm bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFaucetLoading ? 'Requesting...' : 'Get test SUI'}
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Asset</th>
                  <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Balance</th>
                  <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <svg className="w-4 h-5" viewBox="0 0 29 36" fill="currentColor">
                          <path className="text-cyan-500" fillRule="evenodd" clipRule="evenodd" d="M22.5363 15.0142L22.5357 15.0158C24.0044 16.8574 24.8821 19.1898 24.8821 21.7268C24.8821 24.3014 23.9781 26.6655 22.4698 28.5196L22.3399 28.6792L22.3055 28.4763C22.2762 28.3038 22.2418 28.1296 22.2018 27.954C21.447 24.6374 18.9876 21.7934 14.9397 19.4907C12.2063 17.9399 10.6417 16.0727 10.2309 13.9511C9.96558 12.5792 10.1628 11.2012 10.544 10.0209C10.9251 8.84103 11.4919 7.85247 11.9735 7.2573L11.9738 7.25692L13.5484 5.3315C13.8246 4.99384 14.3413 4.99384 14.6175 5.3315L22.5363 15.0142ZM25.0269 13.0906L25.0272 13.0898L14.4731 0.184802C14.2715 -0.0616007 13.8943 -0.0616009 13.6928 0.184802L3.1385 13.09L3.13878 13.0907L3.10444 13.1333C1.16226 15.5434 0 18.6061 0 21.9402C0 29.7051 6.30498 36 14.0829 36C21.8608 36 28.1658 29.7051 28.1658 21.9402C28.1658 18.6062 27.0035 15.5434 25.0614 13.1333L25.0269 13.0906ZM5.66381 14.9727L5.66423 14.9721L6.60825 13.8178L6.63678 14.0309C6.65938 14.1997 6.68678 14.3694 6.71928 14.5398C7.33009 17.7446 9.51208 20.4169 13.1602 22.4865C16.3312 24.2912 18.1775 26.3666 18.7095 28.6427C18.9314 29.5926 18.971 30.5272 18.8749 31.3443L18.8689 31.3948L18.8232 31.4172C17.3919 32.1164 15.783 32.5088 14.0826 32.5088C8.11832 32.5088 3.28308 27.6817 3.28308 21.7268C3.28308 19.1701 4.17443 16.8208 5.66381 14.9727Z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">SUI</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Sui</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-gray-900 dark:text-white">{suiBalance}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {balanceInFiat ? `${currencySymbol}${balanceInFiat}` : '—'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Campaign Activity */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            value={stats.campaignsCreated}
            label="Campaigns Created"
            color="text-cyan-600 dark:text-cyan-400"
            isLoading={isLoading}
          />
          <StatCard
            value={stats.totalResponses}
            label={isMock ? 'Total Responses' : 'Responses Received'}
            color="text-gray-900 dark:text-white"
            isLoading={isLoading}
          />
          <StatCard
            value={stats.campaignsParticipated}
            label="Participated In"
            color="text-cyan-600 dark:text-cyan-400"
            isLoading={isLoading}
          />
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

      {/* Transactions Section - for blockchain data */}
      {!isMock && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transactions <span className="font-normal text-gray-500 dark:text-gray-400">(Logbook Smart Contract)</span></h2>

          {/* Gas Statistics */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalGasFiat ? `${currencySymbol}${totalGasFiat}` : `${totalGasSpent.toFixed(4)} SUI`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Gas Used
                  {totalGasFiat && <span className="text-gray-400"> ({totalGasSpent.toFixed(4)} SUI)</span>}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {userPaidFiat ? `${currencySymbol}${userPaidFiat}` : `${userPaidGas.toFixed(4)} SUI`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  You Paid
                  {userPaidFiat && <span className="text-gray-400"> ({userPaidGas.toFixed(4)} SUI)</span>}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {logbookPaidFiat ? `${currencySymbol}${logbookPaidFiat}` : `${logbookPaidGas.toFixed(4)} SUI`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Logbook Sponsored
                  {logbookPaidFiat && <span className="text-gray-400"> ({logbookPaidGas.toFixed(4)} SUI)</span>}
                </div>
              </div>
            </div>
          )}

          {isLoadingTxs ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No Logbook transactions yet. Create a campaign or submit a response to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <TransactionItem key={tx.digest} tx={tx} suiPrice={suiPrice} currencySymbol={currencySymbol} />
              ))}
            </div>
          )}
        </section>
      )}

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

// Transaction item component (avoids nested <a> issue)
function TransactionItem({ tx, suiPrice, currencySymbol }: { tx: UserTransaction; suiPrice: number | null; currencySymbol: string }) {
  const router = useRouter();

  const getGasPayerLabel = (gasPayedBy: UserTransaction['gasPayedBy']) => {
    if (gasPayedBy === 'user') return null;
    if (gasPayedBy === 'logbook') return 'Sponsored by Logbook';
    return `Sponsored by ${gasPayedBy.slice(0, 6)}...${gasPayedBy.slice(-4)}`;
  };

  const getTransactionLabel = (type: UserTransaction['type']) => {
    switch (type) {
      case 'create_campaign': return 'Created Campaign';
      case 'submit_response': return 'Submitted Response';
      default: return 'Transaction';
    }
  };

  const formatTimestamp = (ts: number) => {
    if (!ts) return '—';
    const date = new Date(ts);
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  };

  const handleClick = () => {
    if (tx.campaignId) {
      router.push(`/campaigns/${tx.campaignId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] flex items-center gap-4 ${
        tx.campaignId ? 'hover:border-cyan-500/50 hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer' : ''
      } transition`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        tx.type === 'create_campaign'
          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
          : tx.type === 'submit_response'
          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
          : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
      }`}>
        {tx.type === 'create_campaign' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ) : tx.type === 'submit_response' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-white">
            {getTransactionLabel(tx.type)}
          </span>
          {!tx.success && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-red-500/10 text-red-600 dark:text-red-400">
              Failed
            </span>
          )}
          {tx.gasPayedBy !== 'user' && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              {getGasPayerLabel(tx.gasPayedBy)}
            </span>
          )}
        </div>
        {tx.campaignTitle && (
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate" title={tx.campaignTitle}>
            {tx.campaignTitle}
          </div>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatTimestamp(tx.timestamp)}
        </div>
      </div>

      {/* Gas cost */}
      <div className="text-right">
        <div className={`text-sm ${tx.gasPayedBy === 'user' ? 'text-gray-600 dark:text-gray-300' : 'text-cyan-600 dark:text-cyan-400 line-through'}`}>
          {suiPrice ? `-${currencySymbol}${(tx.gasCost * suiPrice).toFixed(4)}` : `-${tx.gasCost.toFixed(4)} SUI`}
        </div>
        {suiPrice && (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {tx.gasCost.toFixed(4)} SUI
          </div>
        )}
      </div>

      {/* Link to Suiscan */}
      <a
        href={getSuiscanTxUrl(tx.digest)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        title="View on Suiscan"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}

// Free Tier Tab
function FreeTierTab({
  sponsorshipStatus,
  isMock,
  isLoading,
}: {
  sponsorshipStatus: SponsorshipStatus | null;
  isMock: boolean;
  isLoading: boolean;
}) {
  if (isMock) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Free Tier status is not available in mock mode. Connect to a network to see your sponsorship status.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (!sponsorshipStatus) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Unable to load sponsorship status.
      </div>
    );
  }

  // Cap values to not exceed limits
  const usedCampaigns = Math.min(sponsorshipStatus.used.campaigns, sponsorshipStatus.limits.MAX_CAMPAIGNS);
  const usedResponses = Math.min(sponsorshipStatus.used.responses, sponsorshipStatus.limits.MAX_RESPONSES);
  const remainingCampaigns = Math.max(0, sponsorshipStatus.limits.MAX_CAMPAIGNS - usedCampaigns);
  const remainingResponses = Math.max(0, sponsorshipStatus.limits.MAX_RESPONSES - usedResponses);

  return (
    <div className="space-y-8">
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {remainingCampaigns}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Free Campaigns Left</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {remainingResponses}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Free Responses Left</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {usedCampaigns}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Campaigns Used</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {usedResponses}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Responses Used</div>
        </div>
      </div>

      {/* Progress bars */}
      <section className="p-6 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
        <h2 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 mb-4">Usage Progress</h2>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Campaigns</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {usedCampaigns} of {sponsorshipStatus.limits.MAX_CAMPAIGNS} used
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(usedCampaigns / sponsorshipStatus.limits.MAX_CAMPAIGNS) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Responses</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {usedResponses} of {sponsorshipStatus.limits.MAX_RESPONSES} used
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(usedResponses / sponsorshipStatus.limits.MAX_RESPONSES) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About Free Tier</h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Logbook sponsors gas fees for campaign creators to help them get started without needing SUI tokens. Each creator gets <span className="font-medium text-gray-900 dark:text-white">{sponsorshipStatus.limits.MAX_CAMPAIGNS} free campaigns</span> and <span className="font-medium text-gray-900 dark:text-white">{sponsorshipStatus.limits.MAX_RESPONSES} free responses</span> to their campaigns. Participants never pay — gas fees for responses are covered by the campaign creator. After using your free tier, you&apos;ll need SUI tokens to pay for transaction gas fees.
          </p>
          <p>
            <Link href="/docs?doc=free-tier" className="text-cyan-600 dark:text-cyan-400 hover:underline">
              Learn more in documentation →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

// Settings Tab
function SettingsTab() {
  const { themeMode, setThemeMode } = useTheme();
  const { languageSetting, setLanguage, t } = useLanguage();
  const { currencySetting, setCurrency, currencySymbol: settingsCurrencySymbol } = useCurrency();

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

  const getCurrencyButtonLabel = (currency: CurrencySetting) => {
    switch (currency) {
      case 'auto': return `Auto (${settingsCurrencySymbol})`;
      case 'usd': return 'USD ($)';
      case 'eur': return 'EUR (€)';
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

          {/* AI Generated languages - temporarily hidden
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
          */}
        </div>
      </section>

      {/* Currency */}
      <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Currency</h2>
        <div className="flex flex-wrap gap-2">
          {(['auto', 'usd', 'eur'] as const).map(currency => (
            <button
              key={currency}
              onClick={() => setCurrency(currency)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                currencySetting === currency
                  ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {getCurrencyButtonLabel(currency)}
            </button>
          ))}
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
