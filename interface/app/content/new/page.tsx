'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Plus, Paperclip } from 'lucide-react';
import { ContentIcon, getFileTypeLabel } from '@/components/content/ContentIcon';
import { AttachmentFileType, formatFileSize } from '@/lib/mock/content';

interface AttachmentData {
  id: string;
  filename: string;
  file_type: AttachmentFileType;
  file_size: number;
}

export default function NewContentPage() {
  const router = useRouter();

  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
    // Reset input
    e.target.value = '';
  };

  const processFile = (file: File) => {
    const fileType = getFileType(file.name, file.type);
    const newAttachment: AttachmentData = {
      id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      file_type: fileType,
      file_size: file.size,
    };
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const getFileType = (name: string, mimeType: string): AttachmentFileType => {
    const ext = name.split('.').pop()?.toLowerCase();

    if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')) {
      return 'audio';
    }
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return 'image';
    }
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      return 'pdf';
    }
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext || '')) {
      return 'document';
    }
    return 'other';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreate = () => {
    // Mock creation - just redirect to content list
    // In real app, this would create the content via API
    console.log('Creating content:', { title, description, attachments });
    router.push('/content');
  };

  const canCreate = title.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/content"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Content</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Content</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Create a new content container to organize and share your files.
        </p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Content"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Attachments
            <span className="text-gray-400 font-normal ml-1">
              ({attachments.length})
            </span>
          </label>

          {/* Attachment list */}
          {attachments.length > 0 && (
            <div className="space-y-2 mb-4">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center">
                    <ContentIcon fileType={attachment.file_type} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                      {attachment.filename}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getFileTypeLabel(attachment.file_type)}</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>{formatFileSize(attachment.file_size)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            className={`relative p-6 rounded-xl border-2 border-dashed transition text-center ${
              isDragOver
                ? 'border-cyan-500 bg-cyan-500/5'
                : 'border-gray-300 dark:border-gray-600 hover:border-cyan-500/50'
            }`}
          >
            <Upload size={28} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
              Drag and drop files here, or{' '}
              <label className="text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline">
                browse
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-gray-400">
              Supports video, PDF, images, audio, and documents
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
          <div className="flex items-start gap-3">
            <Paperclip size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-900 dark:text-blue-300 font-medium mb-1">
                Content works like a container
              </p>
              <p className="text-blue-700 dark:text-blue-400">
                You can add attachments now or later. Content can also have nested sections
                which you can add after creation.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => router.push('/content')}
            className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Create Content
          </button>
        </div>
      </div>
    </div>
  );
}
