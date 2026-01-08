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
    response_seed?: string[] | null; // NEW: encrypted password for auto-recovery (Option<String>)
  };
}

interface BlockchainCampaign {
  id: { id: string };
  creator: string;
  campaign_seed: string; // NEW: for creator auto-recovery
  title: string;
  description: string;
  questions: BlockchainQuestion[];
  responses: BlockchainResponse[];
  total_responses: string;
  access_type: number;
  created_at: string;
  end_time: string;
  is_finalized: boolean;
  is_encrypted: boolean;
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
    isEncrypted: data.is_encrypted,
    campaignSeed: data.is_encrypted && data.campaign_seed ? data.campaign_seed : undefined,
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
        const sender = tx.transaction?.data?.sender;
        if (!sender || !tx.digest) continue;

        // Only include submit_response transactions (not create_campaign)
        const inputs = tx.transaction?.data?.transaction;
        if (!inputs || inputs.kind !== 'ProgrammableTransaction') continue;

        const packageCalls = inputs.transactions?.filter((t: any) => {
          if (t.MoveCall) {
            const fn = t.MoveCall.function;
            return fn === 'submit_response';
          }
          return false;
        }) as any[];

        if (packageCalls && packageCalls.length > 0) {
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

      // Find winners (all options with highest votes, if votes > 0)
      const maxVotes = Math.max(...results.map((r) => r.votes));
      const winners = maxVotes > 0
        ? results.filter((r) => r.votes === maxVotes).map((r) => r.id)
        : undefined;

      return {
        id: `q${index + 1}`,
        question: qFields.text,
        type: questionType as 'single-choice' | 'multiple-choice',
        totalVotes,
        results,
        winners,
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
  responseSeed?: string | null; // NEW: encrypted password for auto-recovery
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
        if (!sender || !tx.digest) continue;

        // Only include submit_response transactions (not create_campaign)
        const inputs = tx.transaction?.data?.transaction;
        if (!inputs || inputs.kind !== 'ProgrammableTransaction') continue;

        const packageCalls = inputs.transactions?.filter((t: any) => {
          if (t.MoveCall) {
            const fn = t.MoveCall.function;
            return fn === 'submit_response';
          }
          return false;
        }) as any[];

        if (packageCalls && packageCalls.length > 0) {
          txDigestByRespondent.set(sender, tx.digest);
        }
      }
    } catch (e) {
      console.warn('Could not fetch transaction history:', e);
    }

    // Get question types to properly convert answers
    const questionTypes = data.questions.map((q) => {
      const qType = q.fields.question_type;
      return QUESTION_TYPES_REVERSE[qType as keyof typeof QUESTION_TYPES_REVERSE] || 'text';
    });

    return data.responses.map((response, index) => {
      const fields = response.fields;
      const answersContents = fields?.answers?.fields?.contents || [];

      // Convert VecMap to Record
      const answers: Record<string, string | string[] | null> = {};
      for (const entry of answersContents) {
        const questionIndex = parseInt(entry.fields.key);
        let answer: string | string[] | null = entry.fields.value;

        // For non-encrypted campaigns, answers are stored as indices ("0", "1", "1,2")
        // Convert them to option IDs ("opt1", "opt2", "opt2,opt3") for frontend
        if (!data.is_encrypted) {
          const questionType = questionTypes[questionIndex];

          if (questionType === 'single-choice' && typeof answer === 'string' && /^\d+$/.test(answer)) {
            // Single choice: "0" -> "opt1", "1" -> "opt2"
            const optionIndex = parseInt(answer);
            answer = `opt${optionIndex + 1}`;
          } else if (questionType === 'multiple-choice' && typeof answer === 'string' && answer.includes(',')) {
            // Multiple choice: "0,2" -> ["opt1", "opt3"]
            const indices = answer.split(',').map(idx => parseInt(idx.trim()));
            answer = indices.map(idx => `opt${idx + 1}`);
          }
        }

        answers[`q${questionIndex + 1}`] = answer;
      }

      // Extract response_seed (Option<String> in Move, comes as string[] or null)
      const responseSeed = fields.response_seed && fields.response_seed.length > 0
        ? fields.response_seed[0]
        : null;

      return {
        id: `resp-${index}`,
        respondent: `${fields.respondent.slice(0, 6)}...${fields.respondent.slice(-4)}`,
        respondentAddress: fields.respondent,
        timestamp: new Date(parseInt(fields.timestamp)).toISOString(),
        answers,
        txHash: txDigestByRespondent.get(fields.respondent) || '',
        responseSeed,
      };
    });
  } catch (error) {
    console.error('Error fetching campaign responses:', error);
    return [];
  }
}

