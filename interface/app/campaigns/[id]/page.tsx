'use client';

export const runtime = 'edge';

import { useState, useEffect, Suspense, use } from 'react';
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
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [backLink, setBackLink] = useState('/campaigns');

  // Load zkLogin address and referrer from localStorage/sessionStorage
  useEffect(() => {
    const address = localStorage.getItem('zklogin_address');
    setZkLoginAddress(address);
    setBackLink(getReferrer('/campaigns'));
  }, []);

  // Get connected address (from wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;

  // Blockchain data state
  const [blockchainCampaign, setBlockchainCampaign] = useState<CampaignDetails | null>(null);
  const [blockchainResults, setBlockchainResults] = useState<QuestionResult[]>([]);
  const [blockchainResponses, setBlockchainResponses] = useState<CampaignResponseData[]>([]);
  const [hasParticipatedState, setHasParticipatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet'>('mock');

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

  // Load data from blockchain if needed
  useEffect(() => {
    const source = getDataSource();
    setDataSourceState(source);

    if (source !== 'mock') {
      setIsLoading(true);
      const fetchData = async () => {
        try {
          const [campaignData, resultsData, responsesData] = await Promise.all([
            fetchCampaignById(id),
            fetchCampaignResults(id),
            fetchCampaignResponses(id),
          ]);
          setBlockchainCampaign(campaignData);
          setBlockchainResults(resultsData);
          setBlockchainResponses(responsesData);

          // Check if user has participated (if connected)
          if (connectedAddress) {
            const hasParticipated = await checkUserParticipation(id, connectedAddress);
            setHasParticipatedState(hasParticipated);
          }
        } catch (error) {
          console.error('Failed to fetch campaign:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [id, connectedAddress]);

  // Get campaign - from blockchain or mock data
  const campaign = dataSource !== 'mock' ? blockchainCampaign : getCampaignById(id);
  const results = dataSource !== 'mock' ? {
    totalResponses: campaign?.stats.responses || 0,
    completionRate: 100,
    questions: blockchainResults,
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
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
            >
              Participate
            </button>
          )}
          {campaign.status === 'active' && hasParticipated && (
            <div className="px-6 py-3 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You have participated
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-white/[0.06]">
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

          {/* Share (for creators) */}
          {isCreator && (
            <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share Campaign</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/campaigns/${campaign.id}`}
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-400"
                />
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${window.location.origin}/campaigns/${campaign.id}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className={`px-4 py-3 rounded-lg transition ${
                    showQR
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  QR
                </button>
              </div>
              {showQR && (
                <div className="mt-4 flex justify-center">
                  <div className="p-4 bg-white rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/campaigns/${campaign.id}`)}`}
                      alt="Campaign QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}
            </section>
          )}

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
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 w-36">
                              Respondent
                            </th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                              Answer
                            </th>
                            <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 w-16">
                              TX
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
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Respondent
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Time</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Answers</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 w-16">TX</th>
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
