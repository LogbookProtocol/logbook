'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SpaceTreeNode,
  SPACE_TYPES,
  SpaceType,
  mockUserMemberships,
  getEffectiveRole,
} from '@/lib/mock-spaces';

interface SpaceTreeViewProps {
  nodes: SpaceTreeNode[];
  depth?: number;
}

export function SpaceTreeView({ nodes, depth = 0 }: SpaceTreeViewProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <SpaceTreeNodeItem key={node.id} node={node} depth={depth} />
      ))}
    </div>
  );
}

function SpaceTreeNodeItem({ node, depth }: { node: SpaceTreeNode; depth: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = node.children.length > 0;
  const typeInfo = SPACE_TYPES[node.type as SpaceType];
  const role = getEffectiveRole(node.id, mockUserMemberships);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.02] transition"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <div className="w-5 h-5" /> // Spacer
        )}

        {/* Space info */}
        <Link href={`/spaces/${node.id}`} className="flex-1 flex items-center gap-3">
          <span className="text-lg">{typeInfo?.icon}</span>
          <span className="text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition">
            {node.name}
          </span>
        </Link>

        {/* Role badge */}
        {role && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              role === 'owner'
                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                : role === 'admin'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                : role === 'inherited'
                ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                : 'bg-green-500/20 text-green-600 dark:text-green-400'
            }`}
          >
            {role === 'inherited' ? '↑ member' : role}
          </span>
        )}

        {/* Member count */}
        <span className="text-sm text-gray-500">{node.memberCount.toLocaleString()}</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && <SpaceTreeView nodes={node.children} depth={depth + 1} />}
    </div>
  );
}
