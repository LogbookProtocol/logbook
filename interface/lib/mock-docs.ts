export interface DocItem {
  title: string;
  slug: string;
  description: string;
}

export interface DocSection {
  title: string;
  items: DocItem[];
}

export interface DocContent {
  title: string;
  content: string;
}

export const docsNavigation: DocSection[] = [
  {
    title: 'Introduction',
    items: [
      { title: 'What is Logbook', slug: 'introduction', description: 'Overview of the Logbook platform' },
      { title: 'What is Blockchain', slug: 'blockchain', description: 'Understanding blockchain technology' },
      { title: 'Why Sui', slug: 'why-sui', description: 'Why we chose the Sui blockchain' },
    ],
  },
  {
    title: 'Getting Started',
    items: [
      { title: 'Quick Start', slug: 'quick-start', description: 'Create your first campaign in minutes' },
      { title: 'Authentication', slug: 'authentication', description: 'How to connect with Google or wallet' },
      { title: 'Free Tier', slug: 'free-tier', description: 'Free sponsored transactions for new users' },
    ],
  },
  {
    title: 'Campaigns',
    items: [
      { title: 'Creating Campaigns', slug: 'creating-campaigns', description: 'How to create surveys and polls' },
      { title: 'Question Types', slug: 'question-types', description: 'Single choice, multiple choice, and text' },
      { title: 'Participating', slug: 'participating', description: 'How to submit responses' },
      { title: 'Viewing Results', slug: 'results', description: 'Analyzing campaign results' },
    ],
  },
  {
    title: 'Technical',
    items: [
      { title: 'Architecture', slug: 'architecture', description: 'How Logbook works under the hood' },
      { title: 'Smart Contract', slug: 'smart-contract', description: 'The Move smart contract' },
      { title: 'Data Storage', slug: 'data-storage', description: 'How data is stored on-chain' },
    ],
  },
];

