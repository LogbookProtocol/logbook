import { SuiClient, SuiObjectResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { getSuiConfig, QUESTION_TYPES, QUESTION_TYPES_REVERSE, getDataSource } from './sui-config';
import { CampaignDetails, CampaignQuestion, QuestionResult, TextResponseWithRespondent } from './mock-data';

// Create Sui client
function createSuiClient() {
  const config = getSuiConfig();
  if (!config) return null;
  return new SuiClient({ url: config.rpcUrl });
}

// Types for blockchain data
interface BlockchainQuestionFields {
  question_type: number;
  text: string;
  required: boolean;
  options: string[];
  option_votes: string[];
  text_response_count: string;
}

// Sui returns nested objects with type and fields
interface BlockchainQuestion {
  type: string;
  fields: BlockchainQuestionFields;
}

// VecMap entry structure from Sui
interface VecMapEntry {
  fields: {
    key: string;
    value: string;
  };
}

// Response structure from blockchain
interface BlockchainResponse {
  type: string;
  fields: {
    respondent: string;
    timestamp: string;
    answers: {
      type: string;
      fields: {
        contents: VecMapEntry[];
      };
    };
  };
}

interface BlockchainCampaign {
  id: { id: string };
  creator: string;
  title: string;
  description: string;
  questions: BlockchainQuestion[];
  responses: BlockchainResponse[];
  total_responses: string;
  access_type: number;
  created_at: string;
  end_time: string;
  is_finalized: boolean;
}

// Convert blockchain campaign to frontend format
function convertCampaign(data: BlockchainCampaign, objectId: string): CampaignDetails {
  const now = Date.now();
  const endTime = parseInt(data.end_time);
  const createdAt = parseInt(data.created_at);

  // Status is either 'active' or 'ended'
  const status: 'active' | 'ended' = (now >= endTime || data.is_finalized) ? 'ended' : 'active';

  const questions: CampaignQuestion[] = data.questions.map((q, index) => {
    // Extract fields from nested structure
    const qFields = q.fields;
    const questionType = QUESTION_TYPES_REVERSE[qFields.question_type as keyof typeof QUESTION_TYPES_REVERSE] || 'text';

    return {
      id: `q${index + 1}`,
      type: questionType as 'single-choice' | 'multiple-choice' | 'text',
      question: qFields.text,
      required: qFields.required,
      options: qFields.options.map((opt, i) => ({ id: `opt${i + 1}`, label: opt })),
    };
  });

  return {
    id: objectId,
    title: data.title,
    description: data.description,
    status,
    creator: {
      address: data.creator,
      name: null,
      avatar: null,
    },
    dates: {
      created: new Date(createdAt).toISOString(),
      endDate: new Date(endTime).toISOString(),
    },
    stats: {
      responses: parseInt(data.total_responses),
    },
    questions,
    onChain: {
      objectId,
      txHash: '', // Would need to track this separately
      network: getDataSource() === 'testnet' ? 'sui:testnet' : 'sui:mainnet',
    },
  };
}

// Get all campaigns from the registry
export async function fetchAllCampaigns(): Promise<CampaignDetails[]> {
  const client = createSuiClient();
  const config = getSuiConfig();
  if (!client || !config) return [];

  try {
    // Get registry object
    const registry = await client.getObject({
      id: config.registryId,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return [];
    }

    const registryData = registry.data.content.fields as {
      all_campaigns: Array<string | { id: string }>;
    };

    if (!registryData.all_campaigns || registryData.all_campaigns.length === 0) {
      return [];
    }

    // Extract campaign IDs (handle both string and object formats)
    const campaignIds = registryData.all_campaigns.map(c =>
      typeof c === 'string' ? c : c.id
    );

    // Fetch all campaign objects
    const campaigns = await client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    });

    return campaigns
      .filter((obj): obj is SuiObjectResponse & { data: NonNullable<SuiObjectResponse['data']> } =>
        obj.data?.content?.dataType === 'moveObject'
      )
      .map((obj) => {
        const content = obj.data!.content as unknown as { fields: BlockchainCampaign };
        return convertCampaign(content.fields, obj.data!.objectId);
      });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

// Get campaigns by creator address
export async function fetchCampaignsByCreator(creatorAddress: string): Promise<CampaignDetails[]> {
  const client = createSuiClient();
  const config = getSuiConfig();
  if (!client || !config) return [];

  try {
    // Get registry object
    const registry = await client.getObject({
      id: config.registryId,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return [];
    }

    const registryData = registry.data.content.fields as {
      campaigns_by_creator: { fields: { contents: Array<{ fields: { key: string; value: Array<string | { id: string }> } }> } };
    };

    // Find campaigns for this creator
    const creatorEntry = registryData.campaigns_by_creator?.fields?.contents?.find(
      (entry) => entry.fields.key === creatorAddress
    );

    if (!creatorEntry || creatorEntry.fields.value.length === 0) {
      return [];
    }

    // Extract campaign IDs (handle both string and object formats)
    const campaignIds = creatorEntry.fields.value.map(c =>
      typeof c === 'string' ? c : c.id
    );

    // Fetch campaign objects
    const campaigns = await client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    });

    return campaigns
      .filter((obj): obj is SuiObjectResponse & { data: NonNullable<SuiObjectResponse['data']> } =>
        obj.data?.content?.dataType === 'moveObject'
      )
      .map((obj) => {
        const content = obj.data!.content as unknown as { fields: BlockchainCampaign };
        return convertCampaign(content.fields, obj.data!.objectId);
      });
  } catch (error) {
    console.error('Error fetching campaigns by creator:', error);
    return [];
  }
}

// Participated campaign with response timestamp
export interface ParticipatedCampaign extends CampaignDetails {
  respondedAt: string; // ISO timestamp when user responded
}

// Get campaigns where user has participated
export async function fetchParticipatedCampaigns(userAddress: string): Promise<ParticipatedCampaign[]> {
  const client = createSuiClient();
  const config = getSuiConfig();
  if (!client || !config) return [];

  try {
    // Get all campaign IDs from registry
    const registry = await client.getObject({
      id: config.registryId,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return [];
    }

    const registryData = registry.data.content.fields as {
      all_campaigns: Array<string | { id: string }>;
    };

    if (!registryData.all_campaigns || registryData.all_campaigns.length === 0) {
      return [];
    }

    const campaignIds = registryData.all_campaigns.map(c =>
      typeof c === 'string' ? c : c.id
    );

    // Fetch all campaign objects
    const campaigns = await client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    });

    // Filter campaigns where user is in participants and get response timestamp
    const participated: ParticipatedCampaign[] = [];

    for (const obj of campaigns) {
      if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') continue;

      const content = obj.data.content as unknown as {
        fields: BlockchainCampaign & {
          participants: { fields: { contents: Array<{ fields: { key: string } }> } };
        };
      };

      const participants = content.fields.participants?.fields?.contents || [];
      const isParticipant = participants.some(p => p.fields.key === userAddress);

      if (isParticipant) {
        // Find the response to get timestamp
        const responses = content.fields.responses || [];
        const userResponse = responses.find(r => r.fields.respondent === userAddress);
        const respondedAt = userResponse
          ? new Date(parseInt(userResponse.fields.timestamp)).toISOString()
          : new Date().toISOString();

        participated.push({
          ...convertCampaign(content.fields, obj.data.objectId),
          respondedAt,
        });
      }
    }

    // Sort by responded date (newest first)
    return participated.sort((a, b) =>
      new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching participated campaigns:', error);
    return [];
  }
}

// Get single campaign by ID
export async function fetchCampaignById(campaignId: string): Promise<CampaignDetails | null> {
  const client = createSuiClient();
  if (!client) return null;

  try {
    const campaign = await client.getObject({
      id: campaignId,
      options: { showContent: true },
    });

    if (!campaign.data?.content || campaign.data.content.dataType !== 'moveObject') {
      return null;
    }

    const content = campaign.data.content as unknown as { fields: BlockchainCampaign };
    return convertCampaign(content.fields, campaignId);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }
}

// Re-export types from mock-data for backwards compatibility
export type { QuestionResult, TextResponseWithRespondent } from './mock-data';

export async function fetchCampaignResults(campaignId: string): Promise<QuestionResult[]> {
  const client = createSuiClient();
  if (!client) return [];

  try {
    const campaign = await client.getObject({
      id: campaignId,
      options: { showContent: true },
    });

    if (!campaign.data?.content || campaign.data.content.dataType !== 'moveObject') {
      return [];
    }

    const content = campaign.data.content as unknown as { fields: BlockchainCampaign };
    const data = content.fields;

    // Fetch transactions that modified this campaign to get txDigest for each respondent
    const txDigestByRespondent: Map<string, string> = new Map();
    try {
      const txs = await client.queryTransactionBlocks({
        filter: { ChangedObject: campaignId },
        options: { showInput: true },
        limit: 50,
      });

      for (const tx of txs.data) {
        // Get sender from transaction
        const sender = tx.transaction?.data?.sender;
        if (sender && tx.digest) {
          // Store the most recent tx for each sender (in case of multiple)
          txDigestByRespondent.set(sender, tx.digest);
        }
      }
    } catch (e) {
      console.warn('Could not fetch transaction history:', e);
    }

    // Extract text responses from all responses with respondent info
    // Map: questionIndex -> array of text answers with respondent
    const textResponsesByQuestion: Map<number, TextResponseWithRespondent[]> = new Map();

    for (const response of data.responses) {
      const respondentAddress = response.fields.respondent;
      const respondent = `${respondentAddress.slice(0, 6)}...${respondentAddress.slice(-4)}`;
      const answersContents = response.fields?.answers?.fields?.contents || [];
      const txDigest = txDigestByRespondent.get(respondentAddress);

      for (const entry of answersContents) {
        const questionIndex = parseInt(entry.fields.key);
        const answer = entry.fields.value;

        // Check if this question is a text type
        if (questionIndex < data.questions.length) {
          const qType = data.questions[questionIndex].fields.question_type;
          if (qType === 2) { // QTYPE_TEXT
            if (!textResponsesByQuestion.has(questionIndex)) {
              textResponsesByQuestion.set(questionIndex, []);
            }
            textResponsesByQuestion.get(questionIndex)!.push({
              text: answer,
              respondent,
              respondentAddress,
              txDigest,
            });
          }
        }
      }
    }

    return data.questions.map((q, index) => {
      // Extract fields from nested structure
      const qFields = q.fields;
      const questionType = QUESTION_TYPES_REVERSE[qFields.question_type as keyof typeof QUESTION_TYPES_REVERSE] || 'text';

      if (questionType === 'text') {
        return {
          id: `q${index + 1}`,
          question: qFields.text,
          type: 'text' as const,
          totalResponses: parseInt(qFields.text_response_count),
          textResponses: textResponsesByQuestion.get(index) || [],
        };
      }

      // Calculate votes and percentages for choice questions
      const votes = qFields.option_votes.map((v) => parseInt(v));
      const totalVotes = votes.reduce((a, b) => a + b, 0);

      const results = qFields.options.map((opt, i) => ({
        id: `opt${i + 1}`,
        label: opt,
        votes: votes[i],
        percentage: totalVotes > 0 ? Math.round((votes[i] / totalVotes) * 100) : 0,
      }));

      // Find winner (highest votes) - only if there's a clear winner (no tie)
      const maxVotes = Math.max(...results.map((r) => r.votes));
      const leadingOptions = results.filter((r) => r.votes === maxVotes);
      // Only set winner if there's exactly one leader and they have votes
      const winner = leadingOptions.length === 1 && maxVotes > 0 ? leadingOptions[0].id : undefined;

      return {
        id: `q${index + 1}`,
        question: qFields.text,
        type: questionType as 'single-choice' | 'multiple-choice',
        totalVotes,
        results,
        winner,
      };
    });
  } catch (error) {
    console.error('Error fetching campaign results:', error);
    return [];
  }
}

// Check if user has already participated in a campaign
export async function checkUserParticipation(campaignId: string, userAddress: string): Promise<boolean> {
  const client = createSuiClient();
  if (!client || !userAddress) return false;

  try {
    const campaign = await client.getObject({
      id: campaignId,
      options: { showContent: true },
    });

    if (!campaign.data?.content || campaign.data.content.dataType !== 'moveObject') {
      return false;
    }

    const content = campaign.data.content as unknown as { fields: BlockchainCampaign & { participants: { fields: { contents: Array<{ fields: { key: string } }> } } } };
    const participants = content.fields.participants?.fields?.contents || [];

    // Check if user address is in participants
    return participants.some((p) => p.fields.key === userAddress);
  } catch (error) {
    console.error('Error checking participation:', error);
    return false;
  }
}

// Response type for frontend
export interface CampaignResponseData {
  id: string;
  respondent: string;
  respondentAddress: string; // Full address for Suiscan link
  timestamp: string;
  answers: Record<string, string | string[] | null>;
  txHash: string;
}

// Fetch campaign responses from blockchain
export async function fetchCampaignResponses(campaignId: string): Promise<CampaignResponseData[]> {
  const client = createSuiClient();
  if (!client) return [];

  try {
    const campaign = await client.getObject({
      id: campaignId,
      options: { showContent: true },
    });

    if (!campaign.data?.content || campaign.data.content.dataType !== 'moveObject') {
      return [];
    }

    const content = campaign.data.content as unknown as { fields: BlockchainCampaign };
    const data = content.fields;

    // Fetch transactions that modified this campaign to get txDigest for each respondent
    const txDigestByRespondent: Map<string, string> = new Map();
    try {
      const txs = await client.queryTransactionBlocks({
        filter: { ChangedObject: campaignId },
        options: { showInput: true },
        limit: 50,
      });

      for (const tx of txs.data) {
        const sender = tx.transaction?.data?.sender;
        if (sender && tx.digest) {
          txDigestByRespondent.set(sender, tx.digest);
        }
      }
    } catch (e) {
      console.warn('Could not fetch transaction history:', e);
    }

    return data.responses.map((response, index) => {
      const fields = response.fields;
      const answersContents = fields?.answers?.fields?.contents || [];

      // Convert VecMap to Record
      const answers: Record<string, string | string[] | null> = {};
      for (const entry of answersContents) {
        const questionIndex = parseInt(entry.fields.key);
        const answer = entry.fields.value;
        answers[`q${questionIndex + 1}`] = answer;
      }

      return {
        id: `resp-${index}`,
        respondent: `${fields.respondent.slice(0, 6)}...${fields.respondent.slice(-4)}`,
        respondentAddress: fields.respondent,
        timestamp: new Date(parseInt(fields.timestamp)).toISOString(),
        answers,
        txHash: txDigestByRespondent.get(fields.respondent) || '',
      };
    });
  } catch (error) {
    console.error('Error fetching campaign responses:', error);
    return [];
  }
}

// Build transaction for creating a campaign
export function buildCreateCampaignTx(
  title: string,
  description: string,
  questions: Array<{
    text: string;
    type: 'single_choice' | 'multiple_choice' | 'text_input';
    required: boolean;
    answers: Array<{ text: string }>;
  }>,
  endTime: number // Unix timestamp in milliseconds
): Transaction | null {
  const config = getSuiConfig();
  if (!config) return null;

  const tx = new Transaction();

  // Prepare question data - explicitly cast to number[] for Sui SDK
  const questionTypes: number[] = questions.map((q) => Number(QUESTION_TYPES[q.type]));
  const questionTexts = questions.map((q) => q.text);
  const questionRequired = questions.map((q) => q.required);

  // Flatten all options
  const allOptions: string[] = [];
  const optionsPerQuestion: number[] = [];

  for (const q of questions) {
    if (q.type !== 'text_input') {
      const opts = q.answers.map((a) => a.text);
      allOptions.push(...opts);
      optionsPerQuestion.push(opts.length);
    } else {
      optionsPerQuestion.push(0);
    }
  }

  // Log transaction parameters for debugging
  console.log('Creating campaign transaction:', {
    registry: config.registryId,
    title,
    description,
    questionTypes,
    questionTexts,
    questionRequired,
    allOptions,
    optionsPerQuestion,
    accessType: 0,
    endTime: `${endTime} (${new Date(endTime).toISOString()})`,
    clock: '0x6',
  });

  tx.moveCall({
    target: `${config.packageId}::logbook::create_campaign`,
    arguments: [
      tx.object(config.registryId),            // 0: Campaign Registry
      tx.pure.string(title),                   // 1: Campaign title
      tx.pure.string(description),             // 2: Campaign description
      tx.pure.vector('u8', questionTypes),     // 3: Question types (0=single, 1=multiple, 2=text)
      tx.pure.vector('string', questionTexts), // 4: Question texts
      tx.pure.vector('bool', questionRequired),// 5: Required flags
      tx.pure.vector('string', allOptions),    // 6: Flattened answer options
      tx.pure.vector('u64', optionsPerQuestion), // 7: Options count per question
      tx.pure.u8(0),                           // 8: Access type (0=public)
      tx.pure.u64(endTime),                    // 9: End time (ms timestamp)
      tx.object('0x6'),                        // 10: Sui System Clock
    ],
  });

  return tx;
}

// Build transaction for submitting a response
export function buildSubmitResponseTx(
  campaignId: string,
  answers: Record<string, string | string[]>
): Transaction | null {
  const config = getSuiConfig();
  if (!config) return null;

  const tx = new Transaction();

  // Convert answers to the format expected by the contract
  const questionIndices: number[] = [];
  const answerStrings: string[] = [];

  for (const [questionId, answer] of Object.entries(answers)) {
    // Extract question index from id like "q1", "q2", etc.
    const index = parseInt(questionId.replace('q', '')) - 1;
    questionIndices.push(index);

    if (Array.isArray(answer)) {
      // Multiple choice - join indices
      const indices = answer.map((a) => {
        // Convert "opt1" -> "0", "opt2" -> "1", etc.
        return (parseInt(a.replace('opt', '')) - 1).toString();
      });
      answerStrings.push(indices.join(','));
    } else if (answer.startsWith('opt')) {
      // Single choice - convert "opt1" -> "0"
      const idx = parseInt(answer.replace('opt', '')) - 1;
      answerStrings.push(idx.toString());
    } else {
      // Text answer
      answerStrings.push(answer);
    }
  }

  tx.moveCall({
    target: `${config.packageId}::logbook::submit_response`,
    arguments: [
      tx.object(campaignId),
      tx.pure.vector('u64', questionIndices),
      tx.pure.vector('string', answerStrings),
      tx.object('0x6'), // Clock object
    ],
  });

  return tx;
}

// Execute a sponsored transaction
export async function executeSponsoredTransaction(
  tx: Transaction,
  senderAddress: string,
  signTransaction: (tx: Transaction) => Promise<{ signature: string }>
): Promise<{ digest: string }> {
  const client = createSuiClient();
  if (!client) throw new Error('Sui client not available');

  // Set the sender
  tx.setSender(senderAddress);

  // Get user signature (wallet will build and sign)
  const userSignResult = await signTransaction(tx);

  // Build the transaction for sponsor
  const txBytes = await tx.build({ client });

  // Send to sponsor API
  const sponsorResponse = await fetch('/api/sponsor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txBytes: Buffer.from(txBytes).toString('base64'),
    }),
  });

  if (!sponsorResponse.ok) {
    const error = await sponsorResponse.json();
    throw new Error(error.error || 'Failed to sponsor transaction');
  }

  const { txBytes: sponsoredTxBytes, sponsorSignature } = await sponsorResponse.json();

  // Execute with both signatures
  const result = await client.executeTransactionBlock({
    transactionBlock: sponsoredTxBytes,
    signature: [userSignResult.signature, sponsorSignature],
    options: {
      showEffects: true,
    },
  });

  return { digest: result.digest };
}

