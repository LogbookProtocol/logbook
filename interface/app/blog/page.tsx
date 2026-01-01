'use client';

import Link from 'next/link';

const blogPosts = [
  {
    slug: 'introducing-logbook',
    title: 'Introducing Logbook: Permanent Records for Collective Action',
    excerpt: 'We are building the infrastructure for transparent, verifiable collective decision-making on the Sui blockchain.',
    date: 'Dec 28, 2024',
    category: 'Announcements',
    readTime: '5 min read',
  },
  {
    slug: 'why-on-chain-voting-matters',
    title: 'Why On-Chain Voting Matters',
    excerpt: 'Traditional voting systems suffer from opacity and trust issues. Here is how blockchain-based voting changes the game.',
    date: 'Dec 20, 2024',
    category: 'Education',
    readTime: '8 min read',
  },
  {
    slug: 'building-dao-governance',
    title: 'Building Effective DAO Governance with Logbook',
    excerpt: 'A practical guide to setting up transparent governance for your decentralized organization.',
    date: 'Dec 15, 2024',
    category: 'Guides',
    readTime: '12 min read',
  },
  {
    slug: 'sui-ecosystem-update',
    title: 'Logbook and the Sui Ecosystem',
    excerpt: 'How Logbook leverages Sui unique capabilities for scalable, low-cost collective action.',
    date: 'Dec 10, 2024',
    category: 'Technology',
    readTime: '6 min read',
  },
];

const categories = ['All', 'Announcements', 'Education', 'Guides', 'Technology'];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Blog</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Updates, guides, and insights from the Logbook team
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              category === 'All'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Blog posts */}
      <div className="space-y-6">
        {blogPosts.map((post) => (
          <article
            key={post.slug}
            className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/30 transition"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-1 rounded text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                {post.category}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {post.date}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                • {post.readTime}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer">
              {post.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {post.excerpt}
            </p>
            <span className="text-cyan-600 dark:text-cyan-400 text-sm font-medium hover:underline cursor-pointer">
              Read more →
            </span>
          </article>
        ))}
      </div>

      {/* Load more */}
      <div className="text-center mt-8">
        <button className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition">
          Load more posts
        </button>
      </div>
    </div>
  );
}
