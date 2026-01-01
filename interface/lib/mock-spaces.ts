// lib/mock-spaces.ts

export const SPACE_TYPES = {
  community: { label: 'Community', icon: '👥' },
  organization: { label: 'Organization', icon: '🏢' },
  nonprofit: { label: 'Nonprofit', icon: '💚' },
  education: { label: 'Education', icon: '🎓' },
  dao: { label: 'DAO', icon: '🏛️' },
  government: { label: 'Government', icon: '🏦' },
  team: { label: 'Team', icon: '👔' },
  personal: { label: 'Personal', icon: '👤' },
} as const;

export type SpaceType = keyof typeof SPACE_TYPES;

export const SPACE_VISIBILITY = {
  public: { label: 'Public', description: 'Anyone can see and join' },
  private: { label: 'Private', description: 'Visible but invite-only' },
  secret: { label: 'Secret', description: 'Only members can see' },
} as const;

export type SpaceVisibility = keyof typeof SPACE_VISIBILITY;

export type MemberRole = 'owner' | 'admin' | 'member';

export interface Space {
  id: string;
  name: string;
  description: string;
  type: SpaceType;
  visibility: SpaceVisibility;
  parentId: string | null;
  avatar: string | null;
  owner: string;
  memberCount: number;
  campaignCount: number;
  createdAt: string;
}

