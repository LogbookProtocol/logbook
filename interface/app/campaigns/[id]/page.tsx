'use client';

export const runtime = 'edge';

import { useState, useEffect, Suspense, use, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import {
  getCampaignById,
  mockCampaignResults,
  mockCampaignResponses,
  CAMPAIGN_STATUSES,
  CampaignDetails,
  QuestionResult,
} from '@/lib/mock-data';
import { formatDate, formatDateTime, formatEndDateTimeParts } from '@/lib/format-date';
import { getDataSource, getSuiscanObjectUrl, getSuiscanTxUrl, getSuiscanAccountUrl } from '@/lib/sui-config';
import { fetchCampaignById, fetchCampaignResults, fetchCampaignResponses, checkUserParticipation, CampaignResponseData } from '@/lib/sui-service';
import { useAuth } from '@/contexts/AuthContext';
import { getReferrer, saveReferrer } from '@/lib/navigation';
import { useCopyLink } from '@/hooks/useCopyLink';
import { LastUpdated } from '@/components/LastUpdated';
import {
  decryptCampaignData,
  decryptData,
  getStoredPassword,
  storePassword,
  removeStoredPassword,
  isValidPassword,
} from '@/lib/crypto';

type TabType = 'overview' | 'results' | 'responses';

function CampaignContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const { requireAuth } = useAuth();
  const fromTab = searchParams.get('from') as 'created' | 'participated' | null;
  const initialTab = searchParams.get('tab') as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'overview');
  const [, forceUpdate] = useState(0);
  const [copiedQR, setCopiedQR] = useState(false);
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [backLink, setBackLink] = useState('/campaigns');
  const { copyLink, isCopied } = useCopyLink();

  // Load zkLogin address and referrer from localStorage/sessionStorage
  useEffect(() => {
    const loadZkLoginAddress = () => {
      const address = localStorage.getItem('zklogin_address');
      setZkLoginAddress(address);
    };

    loadZkLoginAddress();
    setBackLink(getReferrer('/campaigns'));

    // Listen for zklogin-changed event (fired when user logs out)
    window.addEventListener('zklogin-changed', loadZkLoginAddress);
    return () => window.removeEventListener('zklogin-changed', loadZkLoginAddress);
  }, []);

  // Get connected address (from wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;

  // Blockchain data state
  const [blockchainCampaign, setBlockchainCampaign] = useState<CampaignDetails | null>(null);
  const [blockchainResults, setBlockchainResults] = useState<QuestionResult[]>([]);
  const [blockchainResponses, setBlockchainResponses] = useState<CampaignResponseData[]>([]);
  const [hasParticipatedState, setHasParticipatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet'>('mock');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Encrypted campaign state
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedCampaign, setDecryptedCampaign] = useState<CampaignDetails | null>(null);
  const [includePasswordInLink, setIncludePasswordInLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [decryptedResults, setDecryptedResults] = useState<QuestionResult[]>([]);

  // Sync tab with URL param when navigating between campaigns
  useEffect(() => {
    setActiveTab(initialTab || 'overview');
  }, [initialTab, id]);

  // Re-render when date format changes
  useEffect(() => {
    const handleDateFormatChange = () => forceUpdate(n => n + 1);
    window.addEventListener('date-format-changed', handleDateFormatChange);
    return () => window.removeEventListener('date-format-changed', handleDateFormatChange);
  }, []);

  // Load and persist includePasswordInLink setting
  useEffect(() => {
    const stored = localStorage.getItem(`campaign_include_password_${id}`);
    if (stored !== null) {
      setIncludePasswordInLink(stored === 'true');
    }
  }, [id]);

  const handleIncludePasswordChange = (checked: boolean) => {
    setIncludePasswordInLink(checked);
    localStorage.setItem(`campaign_include_password_${id}`, String(checked));
  };

  // Fetch campaign data from blockchain
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [campaignData, resultsData, responsesData] = await Promise.all([
        fetchCampaignById(id),
        fetchCampaignResults(id),
        fetchCampaignResponses(id),
      ]);
      setBlockchainCampaign(campaignData);
      setBlockchainResults(resultsData);
      setBlockchainResponses(responsesData);
      setLastUpdated(new Date());

      // Check if user has participated (if connected)
      if (connectedAddress) {
        const hasParticipated = await checkUserParticipation(id, connectedAddress);
        setHasParticipatedState(hasParticipated);
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, connectedAddress]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  // Load data from blockchain if needed
  useEffect(() => {
    const source = getDataSource();
    setDataSourceState(source);

    if (source !== 'mock') {
      // Initial fetch with loading state
      fetchData(true);
    }
  }, [fetchData]);

  // Handle encrypted campaign decryption
  useEffect(() => {
    if (!blockchainCampaign?.isEncrypted) {
      setIsLocked(false);
      setDecryptedCampaign(null);
      return;
    }

    const tryDecrypt = async (password: string) => {
      try {
        const decryptedData = await decryptCampaignData(
          {
            title: blockchainCampaign.title,
            description: blockchainCampaign.description,
            questions: blockchainCampaign.questions.map(q => ({
              text: q.question,
              options: q.options?.map(o => o.label) || [],
            })),
          },
          password
        );

        // Create decrypted campaign object
        const decrypted: CampaignDetails = {
          ...blockchainCampaign,
          title: decryptedData.title,
          description: decryptedData.description,
          questions: blockchainCampaign.questions.map((q, i) => ({
            ...q,
            question: decryptedData.questions[i].text,
            options: q.options?.map((o, j) => ({
              ...o,
              label: decryptedData.questions[i].options[j] || o.label,
            })),
          })),
        };

        setDecryptedCampaign(decrypted);
        setIsLocked(false);
        storePassword(id, password, connectedAddress);
      } catch {
        setIsLocked(true);
      }
    };

    // Check URL param first
    const keyParam = searchParams.get('key');
    if (keyParam && isValidPassword(keyParam)) {
      tryDecrypt(keyParam);
      return;
    }

    // Check localStorage
    const storedPassword = getStoredPassword(id, connectedAddress);
    if (storedPassword && isValidPassword(storedPassword)) {
      tryDecrypt(storedPassword);
      return;
    }

    // No password found, show locked state
    setIsLocked(true);
  }, [blockchainCampaign, id, searchParams, connectedAddress]);

  // Handle unlock button click
  const handleUnlock = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    setIsDecrypting(true);
    setPasswordError(null);

    try {
      if (!blockchainCampaign) return;

      const decryptedData = await decryptCampaignData(
        {
          title: blockchainCampaign.title,
          description: blockchainCampaign.description,
          questions: blockchainCampaign.questions.map(q => ({
            text: q.question,
            options: q.options?.map(o => o.label) || [],
          })),
        },
        passwordInput
      );

      // Create decrypted campaign object
      const decrypted: CampaignDetails = {
        ...blockchainCampaign,
        title: decryptedData.title,
        description: decryptedData.description,
        questions: blockchainCampaign.questions.map((q, i) => ({
          ...q,
          question: decryptedData.questions[i].text,
          options: q.options?.map((o, j) => ({
            ...o,
            label: decryptedData.questions[i].options[j] || o.label,
          })),
        })),
      };

      setDecryptedCampaign(decrypted);
      setIsLocked(false);
      storePassword(id, passwordInput, connectedAddress);
    } catch {
      setPasswordError('Incorrect password');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Set up polling only for active campaigns
  useEffect(() => {
    if (dataSource === 'mock') return;
    if (!blockchainCampaign || blockchainCampaign.status !== 'active') return;

    // Poll every 5 seconds without loading state
    const interval = setInterval(() => fetchData(false), 5000);

    return () => clearInterval(interval);
  }, [dataSource, blockchainCampaign, fetchData]);

  // Redirect to campaigns list when user logs out while viewing encrypted campaign
  useEffect(() => {
    // Only apply to encrypted campaigns that have been unlocked
    if (!blockchainCampaign?.isEncrypted || isLocked) return;

    // If there's no connected address, user has logged out
    if (!connectedAddress) {
      router.push('/campaigns');
    }
  }, [blockchainCampaign?.isEncrypted, isLocked, connectedAddress, router]);

  // Decrypt results for encrypted campaigns
  useEffect(() => {
    const decryptResultsData = async () => {
      if (!blockchainCampaign?.isEncrypted || blockchainResults.length === 0) {
        setDecryptedResults([]);
        return;
      }

      const password = getStoredPassword(id, connectedAddress);
      if (!password) {
        setDecryptedResults([]);
        return;
      }

      try {
        const decrypted = await Promise.all(
          blockchainResults.map(async (q) => {
            // Decrypt question text
            let decryptedQuestion = q.question;
            try {
              decryptedQuestion = await decryptData(q.question, password);
            } catch {
              // Keep original if decryption fails
            }

            // Decrypt option labels for choice questions
            let decryptedResultsArray = q.results;
            if (q.results && q.results.length > 0) {
              decryptedResultsArray = await Promise.all(
                q.results.map(async (option) => {
                  try {
                    const decryptedLabel = await decryptData(option.label, password);
                    return { ...option, label: decryptedLabel };
                  } catch {
                    return option; // Keep original if decryption fails
                  }
                })
              );
            }

            // Decrypt text responses
            let decryptedTextResponses = q.textResponses;
            if (q.type === 'text' && q.textResponses) {
              decryptedTextResponses = await Promise.all(
                q.textResponses.map(async (response) => {
                  try {
                    const decryptedText = await decryptData(response.text, password);
                    return { ...response, text: decryptedText };
                  } catch {
                    return response; // Keep original if decryption fails
                  }
                })
              );
            }

            return {
              ...q,
              question: decryptedQuestion,
              results: decryptedResultsArray,
              textResponses: decryptedTextResponses,
            };
          })
        );
        setDecryptedResults(decrypted);
      } catch {
        setDecryptedResults([]);
      }
    };

    decryptResultsData();
  }, [blockchainCampaign?.isEncrypted, blockchainResults, id, connectedAddress]);

  // Get campaign - from blockchain (decrypted if available) or mock data
  const rawCampaign = dataSource !== 'mock' ? blockchainCampaign : getCampaignById(id);
  const campaign = decryptedCampaign || rawCampaign;
  // Use decrypted results for encrypted campaigns, otherwise use raw blockchain results
  const resultsQuestions = blockchainCampaign?.isEncrypted && decryptedResults.length > 0
    ? decryptedResults
    : blockchainResults;

  const results = dataSource !== 'mock' ? {
    totalResponses: campaign?.stats.responses || 0,
    completionRate: 100,
    questions: resultsQuestions,
    finalizedOnChain: campaign?.status === 'ended',
    finalizationTx: '',
  } : mockCampaignResults;

  // Handle loading
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Handle not found
  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign not found</h1>
        <Link href="/campaigns" className="text-cyan-600 dark:text-cyan-400 hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  // Handle locked encrypted campaign
  if (isLocked && rawCampaign?.isEncrypted) {
    return (
      <div className="max-w-md mx-auto px-6 py-24">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Password Protected Campaign
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            This campaign is encrypted. Enter the password to view its content.
          </p>
        </div>

        {/* Campaign metadata (unencrypted) */}
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Created by</span>
              <span className="text-gray-700 dark:text-gray-300 font-mono">
                {rawCampaign.creator.address.slice(0, 6)}...{rawCampaign.creator.address.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-700 dark:text-gray-300">{formatDate(rawCampaign.dates.created)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Responses</span>
              <span className="text-gray-700 dark:text-gray-300">{rawCampaign.stats.responses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={rawCampaign.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                {CAMPAIGN_STATUSES[rawCampaign.status].label}
              </span>
            </div>
          </div>
        </div>

        {/* Password input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Campaign Password
          </label>
          <input
            type="text"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setPasswordError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition font-mono ${
              passwordError
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter password"
          />
          {passwordError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
          )}
        </div>

        {/* Unlock button */}
        <button
          onClick={handleUnlock}
          disabled={isDecrypting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isDecrypting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Unlocking...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Unlock Campaign
            </>
          )}
        </button>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/campaigns" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
            ← Back to campaigns
          </Link>
        </div>
      </div>
    );
  }
  const responses = dataSource !== 'mock' ? blockchainResponses : mockCampaignResponses;
  const statusInfo = CAMPAIGN_STATUSES[campaign.status];

  // Whether the user has participated in this campaign
  const hasParticipated = dataSource !== 'mock' ? hasParticipatedState : false;

  // Check if current user is the creator (supports both wallet and zkLogin)
  const isCreator = dataSource === 'mock'
    ? true
    : connectedAddress === campaign.creator.address;


  const daysLeft = campaign.dates.endDate
    ? Math.ceil((new Date(campaign.dates.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Build tabs - Responses visible to everyone
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'responses', label: `Responses (${responses.length})` },
    { id: 'results', label: 'Results' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={backLink}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4 inline-block"
        >
          ← Campaigns
        </Link>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {/* Campaign type icon */}
              {campaign.isEncrypted ? (
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0" title="Password Protected">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0" title="Open Campaign">
                  <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1">{campaign.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  campaign.status === 'active'
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                }`}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <span>by {campaign.creator.address.slice(0, 5)}...{campaign.creator.address.slice(-4)}</span>
            </div>
          </div>

          {/* CTA */}
          {campaign.status === 'active' && !hasParticipated && (
            <button
              onClick={() => {
                const targetPath = `/campaigns/${campaign.id}/participate`;
                if (requireAuth(targetPath)) {
                  saveReferrer(targetPath);
                  router.push(targetPath);
                }
              }}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition"
            >
              Participate
            </button>
          )}
          {campaign.status === 'active' && hasParticipated && (
            <div className="px-4 py-2 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 font-medium flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You have participated
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-end justify-between mb-8 border-b border-gray-200 dark:border-white/[0.06]">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {dataSource !== 'mock' && campaign.status === 'active' && (
          <div className="pb-3">
            <LastUpdated
              lastUpdated={lastUpdated}
              onRefresh={handleManualRefresh}
              isLoading={isRefreshing}
            />
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.responses}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Responses</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.questions.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDate(campaign.dates.created)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Started</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {campaign.dates.endDate ? formatEndDateTimeParts(campaign.dates.endDate).datePart : '—'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {campaign.status === 'ended' ? 'Ended' : 'Ends'}
              </div>
              {campaign.dates.endDate && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  until end of 23:59 GMT
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About this campaign</h2>
            <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{campaign.description}</div>
          </section>

          {/* Questions preview */}
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Questions ({campaign.questions.length})
            </h2>
            <div className="space-y-4">
              {campaign.questions.map((q, index) => (
                <div key={q.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 dark:text-white">{q.question}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {q.type === 'single-choice' && `Single choice • ${q.options?.length} options`}
                      {q.type === 'multiple-choice' && `Multiple choice • ${q.options?.length} options`}
                      {q.type === 'text' && 'Text answer'}
                      {q.required && ' • Required'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Share Campaign */}
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share Campaign</h2>

              {/* Password management for encrypted campaigns */}
              {campaign.isEncrypted && getStoredPassword(id, connectedAddress) && (
                <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  {/* Password field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                      Campaign Password
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={getStoredPassword(id, connectedAddress) || ''}
                          readOnly
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg text-gray-900 dark:text-gray-100 font-mono text-sm pr-10"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const password = getStoredPassword(id, connectedAddress);
                          if (password) {
                            navigator.clipboard.writeText(password);
                            setPasswordCopied(true);
                            setTimeout(() => setPasswordCopied(false), 2000);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                          passwordCopied
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                        }`}
                        title="Copy password"
                      >
                        {passwordCopied ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        {passwordCopied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => {
                          removeStoredPassword(id, connectedAddress);
                          window.location.reload();
                        }}
                        className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition"
                        title="Forget password"
                      >
                        Forget
                      </button>
                    </div>
                  </div>

                  {/* Include password in link toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePasswordInLink}
                      onChange={(e) => handleIncludePasswordChange(e.target.checked)}
                      className="w-4 h-4 text-amber-500 border-amber-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      Include password in link and QR code
                    </span>
                  </label>
                  {includePasswordInLink && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                      Anyone with the link or QR code will be able to access the campaign without entering a password.
                    </p>
                  )}
                </div>
              )}

              {/* Hidden QR for canvas operations */}
              <img
                id="campaign-qr-code"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/campaigns/${campaign.id}${includePasswordInLink && campaign.isEncrypted ? `?key=${getStoredPassword(campaign.id, connectedAddress) || ''}` : ''}`)}`}
                alt="Campaign QR Code"
                className="hidden"
                crossOrigin="anonymous"
              />
              <div className="flex flex-wrap gap-3">
                {/* Copy Link */}
                <button
                  onClick={() => {
                    const password = includePasswordInLink && campaign.isEncrypted ? getStoredPassword(campaign.id, connectedAddress) : null;
                    copyLink(campaign.id, undefined, password || undefined);
                  }}
                  className={`px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 ${
                    isCopied(campaign.id)
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
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
                  {isCopied(campaign.id) ? 'Copied!' : 'Copy Link'}
                </button>
                {/* Copy QR */}
                <button
                  onClick={async () => {
                    const img = document.getElementById('campaign-qr-code') as HTMLImageElement;
                    if (!img) return;
                    const canvas = document.createElement('canvas');
                    canvas.width = 200;
                    canvas.height = 200;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(img, 0, 0, 200, 200);
                    canvas.toBlob(async (blob) => {
                      if (!blob) return;
                      try {
                        await navigator.clipboard.write([
                          new ClipboardItem({ 'image/png': blob })
                        ]);
                        setCopiedQR(true);
                        setTimeout(() => setCopiedQR(false), 2000);
                      } catch {
                        // Fallback: download instead
                        const link = document.createElement('a');
                        link.download = `logbook-qr-${campaign.id.slice(0, 8)}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                      }
                    }, 'image/png');
                  }}
                  className={`px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 ${
                    copiedQR
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  {copiedQR ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  )}
                  {copiedQR ? 'Copied!' : 'Copy QR'}
                </button>
                {/* Download QR */}
                <button
                  onClick={() => {
                    const img = document.getElementById('campaign-qr-code') as HTMLImageElement;
                    if (!img) return;
                    const canvas = document.createElement('canvas');
                    canvas.width = 200;
                    canvas.height = 200;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(img, 0, 0, 200, 200);
                    const link = document.createElement('a');
                    link.download = `logbook-qr-${campaign.id.slice(0, 8)}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR
                </button>
              </div>
          </section>

          {/* On-chain info */}
          <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">On-chain Record</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Object ID</span>
                <a
                  href={getSuiscanObjectUrl(campaign.onChain.objectId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  {campaign.onChain.objectId.slice(0, 16)}... ↗
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Network</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {dataSource === 'devnet' ? 'Sui Devnet' : dataSource === 'testnet' ? 'Sui Testnet' : 'Sui Mainnet'}
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{results.totalResponses}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Responses</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{results.completionRate}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.questions.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
            </div>
          </div>

          {/* Results by question */}
          {results.questions.map((q, index) => (
            <div
              key={q.id}
              className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 dark:text-white font-medium">{q.question}</h3>
                  <div className="text-sm text-gray-500 mt-1">{q.totalVotes || q.totalResponses} responses</div>
                </div>
              </div>

              {/* Choice results */}
              {(q.type === 'single-choice' || q.type === 'multiple-choice') && q.results && (
                <div className="space-y-3">
                  {q.results.map((option) => (
                    <div key={option.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span
                          className={
                            option.id === q.winner
                              ? 'text-cyan-600 dark:text-cyan-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }
                        >
                          {option.id === q.winner && '★ '}
                          {option.label}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {option.votes} ({option.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            option.id === q.winner
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                              : 'bg-gray-400 dark:bg-white/30'
                          }`}
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Text responses as table */}
              {q.type === 'text' && (
                <div>
                  {q.textResponses && q.textResponses.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/[0.06]">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-white/[0.02]">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 w-28">
                              Respondent
                            </th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                              Answer
                            </th>
                            <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              Transaction Block
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/[0.06]">
                          {q.textResponses.map((response, i) => (
                            <tr key={i} className="bg-white dark:bg-white/[0.01]">
                              <td className="px-4 py-3">
                                <a
                                  href={getSuiscanAccountUrl(response.respondentAddress)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-600 dark:text-cyan-400 text-xs hover:underline"
                                >
                                  <code>{response.respondent}</code> ↗
                                </a>
                              </td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                {response.text}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {response.txDigest ? (
                                  <a
                                    href={getSuiscanTxUrl(response.txDigest)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-600 dark:text-cyan-400 text-xs hover:underline"
                                  >
                                    ↗
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      No text responses yet
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* On-chain verification */}
          {results.finalizedOnChain && results.finalizationTx && (
            <section className="p-6 rounded-xl bg-green-500/5 border border-green-500/20">
              <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">On-chain Verification</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Finalization TX</span>
                  <a
                    href={getSuiscanTxUrl(results.finalizationTx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    {results.finalizationTx} ↗
                  </a>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Results are permanently recorded on the Sui blockchain and can be independently verified.
                </p>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Responses Tab */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          {responses.length === 0 ? (
            <div className="p-12 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">No responses yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Share your campaign to start collecting responses</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">
                      Respondent
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">Time</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">Answers</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">Transaction Block</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/[0.06]">
                  {responses.map((resp) => (
                    <tr key={resp.id} className="bg-white dark:bg-white/[0.01]">
                      <td className="px-6 py-4">
                        {resp.respondentAddress ? (
                          <a
                            href={getSuiscanAccountUrl(resp.respondentAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 text-sm hover:underline"
                          >
                            <code>{resp.respondent}</code> ↗
                          </a>
                        ) : (
                          <code className="text-cyan-600 dark:text-cyan-400 text-sm">{resp.respondent}</code>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                        {formatDateTime(resp.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                        {Object.keys(resp.answers).length} answers
                      </td>
                      <td className="px-6 py-4 text-right">
                        {resp.txHash ? (
                          <a
                            href={getSuiscanTxUrl(resp.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 text-sm hover:underline"
                          >
                            ↗
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function CampaignViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-6 py-12">Loading...</div>}>
      <CampaignContent params={params} />
    </Suspense>
  );
}