export const docsContent: Record<string, DocContent> = {
  introduction: {
    title: 'What is Logbook',
    content: `# What is Logbook

Logbook is a decentralized platform for creating surveys, polls, and forms with results stored permanently on the blockchain. Every response becomes an immutable, verifiable record that cannot be altered or deleted.

## The Problem

Traditional survey tools like Google Forms or SurveyMonkey store data in private databases. This creates several issues:

- **Data can be modified**: Administrators can change or delete responses
- **No transparency**: There's no way to verify that results haven't been tampered with
- **Single point of failure**: If the service shuts down, data may be lost
- **Trust required**: Participants must trust the platform and campaign creator

## The Solution

Logbook solves these problems by recording every response on the Sui blockchain:

- **Immutable records**: Once submitted, responses cannot be changed
- **Public verification**: Anyone can verify results independently
- **Permanent storage**: Data exists as long as the blockchain exists
- **Trustless**: No need to trust any central authority

## Key Features

- **Easy login**: Sign in with Google (zkLogin) or connect a crypto wallet
- **Free to start**: Your first campaign and 5 responses are sponsored
- **Multiple question types**: Single choice, multiple choice, and text answers
- **Real-time results**: See responses as they come in
- **On-chain proof**: Every response has a verifiable transaction ID

## Use Cases

- **Community voting**: Transparent governance decisions
- **Research surveys**: Collect feedback with provable authenticity
- **Event registration**: Immutable attendance records
- **Polls and opinions**: Public sentiment with verifiable results
- **Certification**: Issue verifiable credentials and test results`,
  },

  blockchain: {
    title: 'What is Blockchain',
    content: `# What is Blockchain Technology

Blockchain is a revolutionary technology that allows data to be stored in a way that makes it nearly impossible to change, hack, or cheat the system.

## Simple Explanation

Imagine a notebook that:
- Everyone can read
- Anyone can add new pages
- But nobody can tear out or modify existing pages
- And thousands of people have identical copies

That's essentially what a blockchain is - a shared, unchangeable record that everyone can verify.

## How It Works

### 1. Blocks of Data

Information is grouped into "blocks". Each block contains:
- A set of transactions or records
- A timestamp of when it was created
- A unique code (hash) that identifies it
- The hash of the previous block

### 2. The Chain

Blocks are linked together in chronological order, forming a "chain". Each block references the previous one, creating an unbroken sequence from the first block to the most recent.

### 3. Distributed Network

Instead of one central computer storing the data, thousands of computers (nodes) around the world each maintain their own copy of the blockchain. When a new block is added, all copies are updated simultaneously.

### 4. Consensus

Before a new block is added, the network must agree that it's valid. This prevents anyone from adding fake or fraudulent data.

## Why Blockchain Matters

### Immutability
Once data is recorded, it cannot be changed. To alter a record, you would need to change that block and every block after it, on more than half of all computers in the network - practically impossible.

### Transparency
Anyone can view the entire history of the blockchain. There are no hidden records or secret changes.

### Decentralization
No single company, government, or individual controls the blockchain. It operates by consensus of the network.

### Security
The cryptographic links between blocks and the distributed nature make blockchain extremely secure against tampering.

## Blockchain vs Traditional Databases

| Feature | Traditional Database | Blockchain |
|---------|---------------------|------------|
| Control | Centralized (one owner) | Decentralized (network) |
| Modification | Can be changed | Immutable |
| Transparency | Private | Public |
| Trust | Trust the operator | Trust the math |
| Single point of failure | Yes | No |

## Common Terms

- **Transaction**: A record of something happening (e.g., a vote, a payment, a survey response)
- **Block**: A collection of transactions grouped together
- **Hash**: A unique fingerprint that identifies each block
- **Node**: A computer participating in the network
- **Wallet**: Software that stores your blockchain identity and allows you to interact with the network
- **Smart Contract**: A program that runs on the blockchain and executes automatically`,
  },

  'why-sui': {
    title: 'Why Sui',
    content: `# Why We Built on Sui

Sui is a next-generation blockchain designed for speed, low cost, and ease of use. Here's why we chose it for Logbook.

## Speed

Sui can process transactions in under a second. When you submit a survey response, it's confirmed almost instantly - no waiting for minutes or hours like on some older blockchains.

## Low Cost

Transaction fees (gas) on Sui are extremely low - fractions of a cent. This makes it practical to record every survey response on-chain without accumulating significant costs.

## zkLogin

Sui pioneered zkLogin technology, which allows users to authenticate with their Google account (or other OAuth providers) without needing a crypto wallet. This is crucial for mainstream adoption - your participants don't need to understand cryptocurrency to use Logbook.

## Sponsored Transactions

Sui supports "sponsored transactions" where a third party (like Logbook) can pay the gas fees on behalf of users. Combined with zkLogin, this means users can interact with blockchain applications without ever owning cryptocurrency.

## Object-Centric Model

Unlike other blockchains that use account-based models, Sui uses an object-centric design. Each campaign and response is a distinct object with its own ID, making it easy to reference and verify specific records.

## Move Language

Sui's smart contracts are written in Move, a language designed specifically for blockchain with built-in safety features. This reduces the risk of bugs and vulnerabilities in the Logbook protocol.

## Ecosystem

Sui has a growing ecosystem of wallets, explorers, and tools. Users can view their Logbook activity in any Sui wallet and verify transactions on block explorers like Suiscan.`,
  },

  'quick-start': {
    title: 'Quick Start',
    content: `# Quick Start Guide

Create your first campaign in just a few minutes.

## Step 1: Sign In

Click the "Get Started" button on the homepage. You have two options:

- **Google Account**: Click "Continue with Google" to sign in with your existing Google account. No wallet needed!
- **Crypto Wallet**: Click any supported wallet (Sui Wallet, Phantom, etc.) to connect

## Step 2: Create a Campaign

Click "New Campaign" in the navigation and fill in your campaign details:

- **Title**: Give your campaign a clear, descriptive name
- **Description**: Explain what you're asking about and why
- **End Date**: Set when the campaign should stop accepting responses

## Step 3: Add Questions

Click "Add Question" to create your survey questions. Choose from three types:

- **Single Choice**: Respondents pick exactly one option
- **Multiple Choice**: Respondents can select multiple options
- **Text Answer**: Respondents type a free-form response

For each question, you can mark it as required or optional and add as many answer options as needed.

## Step 4: Review and Deploy

1. Click "Review Campaign" to see a preview
2. Check that everything looks correct
3. Click "Deploy Campaign"

Your first campaign is free - we sponsor the blockchain transaction for you!

## Step 5: Share Your Campaign

Once deployed, you can share your campaign via:
- **Direct link**: Copy and send the URL
- **QR code**: Display in the campaign details page

## Step 6: Monitor Results

Visit your campaign page to see:
- Real-time response counts
- Aggregated results with charts
- Individual responses (for campaign creators)

When the campaign ends, results are finalized and permanently recorded on the blockchain.`,
  },

  authentication: {
    title: 'Authentication',
    content: `# Authentication Methods

Logbook supports two ways to authenticate: zkLogin with Google and traditional crypto wallets.

## zkLogin with Google

zkLogin is a technology developed by Mysten Labs that allows you to use your Google account as your blockchain identity.

### How It Works

1. You click "Continue with Google"
2. You sign in with your Google account
3. Behind the scenes, a unique blockchain address is computed from your Google identity
4. A zero-knowledge proof verifies your identity without exposing private data

### Benefits

- **No wallet needed**: Use your existing Google account
- **No crypto knowledge required**: Works just like any other Google sign-in
- **Secure**: Your Google password is never shared with Logbook
- **Consistent address**: Your Google account always maps to the same blockchain address

### Privacy

zkLogin uses zero-knowledge cryptography. This means:
- Logbook never sees your Google password
- The blockchain doesn't store your email
- Your identity is verified mathematically without exposing personal data

## Crypto Wallets

If you prefer using a traditional crypto wallet, Logbook supports many popular options:

### Supported Wallets

- Sui Wallet
- Phantom
- Suiet
- OKX Wallet
- Backpack
- Martian
- And many more...

### How to Connect

1. Click "Get Started" on the homepage
2. Select your wallet from the list
3. Approve the connection request in your wallet

### Benefits

- **Full control**: You manage your own keys
- **Use existing wallet**: If you already have a Sui wallet, use it directly
- **Advanced features**: Access to all blockchain features

## Logging Out

To disconnect, click on your address in the header and select "Disconnect".`,
  },

  'free-tier': {
    title: 'Free Tier',
    content: `# Free Sponsored Transactions

Logbook sponsors your first interactions with the platform, so you can try it without owning any cryptocurrency.

## What's Included

Every new user (identified by their blockchain address) gets:

- **1 Free Campaign**: Your first campaign creation is fully sponsored
- **5 Free Responses**: Your first 5 survey responses are sponsored

## How It Works

When you create a campaign or submit a response, the transaction requires a small "gas" fee to be processed by the blockchain. Normally, this would be paid from your wallet.

With our sponsorship program:
1. You initiate the transaction
2. Our treasury account pays the gas fee on your behalf
3. The transaction is processed as normal
4. Your sponsored quota decreases by one

## Checking Your Quota

You can see your remaining sponsored transactions on the account page. Once you've used your free quota:
- You'll need a wallet with SUI tokens to create more campaigns
- You'll need a wallet with SUI tokens to submit more responses

## Getting SUI Tokens

If you need SUI tokens after using your free tier:

1. **Devnet (testing)**: Get free tokens from the Sui faucet
2. **Mainnet**: Purchase SUI from exchanges and transfer to your wallet

## Why We Sponsor

Blockchain transactions have costs, but we believe you should be able to try Logbook without any financial commitment. The free tier lets you:
- Evaluate if Logbook fits your needs
- Create a real campaign and collect responses
- Understand how blockchain-based surveys work

Once you see the value, you can decide whether to continue with your own wallet.`,
  },

  'creating-campaigns': {
    title: 'Creating Campaigns',
    content: `# Creating Campaigns

A campaign is your survey, poll, or form on Logbook. Here's everything you need to know about creating one.

## Campaign Components

### Title
A clear, descriptive name for your campaign. This is what participants will see first.

### Description
Optional but recommended. Explain:
- What you're asking about
- Why you're collecting this information
- How the results will be used

### End Date
When should the campaign stop accepting responses? After this date:
- No new responses can be submitted
- Results become final and immutable
- The campaign is marked as "Ended"

### Questions
The core of your campaign. See the Question Types section for details.

## Creating Your Campaign

### Step 1: Basic Information

Navigate to "New Campaign" and fill in:
- Title (required)
- Description (optional)
- End date (required)

### Step 2: Add Questions

Click "Add Question" for each question you want to include. For each question:
1. Enter the question text
2. Choose the question type
3. Add answer options (for choice questions)
4. Toggle required/optional

### Step 3: Review

Before deploying, review your campaign:
- Check all questions are correct
- Verify answer options are complete
- Confirm the end date

### Step 4: Deploy

Click "Deploy Campaign" to publish your campaign to the blockchain.

If you have free sponsored transactions available, deployment is free. Otherwise, you'll need to confirm the transaction in your wallet.

## After Deployment

Once deployed, your campaign:
- Has a unique on-chain ID
- Can be shared via link or QR code
- Will accept responses until the end date
- Shows real-time results

## Editing Campaigns

**Important**: Once a campaign is deployed to the blockchain, it cannot be edited. This is a feature, not a limitation - it ensures participants can trust that the questions haven't changed after they responded.

If you need to make changes, you'll need to create a new campaign.`,
  },

  'question-types': {
    title: 'Question Types',
    content: `# Question Types

Logbook supports three types of questions to cover most survey needs.

## Single Choice

Participants select exactly one option from a list.

### Best For
- Yes/No questions
- Rating scales
- Mutually exclusive options
- Preference selection

### Example
**What is your preferred programming language?**
- JavaScript
- Python
- Rust
- Go

## Multiple Choice

Participants can select any number of options (zero or more).

### Best For
- "Select all that apply" questions
- Feature preferences
- Multiple interests or skills
- Non-exclusive options

### Example
**Which platforms do you use? (Select all that apply)**
- iOS
- Android
- Web
- Desktop

## Text Input

Participants type a free-form text response.

### Best For
- Open-ended feedback
- Suggestions and ideas
- Detailed explanations
- Contact information

### Example
**What features would you like to see added?**
[Text input field]

## Question Options

### Required vs Optional

- **Required**: Participants must answer to submit the form
- **Optional**: Participants can skip this question

## Tips for Good Questions

1. **Be specific**: "How satisfied are you with the checkout process?" is better than "Are you satisfied?"

2. **Avoid leading questions**: Don't bias responses with loaded language

3. **Keep it simple**: One concept per question

4. **Provide balanced options**: Include the full range of possible responses

5. **Consider order**: Put most common options first, or randomize to avoid bias`,
  },

  participating: {
    title: 'Participating in Campaigns',
    content: `# Participating in Campaigns

Here's how to find campaigns and submit your responses.

## Finding Campaigns

### Direct Links
Most often, you'll receive a campaign link directly from the creator - via email, social media, or messaging.

### Campaigns Page
Visit the Campaigns page to see:
- **Created**: Campaigns you've created
- **Participated**: Campaigns you've responded to

## Submitting a Response

### Step 1: Open the Campaign

Click on a campaign link or select one from the Campaigns page.

### Step 2: Review the Questions

Read through all questions before answering. Note which are required vs optional.

### Step 3: Provide Your Answers

For each question:
- **Single choice**: Click on your preferred option
- **Multiple choice**: Click on all options that apply
- **Text input**: Type your response in the text field

### Step 4: Submit

Click "Submit Response" when you're done.

If you have free sponsored responses remaining, submission is free. Otherwise, confirm the transaction in your wallet.

### Step 5: Confirmation

After submission, you'll see:
- A confirmation message
- The transaction ID (for verification)
- A link to view current results

## Important Notes

### One Response Per Address

You can only submit one response per campaign from each blockchain address. This prevents duplicate voting but means you should be sure of your answers before submitting.

### Immutable Responses

Once submitted, your response is permanent. It cannot be changed or deleted. Make sure you're happy with your answers before confirming.

### Response Privacy

Your responses are linked to your blockchain address, which is visible to:
- The campaign creator (in the Responses tab)
- Anyone who views the blockchain

However:
- Your real name/email is not stored
- zkLogin addresses are not linked to your Google identity on-chain

## Viewing Your Responses

After participating, you can:
1. Go to the Campaigns page
2. Click the "Participated" tab
3. See all campaigns you've responded to`,
  },

  results: {
    title: 'Viewing Results',
    content: `# Viewing Campaign Results

See how responses are aggregated and displayed.

## Results Tab

Every campaign has a Results tab showing aggregated data:

### For Choice Questions

- **Vote counts**: How many people selected each option
- **Percentages**: What proportion chose each answer
- **Visual bars**: Graphical representation of distribution

### For Text Questions

- **Response count**: Total number of text responses
- **Response list**: Individual text answers (click to expand)

## Response Details

Campaign creators can access the Responses tab, which shows:

- **Individual responses**: Each participant's complete submission
- **Timestamps**: When each response was submitted
- **Respondent addresses**: Blockchain address of each participant
- **Transaction IDs**: Links to verify on block explorer

## Real-Time Updates

Results update in real-time as new responses come in:
- Vote counts increment immediately
- Charts update automatically
- No page refresh needed

## On-Chain Verification

Every response can be verified independently:

1. Note the transaction ID from the response
2. Visit a Sui block explorer (like Suiscan)
3. Search for the transaction ID
4. View the complete transaction details

This proves:
- The response was actually submitted
- The exact timestamp of submission
- The blockchain address that submitted it
- The transaction cannot be modified

## Campaign Lifecycle

### Active Campaigns
- Accept new responses
- Show live results
- End date in the future

### Ended Campaigns
- No longer accept responses
- Results are final
- Data remains permanently on-chain

## Exporting Data

Currently, you can:
- View all responses in the app
- Verify individual responses on-chain
- Copy addresses and transaction IDs

Future updates will add CSV/JSON export functionality.`,
  },

  architecture: {
    title: 'Architecture',
    content: `# Technical Architecture

How Logbook works under the hood.

## System Overview

Logbook consists of three main components:

1. **Frontend**: Next.js web application
2. **Smart Contract**: Move module on Sui blockchain
3. **Sponsor Service**: API for gas sponsorship

## Frontend

### Technology Stack
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **State Management**: Zustand for forms, React Query for data
- **Blockchain SDK**: @mysten/sui and @mysten/dapp-kit

### Key Features
- Server-side rendering for SEO
- Client-side blockchain interactions
- Real-time data updates
- Responsive design

## Smart Contract

### Location
Deployed on Sui Devnet (and coming to mainnet).

### Objects
- **Campaign**: Stores title, questions, responses, and metadata
- **CampaignRegistry**: Global index of all campaigns

### Functions
- create_campaign: Deploy a new campaign
- submit_response: Record a participant's answers
- finalize_campaign: Lock after end date

## Sponsor Service

### Purpose
Enables gasless transactions for new users.

### Flow
1. Frontend builds transaction
2. Sends to sponsor API
3. Treasury signs for gas payment
4. Combined signatures execute transaction

### Limits
- 1 campaign per address
- 5 responses per address
- Tracked per blockchain address

## Data Flow

### Creating a Campaign

1. User fills form in frontend
2. Frontend builds Move transaction
3. If sponsored: API adds treasury signature
4. User signs (wallet or zkLogin)
5. Transaction executes on Sui
6. Campaign object created on-chain

### Submitting a Response

1. User selects answers
2. Frontend builds submit_response transaction
3. Sponsorship applied if available
4. User signs transaction
5. Response recorded in Campaign object
6. Vote counts updated atomically

### Reading Results

1. Frontend queries Campaign object
2. Sui RPC returns current state
3. Results aggregated and displayed
4. Real-time updates via polling

## Security

### On-Chain
- Move language prevents common vulnerabilities
- One response per address enforced by contract
- Only creator can access whitelist functions

### Frontend
- No private keys stored in browser (wallet manages)
- zkLogin credentials in sessionStorage only
- Ephemeral keys expire after 2 epochs`,
  },

  'smart-contract': {
    title: 'Smart Contract',
    content: `# Smart Contract

The Logbook protocol is implemented as a Move module — a smart contract written in the Move programming language — on the Sui blockchain.

## What is a Smart Contract?

A smart contract is a program that runs on the blockchain. Unlike traditional software that runs on a company's servers, smart contracts:

- **Execute automatically**: Once deployed, the code runs exactly as written — no one can change the rules
- **Are transparent**: Anyone can read the code and verify what it does
- **Are trustless**: You don't need to trust the developer — you can verify the logic yourself
- **Are permanent**: Once deployed, the contract exists as long as the blockchain exists

Think of it as a vending machine: you put in money, select an item, and the machine gives you exactly what you selected. No human intervention, no exceptions, no "special cases". The rules are the rules.

## Why Sui is Different

Most blockchains (Ethereum, Solana, etc.) have significant limitations:

### Traditional Blockchains
- **Limited data storage**: Storing data is extremely expensive, so most apps store minimal on-chain data
- **Simple logic only**: Complex programs are costly and slow to execute
- **Account-based model**: Data is tied to accounts, making it hard to work with individual objects

### Sui's Advantages

Sui was designed from the ground up to solve these problems:

**1. Object-Centric Model**
Every piece of data is an "object" with its own ID. In Logbook:
- Each campaign is an object
- Each response is stored within the campaign object
- You can reference any specific piece of data by its ID

**2. Cheap Storage**
Sui's storage model makes it economically viable to store real data on-chain. That's why Logbook can store:
- Full question text
- All answer options
- Every individual response
- Complete vote counts

On Ethereum, this would cost hundreds or thousands of dollars. On Sui, it costs fractions of a cent.

**3. Move Language**
Sui uses Move, a language designed specifically for blockchain with:
- Built-in safety guarantees (no reentrancy attacks, no overflow bugs)
- Resource-oriented programming (assets can't be accidentally destroyed or duplicated)
- Clear ownership model (every object has exactly one owner)

**4. Programmable Transactions**
Sui allows complex multi-step transactions that execute atomically. This means:
- Campaign creation and question setup happen in one transaction
- Response submission and vote counting happen together
- Either everything succeeds, or nothing changes

**5. Sponsored Transactions**
Sui natively supports paying gas fees on behalf of users. This is how Logbook offers free transactions — it's built into the blockchain protocol.

## What This Means for Logbook

Because of Sui's unique features, Logbook can:
- Store every response permanently on-chain (not just a hash)
- Execute voting logic in the smart contract itself
- Let anyone verify results by reading the blockchain directly
- Offer a web2-like experience (Google login, free transactions) with web3 guarantees

## Contract Address

**Devnet Package ID**:
0x864dc36953c2fc645fb66a4d7827cc5562e9d982cc077ec3dc1073bbd9bc577d

## Core Objects

### Campaign

The main object representing a survey or poll:

- **id**: Unique identifier (UID)
- **creator**: Address of the campaign creator
- **title**: Campaign title string
- **description**: Optional description
- **questions**: Vector of Question objects
- **responses**: Vector of Response objects
- **participants**: Map of addresses that have responded
- **access_type**: 0 (public) or 1 (whitelist)
- **whitelist**: Vector of allowed addresses
- **created_at**: Timestamp of creation
- **end_time**: When the campaign ends
- **is_finalized**: Whether the campaign is locked

### Question

Stored within a Campaign:

- **question_type**: 0 (single), 1 (multiple), 2 (text)
- **text**: The question text
- **options**: Vector of answer options
- **vote_counts**: Votes per option
- **text_response_count**: Number of text answers

### Response

A participant's submission:

- **respondent**: Address of participant
- **submitted_at**: Timestamp
- **answers**: Map of question_id to answer

### CampaignRegistry

Global registry tracking all campaigns:

- **all_campaigns**: Vector of campaign IDs
- **campaigns_by_creator**: Map of creator to their campaigns

## Entry Functions

### create_campaign

Creates a new campaign on-chain.

Parameters:
- registry: &mut CampaignRegistry
- title: String
- description: String
- questions: Vector of question data
- end_time: u64

### submit_response

Records a participant's answers.

Parameters:
- campaign: &mut Campaign
- answers: Vector of answer data

Checks:
- Campaign not ended
- Participant hasn't already responded
- Access allowed (public or whitelisted)

### add_to_whitelist

Adds addresses to campaign whitelist (creator only).

### finalize_campaign

Locks the campaign after end time (anyone can call).

## View Functions

Read-only functions to query campaign data:

### Campaign Getters
- \`get_creator\`, \`get_title\`, \`get_description\`
- \`get_questions\`, \`get_total_responses\`
- \`get_access_type\`, \`get_created_at\`, \`get_end_time\`, \`get_is_finalized\`

### Participation Checks
- \`has_participated(campaign, address)\` - Check if address has responded
- \`is_whitelisted(campaign, address)\` - Check whitelist status

### Question Getters
- \`get_question_text\`, \`get_question_type\`, \`get_question_required\`
- \`get_question_options\`, \`get_question_votes\`, \`get_question_text_count\`

### Response Getters
- \`get_responses\` - Get all responses for a campaign
- \`get_response_respondent\`, \`get_response_timestamp\`, \`get_response_answers\`

### Registry Getters
- \`get_all_campaigns\` - Get all campaign IDs
- \`get_campaigns_by_creator(registry, address)\` - Get campaigns by creator

## Events

The contract emits events for:
- Campaign created
- Response submitted
- Campaign finalized

These can be monitored by off-chain services for notifications and indexing.`,
  },

  'data-storage': {
    title: 'Data Storage',
    content: `# Data Storage

How data is stored and persisted in Logbook.

## On-Chain Data

All campaign and response data is stored directly on the Sui blockchain.

### What's Stored

**Campaign Data**:
- Title and description
- All questions with options
- Every response submitted
- Vote counts and aggregations
- Creator address
- Timestamps

**Response Data**:
- Respondent's address
- All answers
- Submission timestamp
- Transaction ID

### Data Persistence

On-chain data is:
- **Permanent**: Exists as long as the blockchain exists
- **Immutable**: Cannot be changed after writing
- **Public**: Anyone can read (privacy via pseudonymity)
- **Verifiable**: Cryptographically provable

## Off-Chain Data

Some data is stored locally for functionality:

### Browser Storage

**localStorage**:
- zkLogin address
- User preferences (date format, theme)
- Last connected wallet

**sessionStorage**:
- zkLogin JWT token
- Ephemeral private key
- Session-specific data

This data is:
- Local to your browser
- Cleared on logout
- Not shared with servers

### Server-Side

**Sponsorship Tracking**:
- Which addresses used sponsored transactions
- Count of sponsored campaigns and responses
- Stored in JSON file on server

This is used only for the free tier limits and doesn't include response content.

## Data Lifecycle

### Campaign Creation

1. Form data stored in Zustand (memory)
2. On deploy, sent to blockchain
3. Campaign object created on-chain
4. Local form data cleared

### Response Submission

1. Answers selected in UI
2. Transaction built with answer data
3. Submitted to blockchain
4. Response recorded in Campaign object
5. Vote counts updated atomically

### Data Retrieval

1. Campaign ID requested
2. Sui RPC queried
3. Campaign object returned
4. Data parsed and displayed

## Privacy Considerations

### What's Public

- All responses linked to blockchain addresses
- Vote counts and aggregations
- Campaign content and questions

### What's Private

- Real identity (unless you share your address)
- Email (not stored on-chain with zkLogin)
- IP addresses (not logged)

### Pseudonymity

Your blockchain address is a pseudonym. It's linked to your responses but not directly to your real identity. However:
- If you share your address, responses are linked to you
- zkLogin addresses are deterministic from Google accounts
- Pattern analysis could potentially de-anonymize`,
  },
};
