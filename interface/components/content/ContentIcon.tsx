'use client';

import {
  Folder,
  FileVideo,
  FileText,
  Image,
  Music,
  FileSpreadsheet,
  File,
  FolderOpen,
  Package,
} from 'lucide-react';
import { AttachmentFileType } from '@/lib/mock/content';

interface ContentIconProps {
  fileType?: AttachmentFileType;
  isFolder?: boolean;
  isOpen?: boolean;
  size?: number;
  className?: string;
}

export function ContentIcon({
  fileType,
  isFolder = false,
  isOpen = false,
  size = 20,
  className = '',
}: ContentIconProps) {
  const iconProps = { size, className };

  // Content container icon (like a folder/package)
  if (isFolder) {
    return isOpen ? (
      <FolderOpen {...iconProps} className={`text-cyan-500 ${className}`} />
    ) : (
      <Package {...iconProps} className={`text-cyan-500 ${className}`} />
    );
  }

  // Attachment file type icons
  switch (fileType) {
    case 'video':
      return <FileVideo {...iconProps} className={`text-purple-500 ${className}`} />;
    case 'pdf':
      return <FileText {...iconProps} className={`text-red-500 ${className}`} />;
    case 'image':
      return <Image {...iconProps} className={`text-green-500 ${className}`} />;
    case 'audio':
      return <Music {...iconProps} className={`text-orange-500 ${className}`} />;
    case 'document':
      return <FileSpreadsheet {...iconProps} className={`text-blue-500 ${className}`} />;
    default:
      return <File {...iconProps} className={`text-gray-500 ${className}`} />;
  }
}

export function getFileTypeLabel(fileType?: AttachmentFileType): string {
  switch (fileType) {
    case 'video':
      return 'Video';
    case 'pdf':
      return 'PDF';
    case 'image':
      return 'Image';
    case 'audio':
      return 'Audio';
    case 'document':
      return 'Document';
    default:
      return 'File';
  }
}
