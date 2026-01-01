'use client';

import { useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  getSpaceById,
  getChildSpaces,
  mockMembers,
  mockUserMemberships,
  isMemberOf,
  getEffectiveRole,
  SPACE_TYPES,
  SPACE_VISIBILITY,
  SpaceType,
  SpaceVisibility,
} from '@/lib/mock-spaces';
import { SpaceBreadcrumb } from '@/components/spaces/SpaceBreadcrumb';
import { SubspacesList } from '@/components/spaces/SubspacesList';
import { getContentBySpace } from '@/lib/mock/content';
import { ContentCard } from '@/components/content/ContentCard';

export default function SpaceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<'campaigns' | 'content' | 'members' | 'about'>('campaigns');

  const space = getSpaceById(id);

  if (!space) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Space not found</h1>
          <Link href="/spaces" className="text-cyan-600 dark:text-cyan-400 hover:underline">
            ← Back to Spaces
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = SPACE_TYPES[space.type as SpaceType];
  const visibilityInfo = SPACE_VISIBILITY[space.visibility as SpaceVisibility];
  const isMember = isMemberOf(space.id, mockUserMemberships);
  const role = getEffectiveRole(space.id, mockUserMemberships);
  const children = getChildSpaces(space.id);
  const spaceContent = getContentBySpace(space.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <SpaceBreadcrumb spaceId={space.id} className="mb-6" />

      {/* Space header */}
      <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-gray-200 dark:border-white/10 flex items-center justify-center text-4xl shrink-0">
            {typeInfo?.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{space.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                {typeInfo?.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                {visibilityInfo?.label}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-3">{space.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <span>{space.memberCount.toLocaleString()} members</span>
              <span>{space.campaignCount} campaigns</span>
              {spaceContent.length > 0 && <span>{spaceContent.length} content</span>}
              {children.length > 0 && <span>{children.length} subspaces</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {isMember ? (
              <>
                {role && role !== 'inherited' && (
                  <span
                    className={`px-3 py-1.5 rounded-lg text-sm text-center ${
                      role === 'owner'
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                        : role === 'admin'
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                        : 'bg-green-500/20 text-green-600 dark:text-green-400'
                    }`}
                  >
                    {role}
                  </span>
                )}
                {role === 'inherited' && (
                  <span className="px-3 py-1.5 rounded-lg text-sm text-center bg-gray-500/20 text-gray-600 dark:text-gray-400">
                    ↑ Member via subspace
                  </span>
                )}
                {(role === 'owner' || role === 'admin') && (
                  <Link
                    href={`/spaces/${space.id}/settings`}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition text-center text-sm"
                  >
                    Settings
                  </Link>
                )}
              </>
            ) : (
              <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition">
                {space.visibility === 'private' ? 'Request to Join' : 'Join Space'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subspaces */}
      {children.length > 0 && (
        <div className="mb-8">
          <SubspacesList spaceId={space.id} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-white/[0.06]">
        {(['campaigns', 'content', 'members', 'about'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${
              tab === t
                ? 'text-gray-900 dark:text-white border-cyan-500'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'campaigns' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500 dark:text-gray-400">{space.campaignCount} campaigns</span>
            {isMember && (role === 'owner' || role === 'admin') && (
              <Link
                href={`/campaigns/new?space=${space.id}`}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
              >
                New Campaign
              </Link>
            )}
          </div>

          {/* Campaigns placeholder */}
          <div className="text-gray-500 dark:text-gray-500 text-center py-12 border border-dashed border-gray-300 dark:border-white/10 rounded-xl">
            Campaign list will be displayed here
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500 dark:text-gray-400">
              {spaceContent.length} content item{spaceContent.length !== 1 ? 's' : ''}
            </span>
            {isMember && (role === 'owner' || role === 'admin') && (
              <Link
                href={`/content/new?space=${space.id}`}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
              >
                Add Content
              </Link>
            )}
          </div>

          {spaceContent.length > 0 ? (
            <div className="space-y-4">
              {spaceContent.map((content) => (
                <ContentCard key={content.id} content={content} href={`/content/${content.id}`} />
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-500 text-center py-12 border border-dashed border-gray-300 dark:border-white/10 rounded-xl">
              No content in this space yet
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div>
          <div className="text-gray-500 dark:text-gray-400 mb-6">
            {space.memberCount.toLocaleString()} members
          </div>
          <div className="space-y-2">
            {mockMembers.map((member) => (
              <div
                key={member.address}
                className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10" />
                  <span className="text-gray-900 dark:text-white font-mono">{member.address}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    member.role === 'owner'
                      ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                      : member.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <span className="text-gray-500 dark:text-gray-500 text-sm">Type</span>
              <p className="text-gray-900 dark:text-white">
                {typeInfo?.icon} {typeInfo?.label}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500 text-sm">Visibility</span>
              <p className="text-gray-900 dark:text-white">{visibilityInfo?.label}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{visibilityInfo?.description}</p>
            </div>
            {space.parentId && (
              <div>
                <span className="text-gray-500 dark:text-gray-500 text-sm">Parent Space</span>
                <p>
                  <Link
                    href={`/spaces/${space.parentId}`}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    {getSpaceById(space.parentId)?.name}
                  </Link>
                </p>
              </div>
            )}
            <div>
              <span className="text-gray-500 dark:text-gray-500 text-sm">Created</span>
              <p className="text-gray-900 dark:text-white">{space.createdAt}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-500 text-sm">Owner</span>
              <p className="text-gray-900 dark:text-white font-mono">{space.owner}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
