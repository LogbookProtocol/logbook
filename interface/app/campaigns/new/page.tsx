'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignAndExecuteTransaction, useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { useCampaignStore } from '@/store/campaignStore';
import { Question, QuestionType, AnswerOption, CampaignAccessMode } from '@/types/campaign';
import { formatDate, getEndTimeDisplay, localDateToEndOfDayUTC } from '@/lib/format-date';
import { DatePicker } from '@/components/ui/DatePicker';
import { getDataSource, getSuiConfig } from '@/lib/sui-config';
import { buildCreateCampaignTx, executeZkLoginSponsoredTransaction, executeZkLoginTransaction, getSponsorshipStatus } from '@/lib/sui-service';
import { getReferrer } from '@/lib/navigation';
import { getTransactionCost, fetchSuiPrice } from '@/lib/sui-gas-price';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  generateCampaignPassword,
  encryptCampaignData,
  storePassword,
  getStoredPassword,
  generatePasswordFileContent,
} from '@/lib/crypto';
import {
  generateCampaignSeed,
  getCreatorKey,
  generatePasswordFromSeed,
} from '@/lib/encryption-auto-recovery';
import { parseZkLoginError, ZkLoginErrorInfo } from '@/lib/zklogin-utils';
import { ZkLoginErrorAlert } from '@/components/ZkLoginErrorAlert';
import { useDevice } from '@/hooks/useDevice';