/**
 * Get user's response for a specific campaign (for participant auto-recovery)
 * Returns the response with response_seed if the user has participated
 */
export async function getUserResponse(
  campaignId: string,
  userAddress: string
): Promise<{ responseSeed: string | null } | null> {
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
    const data = content.fields;

    // Find user's response
    const userResponse = data.responses.find(
      (r) => r.fields.respondent === userAddress
    );

    if (!userResponse) {
      return null; // User hasn't participated yet
    }

    // Extract response_seed (Option<String> in Move, comes as string[] or null)
    const responseSeed = userResponse.fields.response_seed && userResponse.fields.response_seed.length > 0
      ? userResponse.fields.response_seed[0]
      : null;

    return { responseSeed };
  } catch (error) {
    console.error('Error fetching user response:', error);
    return null;
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
  endTime: number, // Unix timestamp in milliseconds
  isEncrypted: boolean = false,
  campaignSeed: string = '' // NEW: for creator auto-recovery (empty if not encrypted)
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
    campaignSeed,
    title,
    description,
    questionTypes,
    questionTexts,
    questionRequired,
    allOptions,
    optionsPerQuestion,
    accessType: 0,
    isEncrypted,
    endTime: `${endTime} (${new Date(endTime).toISOString()})`,
    clock: '0x6',
  });

  tx.moveCall({
    target: `${config.packageId}::logbook::create_campaign`,
    arguments: [
      tx.object(config.registryId),            // 0: Campaign Registry
      tx.pure.string(campaignSeed),            // 1: Campaign seed (for auto-recovery)
      tx.pure.string(title),                   // 2: Campaign title
      tx.pure.string(description),             // 3: Campaign description
      tx.pure.vector('u8', questionTypes),     // 4: Question types (0=single, 1=multiple, 2=text)
      tx.pure.vector('string', questionTexts), // 5: Question texts
      tx.pure.vector('bool', questionRequired),// 6: Required flags
      tx.pure.vector('string', allOptions),    // 7: Flattened answer options
      tx.pure.vector('u64', optionsPerQuestion), // 8: Options count per question
      tx.pure.u8(0),                           // 9: Access type (0=public)
      tx.pure.bool(isEncrypted),               // 10: Is encrypted flag
      tx.pure.u64(endTime),                    // 11: End time (ms timestamp)
      tx.object('0x6'),                        // 12: Sui System Clock
    ],
  });

  return tx;
}

// Build transaction for submitting a response
export function buildSubmitResponseTx(
  campaignId: string,
  answers: Record<string, string | string[]>,
  responseSeed: string | null = null // NEW: encrypted password for participant auto-recovery
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

  // Prepare response_seed as Option<String> for Move contract
  // If responseSeed is null, pass empty array for Option::None
  // If responseSeed exists, pass array with single element for Option::Some
  const responseSeedArg = responseSeed
    ? tx.pure.vector('string', [responseSeed])
    : tx.pure.vector('string', []);

  tx.moveCall({
    target: `${config.packageId}::logbook::submit_response`,
    arguments: [
      tx.object(campaignId),
      responseSeedArg, // Option<String> for auto-recovery
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
): Promise<{ digest: string; objectChanges?: Array<{ type: string; objectId?: string; objectType?: string }> }> {
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
      showObjectChanges: true,
    },
  });

  console.log('=== TRANSACTION SUCCESS ===');
  console.log('Digest:', result.digest);
  console.log('Effects status:', result.effects?.status);
  console.log('Object changes:', JSON.stringify(result.objectChanges, null, 2));
  console.log('Full result keys:', Object.keys(result));
  console.log('Full result:', JSON.stringify(result, null, 2));

  return {
    digest: result.digest,
    objectChanges: result.objectChanges as Array<{ type: string; objectId?: string; objectType?: string }> | undefined,
  };
}