// Hierarchical mock data
export const mockSpaces: Space[] = [
  // === STANFORD UNIVERSITY (root) ===
  {
    id: 'stanford',
    name: 'Stanford University',
    description: 'Official Stanford University space for students, faculty, and staff',
    type: 'education',
    visibility: 'public',
    parentId: null,
    avatar: null,
    owner: '0x789...ghi',
    memberCount: 45000,
    campaignCount: 127,
    createdAt: '2024-01-15',
  },

  // Stanford > School of Engineering
  {
    id: 'stanford-engineering',
    name: 'School of Engineering',
    description: 'Stanford School of Engineering',
    type: 'education',
    visibility: 'public',
    parentId: 'stanford',
    avatar: null,
    owner: '0x789...ghi',
    memberCount: 12000,
    campaignCount: 45,
    createdAt: '2024-01-20',
  },

  // Stanford > Engineering > CS Department
  {
    id: 'stanford-cs',
    name: 'Computer Science Department',
    description: 'CS Department at Stanford',
    type: 'education',
    visibility: 'public',
    parentId: 'stanford-engineering',
    avatar: null,
    owner: '0x789...ghi',
    memberCount: 3500,
    campaignCount: 23,
    createdAt: '2024-02-01',
  },

  // Stanford > Engineering > CS > CS101
  {
    id: 'stanford-cs101',
    name: 'CS101: Introduction to Programming',
    description: 'Fall 2025 course space',
    type: 'education',
    visibility: 'private',
    parentId: 'stanford-cs',
    avatar: null,
    owner: '0x789...ghi',
    memberCount: 150,
    campaignCount: 8,
    createdAt: '2024-09-01',
  },

  // Stanford > Engineering > CS > CS202
  {
    id: 'stanford-cs202',
    name: 'CS202: Data Structures',
    description: 'Fall 2025 course space',
    type: 'education',
    visibility: 'private',
    parentId: 'stanford-cs',
    avatar: null,
    owner: '0x789...ghi',
    memberCount: 120,
    campaignCount: 5,
    createdAt: '2024-09-01',
  },

  // Stanford > Engineering > EE Department
  {
    id: 'stanford-ee',
    name: 'Electrical Engineering Department',
    description: 'EE Department at Stanford',
    type: 'education',
    visibility: 'public',
    parentId: 'stanford-engineering',
    avatar: null,
    owner: '0x789...ghi',
    memberCount: 2800,
    campaignCount: 18,
    createdAt: '2024-02-01',
  },

  // Stanford > School of Medicine
  {
    id: 'stanford-medicine',
    name: 'School of Medicine',
    description: 'Stanford School of Medicine',
    type: 'education',
    visibility: 'public',
    parentId: 'stanford',
    avatar: null,
    owner: '0x789...ghi',
    memberCount: 8000,
    campaignCount: 34,
    createdAt: '2024-01-20',
  },

  // === MAKERDAO (root) ===
  {
    id: 'makerdao',
    name: 'MakerDAO',
    description: 'Decentralized governance for the Maker Protocol',
    type: 'dao',
    visibility: 'public',
    parentId: null,
    avatar: null,
    owner: '0xabc...123',
    memberCount: 12500,
    campaignCount: 89,
    createdAt: '2024-03-01',
  },

  // MakerDAO > Governance
  {
    id: 'makerdao-governance',
    name: 'Governance',
    description: 'Proposals and voting for MakerDAO',
    type: 'dao',
    visibility: 'public',
    parentId: 'makerdao',
    avatar: null,
    owner: '0xabc...123',
    memberCount: 2500,
    campaignCount: 67,
    createdAt: '2024-03-05',
  },

  // MakerDAO > Core Contributors
  {
    id: 'makerdao-core',
    name: 'Core Contributors',
    description: 'Active contributors to the protocol',
    type: 'team',
    visibility: 'private',
    parentId: 'makerdao',
    avatar: null,
    owner: '0xabc...123',
    memberCount: 50,
    campaignCount: 12,
    createdAt: '2024-03-05',
  },

  // MakerDAO > Community
  {
    id: 'makerdao-community',
    name: 'Community Hub',
    description: 'Open community discussions',
    type: 'community',
    visibility: 'public',
    parentId: 'makerdao',
    avatar: null,
    owner: '0xabc...123',
    memberCount: 10000,
    campaignCount: 10,
    createdAt: '2024-03-10',
  },

  // === ACME CORP (root) ===
  {
    id: 'acme',
    name: 'Acme Corporation',
    description: 'Internal space for Acme Corp employees',
    type: 'organization',
    visibility: 'secret',
    parentId: null,
    avatar: null,
    owner: '0xdef...456',
    memberCount: 850,
    campaignCount: 34,
    createdAt: '2024-04-01',
  },

  // Acme > Engineering
  {
    id: 'acme-engineering',
    name: 'Engineering Team',
    description: 'Product and platform engineering',
    type: 'team',
    visibility: 'secret',
    parentId: 'acme',
    avatar: null,
    owner: '0xdef...456',
    memberCount: 120,
    campaignCount: 15,
    createdAt: '2024-04-05',
  },

  // Acme > Engineering > Frontend
  {
    id: 'acme-frontend',
    name: 'Frontend Team',
    description: 'Web and mobile frontend',
    type: 'team',
    visibility: 'secret',
    parentId: 'acme-engineering',
    avatar: null,
    owner: '0xdef...456',
    memberCount: 25,
    campaignCount: 6,
    createdAt: '2024-04-10',
  },

  // Acme > Engineering > Backend
  {
    id: 'acme-backend',
    name: 'Backend Team',
    description: 'APIs and infrastructure',
    type: 'team',
    visibility: 'secret',
    parentId: 'acme-engineering',
    avatar: null,
    owner: '0xdef...456',
    memberCount: 30,
    campaignCount: 8,
    createdAt: '2024-04-10',
  },

  // === STANDALONE SPACES (no parent) ===
  {
    id: 'eth-portugal',
    name: 'Ethereum Developers Portugal',
    description: 'Portuguese Ethereum developer community',
    type: 'community',
    visibility: 'public',
    parentId: null,
    avatar: null,
    owner: '0x456...def',
    memberCount: 342,
    campaignCount: 12,
    createdAt: '2024-05-01',
  },

  {
    id: 'redcross-local',
    name: 'Red Cross Local Chapter',
    description: 'Local volunteer coordination',
    type: 'nonprofit',
    visibility: 'public',
    parentId: null,
    avatar: null,
    owner: '0x111...222',
    memberCount: 156,
    campaignCount: 8,
    createdAt: '2024-06-01',
  },

  {
    id: 'city-council-5',
    name: 'City Council District 5',
    description: 'Public engagement and community input for District 5 initiatives',
    type: 'government',
    visibility: 'public',
    parentId: null,
    avatar: null,
    owner: '0x333...444',
    memberCount: 2340,
    campaignCount: 18,
    createdAt: '2024-02-28',
  },
];

// User membership (current user)
export interface SpaceMembership {
  spaceId: string;
  role: MemberRole;
  joinedAt: string;
}

export const mockUserMemberships: SpaceMembership[] = [
  { spaceId: 'stanford-cs101', role: 'member', joinedAt: '2024-09-05' },
  { spaceId: 'stanford-cs202', role: 'member', joinedAt: '2024-09-05' },
  { spaceId: 'makerdao-governance', role: 'member', joinedAt: '2024-06-15' },
  { spaceId: 'makerdao-community', role: 'member', joinedAt: '2024-06-10' },
  { spaceId: 'acme-frontend', role: 'admin', joinedAt: '2024-04-15' },
  { spaceId: 'eth-portugal', role: 'owner', joinedAt: '2024-05-01' },
];

