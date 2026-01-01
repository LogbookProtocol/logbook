'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  mockSpaces,
  mockUserMemberships,
  buildSpaceTree,
  getAllMemberSpaces,
  filterTreeByMembership,
  SPACE_TYPES,
  SpaceType,
  Space,
} from '@/lib/mock-spaces';
import { SpaceTreeView } from '@/components/spaces/SpaceTreeView';

type TabType = 'my' | 'explore';

function SpaceCard({ space, isMember }: { space: Space; isMember: boolean }) {
  const typeInfo = SPACE_TYPES[space.type];

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="block p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/30 transition"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-2xl">
          {typeInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-gray-900 dark:text-white font-semibold truncate">{space.name}</h3>
            {isMember && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-600 dark:text-green-400">
                Joined
              </span>
            )}
          </div>
          <span className="text-gray-500 dark:text-gray-500 text-sm">{typeInfo.label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{space.description}</p>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-500">
        <span>{space.memberCount.toLocaleString()} members</span>
        <span>{space.campaignCount} campaigns</span>
      </div>
    </Link>
  );
}

export default function SpacesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [typeFilter, setTypeFilter] = useState<SpaceType | null>(null);

  const memberSpaceIds = getAllMemberSpaces(mockUserMemberships);
  const tree = buildSpaceTree();
  const filteredTree = filterTreeByMembership(tree, memberSpaceIds);

  // Filter root spaces for explore tab
  const exploreSpaces = mockSpaces
    .filter((s) => s.parentId === null && s.visibility === 'public')
    .filter((s) => !typeFilter || s.type === typeFilter);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Spaces</h1>
          <p className="text-gray-500 dark:text-gray-400">Communities, organizations, and teams</p>
        </div>
        <Link
          href="/spaces/new"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
        >
          Create Space
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
            activeTab === 'my'
              ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          My Spaces
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'my' ? 'bg-gray-300 dark:bg-white/20' : 'bg-gray-200 dark:bg-white/10'
            }`}
          >
            {memberSpaceIds.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-4 py-2.5 rounded-lg font-medium transition ${
            activeTab === 'explore'
              ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          Explore
        </button>
      </div>

      {/* My Spaces - Tree View */}
      {activeTab === 'my' && (
        <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          {memberSpaceIds.length > 0 ? (
            <SpaceTreeView nodes={filteredTree} />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">You haven&apos;t joined any spaces yet</div>
              <button
                onClick={() => setActiveTab('explore')}
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Explore spaces →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Explore - Grid View */}
      {activeTab === 'explore' && (
        <>
          {/* Type filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setTypeFilter(null)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                !typeFilter
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              All
            </button>
            {(Object.entries(SPACE_TYPES) as [SpaceType, (typeof SPACE_TYPES)[SpaceType]][]).map(
              ([key, { label, icon }]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    typeFilter === key
                      ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  {icon} {label}
                </button>
              )
            )}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exploreSpaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                isMember={memberSpaceIds.includes(space.id)}
              />
            ))}
          </div>

          {exploreSpaces.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No spaces found</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
