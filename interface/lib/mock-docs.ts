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
    title: 'Getting Started',
    items: [
      { title: 'Introduction', slug: 'introduction', description: 'What is Logbook and why it exists' },
      { title: 'Quick Start', slug: 'quick-start', description: 'Create your first campaign in 5 minutes' },
      { title: 'Core Concepts', slug: 'concepts', description: 'Campaigns, responses, spaces, and more' },
    ],
  },
  {
    title: 'Creating Campaigns',
    items: [
      { title: 'Campaign Types', slug: 'campaign-types', description: 'Voting, surveys, registration, and more' },
      { title: 'Access Control', slug: 'access-control', description: 'Public, private, and whitelist modes' },
      { title: 'Questions & Options', slug: 'questions', description: 'Building your campaign form' },
      { title: 'Economics', slug: 'economics', description: 'Fees, rewards, and payments' },
    ],
  },
  {
    title: 'Spaces',
    items: [
      { title: 'Creating a Space', slug: 'creating-space', description: 'Set up your organization or community' },
      { title: 'Managing Members', slug: 'managing-members', description: 'Roles, invites, and permissions' },
      { title: 'Space Settings', slug: 'space-settings', description: 'Visibility and configuration' },
    ],
  },
  {
    title: 'Participating',
    items: [
      { title: 'Finding Campaigns', slug: 'finding-campaigns', description: 'Explore the registry' },
      { title: 'Submitting Responses', slug: 'submitting', description: 'How to participate' },
      { title: 'Verifying Results', slug: 'verifying', description: 'Check on-chain records' },
    ],
  },
  {
    title: 'Technical',
    items: [
      { title: 'Architecture', slug: 'architecture', description: 'How Logbook works under the hood' },
      { title: 'Smart Contracts', slug: 'contracts', description: 'Move modules and functions' },
      { title: 'API Reference', slug: 'api', description: 'Coming soon' },
      { title: 'SDK', slug: 'sdk', description: 'Coming soon' },
    ],
  },
];

export const docsContent: Record<string, DocContent> = {
  introduction: {
    title: 'Introduction',
    content: `# Introduction to Logbook

Logbook is a protocol for recording human coordination on-chain. Every vote cast, form submitted, registration completed, or test passed becomes an immutable, verifiable record on the Sui blockchain.

## Why Logbook?

Traditional coordination tools store data in private databases that can be edited, deleted, or lost. There's no shared, verifiable record of what actually happened.

Logbook changes that by treating every response as a factual event. Once recorded on-chain, it becomes permanent and verifiable by anyone.

## Core Principles

- **Immutable**: Records cannot be changed after submission
- **Verifiable**: Anyone can verify the results on-chain
- **Decentralized**: No single point of control or failure
- **Gasless**: Participants don't need wallets or tokens (via zkLogin)

## Use Cases

- **Voting & Governance**: Transparent decisions with verifiable outcomes
- **Surveys & Feedback**: Collect opinions with proof of authenticity
- **Registration**: Permanent attendance and membership records
- **Certification**: Verifiable credentials and test results
- **Fundraising**: Transparent contribution tracking`,
  },
  'quick-start': {
    title: 'Quick Start',
    content: `# Quick Start Guide

Create your first campaign in 5 minutes.

## Step 1: Connect Your Wallet

Click the "Connect" button in the top right corner. You can use:
- Sui Wallet
- Google account (via zkLogin)

## Step 2: Create a Campaign

1. Click "New Campaign" in the navigation
2. Fill in the basic information:
   - Title
   - Description
   - Campaign type (voting, survey, etc.)
3. Configure access control
4. Add your questions
5. Review and deploy

## Step 3: Share Your Campaign

Once deployed, you'll get a shareable link. Send it to your participants via:
- Direct link
- QR code
- Embed on your website

## Step 4: Monitor Results

Track responses in real-time from your Portfolio. When the campaign ends, results are finalized on-chain.`,
  },
  concepts: {
    title: 'Core Concepts',
    content: `# Core Concepts

Understanding the building blocks of Logbook.

## Campaigns

A campaign is a container for collecting responses. Each campaign has:
- A unique on-chain ID
- Questions or options for participants
- Access rules (who can respond)
- Time bounds (start/end dates)

## Responses

A response is a participant's submission to a campaign. Once submitted:
- It's recorded on-chain immediately
- It cannot be modified or deleted
- It's linked to the participant's address

## Spaces

Spaces are organizations or communities that own campaigns. They provide:
- Branding and identity
- Member management
- Campaign organization
- Shared settings

## Participants

Anyone can participate in public campaigns. Participants can use:
- Standard Sui wallets
- zkLogin (Google, Facebook, etc.)
- Email verification (coming soon)`,
  },
};
