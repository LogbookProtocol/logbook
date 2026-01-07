'use client';

export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="flex justify-center">
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
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign not found</h1>
        <Link href="/campaigns" className="text-cyan-600 dark:text-cyan-400 hover:underline">
          ← Back to campaigns
        </Link>
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

  const currentQuestion = campaign.questions[currentStep];
  const isLastQuestion = currentStep === campaign.questions.length - 1;
  const progress = ((currentStep + 1) / campaign.questions.length) * 100;

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    console.log('=== SUBMIT START ===');
    console.log('account?.address:', account?.address);
    console.log('zkLoginAddress:', zkLoginAddress);
    console.log('connectedAddress:', connectedAddress);
    console.log('answers:', answers);

    setIsSubmitting(true);
    setSubmitError(null);

    const dataSource = getDataSource();
    console.log('dataSource:', dataSource);

    // Mock mode - simulate submission
    if (dataSource === 'mock') {
      console.log('Submitting answers (mock):', answers);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push(`/campaigns/${campaign.id}`);
      return;
    }

    // Check if wallet is connected
    if (!connectedAddress) {
      console.log('ERROR: No connected address');
      setSubmitError('Please connect your wallet to submit');
      setIsSubmitting(false);
      return;
    }

    // Blockchain mode - submit with sponsored transaction
    try {
      // Encrypt answers if campaign is encrypted
      let finalAnswers = answers;
      if (campaign.isEncrypted && campaignPassword) {
        console.log('Encrypting answers for encrypted campaign');
        // Convert answers to Record<number, string> format for encryption
        const textAnswers: Record<number, string> = {};
        campaign.questions.forEach((q, idx) => {
          const answer = answers[q.id];
          if (answer !== undefined) {
            textAnswers[idx] = Array.isArray(answer) ? answer.join(',') : answer;
          }
        });

        const encryptedTextAnswers = await encryptAnswers(textAnswers, campaignPassword);

        // Convert back to Record<string, string | string[]> format
        finalAnswers = {};
        campaign.questions.forEach((q, idx) => {
          if (encryptedTextAnswers[idx]) {
            finalAnswers[q.id] = encryptedTextAnswers[idx];
          }
        });
        console.log('Answers encrypted successfully');
      }

      console.log('Building transaction for campaign:', campaign.id);
      const tx = buildSubmitResponseTx(campaign.id, finalAnswers);

      if (!tx) {
        console.log('ERROR: Failed to build transaction');
        setSubmitError('Failed to build transaction');
        setIsSubmitting(false);
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
          setIsSubmitting(false);
          return;
        }

        console.log('=== CALLING executeZkLoginSponsoredTransaction ===');
        console.log('zkLoginAddress:', zkLoginAddress);

        // Use zkLogin sponsored transaction
        const result = await executeZkLoginSponsoredTransaction(tx, zkLoginAddress);
        console.log('=== zkLogin RESULT ===', result);
        setIsSubmitting(false);
        window.location.href = `/campaigns/${campaign.id}`;
      } else {
        // Use regular wallet - direct execution (wallet pays gas)
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log('Response submitted:', result);
              setIsSubmitting(false);
              window.location.href = `/campaigns/${campaign.id}`;
            },
            onError: (error) => {
              console.error('Submit failed:', error);
              setSubmitError(error.message || 'Failed to submit response');
              setIsSubmitting(false);
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
      setIsSubmitting(false);
    }
  };

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={backLink}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4 inline-block"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1">{campaign.title}</h1>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>
            Question {currentStep + 1} of {campaign.questions.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="p-8 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {currentQuestion.question}
          </h2>
          {currentQuestion.description && (
            <p className="text-gray-600 dark:text-gray-400">{currentQuestion.description}</p>
          )}
          {currentQuestion.required && (
            <span className="text-xs text-orange-600 dark:text-orange-400 mt-2 inline-block">Required</span>
          )}
        </div>

        {/* Single choice */}
        {currentQuestion.type === 'single-choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
                  answers[currentQuestion.id] === option.id
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.id}
                  checked={answers[currentQuestion.id] === option.id}
                  onChange={() => setAnswer(currentQuestion.id, option.id)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion.id] === option.id
                      ? 'border-cyan-500 bg-cyan-500'
                      : 'border-gray-400 dark:border-gray-500'
                  }`}
                >
                  {answers[currentQuestion.id] === option.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={
                    answers[currentQuestion.id] === option.id
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Multiple choice */}
        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const currentAnswers = answers[currentQuestion.id];
              const selected = Array.isArray(currentAnswers) && currentAnswers.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
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
                      const current = Array.isArray(answers[currentQuestion.id])
                        ? (answers[currentQuestion.id] as string[])
                        : [];
                      if (e.target.checked) {
                        setAnswer(currentQuestion.id, [...current, option.id]);
                      } else {
                        setAnswer(
                          currentQuestion.id,
                          current.filter((id: string) => id !== option.id)
                        );
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-400 dark:border-gray-500'
                    }`}
                  >
                    {selected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}>
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* Text answer */}
        {currentQuestion.type === 'text' && (() => {
          const maxLength = currentQuestion.maxLength || 500;
          const currentLength = ((answers[currentQuestion.id] as string) || '').length;
          const remaining = maxLength - currentLength;
          return (
            <div>
              <textarea
                rows={4}
                placeholder={currentQuestion.placeholder || 'Enter your answer...'}
                maxLength={maxLength}
                value={(answers[currentQuestion.id] as string) || ''}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition resize-none"
              />
              <div className="flex justify-end mt-2">
                <span className={`text-xs ${remaining < 50 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {remaining} characters remaining
                </span>
              </div>
            </div>
          );
        })()}
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
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
          <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-3 rounded-lg border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : isLastQuestion ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