export default function NewCampaignPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const {
    formData,
    isReviewMode,
    generatedPassword,
    updateFormData,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    setReviewMode,
    setAccessMode,
    setGeneratedPassword,
    resetForm,
  } = useCampaignStore();

  const [deployError, setDeployError] = useState<string | null>(null);
  const [zkLoginError, setZkLoginError] = useState<ZkLoginErrorInfo | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Refs for form fields to restore focus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const questionsSectionRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);
  const [backLink, setBackLink] = useState('/campaigns');
  const [expectedParticipants, setExpectedParticipants] = useState<string>('10');
  const [txCostFiat, setTxCostFiat] = useState<number>(0);
  const [suiPrice, setSuiPrice] = useState<number>(0);
  const { currency, currencySymbol } = useCurrency();
  const { isMobile } = useDevice();
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Deploy flow state: 'idle' | 'deploying' | 'success' | 'error'
  const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [errorCopied, setErrorCopied] = useState(false);

  // Get referrer and saved participants count on client side
  useEffect(() => {
    setBackLink(getReferrer('/campaigns'));
    const saved = localStorage.getItem('logbook_expected_participants');
    if (saved) setExpectedParticipants(saved);
  }, []);

  // Fetch gas cost and SUI price
  useEffect(() => {
    Promise.all([
      getTransactionCost(currency),
      fetchSuiPrice(currency),
    ]).then(([cost, price]) => {
      setTxCostFiat(cost);
      setSuiPrice(price);
    });
  }, [currency]);

  // Re-render when date format changes
  useEffect(() => {
    const handleDateFormatChange = () => forceUpdate(n => n + 1);
    window.addEventListener('date-format-changed', handleDateFormatChange);
    return () => window.removeEventListener('date-format-changed', handleDateFormatChange);
  }, []);

  // Close question editor when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingQuestionId && questionsSectionRef.current && !questionsSectionRef.current.contains(e.target as Node)) {
        setEditingQuestionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingQuestionId]);

  // Mobile: scroll input into view when focused (only on user interaction, not autofocus)
  const pageLoadTimeRef = useRef(Date.now());
  useEffect(() => {
    if (!isMobile) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        // Skip autofocus events that happen within 500ms of page load
        const timeSinceLoad = Date.now() - pageLoadTimeRef.current;
        if (timeSinceLoad < 500) return;

        // Use scrollIntoView for better mobile compatibility
        // Delay to let keyboard appear on iOS/Android
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [isMobile]);

  // Validation
  const isValid = formData.title.trim() && formData.questions.length > 0;

  const handleDeploy = async () => {
    setDeployState('deploying');
    setDeployError(null);
    setZkLoginError(null);

    const dataSource = getDataSource();

    // Simulate error for testing
    if (simulateError) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDeployError('Simulated blockchain error: MoveAbort(MoveLocation { module: ModuleId { address: 0x123, name: Identifier("logbook") }, function: 1, instruction: 42, function_name: Some("create_campaign") }, 1001) in command 0');
      setDeployState('error');
      return;
    }

    // If using mock data, just simulate deployment
    if (dataSource === 'mock') {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log('Campaign deployed (mock):', formData);
        setDeployState('success');
        setCreatedCampaignId('mock-campaign-id');
      } catch (error) {
        console.error('Deploy failed:', error);
        setDeployError('Failed to deploy campaign');
        setDeployState('error');
      }
      return;
    }

    if (!formData.endDate) {
      setDeployError('Please select an end date');
      setDeployState('error');
      return;
    }

    // Check if user has zkLogin address
    const zkLoginAddress = typeof window !== 'undefined'
      ? localStorage.getItem('zklogin_address')
      : null;

    // Check sponsorship status for zkLogin user
    let canUseSponsorship = false;
    if (zkLoginAddress) {
      const sponsorshipStatus = await getSponsorshipStatus(zkLoginAddress);
      canUseSponsorship = sponsorshipStatus?.canSponsorCampaign ?? false;
    }

    // If no zkLogin and no wallet, require connection
    if (!zkLoginAddress && !account) {
      setDeployError('Please connect your wallet to create a campaign');
      setDeployState('error');
      return;
    }

    try {
      // Convert end date to timestamp in milliseconds
      const endTimeUtc = localDateToEndOfDayUTC(formData.endDate);
      const endTime = new Date(endTimeUtc).getTime();

      const isEncrypted = formData.accessMode === 'password_protected';
      let title = formData.title;
      let description = formData.description;
      let questions = formData.questions.map(q => ({
        text: q.text,
        type: q.type,
        required: q.required,
        answers: q.answers,
      }));
      let password: string | null = null;
      let campaignSeed = '';

      // If password protected, generate password with auto-recovery support
      if (isEncrypted) {
        // Generate campaign seed (UUID)
        campaignSeed = generateCampaignSeed();

        try {
          // Get creator key (Google sub or wallet signature)
          // Wrap signPersonalMessage for wallet users
          const signMessageWrapper = account ? async (message: string) => {
            const result = await signPersonalMessage({ message: new TextEncoder().encode(message) });
            return result.signature;
          } : undefined;

          const creatorKey = await getCreatorKey(campaignSeed, signMessageWrapper);

          if (!creatorKey) {
            throw new Error('Failed to get creator key');
          }

          // Generate deterministic password from seed and creator key
          password = generatePasswordFromSeed(campaignSeed, creatorKey as string);
          setGeneratedPassword(password);

          console.log('[Campaign Creation] Using deterministic password for auto-recovery');
        } catch (error) {
          console.error('[Campaign Creation] Failed to generate deterministic password:', error);
          // Fallback to random password if auto-recovery fails
          password = generateCampaignPassword();
          setGeneratedPassword(password);
          console.log('[Campaign Creation] Fallback to random password (no auto-recovery)');
        }

        const encryptedData = await encryptCampaignData(
          {
            title: formData.title,
            description: formData.description,
            questions: formData.questions.map(q => ({
              text: q.text,
              options: q.answers.map(a => a.text),
            })),
          },
          password
        );

        title = encryptedData.title;
        description = encryptedData.description;
        questions = formData.questions.map((q, i) => ({
          text: encryptedData.questions[i].text,
          type: q.type,
          required: q.required,
          answers: q.answers.map((a, j) => ({
            ...a,
            text: encryptedData.questions[i].options[j] || a.text,
          })),
        }));
      }

      // Build the transaction
      const tx = buildCreateCampaignTx(
        title,
        description,
        questions,
        endTime,
        isEncrypted,
        campaignSeed // Pass campaign_seed to smart contract
      );

      if (!tx) {
        setDeployError('Failed to build transaction. Check your network settings.');
        setDeployState('error');
        return;
      }

      // Helper function to handle successful deployment
      const connectedAddress = zkLoginAddress || account?.address;
      const handleDeploySuccess = (campaignId: string | null) => {
        if (isEncrypted && password) {
          // Store password
          if (campaignId) {
            console.log('[Store Password Debug]', {
              campaignId,
              password: '***hidden***',
              connectedAddress,
              passwordLength: password.length,
            });
            storePassword(campaignId, password, connectedAddress);
            // Verify it was stored
            const retrieved = getStoredPassword(campaignId, connectedAddress);
            console.log('[Store Password Debug] Verification:', retrieved ? '***stored successfully***' : 'FAILED TO STORE');
          }
        }
        setCreatedCampaignId(campaignId);
        setDeployState('success');
      };

      // Helper function to extract campaign ID from transaction result
      const extractCampaignId = async (digest: string, objectChanges?: Array<{ type: string; objectId?: string; objectType?: string }>) => {
        console.log('extractCampaignId - digest:', digest, 'objectChanges:', objectChanges);

        // If objectChanges is provided and has data, use it directly
        if (objectChanges && objectChanges.length > 0) {
          const createdCampaign = objectChanges.find(
            (change) => change.type === 'created' && change.objectType?.includes('::logbook::Campaign')
          );
          console.log('extractCampaignId - createdCampaign from objectChanges:', createdCampaign);
          if (createdCampaign?.objectId) {
            return createdCampaign.objectId;
          }
        }

        // If objectChanges is undefined or empty, fetch transaction details
        console.log('extractCampaignId - objectChanges empty/undefined, fetching transaction details');
        try {
          const config = getSuiConfig();
          if (!config) {
            console.error('Failed to get Sui config');
            return null;
          }

          const client = new SuiClient({ url: config.rpcUrl });

          // Retry mechanism - transaction may not be indexed immediately
          const maxRetries = 5;
          const retryDelay = 1000; // 1 second

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`extractCampaignId - Fetch attempt ${attempt}/${maxRetries}`);

              // Fetch full transaction details with objectChanges
              const txDetails = await client.getTransactionBlock({
                digest,
                options: {
                  showObjectChanges: true,
                },
              });

              console.log('Transaction details fetched:', JSON.stringify(txDetails.objectChanges, null, 2));
              const createdCampaign = txDetails.objectChanges?.find(
                (change: any) => change.type === 'created' && change.objectType?.includes('::logbook::Campaign')
              );
              console.log('extractCampaignId - createdCampaign from API:', createdCampaign);

              if (createdCampaign) {
                return (createdCampaign as any)?.objectId || null;
              }

              // If no campaign found but no error, return null
              console.log('extractCampaignId - No campaign object found in transaction');
              return null;
            } catch (err: any) {
              console.log(`extractCampaignId - Attempt ${attempt} failed:`, err?.message || err);

              // If this is the last attempt, throw
              if (attempt === maxRetries) {
                throw err;
              }

              // Wait before retrying
              console.log(`extractCampaignId - Waiting ${retryDelay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }

          return null;
        } catch (error) {
          console.error('Failed to fetch transaction details after retries:', error);
          return null;
        }
      };

      // Use zkLogin transaction for Google users
      if (zkLoginAddress) {
        try {
          // Try sponsored first if available
          if (canUseSponsorship) {
            const result = await executeZkLoginSponsoredTransaction(tx, zkLoginAddress);
            console.log('Campaign deployed with sponsorship:', result.digest);
            const campaignId = await extractCampaignId(result.digest, result.objectChanges);
            handleDeploySuccess(campaignId);
            return;
          }

          // Fall back to non-sponsored zkLogin (user pays gas)
          const result = await executeZkLoginTransaction(tx, zkLoginAddress);
          console.log('Campaign deployed with zkLogin (user paid gas):', result.digest);
          const campaignId = await extractCampaignId(result.digest, result.objectChanges);
          handleDeploySuccess(campaignId);
        } catch (error) {
          const err = error as Error & { code?: string };
          console.error('zkLogin deploy failed:', error);

          // Check if this is a zkLogin session error
          const errorMessage = err.message || String(error);
          if (errorMessage.includes('ZKLogin') ||
              errorMessage.includes('expired at epoch') ||
              errorMessage.includes('Invalid user signature') ||
              errorMessage.includes('Signature is not valid')) {
            const parsedError = parseZkLoginError(error);
            setZkLoginError(parsedError);
            setDeployError(null);
          } else if (err.code === 'CAMPAIGN_LIMIT_REACHED') {
            setDeployError('Sponsored campaign limit reached. You need SUI balance to create more campaigns.');
            setZkLoginError(null);
          } else if (errorMessage.includes('Insufficient gas')) {
            setDeployError('Insufficient SUI balance. Get test SUI from the faucet in Account page.');
            setZkLoginError(null);
          } else {
            setDeployError(errorMessage || 'Failed to deploy campaign');
            setZkLoginError(null);
          }
          setDeployState('error');
        }
        return;
      }

      // Fall back to wallet-based signing
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log('Campaign deployed:', result);

            // Extract campaign ID from result
            const resultWithChanges = result as { digest?: string; objectChanges?: Array<{ type: string; objectId?: string; objectType?: string }> };
            const campaignId = await extractCampaignId(resultWithChanges.digest || '', resultWithChanges.objectChanges);
            handleDeploySuccess(campaignId);
          },
          onError: (error) => {
            console.error('Deploy failed:', error);
            setDeployError(error.message || 'Failed to deploy campaign');
            setDeployState('error');
          },
        }
      );
    } catch (error) {
      console.error('Deploy failed:', error);
      setDeployError(error instanceof Error ? error.message : 'Failed to deploy campaign');
      setDeployState('error');
    }
  };

  const createNewQuestion = (): Question => ({
    id: `q-${Date.now()}`,
    text: '',
    type: 'single_choice',
    answers: [
      { id: `a-${Date.now()}-1`, text: '' },
      { id: `a-${Date.now()}-2`, text: '' },
    ],
    required: true,
  });

  const handleAddQuestion = () => {
    const newQuestion = createNewQuestion();
    addQuestion(newQuestion);
    setEditingQuestionId(newQuestion.id);
  };

  // Check if form has any saved data
  const hasAnyData = formData.title.trim() || formData.description.trim() || formData.endDate ||
    formData.questions.some(q => q.text.trim());

  // Restore focus state on mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;

      // Check for saved focus state
      const savedFocusField = localStorage.getItem('logbook_focus_field');
      const savedEditingId = localStorage.getItem('logbook_editing_question_id');

      // Restore editing state if question exists
      if (savedEditingId && formData.questions.some(q => q.id === savedEditingId)) {
        setEditingQuestionId(savedEditingId);
      }

      // Restore focus based on saved field (only if explicitly saved, not on fresh start)
      setTimeout(() => {
        if (savedFocusField === 'title') {
          titleInputRef.current?.focus();
        } else if (savedFocusField === 'description') {
          descriptionInputRef.current?.focus();
        }
        // Don't auto-focus on fresh start - let user choose privacy type first
        // Clear saved focus state after restoring
        localStorage.removeItem('logbook_focus_field');
        localStorage.removeItem('logbook_editing_question_id');
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store refs to track state for cleanup
  const questionsRef = useRef(formData.questions);
  questionsRef.current = formData.questions;
  const editingQuestionIdRef = useRef(editingQuestionId);
  editingQuestionIdRef.current = editingQuestionId;

  // Save focus state and cleanup when leaving the page
  useEffect(() => {
    return () => {
      // Save current focus state
      const activeElement = document.activeElement;
      if (activeElement === titleInputRef.current) {
        localStorage.setItem('logbook_focus_field', 'title');
      } else if (activeElement === descriptionInputRef.current) {
        localStorage.setItem('logbook_focus_field', 'description');
      } else if (editingQuestionIdRef.current) {
        localStorage.setItem('logbook_editing_question_id', editingQuestionIdRef.current);
      }

      // Remove questions with empty text on unmount
      questionsRef.current
        .filter(q => !q.text.trim())
        .forEach(q => deleteQuestion(q.id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deploying State - Show deployment progress screen
  if (deployState === 'deploying') {
    return (
      <DeployingScreen
        title={formData.title}
        isEncrypted={formData.accessMode === 'password_protected'}
      />
    );
  }

  // Error State - Show error with copy and back buttons
  if (deployState === 'error') {
    return (
      <DeployErrorScreen
        error={deployError}
        zkLoginError={zkLoginError}
        errorCopied={errorCopied}
        onCopyError={() => {
          if (deployError) {
            navigator.clipboard.writeText(deployError);
            setErrorCopied(true);
            setTimeout(() => setErrorCopied(false), 2000);
          }
        }}
        onBack={() => {
          setDeployState('idle');
          setDeployError(null);
          setZkLoginError(null);
        }}
        onDismissZkLoginError={() => setZkLoginError(null)}
      />
    );
  }

  // Success State - Show success with countdown or password
  if (deployState === 'success') {
    return (
      <DeploySuccessScreen
        campaignTitle={formData.title}
        countdown={countdown}
        onCountdownTick={() => setCountdown(c => c - 1)}
        onNavigate={() => {
          resetForm();
          if (createdCampaignId) {
            router.push(`/campaigns/${createdCampaignId}`);
          } else {
            router.push('/campaigns');
          }
        }}
      />
    );
  }

  // Review Mode
  if (isReviewMode) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => setReviewMode(false)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-3 inline-flex items-center gap-1"
          >
            ← Back to editing
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent">Review Campaign</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check everything before deploying</p>
        </div>

        {/* Campaign Info */}
        <div className="rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] overflow-hidden mb-6">
          <table className="w-full text-sm">
            <tbody>
              {/* Privacy Type row */}
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Privacy Type
                </td>
                <td className="px-4 py-2.5">
                  {formData.accessMode === 'password_protected' ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        (Password-protected with end-to-end encryption)
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Public
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        (Anyone can view and participate)
                      </span>
                    </span>
                  )}
                </td>
              </tr>

              {/* Title row */}
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Title
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  {formData.title}
                </td>
              </tr>

              {/* Description row */}
              {formData.description && (
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                    Description
                  </td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                    {formData.description}
                  </td>
                </tr>
              )}

              {/* End Date row */}
              {formData.endDate && (
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                    End Date
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-gray-900 dark:text-gray-100">
                      {formatDate(formData.endDate)}
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{getEndTimeDisplay(formData.endDate)}</span>
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Questions */}
        <div className="p-5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Questions ({formData.questions.length})
          </h3>
          <div className="space-y-4">
            {formData.questions.map((q, index) => (
              <div key={q.id} className="p-4 rounded-lg bg-gray-50 dark:bg-white/[0.02]">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{q.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {q.type === 'single_choice' && 'Single choice'}
                      {q.type === 'multiple_choice' && 'Multiple choice'}
                      {q.type === 'text_input' && 'Text answer'}
                      {q.required && ' • Required'}
                    </p>
                    {q.type !== 'text_input' && (
                      <div className="mt-2 space-y-1">
                        {q.answers.map((a) => (
                          <div key={a.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            {q.type === 'single_choice' ? (
                              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="none">
                                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            )}
                            {a.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulate Error Toggle (for testing) */}
        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="w-4 h-4 text-orange-500 border-orange-300 rounded focus:ring-orange-500"
            />
            <div>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Simulate blockchain error</span>
              <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">For testing error handling flow</p>
            </div>
          </label>
        </div>

        {/* Deploy */}
        <div className="flex gap-4">
          <button
            onClick={() => setReviewMode(false)}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition font-medium"
          >
            Back
          </button>
          <button
            onClick={handleDeploy}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            Deploy Campaign
          </button>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header with back link */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={backLink}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-2 inline-flex items-center gap-1"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent">New Campaign</h1>
        </div>
        <div className="flex gap-2">
          <TestDataButton
            onFill={(data) => {
              updateFormData({
                title: data.title,
                description: data.description,
                endDate: data.endDate,
              });
              formData.questions.forEach(q => deleteQuestion(q.id));
              data.questions.forEach(q => addQuestion(q));
            }}
            onClear={resetForm}
          />
        </div>
      </div>

      {/* Privacy Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Privacy Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Public Campaign */}
          <button
            type="button"
            onClick={() => setAccessMode('open')}
            className={`p-4 rounded-xl border-2 transition text-left ${
              formData.accessMode === 'open'
                ? 'border-cyan-500 bg-cyan-500/5'
                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span className={`font-medium ${formData.accessMode === 'open' ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-900 dark:text-white'}`}>
                Public
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Anyone can view and participate
            </p>
          </button>

          {/* Private */}
          <button
            type="button"
            onClick={() => setAccessMode('password_protected')}
            className={`p-4 rounded-xl border-2 transition text-left ${
              formData.accessMode === 'password_protected'
                ? 'border-amber-500 bg-amber-500/5'
                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className={`font-medium ${formData.accessMode === 'password_protected' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                Private
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password-protected with end-to-end encryption
            </p>
          </button>
        </div>

      </div>

      {/* Campaign Details */}
      <div className="rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-6 p-5">
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition placeholder:text-gray-400"
              placeholder="Enter campaign title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              ref={descriptionInputRef}
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none placeholder:text-gray-400"
              placeholder="Describe your campaign (optional)"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              End Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={formData.endDate || ''}
              onChange={(value) => updateFormData({ endDate: value })}
              placeholder="Select end date"
              showEndTime
            />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="mb-6" ref={questionsSectionRef}>
        {/* Section Header */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Questions {formData.questions.length > 0 && <span className="text-gray-400 font-normal">({formData.questions.length})</span>}
          </label>
        </div>

        {formData.questions.length === 0 ? (
          /* Empty state */
          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full p-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition group"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition">
                <svg className="w-6 h-6 text-gray-400 group-hover:text-cyan-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                Add your first question
              </span>
            </div>
          </button>
        ) : (
          /* Questions list */
          <div className="space-y-2">
            {formData.questions.map((question, index) => (
              <QuestionRow
                key={question.id}
                question={question}
                index={index}
                isEditing={editingQuestionId === question.id}
                onEdit={() => setEditingQuestionId(question.id)}
                onSave={() => setEditingQuestionId(null)}
                onUpdate={(data) => updateQuestion(question.id, data)}
                onDelete={() => deleteQuestion(question.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add question button after questions list */}
      {formData.questions.length > 0 && (
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
      )}

      {/* Bottom bar: gas calculator + review button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <GasCostCalculator
          expectedParticipants={expectedParticipants}
          setExpectedParticipants={setExpectedParticipants}
          txCostFiat={txCostFiat}
          suiPrice={suiPrice}
          currencySymbol={currencySymbol}
        />
        <button
          onClick={() => {
            setReviewMode(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={!isValid}
          className="sm:ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Review →
        </button>
      </div>
    </div>
  );
}

// Question Row Component - card style for questions
function QuestionRow({
  question,
  index,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onDelete,
}: {
  question: Question;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (data: Partial<Question>) => void;
  onDelete: () => void;
}) {
  const addAnswer = () => {
    const newAnswer: AnswerOption = {
      id: `a-${Date.now()}`,
      text: '',
    };
    onUpdate({ answers: [...question.answers, newAnswer] });
  };

  const updateAnswer = (answerId: string, text: string) => {
    onUpdate({
      answers: question.answers.map((a) => (a.id === answerId ? { ...a, text } : a)),
    });
  };

  const removeAnswer = (answerId: string) => {
    if (question.answers.length > 2) {
      onUpdate({
        answers: question.answers.filter((a) => a.id !== answerId),
      });
    }
  };

  // Get type label
  const typeLabel = question.type === 'single_choice'
    ? 'Single choice'
    : question.type === 'multiple_choice'
    ? 'Multiple choice'
    : 'Text';

  // Type icons as SVG components
  const SingleChoiceIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );

  const MultipleChoiceIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 8L7 10.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const TextIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round" />
    </svg>
  );

  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'single_choice': return <SingleChoiceIcon />;
      case 'multiple_choice': return <MultipleChoiceIcon />;
      case 'text_input': return <TextIcon />;
    }
  };

  // Expanded edit mode
  if (isEditing) {
    return (
      <div className="rounded-xl border-2 border-cyan-500 bg-white dark:bg-white/[0.02] overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Question number and text input */}
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-semibold shadow-sm">
              {index + 1}
            </span>
            <input
              type="text"
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm placeholder:text-gray-400"
              placeholder="Enter your question"
              autoFocus
            />
          </div>

          {/* Type selector and Required toggle */}
          <div className="flex flex-wrap items-center gap-3 ml-10">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
              {[
                { type: 'single_choice' as QuestionType, label: 'Single' },
                { type: 'multiple_choice' as QuestionType, label: 'Multiple' },
                { type: 'text_input' as QuestionType, label: 'Text' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => onUpdate({ type: opt.type })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                    question.type === opt.type
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {getTypeIcon(opt.type)}
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <div
                onClick={() => onUpdate({ required: !question.required })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  question.required ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    question.required ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-gray-600 dark:text-gray-400">Required</span>
            </label>
          </div>

          {/* Options for choice questions */}
          {question.type !== 'text_input' && (
            <div className="ml-10 space-y-2">
              {question.answers.map((answer, answerIndex) => (
                <div key={answer.id} className="flex items-center gap-2 group/option">
                  <span className="w-5 h-5 flex items-center justify-center text-gray-400">
                    {question.type === 'single_choice' ? (
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e) => updateAnswer(answer.id, e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm placeholder:text-gray-400"
                    placeholder={`Option ${answerIndex + 1}`}
                  />
                  {question.answers.length > 2 && (
                    <button
                      onClick={() => removeAnswer(answer.id)}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition opacity-0 group-hover/option:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addAnswer}
                className="flex items-center gap-2 ml-7 text-sm text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add option
              </button>
            </div>
          )}

          {/* Text input preview */}
          {question.type === 'text_input' && (
            <div className="ml-10">
              <div className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-400">
                Respondents will enter text here...
              </div>
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5">
          <button
            onClick={onDelete}
            className="text-sm text-gray-400 hover:text-red-500 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Collapsed card view
  return (
    <div
      onClick={onEdit}
      className="group rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-cyan-500/50 transition cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        {/* Question number */}
        <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:text-white transition">
          {index + 1}
        </span>

        {/* Question content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {question.text || <span className="text-gray-400 italic font-normal">Untitled question</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              {getTypeIcon(question.type)} {typeLabel}
            </span>
            {question.required && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-xs text-cyan-600 dark:text-cyan-400">Required</span>
              </>
            )}
            {question.type !== 'text_input' && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-xs text-gray-400">{question.answers.length} options</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Gas Cost Calculator Component - compact inline version
function GasCostCalculator({
  expectedParticipants,
  setExpectedParticipants,
  txCostFiat,
  suiPrice,
  currencySymbol,
}: {
  expectedParticipants: string;
  setExpectedParticipants: (value: string) => void;
  txCostFiat: number;
  suiPrice: number;
  currencySymbol: string;
}) {
  const participants = parseInt(expectedParticipants) || 0;
  const totalTxCount = 1 + participants;
  const totalCostFiat = totalTxCount * txCostFiat;
  const costPerTxSui = suiPrice > 0 ? txCostFiat / suiPrice : 0;
  const totalCostSui = totalTxCount * costPerTxSui;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span>Gas for</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={expectedParticipants}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '');
          setExpectedParticipants(val);
          if (val) localStorage.setItem('logbook_expected_participants', val);
        }}
        className="w-12 px-1.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-center text-sm"
      />
      <span>users:</span>
      {participants > 0 ? (
        <span className="font-medium text-gray-700 dark:text-gray-300">
          ~{currencySymbol}{totalCostFiat.toFixed(3)} <span className="text-gray-400">({totalCostSui.toFixed(3)} SUI)</span>
        </span>
      ) : (
        <span>—</span>
      )}
    </div>
  );
}

// Deploying Screen Component
function DeployingScreen({
  title,
  isEncrypted,
}: {
  title: string;
  isEncrypted: boolean;
}) {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {/* Animated Loader */}
      <div className="flex justify-center mb-8">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Deploying Campaign
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {isEncrypted ? 'Encrypting and deploying' : 'Deploying'} &ldquo;{title}&rdquo; to the blockchain...
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500">
        This may take a few seconds. Please don&apos;t close this page.
      </p>
    </div>
  );
}

// Deploy Error Screen Component
function DeployErrorScreen({
  error,
  zkLoginError,
  errorCopied,
  onCopyError,
  onBack,
  onDismissZkLoginError,
}: {
  error: string | null;
  zkLoginError: ZkLoginErrorInfo | null;
  errorCopied: boolean;
  onCopyError: () => void;
  onBack: () => void;
  onDismissZkLoginError: () => void;
}) {
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
        Deployment Failed
      </h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
        Something went wrong while deploying your campaign. Your data has been preserved.
      </p>

      {/* zkLogin Error */}
      {zkLoginError && (
        <div className="mb-6">
          <ZkLoginErrorAlert
            error={zkLoginError}
            onDismiss={onDismissZkLoginError}
          />
        </div>
      )}

      {/* Error Details */}
      {error && !zkLoginError && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Error Details
          </label>
          <div className="relative">
            <textarea
              readOnly
              value={error}
              rows={4}
              className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm font-mono resize-none"
            />
          </div>
          <button
            onClick={onCopyError}
            className={`mt-2 w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
              errorCopied
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {errorCopied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Error
              </>
            )}
          </button>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Editing
      </button>
    </div>
  );
}

// Deploy Success Screen Component
function DeploySuccessScreen({
  campaignTitle,
  countdown,
  onCountdownTick,
  onNavigate,
}: {
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
        Campaign Created!
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        &ldquo;{campaignTitle}&rdquo; has been successfully deployed to the blockchain.
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
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        Go to campaign now →
      </button>
    </div>
  );
}

// Test Data Templates - 100 diverse campaigns
type TestQuestion = {
  text: string;
  type: QuestionType;
  required: boolean;
  answers: string[];
};

type TestCampaign = {
  title: string;
  description: string;
  questions: TestQuestion[];
};

const TEST_CAMPAIGNS: TestCampaign[] = [
  // 1-10: Product & Service Feedback
  { title: 'Product Satisfaction Survey', description: 'Help us understand your experience with our product.', questions: [
    { text: 'How satisfied are you overall?', type: 'single_choice', required: true, answers: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] },
    { text: 'Which features do you use most?', type: 'multiple_choice', required: true, answers: ['Dashboard', 'Reports', 'Analytics', 'Settings'] },
    { text: 'What would you improve?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Customer Support Rating', description: 'Rate your recent support experience.', questions: [
    { text: 'How would you rate our support?', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Average', 'Poor'] },
  ]},
  { title: 'Feature Request Poll', description: 'Vote for the next feature we should build.', questions: [
    { text: 'Which feature matters most to you?', type: 'single_choice', required: true, answers: ['Dark mode', 'Mobile app', 'API access', 'Integrations'] },
    { text: 'Describe your ideal feature', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Onboarding Experience', description: 'Tell us about your first experience with our platform.', questions: [
    { text: 'How easy was it to get started?', type: 'single_choice', required: true, answers: ['Very easy', 'Easy', 'Difficult', 'Very difficult'] },
    { text: 'What confused you during setup?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Mobile App Feedback', description: 'Share your thoughts on our mobile application.', questions: [
    { text: 'Rate the app performance', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Acceptable', 'Poor'] },
    { text: 'What features are missing?', type: 'multiple_choice', required: false, answers: ['Offline mode', 'Push notifications', 'Biometric login', 'Widgets'] },
  ]},
  { title: 'Website Usability', description: 'Help us improve our website experience.', questions: [
    { text: 'How easy is our site to navigate?', type: 'single_choice', required: true, answers: ['Very easy', 'Somewhat easy', 'Difficult', 'Very difficult'] },
  ]},
  { title: 'Pricing Feedback', description: 'Share your thoughts on our pricing structure.', questions: [
    { text: 'Is our pricing fair?', type: 'single_choice', required: true, answers: ['Very fair', 'Fair', 'Expensive', 'Too expensive'] },
    { text: 'Which plan do you use?', type: 'single_choice', required: true, answers: ['Free', 'Basic', 'Pro', 'Enterprise'] },
    { text: 'Suggestions for pricing?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Beta Feature Testing', description: 'Help us test new features before launch.', questions: [
    { text: 'Did the feature work as expected?', type: 'single_choice', required: true, answers: ['Yes, perfectly', 'Mostly yes', 'Had issues', 'Did not work'] },
    { text: 'Describe any bugs you found', type: 'text_input', required: true, answers: [] },
  ]},
  { title: 'Documentation Quality', description: 'Rate our help articles and guides.', questions: [
    { text: 'Are our docs helpful?', type: 'single_choice', required: true, answers: ['Very helpful', 'Helpful', 'Needs improvement', 'Not helpful'] },
    { text: 'What topics need more coverage?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'NPS Survey', description: 'Quick survey about your likelihood to recommend us.', questions: [
    { text: 'Would you recommend us to a friend?', type: 'single_choice', required: true, answers: ['Definitely', 'Probably', 'Not sure', 'No'] },
  ]},

  // 11-20: Workplace & HR
  { title: 'Employee Satisfaction', description: 'Anonymous survey about workplace happiness.', questions: [
    { text: 'How happy are you at work?', type: 'single_choice', required: true, answers: ['Very happy', 'Happy', 'Neutral', 'Unhappy'] },
    { text: 'What would improve your experience?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Remote Work Preferences', description: 'Help us understand your work-from-home needs.', questions: [
    { text: 'Preferred work arrangement?', type: 'single_choice', required: true, answers: ['Fully remote', 'Hybrid', 'In-office', 'Flexible'] },
    { text: 'What tools do you need?', type: 'multiple_choice', required: false, answers: ['Better webcam', 'Standing desk', 'Monitor', 'Headset'] },
  ]},
  { title: 'Team Meeting Feedback', description: 'Rate our recent all-hands meeting.', questions: [
    { text: 'Was the meeting useful?', type: 'single_choice', required: true, answers: ['Very useful', 'Somewhat useful', 'Not useful', 'Waste of time'] },
    { text: 'Topics for next meeting?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Training Needs Assessment', description: 'Tell us what skills you want to develop.', questions: [
    { text: 'Which areas interest you?', type: 'multiple_choice', required: true, answers: ['Leadership', 'Technical skills', 'Communication', 'Project management'] },
  ]},
  { title: 'Office Environment Survey', description: 'Feedback on our physical workspace.', questions: [
    { text: 'Rate the office comfort', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Acceptable', 'Poor'] },
    { text: 'What improvements are needed?', type: 'multiple_choice', required: false, answers: ['Better lighting', 'Quieter spaces', 'More plants', 'Better AC'] },
    { text: 'Other suggestions?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Manager Feedback', description: 'Feedback about your direct manager.', questions: [
    { text: 'Does your manager support you?', type: 'single_choice', required: true, answers: ['Always', 'Usually', 'Sometimes', 'Rarely'] },
    { text: 'What could they improve?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Benefits Satisfaction', description: 'Rate our employee benefits package.', questions: [
    { text: 'Overall benefits satisfaction?', type: 'single_choice', required: true, answers: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] },
    { text: 'Which benefits matter most?', type: 'multiple_choice', required: true, answers: ['Health insurance', 'PTO', '401k', 'Remote work'] },
  ]},
  { title: 'Sprint Retrospective', description: 'Share your thoughts on the last sprint.', questions: [
    { text: 'What went well?', type: 'text_input', required: true, answers: [] },
    { text: 'What could be improved?', type: 'text_input', required: true, answers: [] },
    { text: 'Rate team collaboration', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Average', 'Poor'] },
  ]},
  { title: 'Onboarding Feedback (New Hire)', description: 'How was your first week?', questions: [
    { text: 'Did you feel welcomed?', type: 'single_choice', required: true, answers: ['Very welcomed', 'Welcomed', 'Neutral', 'Not welcomed'] },
    { text: 'What was unclear?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Company Culture Survey', description: 'How do you feel about our culture?', questions: [
    { text: 'Do you feel valued?', type: 'single_choice', required: true, answers: ['Always', 'Usually', 'Sometimes', 'Never'] },
  ]},

  // 21-30: Events & Community
  { title: 'Conference Registration', description: 'Sign up for our upcoming conference.', questions: [
    { text: 'Which day will you attend?', type: 'single_choice', required: true, answers: ['Day 1', 'Day 2', 'Both days', 'Virtual only'] },
    { text: 'Dietary requirements?', type: 'multiple_choice', required: false, answers: ['Vegetarian', 'Vegan', 'Gluten-free', 'None'] },
  ]},
  { title: 'Workshop Interest', description: 'Which workshops would you attend?', questions: [
    { text: 'Select your interests', type: 'multiple_choice', required: true, answers: ['Web3 basics', 'Smart contracts', 'DeFi', 'NFTs'] },
  ]},
  { title: 'Meetup Feedback', description: 'How was our latest community meetup?', questions: [
    { text: 'Rate the event', type: 'single_choice', required: true, answers: ['Amazing', 'Good', 'Average', 'Disappointing'] },
    { text: 'Favorite part?', type: 'text_input', required: false, answers: [] },
    { text: 'What should we do next time?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Webinar Topics', description: 'Vote on our next webinar topic.', questions: [
    { text: 'Which topic interests you most?', type: 'single_choice', required: true, answers: ['AI in blockchain', 'Security best practices', 'Scaling solutions', 'Governance models'] },
  ]},
  { title: 'Hackathon Registration', description: 'Sign up for our 48-hour hackathon.', questions: [
    { text: 'Team or solo?', type: 'single_choice', required: true, answers: ['Team', 'Solo', 'Looking for team', 'Undecided'] },
    { text: 'Your experience level?', type: 'single_choice', required: true, answers: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  ]},
  { title: 'Speaker Feedback', description: 'Rate our guest speaker presentation.', questions: [
    { text: 'How engaging was the talk?', type: 'single_choice', required: true, answers: ['Very engaging', 'Engaging', 'Boring', 'Very boring'] },
    { text: 'Key takeaway?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Community Pulse Check', description: 'Quick check on community health.', questions: [
    { text: 'Do you feel part of our community?', type: 'single_choice', required: true, answers: ['Definitely', 'Somewhat', 'Not really', 'Not at all'] },
  ]},
  { title: 'AMA Topics', description: 'What should we discuss in our next AMA?', questions: [
    { text: 'Suggest a topic', type: 'text_input', required: true, answers: [] },
  ]},
  { title: 'Networking Event RSVP', description: 'Join us for drinks and networking.', questions: [
    { text: 'Will you attend?', type: 'single_choice', required: true, answers: ['Yes', 'Maybe', 'No', 'Need more info'] },
    { text: 'Bringing a plus one?', type: 'single_choice', required: false, answers: ['Yes', 'No', 'Maybe'] },
  ]},
  { title: 'Content Preferences', description: 'What content do you want to see?', questions: [
    { text: 'Preferred content type?', type: 'multiple_choice', required: true, answers: ['Blog posts', 'Videos', 'Podcasts', 'Tutorials'] },
    { text: 'How often should we post?', type: 'single_choice', required: true, answers: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'] },
  ]},

  // 31-40: Education & Research
  { title: 'Course Feedback', description: 'Rate your learning experience.', questions: [
    { text: 'How useful was the course?', type: 'single_choice', required: true, answers: ['Extremely useful', 'Useful', 'Somewhat useful', 'Not useful'] },
    { text: 'Would you recommend it?', type: 'single_choice', required: true, answers: ['Definitely', 'Probably', 'Maybe not', 'No'] },
  ]},
  { title: 'Learning Preferences', description: 'How do you prefer to learn?', questions: [
    { text: 'Best learning format?', type: 'single_choice', required: true, answers: ['Video', 'Reading', 'Hands-on', 'Live sessions'] },
  ]},
  { title: 'Research Participation', description: 'Help us with our academic study.', questions: [
    { text: 'How often do you use blockchain?', type: 'single_choice', required: true, answers: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
    { text: 'Primary use case?', type: 'text_input', required: true, answers: [] },
  ]},
  { title: 'Student Experience Survey', description: 'Feedback on your educational journey.', questions: [
    { text: 'Rate the curriculum', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Average', 'Poor'] },
    { text: 'What topics should we add?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Instructor Rating', description: 'Rate your instructor.', questions: [
    { text: 'Was the instructor clear?', type: 'single_choice', required: true, answers: ['Very clear', 'Clear', 'Confusing', 'Very confusing'] },
    { text: 'Additional feedback?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Quiz: Blockchain Basics', description: 'Test your knowledge.', questions: [
    { text: 'What is a smart contract?', type: 'single_choice', required: true, answers: ['Self-executing code', 'Legal document', 'A wallet', 'A token'] },
    { text: 'What consensus does Bitcoin use?', type: 'single_choice', required: true, answers: ['Proof of Work', 'Proof of Stake', 'DPoS', 'PoA'] },
  ]},
  { title: 'Certification Interest', description: 'Would you pursue blockchain certification?', questions: [
    { text: 'Interest level?', type: 'single_choice', required: true, answers: ['Very interested', 'Interested', 'Not sure', 'Not interested'] },
  ]},
  { title: 'Tutorial Feedback', description: 'Rate our latest tutorial.', questions: [
    { text: 'Was it easy to follow?', type: 'single_choice', required: true, answers: ['Very easy', 'Easy', 'Difficult', 'Too difficult'] },
    { text: 'What was confusing?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Bootcamp Application', description: 'Apply for our intensive program.', questions: [
    { text: 'Your coding experience?', type: 'single_choice', required: true, answers: ['None', 'Beginner', 'Intermediate', 'Advanced'] },
    { text: 'Why do you want to join?', type: 'text_input', required: true, answers: [] },
  ]},
  { title: 'Study Group Interest', description: 'Join a study group.', questions: [
    { text: 'Preferred meeting time?', type: 'single_choice', required: true, answers: ['Morning', 'Afternoon', 'Evening', 'Weekend'] },
    { text: 'Topics you want to cover?', type: 'multiple_choice', required: true, answers: ['Solidity', 'Move', 'Rust', 'Security'] },
  ]},

  // 41-50: Market Research
  { title: 'Crypto Usage Survey', description: 'How do you use cryptocurrency?', questions: [
    { text: 'Primary crypto activity?', type: 'single_choice', required: true, answers: ['Trading', 'Holding', 'DeFi', 'NFTs'] },
    { text: 'Which chains do you use?', type: 'multiple_choice', required: true, answers: ['Ethereum', 'Solana', 'Sui', 'Bitcoin'] },
  ]},
  { title: 'Wallet Preferences', description: 'Which wallets do you prefer?', questions: [
    { text: 'Favorite wallet type?', type: 'single_choice', required: true, answers: ['Browser extension', 'Mobile app', 'Hardware', 'Custodial'] },
  ]},
  { title: 'DeFi Experience', description: 'Share your DeFi journey.', questions: [
    { text: 'DeFi experience level?', type: 'single_choice', required: true, answers: ['Expert', 'Intermediate', 'Beginner', 'Never used'] },
    { text: 'Biggest DeFi challenge?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'NFT Market Research', description: 'Your thoughts on NFTs.', questions: [
    { text: 'Have you bought an NFT?', type: 'single_choice', required: true, answers: ['Yes, many', 'Yes, a few', 'No, but interested', 'Not interested'] },
    { text: 'What type interests you?', type: 'multiple_choice', required: false, answers: ['Art', 'Gaming', 'Music', 'Collectibles'] },
  ]},
  { title: 'Trading Habits', description: 'How do you trade crypto?', questions: [
    { text: 'Trading frequency?', type: 'single_choice', required: true, answers: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
    { text: 'Preferred exchange type?', type: 'single_choice', required: true, answers: ['CEX', 'DEX', 'Both', 'Neither'] },
  ]},
  { title: 'Security Practices', description: 'How do you protect your assets?', questions: [
    { text: 'Do you use a hardware wallet?', type: 'single_choice', required: true, answers: ['Yes, always', 'Sometimes', 'No', 'Planning to'] },
    { text: 'Security concerns?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Gas Fee Tolerance', description: 'How do gas fees affect you?', questions: [
    { text: 'Max acceptable gas fee?', type: 'single_choice', required: true, answers: ['Under $1', '$1-5', '$5-20', 'Any amount'] },
  ]},
  { title: 'Chain Preferences', description: 'Which blockchains do you prefer?', questions: [
    { text: 'Your main chain?', type: 'single_choice', required: true, answers: ['Ethereum', 'Solana', 'Sui', 'Other'] },
    { text: 'Why this chain?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Investment Strategy', description: 'Your crypto investment approach.', questions: [
    { text: 'Investment style?', type: 'single_choice', required: true, answers: ['Long-term hold', 'Active trading', 'DCA', 'Mixed'] },
  ]},
  { title: 'Web3 Adoption Barriers', description: 'What stops mainstream adoption?', questions: [
    { text: 'Biggest barrier?', type: 'single_choice', required: true, answers: ['Complexity', 'Security fears', 'Volatility', 'Regulation'] },
    { text: 'How to fix it?', type: 'text_input', required: false, answers: [] },
  ]},

  // 51-60: Gaming & Entertainment
  { title: 'Gaming Preferences', description: 'What games do you enjoy?', questions: [
    { text: 'Favorite genre?', type: 'single_choice', required: true, answers: ['RPG', 'Strategy', 'Action', 'Puzzle'] },
    { text: 'Platforms you use?', type: 'multiple_choice', required: true, answers: ['PC', 'Console', 'Mobile', 'VR'] },
  ]},
  { title: 'Play-to-Earn Survey', description: 'Your P2E experience.', questions: [
    { text: 'Do you play P2E games?', type: 'single_choice', required: true, answers: ['Yes, regularly', 'Sometimes', 'Tried once', 'Never'] },
    { text: 'What matters most in P2E?', type: 'single_choice', required: true, answers: ['Earnings', 'Fun gameplay', 'Community', 'Graphics'] },
  ]},
  { title: 'Metaverse Interest', description: 'Your thoughts on the metaverse.', questions: [
    { text: 'Metaverse excitement level?', type: 'single_choice', required: true, answers: ['Very excited', 'Curious', 'Skeptical', 'Not interested'] },
  ]},
  { title: 'Streaming Preferences', description: 'How do you consume content?', questions: [
    { text: 'Preferred platform?', type: 'single_choice', required: true, answers: ['YouTube', 'Twitch', 'TikTok', 'Other'] },
    { text: 'Content type?', type: 'multiple_choice', required: true, answers: ['Tutorials', 'Entertainment', 'News', 'Reviews'] },
  ]},
  { title: 'In-Game Purchases', description: 'Your spending habits in games.', questions: [
    { text: 'Do you buy in-game items?', type: 'single_choice', required: true, answers: ['Often', 'Sometimes', 'Rarely', 'Never'] },
  ]},
  { title: 'Esports Interest', description: 'Do you follow competitive gaming?', questions: [
    { text: 'Esports engagement?', type: 'single_choice', required: true, answers: ['Watch regularly', 'Occasionally', 'Rarely', 'Never'] },
    { text: 'Favorite esport?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Music NFTs', description: 'Your interest in music NFTs.', questions: [
    { text: 'Would you buy music NFTs?', type: 'single_choice', required: true, answers: ['Already have', 'Would consider', 'Maybe', 'No interest'] },
  ]},
  { title: 'Virtual Events', description: 'Virtual concert/event preferences.', questions: [
    { text: 'Attended virtual events?', type: 'single_choice', required: true, answers: ['Yes, loved it', 'Yes, it was okay', 'No, but interested', 'Not interested'] },
    { text: 'What would make them better?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Avatar Customization', description: 'How important are avatars?', questions: [
    { text: 'Avatar importance?', type: 'single_choice', required: true, answers: ['Very important', 'Somewhat', 'Not very', 'Not at all'] },
  ]},
  { title: 'Social Gaming', description: 'Gaming with friends.', questions: [
    { text: 'How often do you play with friends?', type: 'single_choice', required: true, answers: ['Always', 'Often', 'Sometimes', 'Solo only'] },
    { text: 'Preferred multiplayer type?', type: 'single_choice', required: true, answers: ['Co-op', 'Competitive', 'MMO', 'Local'] },
  ]},

  // 61-70: Health & Lifestyle
  { title: 'Wellness Check-in', description: 'Quick wellness survey.', questions: [
    { text: 'How are you feeling today?', type: 'single_choice', required: true, answers: ['Great', 'Good', 'Okay', 'Not great'] },
  ]},
  { title: 'Fitness Goals', description: 'What are your fitness objectives?', questions: [
    { text: 'Primary fitness goal?', type: 'single_choice', required: true, answers: ['Lose weight', 'Build muscle', 'Stay healthy', 'Improve endurance'] },
    { text: 'Workout frequency?', type: 'single_choice', required: true, answers: ['Daily', '3-5x week', '1-2x week', 'Rarely'] },
  ]},
  { title: 'Sleep Quality', description: 'How well do you sleep?', questions: [
    { text: 'Average sleep quality?', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Fair', 'Poor'] },
    { text: 'What affects your sleep?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Diet Preferences', description: 'Your dietary habits.', questions: [
    { text: 'Diet type?', type: 'single_choice', required: true, answers: ['Omnivore', 'Vegetarian', 'Vegan', 'Keto/Low-carb'] },
  ]},
  { title: 'Mental Health Check', description: 'How is your mental wellbeing?', questions: [
    { text: 'Stress level lately?', type: 'single_choice', required: true, answers: ['Very low', 'Manageable', 'High', 'Overwhelming'] },
    { text: 'What helps you relax?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Work-Life Balance', description: 'Your balance assessment.', questions: [
    { text: 'Rate your work-life balance', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Needs work', 'Poor'] },
  ]},
  { title: 'Productivity Habits', description: 'How do you stay productive?', questions: [
    { text: 'Most productive time?', type: 'single_choice', required: true, answers: ['Early morning', 'Late morning', 'Afternoon', 'Night'] },
    { text: 'Productivity tools?', type: 'multiple_choice', required: false, answers: ['To-do lists', 'Calendar blocking', 'Pomodoro', 'None'] },
  ]},
  { title: 'Hobby Survey', description: 'What do you do for fun?', questions: [
    { text: 'Main hobby?', type: 'text_input', required: true, answers: [] },
    { text: 'Hours per week on hobbies?', type: 'single_choice', required: true, answers: ['0-5', '5-10', '10-20', '20+'] },
  ]},
  { title: 'Travel Preferences', description: 'How do you like to travel?', questions: [
    { text: 'Preferred travel style?', type: 'single_choice', required: true, answers: ['Adventure', 'Relaxation', 'Cultural', 'Business'] },
  ]},
  { title: 'Reading Habits', description: 'Your reading preferences.', questions: [
    { text: 'Books read per year?', type: 'single_choice', required: true, answers: ['0-5', '5-15', '15-30', '30+'] },
    { text: 'Preferred format?', type: 'single_choice', required: true, answers: ['Physical', 'E-book', 'Audiobook', 'Mixed'] },
  ]},

  // 71-80: Technology & Preferences
  { title: 'Device Usage', description: 'Which devices do you use?', questions: [
    { text: 'Primary device?', type: 'single_choice', required: true, answers: ['Desktop', 'Laptop', 'Tablet', 'Phone'] },
    { text: 'Operating system?', type: 'single_choice', required: true, answers: ['Windows', 'macOS', 'Linux', 'Chrome OS'] },
  ]},
  { title: 'Browser Preferences', description: 'Which browser do you prefer?', questions: [
    { text: 'Main browser?', type: 'single_choice', required: true, answers: ['Chrome', 'Firefox', 'Safari', 'Brave'] },
  ]},
  { title: 'AI Usage Survey', description: 'How do you use AI tools?', questions: [
    { text: 'AI usage frequency?', type: 'single_choice', required: true, answers: ['Daily', 'Weekly', 'Monthly', 'Never'] },
    { text: 'Main AI use case?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Privacy Concerns', description: 'Your data privacy views.', questions: [
    { text: 'Privacy concern level?', type: 'single_choice', required: true, answers: ['Very concerned', 'Concerned', 'Neutral', 'Not concerned'] },
    { text: 'Privacy measures you take?', type: 'multiple_choice', required: false, answers: ['VPN', 'Password manager', 'Ad blocker', 'None'] },
  ]},
  { title: 'Smart Home', description: 'Your smart home setup.', questions: [
    { text: 'Smart home adoption?', type: 'single_choice', required: true, answers: ['Fully automated', 'Some devices', 'Planning to', 'Not interested'] },
  ]},
  { title: 'Social Media Usage', description: 'Your social media habits.', questions: [
    { text: 'Daily social media time?', type: 'single_choice', required: true, answers: ['Under 1 hour', '1-3 hours', '3-5 hours', '5+ hours'] },
    { text: 'Favorite platform?', type: 'single_choice', required: true, answers: ['Twitter/X', 'Instagram', 'TikTok', 'LinkedIn'] },
  ]},
  { title: 'Coding Languages', description: 'Which languages do you use?', questions: [
    { text: 'Primary language?', type: 'single_choice', required: true, answers: ['JavaScript', 'Python', 'Rust', 'Other'] },
    { text: 'Languages you want to learn?', type: 'multiple_choice', required: false, answers: ['Rust', 'Go', 'Move', 'Solidity'] },
  ]},
  { title: 'Newsletter Preferences', description: 'Email content preferences.', questions: [
    { text: 'Preferred email frequency?', type: 'single_choice', required: true, answers: ['Daily', 'Weekly', 'Monthly', 'Never'] },
  ]},
  { title: 'App Notifications', description: 'How do you feel about notifications?', questions: [
    { text: 'Notification preference?', type: 'single_choice', required: true, answers: ['All on', 'Selective', 'Minimal', 'All off'] },
  ]},
  { title: 'Tech Support Experience', description: 'Rate tech support interactions.', questions: [
    { text: 'Preferred support channel?', type: 'single_choice', required: true, answers: ['Live chat', 'Email', 'Phone', 'Self-service'] },
    { text: 'Best support experience?', type: 'text_input', required: false, answers: [] },
  ]},

  // 81-90: Governance & DAO
  { title: 'DAO Participation', description: 'Your DAO involvement.', questions: [
    { text: 'Are you in any DAOs?', type: 'single_choice', required: true, answers: ['Yes, multiple', 'Yes, one', 'No, but interested', 'Not interested'] },
  ]},
  { title: 'Governance Proposal', description: 'Vote on this proposal.', questions: [
    { text: 'Your vote?', type: 'single_choice', required: true, answers: ['For', 'Against', 'Abstain'] },
    { text: 'Reasoning?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Treasury Allocation', description: 'How should we spend treasury?', questions: [
    { text: 'Priority spending area?', type: 'single_choice', required: true, answers: ['Development', 'Marketing', 'Community', 'Reserves'] },
  ]},
  { title: 'Voting Frequency', description: 'How often do you vote?', questions: [
    { text: 'Governance participation?', type: 'single_choice', required: true, answers: ['Every proposal', 'Most proposals', 'Sometimes', 'Never'] },
    { text: 'What would increase participation?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Delegate Selection', description: 'Choosing a delegate.', questions: [
    { text: 'What matters in a delegate?', type: 'multiple_choice', required: true, answers: ['Expertise', 'Activity', 'Alignment', 'Reputation'] },
  ]},
  { title: 'Protocol Upgrade Vote', description: 'Should we upgrade?', questions: [
    { text: 'Support the upgrade?', type: 'single_choice', required: true, answers: ['Strongly support', 'Support', 'Oppose', 'Strongly oppose'] },
  ]},
  { title: 'Community Grants', description: 'Grant program feedback.', questions: [
    { text: 'Grant program effectiveness?', type: 'single_choice', required: true, answers: ['Very effective', 'Effective', 'Needs improvement', 'Not effective'] },
    { text: 'Suggestions for grants?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Tokenomics Feedback', description: 'Your thoughts on our token model.', questions: [
    { text: 'Token utility rating?', type: 'single_choice', required: true, answers: ['Excellent', 'Good', 'Average', 'Poor'] },
  ]},
  { title: 'Roadmap Priorities', description: 'What should we build next?', questions: [
    { text: 'Top priority?', type: 'single_choice', required: true, answers: ['Scalability', 'New features', 'Security', 'Integrations'] },
    { text: 'Feature request?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Partnership Vote', description: 'Should we partner with X?', questions: [
    { text: 'Your opinion?', type: 'single_choice', required: true, answers: ['Strong yes', 'Yes', 'No', 'Strong no'] },
  ]},

  // 91-100: Misc & Fun
  { title: 'Quick Poll', description: 'Just a quick question.', questions: [
    { text: 'Tabs or spaces?', type: 'single_choice', required: true, answers: ['Tabs', 'Spaces', 'Both', 'I don\'t code'] },
  ]},
  { title: 'Hot Take Survey', description: 'Share your controversial opinions.', questions: [
    { text: 'Is Web3 the future?', type: 'single_choice', required: true, answers: ['Absolutely', 'Probably', 'Doubtful', 'No way'] },
    { text: 'Your hottest take?', type: 'text_input', required: true, answers: [] },
  ]},
  { title: 'Emoji Poll', description: 'Pick your favorite.', questions: [
    { text: 'Best emoji?', type: 'single_choice', required: true, answers: ['🚀', '🔥', '💎', '🌙'] },
  ]},
  { title: 'Coffee or Tea', description: 'The eternal question.', questions: [
    { text: 'Your preference?', type: 'single_choice', required: true, answers: ['Coffee', 'Tea', 'Both', 'Neither'] },
  ]},
  { title: 'Timezone Check', description: 'Where are you located?', questions: [
    { text: 'Your timezone region?', type: 'single_choice', required: true, answers: ['Americas', 'Europe/Africa', 'Asia', 'Oceania'] },
  ]},
  { title: 'Pet Preferences', description: 'Cats, dogs, or other?', questions: [
    { text: 'Favorite pet?', type: 'single_choice', required: true, answers: ['Dog', 'Cat', 'Other', 'No pets'] },
    { text: 'Pet name if you have one?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Season Preference', description: 'What\'s your favorite season?', questions: [
    { text: 'Best season?', type: 'single_choice', required: true, answers: ['Spring', 'Summer', 'Fall', 'Winter'] },
  ]},
  { title: 'Introvert or Extrovert', description: 'Quick personality check.', questions: [
    { text: 'You are more...', type: 'single_choice', required: true, answers: ['Introvert', 'Extrovert', 'Ambivert', 'Depends on mood'] },
  ]},
  { title: 'Superpower Poll', description: 'If you could have one...', questions: [
    { text: 'Choose a superpower', type: 'single_choice', required: true, answers: ['Fly', 'Invisibility', 'Time travel', 'Mind reading'] },
    { text: 'What would you do with it?', type: 'text_input', required: false, answers: [] },
  ]},
  { title: 'Random Feedback', description: 'Tell us anything.', questions: [
    { text: 'Rate your day', type: 'single_choice', required: true, answers: ['Amazing', 'Good', 'Meh', 'Bad'] },
    { text: 'Anything on your mind?', type: 'text_input', required: false, answers: [] },
    { text: 'Send us a message', type: 'text_input', required: false, answers: [] },
  ]},
];

// Test Data Button Component
// Icon-only test data buttons for header
function TestDataButton({
  onFill,
  onClear,
}: {
  onFill: (data: { title: string; description: string; endDate: string; questions: Question[] }) => void;
  onClear: () => void;
}) {
  const handleFill = () => {
    const template = TEST_CAMPAIGNS[Math.floor(Math.random() * TEST_CAMPAIGNS.length)];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().split('T')[0];
    const now = Date.now();
    const questions: Question[] = template.questions.map((q, qIndex) => ({
      id: `q-${now}-${qIndex}`,
      text: q.text,
      type: q.type,
      required: q.required,
      answers: q.answers.map((answerText, aIndex) => ({
        id: `a-${now}-${qIndex}-${aIndex}`,
        text: answerText,
      })),
    }));
    onFill({
      title: `[Test] ${template.title}`,
      description: template.description,
      endDate: endDateStr,
      questions,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleFill}
        className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-cyan-500 hover:bg-gray-100 dark:hover:bg-white/5 transition"
        title="Fill with test data"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-[10px] font-medium">Test</span>
      </button>
      <button
        type="button"
        onClick={onClear}
        className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-white/5 transition"
        title="Clear form"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20h-10.5l-4.21-4.3a1 1 0 010-1.41l10-10a1 1 0 011.41 0l5 5a1 1 0 010 1.41l-9.2 9.3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13.3l-6.3-6.3" />
        </svg>
        <span className="text-[10px] font-medium">Clear</span>
      </button>
    </>
  );
}
