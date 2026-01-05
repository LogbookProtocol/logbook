'use client';

export const runtime = 'edge';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { getCampaignById, CampaignDetails } from '@/lib/mock-data';
import { getDataSource } from '@/lib/sui-config';
import { fetchCampaignById, buildSubmitResponseTx, executeZkLoginSponsoredTransaction } from '@/lib/sui-service';
import { isZkLoginSessionValid } from '@/lib/zklogin-utils';
import { getReferrer } from '@/lib/navigation';

export default function CampaignParticipatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
  const [backLink, setBackLink] = useState(`/campaigns/${id}`);

  // Load zkLogin address and referrer
  useEffect(() => {
    const address = localStorage.getItem('zklogin_address');
    setZkLoginAddress(address);
    setBackLink(getReferrer(`/campaigns/${id}`));
  }, [id]);

  // Get connected address (from wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      setIsLoading(true);
      const dataSource = getDataSource();

      if (dataSource === 'mock') {
        const mockCampaign = getCampaignById(id);
        setCampaign(mockCampaign || null);
      } else {
        const blockchainCampaign = await fetchCampaignById(id);
        setCampaign(blockchainCampaign);
      }
      setIsLoading(false);
    };

    loadCampaign();
  }, [id]);

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
  if (!campaign) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign not found</h1>
        <Link href="/campaigns" className="text-cyan-600 dark:text-cyan-400 hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    );
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
      console.log('Building transaction for campaign:', campaign.id);
      const tx = buildSubmitResponseTx(campaign.id, answers);

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
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit response');
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.title}</h1>
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

      {/* Error message */}
      {submitError && (
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