// Space members (for space detail page)
export interface SpaceMember {
  address: string;
  role: MemberRole;
  joinedAt: string;
}

export const mockMembers: SpaceMember[] = [
  { address: '0x456...def', role: 'owner', joinedAt: '2024-06-15' },
  { address: '0x789...ghi', role: 'admin', joinedAt: '2024-06-20' },
  { address: '0xabc...123', role: 'member', joinedAt: '2024-07-01' },
  { address: '0xdef...456', role: 'member', joinedAt: '2024-07-15' },
  { address: '0x111...222', role: 'member', joinedAt: '2024-08-01' },
];

// === HELPER FUNCTIONS ===

// Get space by ID
export function getSpaceById(id: string): Space | null {
  return mockSpaces.find((s) => s.id === id) || null;
}

// Get children of a space
export function getChildSpaces(parentId: string): Space[] {
  return mockSpaces.filter((s) => s.parentId === parentId);
}

// Get all ancestors (for breadcrumb)
export function getAncestors(spaceId: string): Space[] {
  const ancestors: Space[] = [];
  let current = getSpaceById(spaceId);

  while (current?.parentId) {
    const parent = getSpaceById(current.parentId);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

// Get full path (ancestors + current)
export function getSpacePath(spaceId: string): Space[] {
  const space = getSpaceById(spaceId);
  if (!space) return [];
  return [...getAncestors(spaceId), space];
}

// Get root spaces (no parent)
export function getRootSpaces(): Space[] {
  return mockSpaces.filter((s) => s.parentId === null);
}

// Build tree structure
export interface SpaceTreeNode extends Space {
  children: SpaceTreeNode[];
}

export function buildSpaceTree(parentId: string | null = null): SpaceTreeNode[] {
  const children = parentId === null ? getRootSpaces() : getChildSpaces(parentId);

  return children.map((space) => ({
    ...space,
    children: buildSpaceTree(space.id),
  }));
}

// Check membership with inheritance
export function isMemberOf(spaceId: string, memberships: SpaceMembership[]): boolean {
  // Direct membership
  if (memberships.some((m) => m.spaceId === spaceId)) {
    return true;
  }

  // Check if member of any child (inheritance up)
  const children = getChildSpaces(spaceId);
  for (const child of children) {
    if (isMemberOf(child.id, memberships)) {
      return true;
    }
  }

  return false;
}

// Get all spaces where user is a member (including inherited)
export function getAllMemberSpaces(memberships: SpaceMembership[]): string[] {
  const memberSpaces = new Set<string>();

  for (const membership of memberships) {
    // Add direct membership
    memberSpaces.add(membership.spaceId);

    // Add all ancestors (inherited)
    const ancestors = getAncestors(membership.spaceId);
    for (const ancestor of ancestors) {
      memberSpaces.add(ancestor.id);
    }
  }

  return Array.from(memberSpaces);
}

// Get user's role in a space (direct only)
export function getUserRole(spaceId: string, memberships: SpaceMembership[]): MemberRole | null {
  const membership = memberships.find((m) => m.spaceId === spaceId);
  return membership?.role || null;
}

// Get effective role (highest in hierarchy)
export function getEffectiveRole(
  spaceId: string,
  memberships: SpaceMembership[]
): MemberRole | 'inherited' | null {
  // Direct role
  const directRole = getUserRole(spaceId, memberships);
  if (directRole) return directRole;

  // Inherited via children
  const children = getChildSpaces(spaceId);
  for (const child of children) {
    const childRole = getEffectiveRole(child.id, memberships);
    if (childRole) return 'inherited'; // Marker for inherited membership
  }

  return null;
}

// Filter tree to only show spaces with membership
export function filterTreeByMembership(
  nodes: SpaceTreeNode[],
  memberSpaceIds: string[]
): SpaceTreeNode[] {
  return nodes
    .filter((node) => {
      // Include if member or has children who are members
      const hasMemberChildren = node.children.some(
        (c) => memberSpaceIds.includes(c.id) || filterTreeByMembership([c], memberSpaceIds).length > 0
      );
      return memberSpaceIds.includes(node.id) || hasMemberChildren;
    })
    .map((node) => ({
      ...node,
      children: filterTreeByMembership(node.children, memberSpaceIds),
    }));
}