// Execute a sponsored transaction with zkLogin signature
export async function executeZkLoginSponsoredTransaction(
  tx: Transaction,
  senderAddress: string
): Promise<{ digest: string }> {
  console.log('=== executeZkLoginSponsoredTransaction START ===');
  console.log('senderAddress:', senderAddress);

  // Import zkLogin signing function dynamically to avoid SSR issues
  const { signTransactionWithZkLogin } = await import('@/lib/zklogin-utils');
  const { fromBase64 } = await import('@mysten/sui/utils');

  const config = getSuiConfig();
  console.log('Sui config:', config);
  const client = createSuiClient();
  if (!client) throw new Error('Sui client not available');
  console.log('Sui client created with URL:', config?.rpcUrl);

  // Set the sender
  tx.setSender(senderAddress);
  console.log('Sender set');

  // Serialize the transaction to JSON string (for transfer to server)
  const txSerialized = tx.serialize();
  console.log('Transaction serialized, length:', txSerialized.length);

  // Send to sponsor API to build and add gas payment
  console.log('=== Calling /api/sponsor ===');
  const sponsorResponse = await fetch('/api/sponsor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      txSerialized,
      sender: senderAddress,
    }),
  });

  console.log('Sponsor response status:', sponsorResponse.status);

  if (!sponsorResponse.ok) {
    const error = await sponsorResponse.json();
    console.error('Sponsor error:', error);

    // Create a custom error with additional info
    const err = new Error(error.error || 'Failed to sponsor transaction') as Error & {
      code?: string;
      remaining?: { campaignsRemaining: number; responsesRemaining: number };
    };
    err.code = error.code;
    err.remaining = error.remaining;
    throw err;
  }

  const sponsorData = await sponsorResponse.json();
  const { txBytes: sponsoredTxBytesB64, sponsorSignature, sponsorAddress } = sponsorData;
  console.log('=== Sponsor response ===');
  console.log('sponsorAddress:', sponsorAddress);
  console.log('sponsoredTxBytes length:', sponsoredTxBytesB64.length);
  console.log('sponsorSignature:', sponsorSignature.substring(0, 50) + '...');

  // Decode the sponsored transaction bytes
  const sponsoredTxBytes = fromBase64(sponsoredTxBytesB64);
  console.log('Decoded tx bytes length:', sponsoredTxBytes.length);

  // Now sign the SPONSORED transaction with zkLogin (after gas is added)
  console.log('=== Calling signTransactionWithZkLogin ===');
  const zkLoginSignature = await signTransactionWithZkLogin(sponsoredTxBytes);
  console.log('zkLoginSignature:', zkLoginSignature.substring(0, 50) + '...');

  // Execute with zkLogin signature and sponsor signature
  console.log('=== Executing transaction ===');
  console.log('Signatures: [zkLogin, sponsor]');

  const result = await client.executeTransactionBlock({
    transactionBlock: sponsoredTxBytesB64,
    signature: [zkLoginSignature, sponsorSignature],
    options: {
      showEffects: true,
    },
  });

  console.log('=== TRANSACTION SUCCESS ===');
  console.log('Digest:', result.digest);
  console.log('Effects status:', result.effects?.status);

  return { digest: result.digest };
}

