'use client';

export const runtime = 'edge';

import { useState, useEffect, Suspense, use, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
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
import { fetchCampaignById, fetchCampaignResults, fetchCampaignResponses, checkUserParticipation, getUserResponse, CampaignResponseData } from '@/lib/sui-service';
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
import {
  tryCreatorAutoUnlock,
  tryParticipantAutoUnlock,
  getCreatorKey,
  generatePasswordFromSeed,
} from '@/lib/encryption-auto-recovery';
import { usePollingInterval } from '@/contexts/PollingContext';


function CampaignContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { requireAuth } = useAuth();
  const { pollingInterval } = usePollingInterval();
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

  // Determine back link text based on where user came from
  const getBackLinkText = () => {
    if (backLink.startsWith('/account')) {
      return '← Back to account';
    }
    return '← Back to campaigns';
  };

  // Get connected address (from wallet or zkLogin)
  const connectedAddress = account?.address || zkLoginAddress;

  // Blockchain data state
  const [blockchainCampaign, setBlockchainCampaign] = useState<CampaignDetails | null>(null);
  const [blockchainResults, setBlockchainResults] = useState<QuestionResult[]>([]);
  const [blockchainResponses, setBlockchainResponses] = useState<CampaignResponseData[]>([]);
  const [hasParticipatedState, setHasParticipatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSourceState] = useState<'mock' | 'devnet' | 'testnet' | 'mainnet'>('mock');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Encrypted campaign state
  const [isLocked, setIsLocked] = useState(false);
  const [isAutoDecrypting, setIsAutoDecrypting] = useState(false); // True while trying auto-decrypt
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [decryptedCampaign, setDecryptedCampaign] = useState<CampaignDetails | null>(null);
  const [includePasswordInLink, setIncludePasswordInLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [decryptedResults, setDecryptedResults] = useState<QuestionResult[]>([]);
  const [decryptedResponses, setDecryptedResponses] = useState<CampaignResponseData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'responses'>('results');
  const hasDecryptedResultsOnce = useRef(false);
  const hasAttemptedAutoUnlock = useRef(false); // Track if we've tried auto-unlock already

  // Set default tab based on screen size after mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setActiveTab('overview');
    }
  }, []);

  // Re-render when date format changes
  useEffect(() => {
    const handleDateFormatChange = () => forceUpdate(n => n + 1);
    window.addEventListener('date-format-changed', handleDateFormatChange);
    return () => window.removeEventListener('date-format-changed', handleDateFormatChange);
  }, []);

  // Debug: Log state changes for encrypted campaigns
  useEffect(() => {
    if (blockchainCampaign?.isEncrypted) {
      console.log('[State Change] ========== STATE UPDATE ==========');
      console.log('[State Change] isLocked:', isLocked);
      console.log('[State Change] isRecovering:', isRecovering);
      console.log('[State Change] isDecrypting:', isDecrypting);
      console.log('[State Change] isAutoDecrypting:', isAutoDecrypting);
      console.log('[State Change] decryptedCampaign exists:', !!decryptedCampaign);
      console.log('[State Change] decryptedCampaign?.title:', decryptedCampaign?.title?.substring(0, 50));
      console.log('[State Change] =======================================');
    }
  }, [blockchainCampaign?.isEncrypted, isLocked, isRecovering, isDecrypting, isAutoDecrypting, decryptedCampaign]);

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

      console.log('[Fetch Data] resultsData from blockchain:', resultsData.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question?.substring(0, 50),
        textResponsesCount: q.textResponses?.length,
        textResponses: q.textResponses?.map(r => ({
          text: r.text?.substring(0, 50),
          respondent: r.respondent?.substring(0, 50),
        })),
      })));

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
    } else {
      // Mock mode - no loading needed
      setIsLoading(false);
    }
  }, [fetchData]);

  // Handle encrypted campaign decryption with auto-recovery
  useEffect(() => {
    if (!blockchainCampaign?.isEncrypted) {
      setIsLocked(false);
      setIsAutoDecrypting(false);
      setDecryptedCampaign(null);
      hasAttemptedAutoUnlock.current = false;
      return;
    }

    // Skip if we already have decrypted campaign or already attempted unlock
    // This prevents re-running auto-unlock on every blockchain data update
    if (decryptedCampaign || hasAttemptedAutoUnlock.current) {
      return;
    }

    // Mark that we're attempting auto-unlock
    hasAttemptedAutoUnlock.current = true;
    setIsAutoDecrypting(true);

    const attemptAutoUnlock = async () => {
      let passwordToTry: string | null = null;

      // Priority 1: URL parameter (manual sharing)
      const keyParam = searchParams.get('key');
      if (keyParam && isValidPassword(keyParam)) {
        console.log('[Auto-Recovery] Using password from URL parameter:', keyParam.substring(0, 16) + '...');
        passwordToTry = keyParam;
      }

      // Priority 2: LocalStorage (existing sessions)
      if (!passwordToTry) {
        const storedPassword = getStoredPassword(id, connectedAddress);
        if (storedPassword && isValidPassword(storedPassword)) {
          console.log('[Auto-Recovery] Using password from localStorage:', storedPassword.substring(0, 16) + '...');
          passwordToTry = storedPassword;
        }
      }

      // Priority 3: Creator auto-recovery (campaign_seed + creator_key)
      // Only try automatic unlock for Google zkLogin users (no wallet signature required)
      // Wallet users must use the "Recover Password" button to explicitly request signature
      if (!passwordToTry && blockchainCampaign.campaignSeed && connectedAddress) {
        console.log('[Auto-Recovery] Trying creator auto-unlock with seed (Google only):', blockchainCampaign.campaignSeed);

        // Pass undefined for signMessage - only Google zkLogin will work automatically
        const creatorPassword = await tryCreatorAutoUnlock(
          blockchainCampaign.campaignSeed,
          blockchainCampaign.creator.address,
          connectedAddress,
          undefined // Don't pass wallet signature function for automatic unlock
        );
        if (creatorPassword) {
          console.log('[Auto-Recovery] Creator auto-unlock successful (Google), password:', creatorPassword.substring(0, 16) + '...');
          passwordToTry = creatorPassword;
        } else {
          console.log('[Auto-Recovery] Creator auto-unlock returned null (Google not available or not creator)');
        }
      }

      // Priority 4: Participant auto-recovery (response_seed + personal_key)
      // Only try automatic unlock for Google zkLogin users (no wallet signature required)
      // Wallet users must explicitly request recovery through UI
      if (!passwordToTry && connectedAddress) {
        try {
          // Fetch user's response to get response_seed
          const userResponse = await getUserResponse(id, connectedAddress);

          if (userResponse?.responseSeed) {
            console.log('[Auto-Recovery] Found response_seed, attempting participant auto-unlock (Google only)');

            // Pass undefined for signMessage - only Google zkLogin will work automatically
            const participantPassword = await tryParticipantAutoUnlock(userResponse.responseSeed, undefined);

            if (participantPassword) {
              console.log('[Auto-Recovery] Participant auto-unlock successful (Google), password:', participantPassword.substring(0, 16) + '...');
              passwordToTry = participantPassword;
            } else {
              console.log('[Auto-Recovery] Participant auto-unlock returned null (Google not available)');
            }
          } else {
            console.log('[Auto-Recovery] No response_seed found for this user');
          }
        } catch (error) {
          console.error('[Auto-Recovery] Participant auto-unlock failed:', error);
        }
      }

      // No password found through any method
      if (!passwordToTry) {
        console.log('[Auto-Recovery] No password available, showing locked state');
        setIsLocked(true);
        setIsAutoDecrypting(false);
        return;
      }

      // We have a password, try to decrypt
      return passwordToTry;
    };

    attemptAutoUnlock().then(async (passwordToTry) => {
      if (!passwordToTry) return;

      // We have a password, try to decrypt
      console.log('[Auto-Recovery] Attempting to decrypt with recovered password');
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
          passwordToTry
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

        // Store password first, then update all states together
        storePassword(id, passwordToTry, connectedAddress);
        console.log('[Auto-Recovery] Decryption successful!');

        // Batch state updates to prevent showing encrypted content
        setDecryptedCampaign(decrypted);
        setIsLocked(false);
        setIsAutoDecrypting(false);
      } catch (error) {
        console.error('[Auto-Recovery] Decryption failed with recovered password:', error);
        console.log('[Auto-Recovery] Password that failed:', passwordToTry?.substring(0, 16) + '...');
        // Don't store failed password, remove it if it was in localStorage
        removeStoredPassword(id, connectedAddress);
        // Ensure locked state with no decrypted data
        setDecryptedCampaign(null);
        setIsLocked(true);
        setIsAutoDecrypting(false);
      }
    });
  }, [blockchainCampaign, id, searchParams, connectedAddress, decryptedCampaign]);

  // Update decrypted campaign when blockchain data changes (without re-decrypting)
  // This keeps the decrypted view in sync with blockchain updates (e.g., new responses)
  useEffect(() => {
    // Only update if campaign is encrypted and we have a decrypted version
    if (!blockchainCampaign?.isEncrypted) return;

    console.log('[Sync Effect] Blockchain campaign changed, syncing with decrypted data');
    console.log('[Sync Effect] blockchainCampaign.title:', blockchainCampaign.title?.substring(0, 50));

    setDecryptedCampaign(prev => {
      if (!prev) {
        console.log('[Sync Effect] No previous decrypted campaign, returning null');
        return null; // No decrypted version yet, don't update
      }

      console.log('[Sync Effect] Previous decrypted title:', prev.title?.substring(0, 50));

      // Merge new blockchain data with existing decrypted text fields
      const updated = {
        ...blockchainCampaign,
        title: prev.title, // Keep decrypted title
        description: prev.description, // Keep decrypted description
        questions: blockchainCampaign.questions.map((q, i) => ({
          ...q,
          question: prev.questions[i]?.question || q.question, // Keep decrypted question text
          options: q.options?.map((o, j) => ({
            ...o,
            label: prev.questions[i]?.options?.[j]?.label || o.label, // Keep decrypted option labels
          })),
        })),
      };

      console.log('[Sync Effect] Updated decrypted title:', updated.title?.substring(0, 50));
      return updated;
    });
  }, [blockchainCampaign]);

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
      // Ensure locked state with no decrypted data on failure
      setDecryptedCampaign(null);
      setIsLocked(true);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle password recovery for wallet users (creators only)
  const handleRecoverPassword = async () => {
    if (!blockchainCampaign || !account) return;

    // Only creator can recover password
    if (account.address !== blockchainCampaign.creator.address) {
      setPasswordError('Only the campaign creator can recover the password');
      return;
    }

    console.log('[Recovery] ========== RECOVERY START ==========');
    console.log('[Recovery] Initial state - isLocked:', isLocked);
    console.log('[Recovery] Initial state - decryptedCampaign exists:', !!decryptedCampaign);
    console.log('[Recovery] Initial state - blockchainCampaign.title:', blockchainCampaign.title?.substring(0, 50));
    console.log('[Recovery] ===========================================');

    setIsRecovering(true);
    setPasswordError(null);
    console.log('[Recovery] Starting password recovery, isRecovering set to true');

    // Small delay to allow React to render the loading state
    await new Promise(resolve => setTimeout(resolve, 10));

    try {
      const campaignSeed = blockchainCampaign.campaignSeed;
      if (!campaignSeed) {
        throw new Error('Campaign seed not found');
      }

      // Create sign function wrapper
      const signMessage = async (message: string) => {
        const result = await signPersonalMessage({
          message: new TextEncoder().encode(message),
          account,
        });
        return result.signature;
      };

      // Get creator key and generate password
      const creatorKey = await getCreatorKey(campaignSeed, signMessage);
      if (!creatorKey) {
        throw new Error('Failed to get creator key');
      }
      const recoveredPassword = generatePasswordFromSeed(campaignSeed, creatorKey);

      // Set the password and unlock
      setPasswordInput(recoveredPassword);

      // Try to decrypt with recovered password
      const decryptedData = await decryptCampaignData(
        {
          title: blockchainCampaign.title,
          description: blockchainCampaign.description,
          questions: blockchainCampaign.questions.map(q => ({
            text: q.question,
            options: q.options?.map(o => o.label) || [],
          })),
        },
        recoveredPassword
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

      // Store password first, then batch all state updates
      storePassword(id, recoveredPassword, connectedAddress);
      console.log('[Recovery] Password recovery successful, updating states');
      console.log('[Recovery] Decrypted campaign title:', decrypted.title);
      console.log('[Recovery] Decrypted campaign description:', decrypted.description?.substring(0, 50));

      // Batch state updates to prevent showing encrypted content
      setDecryptedCampaign(decrypted);
      setIsLocked(false);
      setIsRecovering(false);
      console.log('[Recovery] All states updated - decrypted, unlocked, recovery complete');
      console.log('[Recovery] State after update - isLocked:', false, 'hasDecryptedCampaign:', true);
    } catch (error) {
      console.error('Password recovery failed:', error);
      setPasswordError('Failed to recover password. Please try again or enter it manually.');
      // Ensure we stay in locked state when recovery fails
      setIsLocked(true);
      setDecryptedCampaign(null);
      setIsRecovering(false);
    }
  };

  // Handle password deletion with auto-recovery for zkLogin/wallet users
  const handleClearPassword = async () => {
    if (!blockchainCampaign || !connectedAddress) return;

    // Remove password from localStorage
    removeStoredPassword(id, connectedAddress);
    console.log('[Clear Password] Password removed from localStorage');

    // Reset states to locked and force React to render immediately
    flushSync(() => {
      setDecryptedCampaign(null);
      setIsLocked(true);
      setPasswordError(null);
      setPasswordInput(''); // Clear password input field
      setIsAutoDecrypting(true);
    });

    console.log('[Clear Password] States reset, showing loading spinner');

    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      let passwordToTry: string | null = null;

      // Priority 1: Creator auto-recovery (Google zkLogin only - no wallet signatures)
      if (blockchainCampaign.campaignSeed) {
        console.log('[Clear Password] Attempting creator auto-unlock (Google only)');

        // Don't pass wallet signature function - only Google zkLogin will work
        passwordToTry = await tryCreatorAutoUnlock(
          blockchainCampaign.campaignSeed,
          blockchainCampaign.creator.address,
          connectedAddress,
          undefined // No wallet signature for automatic unlock
        );
      }

      // Priority 2: Participant auto-recovery (Google zkLogin only - no wallet signatures)
      if (!passwordToTry) {
        try {
          const userResponse = await getUserResponse(id, connectedAddress);
          if (userResponse?.responseSeed) {
            console.log('[Clear Password] Attempting participant auto-unlock (Google only)');

            // Don't pass wallet signature function - only Google zkLogin will work
            passwordToTry = await tryParticipantAutoUnlock(userResponse.responseSeed, undefined);
          }
        } catch (error) {
          console.error('[Clear Password] Participant auto-unlock failed:', error);
        }
      }

      // If we got a password, decrypt immediately
      if (passwordToTry) {
        console.log('[Clear Password] Auto-recovery successful, decrypting');

        const decryptedData = await decryptCampaignData(
          {
            title: blockchainCampaign.title,
            description: blockchainCampaign.description,
            questions: blockchainCampaign.questions.map(q => ({
              text: q.question,
              options: q.options?.map(o => o.label) || [],
            })),
          },
          passwordToTry
        );

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

        // Store password and update states
        storePassword(id, passwordToTry, connectedAddress);
        setDecryptedCampaign(decrypted);
        setIsLocked(false);
        setIsAutoDecrypting(false);
        console.log('[Clear Password] Auto-recovery and decryption complete');
      } else {
        // No auto-recovery available, stay locked
        console.log('[Clear Password] No auto-recovery available, showing password form');
        setIsAutoDecrypting(false);
      }
    } catch (error) {
      console.error('[Clear Password] Auto-recovery failed:', error);
      // Ensure we stay in locked state when auto-recovery fails
      setIsLocked(true);
      setDecryptedCampaign(null);
      setIsAutoDecrypting(false);
    }
  };

  // Set up polling only for active campaigns
  useEffect(() => {
    if (dataSource === 'mock') return;
    if (!blockchainCampaign || blockchainCampaign.status !== 'active') return;
    if (pollingInterval === 0) return; // Don't poll if disabled

    // Poll based on user's selected interval (in seconds)
    const interval = setInterval(() => fetchData(false), pollingInterval * 1000);

    return () => clearInterval(interval);
  }, [dataSource, blockchainCampaign, fetchData, pollingInterval]);

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
      console.log('[Decrypt Results Effect] ===== STARTING =====');
      console.log('[Decrypt Results Effect] blockchainCampaign?.isEncrypted:', blockchainCampaign?.isEncrypted);
      console.log('[Decrypt Results Effect] blockchainResults.length:', blockchainResults.length);
      console.log('[Decrypt Results Effect] connectedAddress:', connectedAddress);

      if (!blockchainCampaign?.isEncrypted || blockchainResults.length === 0) {
        console.log('[Decrypt Results Effect] Early return - not encrypted or no results');
        setDecryptedResults([]);
        return;
      }

      const password = getStoredPassword(id, connectedAddress);
      console.log('[Decrypt Results Effect] Retrieved password from storage:', password ? `${password.substring(0, 16)}...` : 'null');

      if (!password) {
        console.log('[Decrypt Results Effect] No password - setting decryptedResults to empty');
        setDecryptedResults([]);
        setDecryptedResponses([]);
        return;
      }

      try {
        // First, decrypt individual response answers - we need these for vote counting
        const decryptedResponsesData = await Promise.all(
          blockchainResponses.map(async (response) => {
            try {
              // Decrypt the answers object
              // answers is Record<string, string | string[] | null>
              const decryptedAnswersObj: Record<string, string | string[] | null> = {};

              for (const [questionId, answerValue] of Object.entries(response.answers)) {
                if (answerValue === null) {
                  decryptedAnswersObj[questionId] = null;
                } else if (Array.isArray(answerValue)) {
                  // Multiple choice - decrypt each option ID
                  const decryptedArray = await Promise.all(
                    answerValue.map(val => decryptData(val, password))
                  );
                  decryptedAnswersObj[questionId] = decryptedArray;
                } else {
                  // Single choice or text - decrypt the value
                  decryptedAnswersObj[questionId] = await decryptData(answerValue, password);
                }
              }

              // Decrypt respondent name
              let decryptedRespondent = response.respondent;
              try {
                decryptedRespondent = await decryptData(response.respondent, password);
              } catch {
                // Keep original if decryption fails
              }

              return { ...response, answers: decryptedAnswersObj, respondent: decryptedRespondent };
            } catch {
              // If decryption fails, keep original
              return response;
            }
          })
        );
        setDecryptedResponses(decryptedResponsesData);

        // Decrypt results (questions, options, text responses)
        // For encrypted campaigns, blockchain can't count votes (encrypted data)
        // so we need to count votes client-side from decrypted responses
        const decrypted = await Promise.all(
          blockchainResults.map(async (q) => {
            // Decrypt question text
            let decryptedQuestion = q.question;
            try {
              decryptedQuestion = await decryptData(q.question, password);
            } catch {
              // Keep original if decryption fails
            }

            // Decrypt text responses first (needed for all question types)
            let decryptedTextResponses = q.textResponses;
            if (q.type === 'text' && q.textResponses) {
              console.log(`[Text Responses Decrypt] Question ${q.id}, type: ${q.type}, responses count:`, q.textResponses.length);
              decryptedTextResponses = await Promise.all(
                q.textResponses.map(async (response, idx) => {
                  console.log(`[Text Responses Decrypt] Response ${idx}:`, {
                    text: response.text?.substring(0, 50),
                    respondent: response.respondent?.substring(0, 50),
                  });
                  try {
                    const decryptedText = await decryptData(response.text, password);
                    console.log(`[Text Responses Decrypt] Response ${idx} text decrypted:`, decryptedText?.substring(0, 50));
                    let decryptedRespondent = response.respondent;
                    try {
                      decryptedRespondent = await decryptData(response.respondent, password);
                      console.log(`[Text Responses Decrypt] Response ${idx} respondent decrypted:`, decryptedRespondent?.substring(0, 50));
                    } catch (e) {
                      console.log(`[Text Responses Decrypt] Response ${idx} respondent decryption failed, keeping original`);
                    }
                    return { ...response, text: decryptedText, respondent: decryptedRespondent };
                  } catch (e) {
                    console.error(`[Text Responses Decrypt] Response ${idx} decryption failed:`, e);
                    return response; // Keep original if decryption fails
                  }
                })
              );
              console.log(`[Text Responses Decrypt] Question ${q.id} decrypted responses:`, decryptedTextResponses.map(r => ({
                text: r.text?.substring(0, 50),
                respondent: r.respondent?.substring(0, 50),
              })));
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

              // CLIENT-SIDE VOTE COUNTING for encrypted campaigns
              // Count votes from decrypted responses since blockchain can't decrypt
              const voteCounts: Record<string, number> = {};
              decryptedResultsArray.forEach(opt => {
                voteCounts[opt.id] = 0;
              });

              console.log(`[Vote Counting] Question ${q.id}: Counting votes from ${decryptedResponsesData.length} responses`);

              // Count votes from decrypted responses
              decryptedResponsesData.forEach((response, respIndex) => {
                const answer = response.answers[q.id];
                console.log(`[Vote Counting] Response ${respIndex} for ${q.id}:`, answer);
                if (answer) {
                  if (Array.isArray(answer)) {
                    // Multiple choice - each answer is an index like "0", "1"
                    answer.forEach(idx => {
                      const optId = `opt${parseInt(idx) + 1}`;
                      console.log(`[Vote Counting]   Multiple choice: index "${idx}" -> ${optId}`);
                      if (voteCounts[optId] !== undefined) {
                        voteCounts[optId]++;
                      }
                    });
                  } else if (q.type === 'single-choice') {
                    // Single choice - answer is an index like "0", "1", "2"
                    const optId = `opt${parseInt(answer) + 1}`;
                    console.log(`[Vote Counting]   Single choice: index "${answer}" -> ${optId}`);
                    if (voteCounts[optId] !== undefined) {
                      voteCounts[optId]++;
                    }
                  }
                }
              });

              console.log(`[Vote Counting] Question ${q.id} final counts:`, voteCounts);

              // Calculate total and percentages
              const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
              decryptedResultsArray = decryptedResultsArray.map(opt => ({
                ...opt,
                votes: voteCounts[opt.id] || 0,
                percentage: totalVotes > 0 ? Math.round((voteCounts[opt.id] / totalVotes) * 100) : 0,
              }));

              // Find winners (all options with highest votes, if votes > 0)
              const maxVotes = Math.max(...decryptedResultsArray.map((r) => r.votes));
              const winners = maxVotes > 0
                ? decryptedResultsArray.filter((r) => r.votes === maxVotes).map((r) => r.id)
                : undefined;

              return {
                ...q,
                question: decryptedQuestion,
                results: decryptedResultsArray,
                textResponses: decryptedTextResponses,
                winners,
              };
            }

            // For text questions or questions without results
            return {
              ...q,
              question: decryptedQuestion,
              results: decryptedResultsArray,
              textResponses: decryptedTextResponses,
            };
          })
        );

        console.log('[Decrypt Results] Setting decryptedResults, text questions:', decrypted.filter(q => q.type === 'text').map(q => ({
          id: q.id,
          type: q.type,
          textResponsesCount: q.textResponses?.length,
          textResponses: q.textResponses?.map(r => ({
            text: r.text?.substring(0, 50),
            respondent: r.respondent?.substring(0, 50),
          })),
        })));

        setDecryptedResults(decrypted);

        hasDecryptedResultsOnce.current = true;
      } catch {
        setDecryptedResults([]);
        setDecryptedResponses([]);
      }
    };

    decryptResultsData();
  }, [blockchainCampaign?.isEncrypted, blockchainResults, blockchainResponses, id, connectedAddress, decryptedCampaign]);

  // Get campaign - from blockchain (decrypted if available) or mock data
  const rawCampaign = dataSource !== 'mock' ? blockchainCampaign : getCampaignById(id);
  // For encrypted campaigns: ONLY use decrypted campaign (never show encrypted data in main view)
  // rawCampaign is only used in the locked state for showing metadata
  // For non-encrypted campaigns: use raw campaign
  const campaign = rawCampaign?.isEncrypted
    ? decryptedCampaign  // For encrypted: only decrypted, null if not available
    : (decryptedCampaign || rawCampaign);  // For non-encrypted: prefer decrypted, fallback to raw

  // Debug logging for campaign selection
  if (rawCampaign?.isEncrypted) {
    console.log('[Campaign Selection] rawCampaign.isEncrypted:', rawCampaign.isEncrypted);
    console.log('[Campaign Selection] rawCampaign.title:', rawCampaign.title?.substring(0, 50));
    console.log('[Campaign Selection] decryptedCampaign exists:', !!decryptedCampaign);
    console.log('[Campaign Selection] decryptedCampaign.title:', decryptedCampaign?.title?.substring(0, 50));
    console.log('[Campaign Selection] selected campaign.title:', campaign?.title?.substring(0, 50));
    console.log('[Campaign Selection] isLocked:', isLocked);
  }

  // Use decrypted results for encrypted campaigns, otherwise use raw blockchain results
  const resultsQuestions = blockchainCampaign?.isEncrypted && decryptedResults.length > 0
    ? decryptedResults
    : blockchainResults;

  console.log('[Results Selection] ===== RESULTS SELECTION =====');
  console.log('[Results Selection] blockchainCampaign?.isEncrypted:', blockchainCampaign?.isEncrypted);
  console.log('[Results Selection] decryptedResults.length:', decryptedResults.length);
  console.log('[Results Selection] blockchainResults.length:', blockchainResults.length);
  console.log('[Results Selection] Using:', blockchainCampaign?.isEncrypted && decryptedResults.length > 0 ? 'decryptedResults' : 'blockchainResults');
  console.log('[Results Selection] resultsQuestions === decryptedResults:', resultsQuestions === decryptedResults);
  console.log('[Results Selection] resultsQuestions === blockchainResults:', resultsQuestions === blockchainResults);

  const textQuestions = resultsQuestions.filter(q => q.type === 'text');
  console.log('[Results Selection] TEXT QUESTIONS:', textQuestions);
  console.log('[Results Selection] resultsQuestions text questions:', textQuestions.map(q => ({
    id: q.id,
    type: q.type,
    textResponsesCount: q.textResponses?.length,
    firstResponse: q.textResponses?.[0] ? {
      text: q.textResponses[0].text?.substring(0, 50),
      respondent: q.textResponses[0].respondent?.substring(0, 50),
    } : null,
  })));

  const results = dataSource !== 'mock' ? {
    totalResponses: campaign?.stats.responses || 0,
    completionRate: 100,
    questions: resultsQuestions,
    finalizedOnChain: campaign?.status === 'ended',
    finalizationTx: '',
  } : mockCampaignResults;

  // Handle loading (including auto-decryption of encrypted campaigns)
  // For encrypted campaigns: show loading until we know if it's locked or decrypted
  // Also wait for results decryption to complete for encrypted campaigns
  // Also show loading during password recovery
  // IMPORTANT: For encrypted campaigns, don't show content until either locked or decrypted
  const encryptedButNotResolved = blockchainCampaign?.isEncrypted && (isAutoDecrypting || isRecovering || isDecrypting || (!isLocked && !decryptedCampaign));
  // Show loading if campaign is unlocked but results are not yet decrypted (prevents showing encrypted data)
  const encryptedResultsNotReady = blockchainCampaign?.isEncrypted && decryptedCampaign && blockchainResults.length > 0 && decryptedResults.length === 0;

  // Debug logging
  if (blockchainCampaign?.isEncrypted) {
    console.log('[Render] ========== RENDER CHECK ==========');
    console.log('[Render] isAutoDecrypting:', isAutoDecrypting);
    console.log('[Render] isRecovering:', isRecovering);
    console.log('[Render] isDecrypting:', isDecrypting);
    console.log('[Render] isLocked:', isLocked);
    console.log('[Render] hasDecrypted:', !!decryptedCampaign);
    console.log('[Render] decryptedCampaign?.title:', decryptedCampaign?.title?.substring(0, 50));
    console.log('[Render] encryptedButNotResolved:', encryptedButNotResolved);
    console.log('[Render] willShowSpinner:', isLoading || encryptedButNotResolved || encryptedResultsNotReady);
    console.log('[Render] campaign (selected for display):', campaign?.title?.substring(0, 50));
    console.log('[Render] =====================================');
  }

  if (isLoading || encryptedButNotResolved || encryptedResultsNotReady) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Handle locked encrypted campaign FIRST (before checking if campaign is null)
  // This ensures password form shows even when campaign=null for encrypted campaigns
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
            Private Campaign
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

        {/* Recovery button for wallet users who are creators */}
        {account && blockchainCampaign && account.address === blockchainCampaign.creator.address && blockchainCampaign.campaignSeed && (
          <button
            onClick={handleRecoverPassword}
            disabled={isRecovering || isDecrypting}
            className="w-full mb-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-medium hover:bg-cyan-50 dark:hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRecovering ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Recovering...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Recover Password
              </>
            )}
          </button>
        )}

        {/* Unlock button */}
        <button
          onClick={handleUnlock}
          disabled={isDecrypting || isRecovering}
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
          <Link href={backLink} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm">
            {getBackLinkText()}
          </Link>
        </div>
      </div>
    );
  }

  // Handle not found
  // Don't show "not found" for encrypted campaigns that haven't been decrypted yet
  if (!campaign && !rawCampaign?.isEncrypted) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Campaign not found</h1>
        <Link href={backLink} className="text-cyan-600 dark:text-cyan-400 hover:underline">
          {getBackLinkText()}
        </Link>
      </div>
    );
  }

  // If we reach here with null campaign, it must be an encrypted campaign waiting for decryption
  // This should have been caught by encryptedButNotResolved check above
  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Use decrypted responses for encrypted campaigns, otherwise use raw blockchain responses
  const responses = dataSource !== 'mock'
    ? (blockchainCampaign?.isEncrypted && decryptedResponses.length > 0 ? decryptedResponses : blockchainResponses)
    : mockCampaignResponses;

  // Whether the user has participated in this campaign
  const hasParticipated = dataSource !== 'mock' ? hasParticipatedState : false;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <Link
            href={backLink}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            {getBackLinkText()}
          </Link>

          {/* CTA Button - aligned to the right */}
          {campaign.status === 'active' && !hasParticipated && (
            <button
              onClick={() => {
                const targetPath = `/campaigns/${campaign.id}/participate`;
                if (requireAuth(targetPath)) {
                  saveReferrer(targetPath);
                  router.push(targetPath);
                }
              }}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition"
            >
              Participate
            </button>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {campaign.isEncrypted ? (
                <span title="Private">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
              ) : (
                <span title="Public">
                  <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.title}</h1>
            </div>
          </div>
        </div>

        {/* Info Table - Hidden on mobile, shown on desktop */}
        <div className="mt-4 border border-gray-200 dark:border-white/[0.06] rounded-lg overflow-hidden hidden md:block">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02] w-28">
                  Campaign
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  <a
                    href={getSuiscanObjectUrl(campaign.onChain.objectId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                    title={campaign.onChain.objectId}
                  >
                    {campaign.onChain.objectId.slice(0, 10)}...{campaign.onChain.objectId.slice(-6)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Creator
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  <a
                    href={getSuiscanAccountUrl(campaign.creator.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                    title={campaign.creator.address}
                  >
                    {campaign.creator.address.slice(0, 6)}...{campaign.creator.address.slice(-4)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Start Date
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  {formatDate(campaign.dates.created)}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  End Date
                </td>
                <td className="px-4 py-2.5">
                  {campaign.dates.endDate ? (
                    <>
                      <span className="text-gray-900 dark:text-gray-100">{formatEndDateTimeParts(campaign.dates.endDate).datePart}</span>
                      {formatEndDateTimeParts(campaign.dates.endDate).timePart && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{formatEndDateTimeParts(campaign.dates.endDate).timePart}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100">No end date</span>
                  )}
                </td>
              </tr>
              {/* Privacy Type row */}
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Privacy Type
                </td>
                <td className="px-4 py-2.5">
                  {campaign.isEncrypted ? (
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
              {/* Access row - only for encrypted campaigns with stored password */}
              {campaign.isEncrypted && getStoredPassword(id, connectedAddress) && (
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                    Access
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => {
                          const password = getStoredPassword(id, connectedAddress);
                          if (password) {
                            navigator.clipboard.writeText(password);
                            setPasswordCopied(true);
                            setTimeout(() => setPasswordCopied(false), 2000);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1 ${
                          passwordCopied
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                        }`}
                      >
                        <span>Password</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleClearPassword}
                        className="px-2 py-0.5 rounded text-sm transition flex items-center gap-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30"
                        title="Delete password from localStorage (test)"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                      <label
                        className="flex items-center gap-2 cursor-pointer"
                        title="Include password in links and QR"
                      >
                        <span className="text-sm text-gray-500 dark:text-gray-400">Add to link/QR</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={includePasswordInLink}
                          onClick={() => handleIncludePasswordChange(!includePasswordInLink)}
                          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                            includePasswordInLink
                              ? 'bg-amber-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              includePasswordInLink ? 'translate-x-[17px]' : 'translate-x-[2px]'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </td>
                </tr>
              )}
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Share
                </td>
                <td className="px-4 py-2.5">
                  {/* Hidden QR for canvas operations */}
                  <img
                    id="campaign-qr-code"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/campaigns/${campaign.id}${includePasswordInLink && campaign.isEncrypted ? `?key=${getStoredPassword(campaign.id, connectedAddress) || ''}` : ''}`)}`}
                    alt="Campaign QR Code"
                    className="hidden"
                    crossOrigin="anonymous"
                  />

                  <div className="flex flex-wrap items-center gap-1.5">

                    <button
                      onClick={() => {
                        const password = includePasswordInLink && campaign.isEncrypted ? getStoredPassword(campaign.id, connectedAddress) : null;
                        copyLink(campaign.id, undefined, password || undefined);
                      }}
                      className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1 ${
                        isCopied(campaign.id)
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : includePasswordInLink && campaign.isEncrypted
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {isCopied(campaign.id) ? 'Copied!' : 'Link'}
                    </button>

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
                            const link = document.createElement('a');
                            link.download = `logbook-qr-${campaign.id.slice(0, 8)}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                          }
                        }, 'image/png');
                      }}
                      className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1 ${
                        copiedQR
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : includePasswordInLink && campaign.isEncrypted
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      {copiedQR ? 'Copied!' : 'QR'}
                    </button>

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
                      className={`px-2 py-0.5 rounded transition text-sm flex items-center gap-1 ${
                        includePasswordInLink && campaign.isEncrypted
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Save QR
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02] align-top">
                  Description
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {campaign.description || 'No description provided'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center border-b border-gray-200 dark:border-white/[0.06]">
          {/* Overview tab - only visible on mobile */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`md:hidden px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === 'results'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Results
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === 'responses'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Responses ({responses.length})
          </button>

          {/* Updated button - Desktop only */}
          {dataSource !== 'mock' && campaign.status === 'active' && (
            <div className="ml-auto hidden md:block">
              <LastUpdated
                lastUpdated={lastUpdated}
                onRefresh={handleManualRefresh}
                isLoading={isRefreshing}
              />
            </div>
          )}
        </div>
      </div>

      {/* Overview Tab Content - Only visible on mobile */}
      {activeTab === 'overview' && (
        <div className="md:hidden mt-4 border border-gray-200 dark:border-white/[0.06] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02] w-28">
                  Campaign
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  <a
                    href={getSuiscanObjectUrl(campaign.onChain.objectId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                    title={campaign.onChain.objectId}
                  >
                    {campaign.onChain.objectId.slice(0, 10)}...{campaign.onChain.objectId.slice(-6)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Creator
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  <a
                    href={getSuiscanAccountUrl(campaign.creator.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                    title={campaign.creator.address}
                  >
                    {campaign.creator.address.slice(0, 6)}...{campaign.creator.address.slice(-4)}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Start Date
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                  {formatDate(campaign.dates.created)}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  End Date
                </td>
                <td className="px-4 py-2.5">
                  {campaign.dates.endDate ? (
                    <>
                      <span className="text-gray-900 dark:text-gray-100">{formatEndDateTimeParts(campaign.dates.endDate).datePart}</span>
                      {formatEndDateTimeParts(campaign.dates.endDate).timePart && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">{formatEndDateTimeParts(campaign.dates.endDate).timePart}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100">No end date</span>
                  )}
                </td>
              </tr>
              {/* Privacy Type row */}
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Privacy Type
                </td>
                <td className="px-4 py-2.5">
                  {campaign.isEncrypted ? (
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
              {/* Access row - only for encrypted campaigns with stored password */}
              {campaign.isEncrypted && getStoredPassword(id, connectedAddress) && (
                <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                    Access
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => {
                          const password = getStoredPassword(id, connectedAddress);
                          if (password) {
                            navigator.clipboard.writeText(password);
                            setPasswordCopied(true);
                            setTimeout(() => setPasswordCopied(false), 2000);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1 ${
                          passwordCopied
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                        }`}
                      >
                        <span>Password</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleClearPassword}
                        className="px-2 py-0.5 rounded text-sm transition flex items-center gap-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30"
                        title="Delete password from localStorage (test)"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                      <label
                        className="flex items-center gap-2 cursor-pointer"
                        title="Include password in links and QR"
                      >
                        <span className="text-sm text-gray-500 dark:text-gray-400">Add to link/QR</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={includePasswordInLink}
                          onClick={() => handleIncludePasswordChange(!includePasswordInLink)}
                          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                            includePasswordInLink
                              ? 'bg-amber-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              includePasswordInLink ? 'translate-x-[17px]' : 'translate-x-[2px]'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </td>
                </tr>
              )}
              <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                  Share
                </td>
                <td className="px-4 py-2.5">
                  {/* Hidden QR for canvas operations */}
                  <img
                    id="campaign-qr-code-mobile"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/campaigns/${campaign.id}${includePasswordInLink && campaign.isEncrypted ? `?key=${getStoredPassword(campaign.id, connectedAddress) || ''}` : ''}`)}`}
                    alt="Campaign QR Code"
                    className="hidden"
                    crossOrigin="anonymous"
                  />

                  <div className="flex flex-wrap items-center gap-1.5">

                    <button
                      onClick={() => {
                        const password = includePasswordInLink && campaign.isEncrypted ? getStoredPassword(campaign.id, connectedAddress) : null;
                        copyLink(campaign.id, undefined, password || undefined);
                      }}
                      className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1 ${
                        isCopied(campaign.id)
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : includePasswordInLink && campaign.isEncrypted
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {isCopied(campaign.id) ? 'Copied!' : 'Link'}
                    </button>

                    <button
                      onClick={async () => {
                        const img = document.getElementById('campaign-qr-code-mobile') as HTMLImageElement;
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
                            const link = document.createElement('a');
                            link.download = `logbook-qr-${campaign.id.slice(0, 8)}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                          }
                        }, 'image/png');
                      }}
                      className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1 ${
                        copiedQR
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : includePasswordInLink && campaign.isEncrypted
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      {copiedQR ? 'Copied!' : 'QR'}
                    </button>

                    <button
                      onClick={() => {
                        const img = document.getElementById('campaign-qr-code-mobile') as HTMLImageElement;
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
                      className={`px-2 py-0.5 rounded transition text-sm flex items-center gap-1 ${
                        includePasswordInLink && campaign.isEncrypted
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Save QR
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02] align-top">
                  Description
                </td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 whitespace-pre-line">
                  {campaign.description || 'No description provided'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'results' && (
        <div className="mb-6">
          {/* Updated button for Results - Mobile only */}
          {dataSource !== 'mock' && campaign.status === 'active' && (
            <div className="flex justify-end mb-4 md:hidden">
              <LastUpdated
                lastUpdated={lastUpdated}
                onRefresh={handleManualRefresh}
                isLoading={isRefreshing}
              />
            </div>
          )}

          <div className="space-y-4">
            {campaign.questions.map((q, index) => {
            const questionResult = resultsQuestions.find(r => r.id === q.id);

            // Find user's response for this question
            const userResponse = responses.find(resp =>
              resp.respondentAddress && connectedAddress &&
              resp.respondentAddress.toLowerCase() === connectedAddress.toLowerCase()
            );
            // Get the user's answer (already decrypted if campaign is encrypted)
            const userAnswerForQuestion = userResponse?.answers?.[q.id];

            // Debug logging
            if (index === 0) {
              console.log('[Highlight Debug]', {
                questionId: q.id,
                questionType: q.type,
                connectedAddress,
                allRespondentAddresses: responses.map(r => ({
                  id: r.id,
                  addr: r.respondentAddress,
                  matches: r.respondentAddress?.toLowerCase() === connectedAddress?.toLowerCase()
                })),
                userResponse: userResponse ? {
                  id: userResponse.id,
                  respondent: userResponse.respondent,
                  respondentAddress: userResponse.respondentAddress,
                  allAnswers: userResponse.answers
                } : null,
                userAnswerForQuestion,
              });
            }

            return (
              <div key={q.id} className="p-5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="text-base font-medium text-gray-900 dark:text-white">{q.question}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {q.type === 'single-choice' && 'Single choice'}
                      {q.type === 'multiple-choice' && 'Multiple choice'}
                      {q.type === 'text' && 'Text answer'}
                      {questionResult && ` • ${questionResult.totalVotes || questionResult.totalResponses || 0} responses`}
                    </div>
                  </div>
                </div>

                {/* Results for choice questions */}
                {(q.type === 'single-choice' || q.type === 'multiple-choice') && questionResult?.results && (
                  <div className="space-y-2 mt-4">
                    {questionResult.results.map((option, optIndex) => {
                      // Check if this option is the user's answer
                      // For encrypted campaigns: userAnswerForQuestion is decrypted index like "0", "1", "2"
                      // For open campaigns: userAnswerForQuestion is option ID like "opt1", "opt2", "opt3"
                      // For multiple-choice: userAnswerForQuestion is an array of strings
                      let isUserAnswer = false;
                      if (blockchainCampaign?.isEncrypted) {
                        // For encrypted campaigns, convert decrypted index to optN format
                        if (Array.isArray(userAnswerForQuestion)) {
                          // Multiple choice: check if any decrypted index matches this option
                          isUserAnswer = userAnswerForQuestion.some(idx => {
                            const optId = `opt${parseInt(idx) + 1}`;
                            return optId === option.id;
                          });
                        } else if (userAnswerForQuestion !== undefined && userAnswerForQuestion !== null) {
                          // Single choice: convert decrypted index to optN
                          const optId = `opt${parseInt(userAnswerForQuestion as string) + 1}`;
                          isUserAnswer = optId === option.id;
                        }
                      } else {
                        // For open campaigns, direct comparison
                        isUserAnswer = Array.isArray(userAnswerForQuestion)
                          ? userAnswerForQuestion.includes(option.id)
                          : userAnswerForQuestion === option.id;
                      }

                      // Debug first option of first question
                      if (index === 0 && optIndex === 0) {
                        console.log('[Option Check]', {
                          optionId: option.id,
                          optionLabel: option.label,
                          userAnswerForQuestion,
                          isArray: Array.isArray(userAnswerForQuestion),
                          isUserAnswer,
                          comparison: Array.isArray(userAnswerForQuestion)
                            ? `${JSON.stringify(userAnswerForQuestion)}.includes(${option.id})`
                            : `${userAnswerForQuestion} === ${option.id}`
                        });
                      }

                      return (
                        <div
                          key={option.id}
                          className={`p-2 rounded-lg ${
                            isUserAnswer
                              ? 'bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20'
                              : ''
                          }`}
                        >
                          <div className="flex justify-between text-sm mb-1">
                            <span className={
                              isUserAnswer && questionResult.winners?.includes(option.id)
                                ? 'text-cyan-700 dark:text-cyan-400 font-medium'
                                : isUserAnswer
                                  ? 'text-gray-900 dark:text-gray-100 font-medium'
                                  : questionResult.winners?.includes(option.id)
                                    ? 'text-cyan-600 dark:text-cyan-400 font-medium'
                                    : 'text-gray-600 dark:text-gray-400'
                            }>
                              {questionResult.winners?.includes(option.id) && (
                                <span className={isUserAnswer ? 'text-cyan-600 dark:text-cyan-400' : ''}>★ </span>
                              )}
                              {option.label}
                            </span>
                            <span className="text-gray-500">{option.votes} ({option.percentage}%)</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isUserAnswer && questionResult.winners?.includes(option.id)
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                  : questionResult.winners?.includes(option.id)
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                    : 'bg-gray-400 dark:bg-white/30'
                              }`}
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text responses */}
                {q.type === 'text' && questionResult?.textResponses && questionResult.textResponses.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {(() => {
                      console.log(`[Render Text Responses] Question ${q.id}, questionResult.textResponses:`, questionResult.textResponses.map(r => ({
                        text: r.text?.substring(0, 50),
                        respondent: r.respondent?.substring(0, 50),
                      })));
                      return null;
                    })()}
                    {questionResult.textResponses.slice(0, 5).map((response, i) => {
                      console.log(`[Render] Rendering response ${i}:`, {
                        text: response.text?.substring(0, 50),
                        respondent: response.respondent?.substring(0, 50),
                      });
                      const isCurrentUser = response.respondent && connectedAddress &&
                                          responses.find(r =>
                                            r.respondent === response.respondent &&
                                            r.respondentAddress?.toLowerCase() === connectedAddress.toLowerCase()
                                          );

                      return (
                        <div
                          key={i}
                          className={`text-sm p-3 rounded-lg ${
                            isCurrentUser
                              ? 'text-gray-900 dark:text-gray-100 bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20'
                              : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02]'
                          }`}
                        >
                          <span className={isCurrentUser ? "text-cyan-600 dark:text-cyan-400 font-medium" : "text-gray-400 dark:text-gray-500"}>
                            {response.respondent}:
                          </span> {response.text}
                        </div>
                      );
                    })}
                    {questionResult.textResponses.length > 5 && (
                      <div className="text-sm text-gray-500">+{questionResult.textResponses.length - 5} more responses</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="mb-6">
          {/* Updated button for Responses - Mobile only */}
          {dataSource !== 'mock' && campaign.status === 'active' && (
            <div className="flex justify-end mb-4 md:hidden">
              <LastUpdated
                lastUpdated={lastUpdated}
                onRefresh={handleManualRefresh}
                isLoading={isRefreshing}
              />
            </div>
          )}

          {responses.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Respondent</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/[0.06]">
                {responses.map((resp) => {
                  const isCurrentUser = resp.respondentAddress && connectedAddress &&
                                       resp.respondentAddress.toLowerCase() === connectedAddress.toLowerCase();
                  return (
                    <tr
                      key={resp.id}
                      className={isCurrentUser
                        ? "bg-cyan-500/10 dark:bg-cyan-500/10"
                        : "bg-white dark:bg-white/[0.01]"
                      }
                    >
                      <td className="px-4 py-3">
                        {resp.respondentAddress ? (
                          <a
                            href={getSuiscanAccountUrl(resp.respondentAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={isCurrentUser
                              ? "text-cyan-600 dark:text-cyan-400 hover:underline font-mono font-medium"
                              : "text-cyan-600 dark:text-cyan-400 hover:underline font-mono"
                            }
                          >
                            {resp.respondent} ↗
                          </a>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400 font-mono">{resp.respondent}</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${isCurrentUser ? "text-gray-600 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>
                        {formatDateTime(resp.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {resp.txHash ? (
                          <a
                            href={getSuiscanTxUrl(resp.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 hover:underline"
                          >
                            ↗
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No responses yet
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
