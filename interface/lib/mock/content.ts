export type AttachmentFileType = 'video' | 'pdf' | 'image' | 'audio' | 'document' | 'other';

export type Attachment = {
  id: string;
  filename: string;
  file_type: AttachmentFileType;
  file_url?: string;
  file_size?: number;
};

export type Content = {
  id: string;
  owner: string;
  title: string;
  description?: string;
  attachments: Attachment[];
  children?: Content[];
  linked_campaigns?: string[];
  linked_spaces?: string[];
  created_at: string;
  updated_at: string;
};

// Content created by the current user
export const mockMyContent: Content[] = [
  {
    id: 'content-1',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    title: 'Dance Course',
    description: 'Complete dance training program with video lessons and practice guides',
    attachments: [
      {
        id: 'attach-1',
        filename: 'Course Overview.pdf',
        file_type: 'pdf',
        file_size: 1500000,
        file_url: 'https://example.com/course-overview.pdf',
      },
      {
        id: 'attach-2',
        filename: 'Welcome Video.mp4',
        file_type: 'video',
        file_size: 85000000,
        file_url: 'https://example.com/welcome.mp4',
      },
    ],
    children: [
      {
        id: 'content-1-1',
        owner: '0x1234567890abcdef1234567890abcdef12345678',
        title: 'Module 1: Basics',
        description: 'Foundation moves and techniques',
        attachments: [
          {
            id: 'attach-3',
            filename: 'Introduction.mp4',
            file_type: 'video',
            file_size: 150000000,
            file_url: 'https://example.com/intro.mp4',
          },
          {
            id: 'attach-4',
            filename: 'Basic Steps.mp4',
            file_type: 'video',
            file_size: 280000000,
            file_url: 'https://example.com/basic-steps.mp4',
          },
          {
            id: 'attach-5',
            filename: 'Practice Guide.pdf',
            file_type: 'pdf',
            file_size: 2500000,
            file_url: 'https://example.com/practice-guide.pdf',
          },
        ],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'content-1-2',
        owner: '0x1234567890abcdef1234567890abcdef12345678',
        title: 'Module 2: Advanced',
        description: 'Advanced choreography and techniques',
        attachments: [
          {
            id: 'attach-6',
            filename: 'Complex Moves.mp4',
            file_type: 'video',
            file_size: 320000000,
            file_url: 'https://example.com/complex-moves.mp4',
          },
          {
            id: 'attach-7',
            filename: 'Choreography Breakdown.mp4',
            file_type: 'video',
            file_size: 450000000,
            file_url: 'https://example.com/choreography.mp4',
          },
        ],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
    ],
    linked_campaigns: ['1'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 'content-2',
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    title: 'Marketing Templates',
    description: 'Collection of marketing materials and brand assets',
    attachments: [
      {
        id: 'attach-8',
        filename: 'Brand Guidelines.pdf',
        file_type: 'pdf',
        file_size: 5000000,
        file_url: 'https://example.com/brand-guidelines.pdf',
      },
      {
        id: 'attach-9',
        filename: 'Logo Dark.png',
        file_type: 'image',
        file_size: 250000,
        file_url: 'https://example.com/logo-dark.png',
      },
      {
        id: 'attach-10',
        filename: 'Logo Light.png',
        file_type: 'image',
        file_size: 245000,
        file_url: 'https://example.com/logo-light.png',
      },
      {
        id: 'attach-11',
        filename: 'Social Media Templates.zip',
        file_type: 'other',
        file_size: 25000000,
        file_url: 'https://example.com/social-templates.zip',
      },
    ],
    children: [],
    created_at: '2025-01-06T00:00:00Z',
    updated_at: '2025-01-06T00:00:00Z',
  },
];

// Content the user has access to (unlocked through campaigns or spaces)
export const mockAccessibleContent: Content[] = [
  {
    id: 'content-access-1',
    owner: '0x456789abcdef0123456789abcdef0123456789ab',
    title: 'Photography Masterclass',
    description: 'Professional photography techniques and post-processing tutorials',
    attachments: [
      {
        id: 'attach-a1',
        filename: 'Lesson 1 - Composition.mp4',
        file_type: 'video',
        file_size: 520000000,
        file_url: 'https://example.com/photo-lesson1.mp4',
      },
      {
        id: 'attach-a2',
        filename: 'Lesson 2 - Lighting.mp4',
        file_type: 'video',
        file_size: 480000000,
        file_url: 'https://example.com/photo-lesson2.mp4',
      },
      {
        id: 'attach-a3',
        filename: 'Lightroom Presets.zip',
        file_type: 'other',
        file_size: 15000000,
        file_url: 'https://example.com/presets.zip',
      },
    ],
    children: [
      {
        id: 'content-access-1-1',
        owner: '0x456789abcdef0123456789abcdef0123456789ab',
        title: 'Bonus: Street Photography',
        description: 'Advanced street photography techniques',
        attachments: [
          {
            id: 'attach-a4',
            filename: 'Street Photo Guide.pdf',
            file_type: 'pdf',
            file_size: 3500000,
            file_url: 'https://example.com/street-guide.pdf',
          },
          {
            id: 'attach-a5',
            filename: 'Street Photography Demo.mp4',
            file_type: 'video',
            file_size: 380000000,
            file_url: 'https://example.com/street-demo.mp4',
          },
        ],
        created_at: '2024-12-18T00:00:00Z',
        updated_at: '2024-12-18T00:00:00Z',
      },
    ],
    linked_campaigns: ['2'],
    created_at: '2024-12-15T00:00:00Z',
    updated_at: '2024-12-18T00:00:00Z',
  },
  {
    id: 'content-access-2',
    owner: '0x789abcdef0123456789abcdef0123456789abcd',
    title: 'Startup Pitch Deck',
    description: 'Investor pitch deck templates and examples',
    attachments: [
      {
        id: 'attach-a6',
        filename: 'Pitch Deck Template.pptx',
        file_type: 'document',
        file_size: 8500000,
        file_url: 'https://example.com/pitch-template.pptx',
      },
      {
        id: 'attach-a7',
        filename: 'Financial Model.xlsx',
        file_type: 'document',
        file_size: 2100000,
        file_url: 'https://example.com/financial-model.xlsx',
      },
      {
        id: 'attach-a8',
        filename: 'Pitch Tips.pdf',
        file_type: 'pdf',
        file_size: 1800000,
        file_url: 'https://example.com/pitch-tips.pdf',
      },
    ],
    children: [],
    created_at: '2024-11-20T00:00:00Z',
    updated_at: '2024-11-20T00:00:00Z',
  },
];

// Content for Stanford University Space (space-stanford)
export const mockStanfordContent: Content[] = [
  {
    id: 'content-stanford-1',
    owner: '0xstanford123456789abcdef1234567890abcdef',
    title: 'CS101: Introduction to Computer Science',
    description: 'Foundational computer science course materials',
    attachments: [
      {
        id: 'attach-s1',
        filename: 'Syllabus.pdf',
        file_type: 'pdf',
        file_size: 450000,
        file_url: 'https://example.com/cs101-syllabus.pdf',
      },
      {
        id: 'attach-s2',
        filename: 'Lecture 1 - Algorithms.mp4',
        file_type: 'video',
        file_size: 650000000,
        file_url: 'https://example.com/cs101-lecture1.mp4',
      },
      {
        id: 'attach-s3',
        filename: 'Lecture 2 - Data Structures.mp4',
        file_type: 'video',
        file_size: 720000000,
        file_url: 'https://example.com/cs101-lecture2.mp4',
      },
    ],
    children: [
      {
        id: 'content-stanford-1-1',
        owner: '0xstanford123456789abcdef1234567890abcdef',
        title: 'Week 1 Materials',
        description: 'Assignments and readings for week 1',
        attachments: [
          {
            id: 'attach-s4',
            filename: 'Assignment 1.pdf',
            file_type: 'pdf',
            file_size: 180000,
            file_url: 'https://example.com/cs101-hw1.pdf',
          },
          {
            id: 'attach-s5',
            filename: 'Reading List.pdf',
            file_type: 'pdf',
            file_size: 95000,
            file_url: 'https://example.com/cs101-reading1.pdf',
          },
        ],
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
    ],
    linked_spaces: ['stanford'],
    created_at: '2025-01-08T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'content-stanford-2',
    owner: '0xstanford123456789abcdef1234567890abcdef',
    title: 'Student Resources',
    description: 'General resources for Stanford students',
    attachments: [
      {
        id: 'attach-s6',
        filename: 'Campus Map.pdf',
        file_type: 'pdf',
        file_size: 3200000,
        file_url: 'https://example.com/campus-map.pdf',
      },
      {
        id: 'attach-s7',
        filename: 'Student Handbook.pdf',
        file_type: 'pdf',
        file_size: 5600000,
        file_url: 'https://example.com/handbook.pdf',
      },
      {
        id: 'attach-s8',
        filename: 'Welcome Video.mp4',
        file_type: 'video',
        file_size: 180000000,
        file_url: 'https://example.com/welcome-stanford.mp4',
      },
    ],
    children: [],
    linked_spaces: ['stanford'],
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
  {
    id: 'content-stanford-3',
    owner: '0xstanford123456789abcdef1234567890abcdef',
    title: 'Research Workshop Series',
    description: 'Workshop materials on research methodology',
    attachments: [
      {
        id: 'attach-s9',
        filename: 'Research Methods Overview.pdf',
        file_type: 'pdf',
        file_size: 2800000,
        file_url: 'https://example.com/research-methods.pdf',
      },
      {
        id: 'attach-s10',
        filename: 'Workshop 1 Recording.mp4',
        file_type: 'video',
        file_size: 890000000,
        file_url: 'https://example.com/workshop1.mp4',
      },
    ],
    children: [
      {
        id: 'content-stanford-3-1',
        owner: '0xstanford123456789abcdef1234567890abcdef',
        title: 'Workshop Templates',
        description: 'Templates for research projects',
        attachments: [
          {
            id: 'attach-s11',
            filename: 'Research Proposal Template.docx',
            file_type: 'document',
            file_size: 125000,
            file_url: 'https://example.com/proposal-template.docx',
          },
          {
            id: 'attach-s12',
            filename: 'Data Analysis Template.xlsx',
            file_type: 'document',
            file_size: 340000,
            file_url: 'https://example.com/analysis-template.xlsx',
          },
        ],
        created_at: '2025-01-12T00:00:00Z',
        updated_at: '2025-01-12T00:00:00Z',
      },
    ],
    linked_spaces: ['stanford'],
    created_at: '2025-01-11T00:00:00Z',
    updated_at: '2025-01-12T00:00:00Z',
  },
];

// Combined mockContent for backward compatibility (uses mockMyContent)
export const mockContent = mockMyContent;

// Helper function to find content by ID (including nested children)
export function findContentById(id: string, contentList: Content[] = mockMyContent): Content | null {
  for (const content of contentList) {
    if (content.id === id) {
      return content;
    }
    if (content.children) {
      const found = findContentById(id, content.children);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to find content by ID across all content sources
export function findContentByIdGlobal(id: string): Content | null {
  const allContent = [...mockMyContent, ...mockAccessibleContent, ...mockStanfordContent];
  return findContentById(id, allContent);
}

// Helper function to get content path (breadcrumbs)
export function getContentPath(id: string, contentList: Content[] = mockMyContent, path: Content[] = []): Content[] | null {
  for (const content of contentList) {
    if (content.id === id) {
      return [...path, content];
    }
    if (content.children) {
      const found = getContentPath(id, content.children, [...path, content]);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to get all top-level content for a user
export function getUserContent(owner: string): Content[] {
  return mockMyContent.filter(content => content.owner === owner);
}

// Helper function to get content linked to a campaign
export function getContentByCampaign(campaignId: string): Content[] {
  const result: Content[] = [];
  const allContent = [...mockMyContent, ...mockAccessibleContent, ...mockStanfordContent];

  function searchContent(contentList: Content[]) {
    for (const content of contentList) {
      if (content.linked_campaigns?.includes(campaignId)) {
        result.push(content);
      }
      if (content.children) {
        searchContent(content.children);
      }
    }
  }

  searchContent(allContent);
  return result;
}

// Helper function to get content linked to a space
export function getContentBySpace(spaceId: string): Content[] {
  const result: Content[] = [];
  const allContent = [...mockMyContent, ...mockAccessibleContent, ...mockStanfordContent];

  function searchContent(contentList: Content[]) {
    for (const content of contentList) {
      if (content.linked_spaces?.includes(spaceId)) {
        result.push(content);
      }
      if (content.children) {
        searchContent(content.children);
      }
    }
  }

  searchContent(allContent);
  return result;
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// Helper to count total attachments (including in children)
export function countTotalAttachments(content: Content): number {
  let count = content.attachments.length;
  if (content.children) {
    for (const child of content.children) {
      count += countTotalAttachments(child);
    }
  }
  return count;
}

// Helper to count children count
export function countChildren(content: Content): number {
  return content.children?.length || 0;
}

// Helper function to get content the user has access to (but didn't create)
export function getAccessibleContent(): Content[] {
  return mockAccessibleContent;
}

// Helper function to get Stanford content
export function getStanfordContent(): Content[] {
  return mockStanfordContent;
}