// Execute a transaction with zkLogin (no sponsorship - user pays gas)
export async function executeZkLoginTransaction(
  tx: Transaction,
  senderAddress: string
): Promise<{ digest: string; objectChanges?: Array<{ type: string; objectId?: string; objectType?: string }> }> {
  console.log('=== executeZkLoginTransaction START ===');
  console.log('senderAddress:', senderAddress);

  const { signTransactionWithZkLogin } = await import('@/lib/zklogin-utils');

  const config = getSuiConfig();
  const client = createSuiClient();
  if (!client) throw new Error('Sui client not available');

  // Set the sender (user pays gas)
  tx.setSender(senderAddress);
  tx.setGasBudget(50_000_000); // 0.05 SUI max gas

  // Build the transaction
  const txBytes = await tx.build({ client });
  console.log('Transaction built, bytes length:', txBytes.length);

  // Sign with zkLogin
  const zkLoginSignature = await signTransactionWithZkLogin(txBytes);
  console.log('zkLoginSignature:', zkLoginSignature.substring(0, 50) + '...');

  // Execute transaction
  const result = await client.executeTransactionBlock({
    transactionBlock: txBytes,
    signature: zkLoginSignature,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log('=== TRANSACTION SUCCESS ===');
  console.log('Digest:', result.digest);
  console.log('Effects status:', result.effects?.status);
  console.log('Object changes:', JSON.stringify(result.objectChanges, null, 2));
  console.log('Full result keys:', Object.keys(result));
  console.log('Full result:', JSON.stringify(result, null, 2));

  return {
    digest: result.digest,
    objectChanges: result.objectChanges as Array<{ type: string; objectId?: string; objectType?: string }> | undefined,
  };
}

// Protocol statistics from blockchain
export interface ProtocolStatsBlockchain {
  totalCampaigns: number;
  totalResponses: number;
  totalParticipants: number;
  activeCampaigns: number;
}

// Gas statistics from blockchain
export interface ProtocolGasStats {
  totalGasSpentOnCampaigns: number; // in SUI
  totalGasSpentOnResponses: number; // in SUI
  totalTransactions: number;
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

// Fetch protocol gas statistics from blockchain
export async function fetchProtocolGasStats(): Promise<ProtocolGasStats> {
  const client = createSuiClient();
  const config = getSuiConfig();
  if (!client || !config) {
    return { totalGasSpentOnCampaigns: 0, totalGasSpentOnResponses: 0, totalTransactions: 0 };
  }

  try {
    let totalGasSpentOnCampaigns = 0;
    let totalGasSpentOnResponses = 0;
    let totalTransactions = 0;
    let cursor: string | null | undefined = undefined;
    let hasMore = true;

    // Query all transactions to the package
    while (hasMore) {
      const { data: txData, hasNextPage, nextCursor } = await client.queryTransactionBlocks({
        filter: {
          InputObject: config.packageId,
        },
        options: {
          showInput: true,
          showEffects: true,
        },
        limit: 50,
        cursor,
      });

      for (const tx of txData) {
        const inputs = tx.transaction?.data?.transaction;
        if (!inputs || inputs.kind !== 'ProgrammableTransaction') continue;

        // Look for calls to our package
        let transactionType: 'campaign' | 'response' | null = null;

        const packageCalls = inputs.transactions?.filter((t: any) => {
          if (t.MoveCall) {
            return t.MoveCall.package === config.packageId;
          }
          return false;
        }) as any[];

        for (const call of packageCalls || []) {
          if (call.MoveCall) {
            const fn = call.MoveCall.function;
            if (fn === 'create_campaign') {
              transactionType = 'campaign';
              break;
            } else if (fn === 'submit_response') {
              transactionType = 'response';
              break;
            }
          }
        }

        if (!transactionType) continue;

        // Calculate gas cost
        const gasUsed = tx.effects?.gasUsed;
        const gasCost = gasUsed
          ? (Number(gasUsed.computationCost) + Number(gasUsed.storageCost) - Number(gasUsed.storageRebate)) / 1_000_000_000
          : 0;

        if (transactionType === 'campaign') {
          totalGasSpentOnCampaigns += Math.max(0, gasCost);
        } else {
          totalGasSpentOnResponses += Math.max(0, gasCost);
        }
        totalTransactions++;
      }

      hasMore = hasNextPage;
      cursor = nextCursor;

      // Safety limit to avoid infinite loops
      if (totalTransactions > 10000) break;
    }

    return {
      totalGasSpentOnCampaigns,
      totalGasSpentOnResponses,
      totalTransactions,
    };
  } catch (error) {
    console.error('Error fetching protocol gas stats:', error);
    return { totalGasSpentOnCampaigns: 0, totalGasSpentOnResponses: 0, totalTransactions: 0 };
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

// Fetch SUI balance for an address
export async function fetchSuiBalance(address: string): Promise<string> {
  const client = createSuiClient();
  if (!client || !address) return '0';

  try {
    const balance = await client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI',
    });
    // Convert from MIST to SUI (1 SUI = 10^9 MIST)
    const suiBalance = Number(balance.totalBalance) / 1_000_000_000;
    return suiBalance.toFixed(4);
  } catch (error) {
    console.error('Error fetching SUI balance:', error);
    return '0';
  }
}

// Request test SUI from devnet/testnet faucet
export async function requestFaucet(address: string): Promise<{ success: boolean; error?: string }> {
  const dataSource = getDataSource();

  if (dataSource !== 'devnet' && dataSource !== 'testnet') {
    return { success: false, error: 'Faucet only available on devnet/testnet' };
  }

  const faucetUrl = dataSource === 'devnet'
    ? 'https://faucet.devnet.sui.io/v2/gas'
    : 'https://faucet.testnet.sui.io/v2/gas';

  try {
    const response = await fetch(faucetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FixedAmountRequest: { recipient: address },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || 'Faucet request failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error requesting faucet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// User account statistics from blockchain
export interface UserAccountStats {
  campaignsCreated: number;
  campaignsParticipated: number;
  totalResponsesReceived: number; // total responses on user's campaigns
  firstActivityDate: string | null; // ISO date of first campaign/response
}

// Fetch user account statistics from blockchain
export async function fetchUserAccountStats(userAddress: string): Promise<UserAccountStats> {
  const client = createSuiClient();
  const config = getSuiConfig();
  if (!client || !config || !userAddress) {
    return { campaignsCreated: 0, campaignsParticipated: 0, totalResponsesReceived: 0, firstActivityDate: null };
  }

  try {
    // Get registry object
    const registry = await client.getObject({
      id: config.registryId,
      options: { showContent: true },
    });

    if (!registry.data?.content || registry.data.content.dataType !== 'moveObject') {
      return { campaignsCreated: 0, campaignsParticipated: 0, totalResponsesReceived: 0, firstActivityDate: null };
    }

    const registryData = registry.data.content.fields as {
      all_campaigns: Array<string | { id: string }>;
      campaigns_by_creator: { fields: { contents: Array<{ fields: { key: string; value: Array<string | { id: string }> } }> } };
    };

    // Count campaigns created by this user
    const creatorEntry = registryData.campaigns_by_creator?.fields?.contents?.find(
      (entry) => entry.fields.key === userAddress
    );
    const campaignsCreated = creatorEntry?.fields.value.length || 0;

    // Get all campaigns to count participations and responses
    if (!registryData.all_campaigns || registryData.all_campaigns.length === 0) {
      return { campaignsCreated, campaignsParticipated: 0, totalResponsesReceived: 0, firstActivityDate: null };
    }

    const campaignIds = registryData.all_campaigns.map(c =>
      typeof c === 'string' ? c : c.id
    );

    // Fetch all campaign objects
    const campaigns = await client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    });

    let campaignsParticipated = 0;
    let totalResponsesReceived = 0;
    let earliestTimestamp: number | null = null;

    for (const obj of campaigns) {
      if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') continue;

      const content = obj.data.content as unknown as {
        fields: {
          creator: string;
          total_responses: string;
          created_at: string;
          participants: { fields: { contents: Array<{ fields: { key: string } }> } };
          responses: Array<{ fields: { respondent: string; timestamp: string } }>;
        };
      };

      // Check if user is creator - add responses received
      if (content.fields.creator === userAddress) {
        totalResponsesReceived += parseInt(content.fields.total_responses || '0');
        const createdAt = parseInt(content.fields.created_at || '0');
        if (createdAt > 0 && (earliestTimestamp === null || createdAt < earliestTimestamp)) {
          earliestTimestamp = createdAt;
        }
      }

      // Check if user has participated
      const participants = content.fields.participants?.fields?.contents || [];
      const isParticipant = participants.some(p => p.fields.key === userAddress);
      if (isParticipant) {
        campaignsParticipated++;
        // Get response timestamp for first activity
        const userResponse = content.fields.responses?.find(r => r.fields.respondent === userAddress);
        if (userResponse) {
          const respTimestamp = parseInt(userResponse.fields.timestamp || '0');
          if (respTimestamp > 0 && (earliestTimestamp === null || respTimestamp < earliestTimestamp)) {
            earliestTimestamp = respTimestamp;
          }
        }
      }
    }

    return {
      campaignsCreated,
      campaignsParticipated,
      totalResponsesReceived,
      firstActivityDate: earliestTimestamp ? new Date(earliestTimestamp).toISOString() : null,
    };
  } catch (error) {
    console.error('Error fetching user account stats:', error);
    return { campaignsCreated: 0, campaignsParticipated: 0, totalResponsesReceived: 0, firstActivityDate: null };
  }
}

// User transaction for the Activity tab
export interface UserTransaction {
  digest: string;
  timestamp: number;
  type: 'create_campaign' | 'submit_response' | 'unknown';
  campaignId?: string;
  campaignTitle?: string;
  gasCost: number; // in SUI
  success: boolean;
  gasPayedBy: 'user' | 'logbook' | string; // 'user' = self-paid, 'logbook' = our sponsor, or address of sponsor
}

// Known Logbook treasury/sponsor addresses (gas payers)
const LOGBOOK_SPONSOR_ADDRESSES = [
  '0xb6ec49cb872f3941b526e1281ebc1c9b9b91f848e20469a2ff77692d25f29134', // devnet treasury
];

// Fetch user's Logbook transactions
export async function fetchUserTransactions(userAddress: string): Promise<UserTransaction[]> {
  const client = createSuiClient();
  const config = getSuiConfig();
  if (!client || !config || !userAddress) {
    return [];
  }

  try {
    // Query transactions from this user to our package
    const { data: txData } = await client.queryTransactionBlocks({
      filter: {
        FromAddress: userAddress,
      },
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
      },
      limit: 50,
      order: 'descending',
    });

    const transactions: UserTransaction[] = [];

    for (const tx of txData) {
      // Check if this transaction calls our package
      const inputs = tx.transaction?.data?.transaction;
      if (!inputs || inputs.kind !== 'ProgrammableTransaction') continue;

      // Look for calls to our package
      const packageCalls = inputs.transactions?.filter((t: any) => {
        if (t.MoveCall) {
          return t.MoveCall.package === config.packageId;
        }
        return false;
      }) as any[];

      if (!packageCalls || packageCalls.length === 0) continue;

      // Determine transaction type and extract campaign ID
      let txType: UserTransaction['type'] = 'unknown';
      let campaignId: string | undefined;

      for (const call of packageCalls) {
        if (call.MoveCall) {
          const fn = call.MoveCall.function;
          if (fn === 'create_campaign') {
            txType = 'create_campaign';
          } else if (fn === 'submit_response') {
            txType = 'submit_response';
            // For submit_response, the campaign ID is the first argument
            // Arguments are references to inputs, we need to resolve them
            const args = call.MoveCall.arguments;
            if (args && args.length > 0) {
              const firstArg = args[0];
              // Check if it's an Input reference
              if (firstArg && typeof firstArg === 'object' && 'Input' in firstArg) {
                const inputIndex = firstArg.Input;
                const txInputs = inputs.inputs;
                if (txInputs && txInputs[inputIndex]) {
                  const input = txInputs[inputIndex];
                  // SharedObject type contains objectId
                  if (input && typeof input === 'object' && 'Object' in input) {
                    const objInput = input.Object as any;
                    if (objInput && typeof objInput === 'object' && 'Shared' in objInput) {
                      campaignId = objInput.Shared.objectId;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // For submit_response, also try to get campaignId from mutated objects
      if (txType === 'submit_response' && !campaignId && tx.effects?.mutated) {
        // The campaign object gets mutated when a response is submitted
        // Look for a shared object that was mutated (campaign is shared)
        for (const mutated of tx.effects.mutated) {
          if (mutated.owner && typeof mutated.owner === 'object' && 'Shared' in mutated.owner) {
            campaignId = mutated.reference?.objectId;
            break;
          }
        }
      }

      // Get created campaign ID if it was a create_campaign tx
      if (txType === 'create_campaign' && tx.effects?.created) {
        const createdCampaign = tx.effects.created.find((obj: any) =>
          obj.owner && typeof obj.owner === 'object' && 'Shared' in obj.owner
        );
        if (createdCampaign) {
          campaignId = createdCampaign.reference?.objectId;
        }
      }

      // Calculate gas cost
      const gasUsed = tx.effects?.gasUsed;
      const gasCost = gasUsed
        ? (Number(gasUsed.computationCost) + Number(gasUsed.storageCost) - Number(gasUsed.storageRebate)) / 1_000_000_000
        : 0;

      // Determine who paid for gas
      const gasOwner = tx.effects?.gasObject?.owner;
      let gasPayedBy: UserTransaction['gasPayedBy'] = 'user';

      if (gasOwner && typeof gasOwner === 'object' && 'AddressOwner' in gasOwner) {
        const payerAddress = gasOwner.AddressOwner;
        if (payerAddress !== userAddress) {
          // Someone else paid - check if it's Logbook
          if (LOGBOOK_SPONSOR_ADDRESSES.includes(payerAddress)) {
            gasPayedBy = 'logbook';
          } else {
            gasPayedBy = payerAddress; // Other sponsor address
          }
        }
      }

      transactions.push({
        digest: tx.digest,
        timestamp: Number(tx.timestampMs || 0),
        type: txType,
        campaignId,
        gasCost: Math.max(0, gasCost),
        success: tx.effects?.status?.status === 'success',
        gasPayedBy,
      });
    }

    // Fetch campaign titles for all transactions that have campaignId
    const campaignIds = [...new Set(transactions.filter(tx => tx.campaignId).map(tx => tx.campaignId!))];
    if (campaignIds.length > 0) {
      try {
        const campaignObjects = await client.multiGetObjects({
          ids: campaignIds,
          options: { showContent: true },
        });

        const titleMap = new Map<string, string>();
        for (const obj of campaignObjects) {
          if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
            const fields = obj.data.content.fields as { title?: string };
            if (fields.title) {
              titleMap.set(obj.data.objectId, fields.title);
            }
          }
        }

        // Update transactions with campaign titles
        for (const tx of transactions) {
          if (tx.campaignId && titleMap.has(tx.campaignId)) {
            tx.campaignTitle = titleMap.get(tx.campaignId);
          }
        }
      } catch (error) {
        console.error('Error fetching campaign titles:', error);
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
}
