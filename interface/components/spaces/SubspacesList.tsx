'use client';

import Link from 'next/link';
import { getChildSpaces, SPACE_TYPES, SpaceType } from '@/lib/mock-spaces';

interface SubspacesListProps {
  spaceId: string;
}

export function SubspacesList({ spaceId }: SubspacesListProps) {
  const children = getChildSpaces(spaceId);

  if (children.length === 0) return null;

  return (
    <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Subspaces ({children.length})
        </h2>
        <Link
          href={`/spaces/new?parent=${spaceId}`}
          className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
        >
          + Add subspace
        </Link>
      </div>

      <div className="space-y-2">
        {children.map((child) => {
          const typeInfo = SPACE_TYPES[child.type as SpaceType];

          return (
            <Link
              key={child.id}
              href={`/spaces/${child.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{typeInfo?.icon}</span>
                <div>
                  <div className="text-gray-900 dark:text-white font-medium">{child.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {child.memberCount.toLocaleString()} members
                  </div>
                </div>
              </div>
              <span className="text-gray-400 dark:text-gray-600">→</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
