'use client';

export const runtime = 'edge';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { getCampaignById, CampaignDetails, CAMPAIGN_STATUSES } from '@/lib/mock-data';
import { getDataSource } from '@/lib/sui-config';
import { fetchCampaignById, buildSubmitResponseTx, executeZkLoginSponsoredTransaction } from '@/lib/sui-service';
import { isZkLoginSessionValid, parseZkLoginError, ZkLoginErrorInfo } from '@/lib/zklogin-utils';
import { ZkLoginErrorAlert } from '@/components/ZkLoginErrorAlert';
import { getReferrer } from '@/lib/navigation';
import { formatDate } from '@/lib/format-date';
import {
  decryptCampaignData,
  encryptAnswers,
  getStoredPassword,
  storePassword,
  isValidPassword,
} from '@/lib/crypto';
import {
  getPersonalKey,
  encryptPasswordForStorage,
} from '@/lib/encryption-auto-recovery';

export default function CampaignParticipatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [rawCampaign, setRawCampaign] = useState<CampaignDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [zkLoginError, setZkLoginError] = useState<ZkLoginErrorInfo | null>(null);
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [backLink, setBackLink] = useState(`/campaigns/${id}`);

  // Encrypted campaign state
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [campaignPassword, setCampaignPassword] = useState<string | null>(null);

  // Load zkLogin address and referrer
  useEffect(() => {
    const loadZkLoginAddress = () => {
      const address = localStorage.getItem('zklogin_address');
      setZkLoginAddress(address);
    };

    loadZkLoginAddress();
    setBackLink(getReferrer(`/campaigns/${id}`));

    // Listen for zklogin-changed event (fired when user logs out)
    window.addEventListener('zklogin-changed', loadZkLoginAddress);
    return () => window.removeEventListener('zklogin-changed', loadZkLoginAddress);
  }, [id]);

  // Get connected address (from wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;

  // Redirect to campaigns list when user logs out while on encrypted campaign
  useEffect(() => {
    // Only apply to encrypted campaigns that have been unlocked
    if (!rawCampaign?.isEncrypted || isLocked) return;

    // If there's no connected address, user has logged out
    if (!connectedAddress) {
      router.push('/campaigns');
    }
  }, [rawCampaign?.isEncrypted, isLocked, connectedAddress, router]);

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      setIsLoading(true);
      const dataSource = getDataSource();

      let loadedCampaign: CampaignDetails | null = null;

      if (dataSource === 'mock') {
        loadedCampaign = getCampaignById(id) || null;
      } else {
        loadedCampaign = await fetchCampaignById(id);
      }

      setRawCampaign(loadedCampaign);

      // Handle encrypted campaigns
      if (loadedCampaign?.isEncrypted) {
        // Try to decrypt
        const tryDecrypt = async (password: string) => {
          try {
            const decryptedData = await decryptCampaignData(
              {
                title: loadedCampaign!.title,
                description: loadedCampaign!.description,
                questions: loadedCampaign!.questions.map(q => ({
                  text: q.question,
                  options: q.options?.map(o => o.label) || [],
                })),
              },
              password
            );

            const decrypted: CampaignDetails = {
              ...loadedCampaign!,
              title: decryptedData.title,
              description: decryptedData.description,
              questions: loadedCampaign!.questions.map((q, i) => ({
                ...q,
                question: decryptedData.questions[i].text,
                options: q.options?.map((o, j) => ({
                  ...o,
                  label: decryptedData.questions[i].options[j] || o.label,
                })),
              })),
            };

            setCampaign(decrypted);
            setCampaignPassword(password);
            setIsLocked(false);
            storePassword(id, password, connectedAddress);
          } catch {
            setIsLocked(true);
          }
        };

        // Check URL param first
        const keyParam = searchParams.get('key');
        if (keyParam && isValidPassword(keyParam)) {
          await tryDecrypt(keyParam);
        } else {
          // Check localStorage
          const storedPassword = getStoredPassword(id, connectedAddress);
          if (storedPassword && isValidPassword(storedPassword)) {
            await tryDecrypt(storedPassword);
          } else {
            setIsLocked(true);
          }
        }
      } else {
        setCampaign(loadedCampaign);
      }

      setIsLoading(false);
    };

    loadCampaign();
  }, [id, searchParams, connectedAddress]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  // Handle not found
  if (!campaign && !isLocked) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign not found</h1>
          <Link href="/campaigns" className="text-cyan-600 dark:text-cyan-400 hover:underline">
            ← Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Handle unlock for encrypted campaign
  const handleUnlock = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    setIsDecrypting(true);
    setPasswordError(null);

    try {
      if (!rawCampaign) return;

      const decryptedData = await decryptCampaignData(
        {
          title: rawCampaign.title,
          description: rawCampaign.description,
          questions: rawCampaign.questions.map(q => ({
            text: q.question,
            options: q.options?.map(o => o.label) || [],
          })),
        },
        passwordInput
      );

      const decrypted: CampaignDetails = {
        ...rawCampaign,
        title: decryptedData.title,
        description: decryptedData.description,
        questions: rawCampaign.questions.map((q, i) => ({
          ...q,
          question: decryptedData.questions[i].text,
          options: q.options?.map((o, j) => ({
            ...o,
            label: decryptedData.questions[i].options[j] || o.label,
          })),
        })),
      };

      setCampaign(decrypted);
      setCampaignPassword(passwordInput);
      setIsLocked(false);
      storePassword(id, passwordInput, connectedAddress);
    } catch {
      setPasswordError('Incorrect password');
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle locked encrypted campaign
  if (isLocked && rawCampaign?.isEncrypted) {
    return (
      <div className="max-w-md mx-auto px-6 py-8">
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
            Enter the password to participate in this campaign.
          </p>
        </div>

        {/* Campaign metadata */}
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Created by</span>
              <span className="text-gray-700 dark:text-gray-300 font-mono">
                {rawCampaign.creator.address.slice(0, 6)}...{rawCampaign.creator.address.slice(-4)}
              </span>
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

  // Campaign should be available at this point
  if (!campaign) {
    return null;
  }

  // Calculate progress based on answered questions
  const answeredCount = campaign.questions.filter(q => {
    const answer = answers[q.id];
    if (!answer) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (typeof answer === 'string' && !answer.trim()) return false;
    return true;
  }).length;
  const progress = (answeredCount / campaign.questions.length) * 100;

  // Check if all required questions are answered
  const canSubmit = () => {
    return campaign.questions.every(q => {
      if (!q.required) return true;
      const answer = answers[q.id];
      if (!answer) return false;
      if (Array.isArray(answer) && answer.length === 0) return false;
      if (typeof answer === 'string' && !answer.trim()) return false;
      return true;
    });
  };

  const handleSubmit = async () => {
    console.log('=== SUBMIT START ===');
    console.log('account?.address:', account?.address);
    console.log('zkLoginAddress:', zkLoginAddress);
    console.log('connectedAddress:', connectedAddress);
    console.log('answers:', answers);

    setSubmitState('submitting');
    setSubmitError(null);
    setZkLoginError(null);

    const dataSource = getDataSource();
    console.log('dataSource:', dataSource);

    // Mock mode - simulate submission
    if (dataSource === 'mock') {
      console.log('Submitting answers (mock):', answers);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSubmitState('success');
      return;
    }

    // Check if wallet is connected
    if (!connectedAddress) {
      console.log('ERROR: No connected address');
      setSubmitError('Please connect your wallet to submit');
      setSubmitState('error');
      return;
    }

    // Blockchain mode - submit with sponsored transaction
    try {
      // Encrypt answers if campaign is encrypted
      let finalAnswers = answers;
      if (campaign.isEncrypted && campaignPassword) {
        console.log('=== ENCRYPTING ANSWERS ===');
        console.log('Original answers:', answers);

        // For encrypted campaigns: ALL answers are encrypted (choice and text)
        // IMPORTANT: Convert choice option IDs to indices BEFORE encryption
        // so the blockchain receives encrypted indices that decrypt to "0", "1", "2", etc.
        const answersToEncrypt: Record<number, string> = {};

        campaign.questions.forEach((q, idx) => {
          const answer = answers[q.id];
          if (answer !== undefined) {
            // Convert answer to string for encryption
            if (Array.isArray(answer)) {
              // Multiple choice - convert option IDs to indices, then join
              const indices = answer.map((optId) => {
                // Convert "opt1" -> "0", "opt2" -> "1", etc.
                return (parseInt(optId.replace('opt', '')) - 1).toString();
              });
              answersToEncrypt[idx] = indices.join(',');
              console.log(`Question ${idx} (${q.id}, multiple-choice): encrypting indices "${indices.join(',')}" from options [${answer.join(', ')}]`);
            } else if (q.type === 'single-choice') {
              // Single choice - convert option ID to index
              const optionIndex = (parseInt(answer.replace('opt', '')) - 1).toString();
              answersToEncrypt[idx] = optionIndex;
              console.log(`Question ${idx} (${q.id}, single-choice): encrypting index "${optionIndex}" from option "${answer}"`);
            } else {
              // Text answer - encrypt as-is
              answersToEncrypt[idx] = answer;
              console.log(`Question ${idx} (${q.id}, text): encrypting text "${answer}"`);
            }
          }
        });

        console.log('answersToEncrypt (with indices):', answersToEncrypt);

        // Encrypt all answers
        const encryptedAnswers = await encryptAnswers(answersToEncrypt, campaignPassword);
        console.log('encryptedAnswers:', encryptedAnswers);

        // Convert back to Record<string, string | string[]> format
        finalAnswers = {};
        campaign.questions.forEach((q, idx) => {
          if (encryptedAnswers[idx]) {
            finalAnswers[q.id] = encryptedAnswers[idx];
            console.log(`Question ${q.id}: mapped encrypted answer from index ${idx}`);
          }
        });

        console.log('finalAnswers after mapping:', finalAnswers);
        console.log('=== ENCRYPTION COMPLETE ===');
      }

      // Generate response_seed for encrypted campaigns (enables participant auto-recovery)
      let responseSeed: string | null = null;
      if (campaign.isEncrypted && campaignPassword) {
        try {
          console.log('=== GENERATING RESPONSE_SEED ===');
          // Get personal key (works for both Google and Wallet)
          const personalKey = await getPersonalKey();

          // Encrypt password with personal key
          responseSeed = await encryptPasswordForStorage(campaignPassword, personalKey);
          console.log('response_seed generated successfully (encrypted password for auto-recovery)');
          console.log('=== RESPONSE_SEED GENERATION COMPLETE ===');
        } catch (error) {
          console.error('Failed to generate response_seed:', error);
          console.log('Continuing without response_seed (participant will need to enter password again)');
          // Continue without response_seed - not critical for submission
        }
      }

      console.log('Building transaction for campaign:', campaign.id);
      const tx = buildSubmitResponseTx(campaign.id, finalAnswers, responseSeed);

      if (!tx) {
        console.log('ERROR: Failed to build transaction');
        setSubmitError('Failed to build transaction');
        setSubmitState('error');
        return;
      }
      console.log('Transaction built successfully');

      // Check if using zkLogin (needs sponsored transaction)
      const useZkLogin = !account?.address && zkLoginAddress;
      console.log('useZkLogin:', useZkLogin);

      if (useZkLogin) {
        // Verify zkLogin session is valid
        const sessionValid = isZkLoginSessionValid();
        console.log('zkLogin session valid:', sessionValid);

        if (!sessionValid) {
          setSubmitError('Your session has expired. Please re-login with Google.');
          setSubmitState('error');
          return;
        }

        console.log('=== CALLING executeZkLoginSponsoredTransaction ===');
        console.log('zkLoginAddress:', zkLoginAddress);

        // Use zkLogin sponsored transaction
        const result = await executeZkLoginSponsoredTransaction(tx, zkLoginAddress);
        console.log('=== zkLogin RESULT ===', result);
        setSubmitState('success');
      } else {
        // Use regular wallet - direct execution (wallet pays gas)
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log('Response submitted:', result);
              setSubmitState('success');
            },
            onError: (error) => {
              console.error('Submit failed:', error);
              setSubmitError(error.message || 'Failed to submit response');
              setSubmitState('error');
            },
          }
        );
        return; // Exit early, callbacks will handle the rest
      }
    } catch (error) {
      console.error('Submit failed:', error);

      // Check if this is a zkLogin-related error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('ZKLogin') ||
          errorMessage.includes('expired at epoch') ||
          errorMessage.includes('Invalid user signature') ||
          errorMessage.includes('Signature is not valid')) {
        const parsedError = parseZkLoginError(error);
        setZkLoginError(parsedError);
        setSubmitError(null);
      } else {
        setSubmitError(errorMessage || 'Failed to submit response');
        setZkLoginError(null);
      }
      setSubmitState('error');
    }
  };

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Submitting State
  if (submitState === 'submitting') {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        {/* Animated Loader */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Submitting Response
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {campaign.isEncrypted ? 'Encrypting and submitting' : 'Submitting'} your response...
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          This may take a few seconds. Please don&apos;t close this page.
        </p>
      </div>
    );
  }

  // Success State
  if (submitState === 'success') {
    return (
      <SubmitSuccessScreen
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        countdown={countdown}
        onCountdownTick={() => setCountdown(c => c - 1)}
        onNavigate={() => router.push(`/campaigns/${campaign.id}`)}
      />
    );
  }

  // Error State
  if (submitState === 'error') {
    return (
      <div className="max-w-md mx-auto px-6 py-24">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Submission Failed
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          There was a problem submitting your response.
        </p>

        {/* zkLogin Error */}
        {zkLoginError && (
          <div className="mb-4">
            <ZkLoginErrorAlert
              error={zkLoginError}
              onDismiss={() => setZkLoginError(null)}
            />
          </div>
        )}

        {/* Regular Error */}
        {submitError && !zkLoginError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm font-mono break-all">{submitError}</p>
          </div>
        )}

        {/* Try Again Button */}
        <button
          onClick={() => {
            setSubmitState('idle');
            setSubmitError(null);
            setZkLoginError(null);
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={backLink}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-3 inline-flex items-center gap-1"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent">{campaign.title}</h1>
        {campaign.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{campaign.description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>
            {answeredCount} of {campaign.questions.length} answered
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* All Questions */}
      <div className="space-y-4 mb-6">
        {campaign.questions.map((question, index) => (
          <div
            key={question.id}
            className="p-5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
          >
            <div className="mb-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-full text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h2 className="text-base font-medium text-gray-900 dark:text-white">
                    {question.question}
                    {question.required && (
                      <span className="text-orange-500 ml-1">*</span>
                    )}
                  </h2>
                  {question.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{question.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Single choice */}
            {question.type === 'single-choice' && question.options && (
              <div className="space-y-2 ml-9">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                      answers[question.id] === option.id
                        ? 'bg-cyan-500/10 border border-cyan-500/30'
                        : 'bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() => setAnswer(question.id, option.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        answers[question.id] === option.id
                          ? 'border-cyan-500 bg-cyan-500'
                          : 'border-gray-400 dark:border-gray-500'
                      }`}
                    >
                      {answers[question.id] === option.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        answers[question.id] === option.id
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Multiple choice */}
            {question.type === 'multiple-choice' && question.options && (
              <div className="space-y-2 ml-9">
                {question.options.map((option) => {
                  const currentAnswers = answers[question.id];
                  const selected = Array.isArray(currentAnswers) && currentAnswers.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                        selected
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={selected}
                        onChange={(e) => {
                          const current = Array.isArray(answers[question.id])
                            ? (answers[question.id] as string[])
                            : [];
                          if (e.target.checked) {
                            setAnswer(question.id, [...current, option.id]);
                          } else {
                            setAnswer(
                              question.id,
                              current.filter((id: string) => id !== option.id)
                            );
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-400 dark:border-gray-500'
                        }`}
                      >
                        {selected && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className={`text-sm ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Text answer */}
            {question.type === 'text' && (() => {
              const maxLength = question.maxLength || 500;
              const currentLength = ((answers[question.id] as string) || '').length;
              const remaining = maxLength - currentLength;
              return (
                <div className="ml-9">
                  <textarea
                    rows={3}
                    placeholder={question.placeholder || 'Enter your answer...'}
                    maxLength={maxLength}
                    value={(answers[question.id] as string) || ''}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition resize-none text-sm"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${remaining < 50 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {remaining} characters remaining
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* zkLogin Error with relogin button */}
      {zkLoginError && (
        <ZkLoginErrorAlert
          error={zkLoginError}
          onDismiss={() => setZkLoginError(null)}
        />
      )}

      {/* Regular error message */}
      {submitError && !zkLoginError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

// Submit Success Screen Component
function SubmitSuccessScreen({
  campaignId,
  campaignTitle,
  countdown,
  onCountdownTick,
  onNavigate,
}: {
  campaignId: string;
  campaignTitle: string;
  countdown: number;
  onCountdownTick: () => void;
  onNavigate: () => void;
}) {
  const hasNavigated = useRef(false);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        onNavigate();
      }
      return;
    }

    const timer = setTimeout(onCountdownTick, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onCountdownTick, onNavigate]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Response Submitted!
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Your response to &ldquo;{campaignTitle}&rdquo; has been recorded on the blockchain.
      </p>

      {/* Countdown */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
          <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Redirecting in {countdown}s...</span>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={onNavigate}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm"
      >
        Go to campaign now →
      </button>
    </div>
  );
}
