'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SpaceParentSelector } from '@/components/spaces/SpaceParentSelector';
import { SPACE_TYPES, SPACE_VISIBILITY, getSpaceById, SpaceType, SpaceVisibility } from '@/lib/mock-spaces';

function CreateSpaceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultParentId = searchParams.get('parent');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SpaceType | null>(null);
  const [visibility, setVisibility] = useState<SpaceVisibility>('public');
  const [parentId, setParentId] = useState<string | null>(defaultParentId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentSpace = parentId ? getSpaceById(parentId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/spaces');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/spaces"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4 inline-block"
        >
          ← Back to Spaces
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Space</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {parentSpace
            ? `Create a subspace within ${parentSpace.name}`
            : 'Create a new space for your team, community, or organization'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Parent selector */}
        <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parent Space</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Optionally nest this space within an existing space. Members will inherit access to parent
            spaces.
          </p>
          <SpaceParentSelector value={parentId} onChange={setParentId} />
        </section>

        {/* Basic info */}
        <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Space Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter space name"
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your space"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition resize-none"
              />
            </div>
          </div>
        </section>

        {/* Type */}
        <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Space Type <span className="text-red-500">*</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(SPACE_TYPES) as [SpaceType, (typeof SPACE_TYPES)[SpaceType]][]).map(
              ([key, { label, icon }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`p-4 rounded-lg text-center transition ${
                    type === key
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : 'bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <div
                    className={`text-sm ${
                      type === key ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {label}
                  </div>
                </button>
              )
            )}
          </div>
        </section>

        {/* Visibility */}
        <section className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visibility</h2>

          <div className="space-y-3">
            {(
              Object.entries(SPACE_VISIBILITY) as [SpaceVisibility, (typeof SPACE_VISIBILITY)[SpaceVisibility]][]
            ).map(([key, { label, description }]) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
                  visibility === key
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={key}
                  checked={visibility === key}
                  onChange={() => setVisibility(key)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    visibility === key ? 'border-cyan-500 bg-cyan-500' : 'border-gray-400 dark:border-gray-500'
                  }`}
                >
                  {visibility === key && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div
                    className={visibility === key ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
                  >
                    {label}
                  </div>
                  <div className="text-sm text-gray-500">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={!name || !type || isSubmitting}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Space'}
        </button>
      </form>
    </div>
  );
}

export default function CreateSpacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
          </div>
        </div>
      }
    >
      <CreateSpaceForm />
    </Suspense>
  );
}