// Protocol statistics from blockchain
export interface ProtocolStatsBlockchain {
  totalCampaigns: number;
  totalResponses: number;
  totalParticipants: number;
  activeCampaigns: number;
}

// Fetch protocol statistics from blockchain
export async function fetchProtocolStats(): Promise<ProtocolStatsBlockchain> {
  const client = createSuiClient();
  const config = getSuiConfig();
  if (!client || !config) {
    return { totalCampaigns: 0, totalResponses: 0, totalParticipants: 0, activeCampaigns: 0 };
  }

  try {
    // Get all campaigns from registry
    const registry = await client.getObject({
      id: config.registryId,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return { totalCampaigns: 0, totalResponses: 0, totalParticipants: 0, activeCampaigns: 0 };
    }

    const registryData = registry.data.content.fields as {
      all_campaigns: Array<string | { id: string }>;
    };

    if (!registryData.all_campaigns || registryData.all_campaigns.length === 0) {
      return { totalCampaigns: 0, totalResponses: 0, totalParticipants: 0, activeCampaigns: 0 };
    }

    const campaignIds = registryData.all_campaigns.map(c =>
      typeof c === 'string' ? c : c.id
    );

    // Fetch all campaign objects
    const campaigns = await client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    });

    let totalResponses = 0;
    let activeCampaigns = 0;
    const participantsSet = new Set<string>();
    const now = Date.now();

    for (const obj of campaigns) {
      if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') continue;

      const content = obj.data.content as unknown as {
        fields: {
          total_responses: string;
          end_time: string;
          is_finalized: boolean;
          participants: { fields: { contents: Array<{ fields: { key: string } }> } };
        };
      };

      totalResponses += parseInt(content.fields.total_responses || '0');

      const endTime = parseInt(content.fields.end_time || '0');
      if (now < endTime && !content.fields.is_finalized) {
        activeCampaigns++;
      }

      // Count unique participants
      const participants = content.fields.participants?.fields?.contents || [];
      for (const p of participants) {
        participantsSet.add(p.fields.key);
      }
    }

    return {
      totalCampaigns: campaignIds.length,
      totalResponses,
      totalParticipants: participantsSet.size,
      activeCampaigns,
    };
  } catch (error) {
    console.error('Error fetching protocol stats:', error);
    return { totalCampaigns: 0, totalResponses: 0, totalParticipants: 0, activeCampaigns: 0 };
  }
}

// Sponsorship status
export interface SponsorshipStatus {
  address: string;
  limits: { MAX_CAMPAIGNS: number; MAX_RESPONSES: number };
  used: { campaigns: number; responses: number };
  remaining: { campaigns: number; responses: number };
  canSponsorCampaign: boolean;
  canSponsorResponse: boolean;
}

// Get sponsorship status for an address
export async function getSponsorshipStatus(address: string): Promise<SponsorshipStatus | null> {
  try {
    const response = await fetch(`/api/sponsor/status?address=${encodeURIComponent(address)}`);
    if (!response.ok) {
      console.error('Failed to get sponsorship status');
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting sponsorship status:', error);
    return null;
  }
}
