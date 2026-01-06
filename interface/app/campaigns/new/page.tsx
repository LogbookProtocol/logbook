'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { useCampaignStore } from '@/store/campaignStore';
import { Question, QuestionType, AnswerOption } from '@/types/campaign';
import { formatDate, getEndTimeDisplay, localDateToEndOfDayUTC } from '@/lib/format-date';
import { DatePicker } from '@/components/ui/DatePicker';
import { getDataSource } from '@/lib/sui-config';
import { buildCreateCampaignTx, executeZkLoginSponsoredTransaction, executeZkLoginTransaction, getSponsorshipStatus } from '@/lib/sui-service';
import { getReferrer } from '@/lib/navigation';

export default function NewCampaignPage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const {
    formData,
    isReviewMode,
    updateFormData,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    setReviewMode,
    resetForm,
  } = useCampaignStore();

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const [backLink, setBackLink] = useState('/campaigns');

  // Get referrer on client side
  useEffect(() => {
    setBackLink(getReferrer('/campaigns'));
  }, []);

  // Re-render when date format changes
  useEffect(() => {
    const handleDateFormatChange = () => forceUpdate(n => n + 1);
    window.addEventListener('date-format-changed', handleDateFormatChange);
    return () => window.removeEventListener('date-format-changed', handleDateFormatChange);
  }, []);

  // Validation
  const isValid = formData.title.trim() && formData.questions.length > 0;

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);

    const dataSource = getDataSource();

    // If using mock data, just simulate deployment
    if (dataSource === 'mock') {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log('Campaign deployed (mock):', formData);
        resetForm();
        router.push('/campaigns');
      } catch (error) {
        console.error('Deploy failed:', error);
        setDeployError('Failed to deploy campaign');
      } finally {
        setIsDeploying(false);
      }
      return;
    }

    if (!formData.endDate) {
      setDeployError('Please select an end date');
      setIsDeploying(false);
      return;
    }

    // Check if user has zkLogin address
    const zkLoginAddress = typeof window !== 'undefined'
      ? localStorage.getItem('zklogin_address')
      : null;

    // Check sponsorship status for zkLogin user
    let canUseSponsorship = false;
    if (zkLoginAddress) {
      const sponsorshipStatus = await getSponsorshipStatus(zkLoginAddress);
      canUseSponsorship = sponsorshipStatus?.canSponsorCampaign ?? false;
    }

    // If no zkLogin and no wallet, require connection
    if (!zkLoginAddress && !account) {
      setDeployError('Please connect your wallet to create a campaign');
      setIsDeploying(false);
      return;
    }

    try {
      // Convert end date to timestamp in milliseconds
      const endTimeUtc = localDateToEndOfDayUTC(formData.endDate);
      const endTime = new Date(endTimeUtc).getTime();

      // Build the transaction
      const tx = buildCreateCampaignTx(
        formData.title,
        formData.description,
        formData.questions.map(q => ({
          text: q.text,
          type: q.type,
          required: q.required,
          answers: q.answers,
        })),
        endTime
      );

      if (!tx) {
        setDeployError('Failed to build transaction. Check your network settings.');
        setIsDeploying(false);
        return;
      }

      // Use zkLogin transaction for Google users
      if (zkLoginAddress) {
        try {
          // Try sponsored first if available
          if (canUseSponsorship) {
            const result = await executeZkLoginSponsoredTransaction(tx, zkLoginAddress);
            console.log('Campaign deployed with sponsorship:', result.digest);
            resetForm();
            router.push('/campaigns');
            return;
          }

          // Fall back to non-sponsored zkLogin (user pays gas)
          const result = await executeZkLoginTransaction(tx, zkLoginAddress);
          console.log('Campaign deployed with zkLogin (user paid gas):', result.digest);
          resetForm();
          router.push('/campaigns');
        } catch (error) {
          const err = error as Error & { code?: string };
          console.error('zkLogin deploy failed:', error);
          if (err.code === 'CAMPAIGN_LIMIT_REACHED') {
            setDeployError('Sponsored campaign limit reached. You need SUI balance to create more campaigns.');
          } else if (err.message?.includes('Insufficient gas')) {
            setDeployError('Insufficient SUI balance. Get test SUI from the faucet in Account page.');
          } else {
            setDeployError(err.message || 'Failed to deploy campaign');
          }
          setIsDeploying(false);
        }
        return;
      }

      // Fall back to wallet-based signing
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Campaign deployed:', result);
            resetForm();

            // Try to extract the created campaign object ID from the result
            // The result contains objectChanges with created objects
            const createdObjects = (result as { objectChanges?: Array<{ type: string; objectId?: string; objectType?: string }> })
              .objectChanges?.filter(
                (change) => change.type === 'created' && change.objectType?.includes('::logbook::Campaign')
              );

            if (createdObjects && createdObjects.length > 0 && createdObjects[0].objectId) {
              // Redirect to the created campaign page
              router.push(`/campaigns/${createdObjects[0].objectId}`);
            } else {
              // Fallback to campaigns list
              router.push('/campaigns');
            }
          },
          onError: (error) => {
            console.error('Deploy failed:', error);
            setDeployError(error.message || 'Failed to deploy campaign');
            setIsDeploying(false);
          },
        }
      );
    } catch (error) {
      console.error('Deploy failed:', error);
      setDeployError(error instanceof Error ? error.message : 'Failed to deploy campaign');
      setIsDeploying(false);
    }
  };

  const createNewQuestion = (): Question => ({
    id: `q-${Date.now()}`,
    text: '',
    type: 'single_choice',
    answers: [
      { id: `a-${Date.now()}-1`, text: '' },
      { id: `a-${Date.now()}-2`, text: '' },
    ],
    required: true,
  });

  const handleAddQuestion = () => {
    const newQuestion = createNewQuestion();
    addQuestion(newQuestion);
    setEditingQuestionId(newQuestion.id);
  };

  // Review Mode
  if (isReviewMode) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <button
            onClick={() => setReviewMode(false)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4 inline-flex items-center gap-1"
          >
            ← Back to editing
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1">Review Campaign</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Check everything before deploying</p>
        </div>

        {/* Campaign Info */}
        <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{formData.title}</h2>
          {formData.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{formData.description}</p>
          )}
          {formData.endDate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ends: {formatDate(formData.endDate)}, {getEndTimeDisplay(formData.endDate)}
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Questions ({formData.questions.length})
          </h3>
          <div className="space-y-4">
            {formData.questions.map((q, index) => (
              <div key={q.id} className="p-4 rounded-lg bg-gray-50 dark:bg-white/[0.02]">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{q.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {q.type === 'single_choice' && 'Single choice'}
                      {q.type === 'multiple_choice' && 'Multiple choice'}
                      {q.type === 'text_input' && 'Text answer'}
                      {q.required && ' • Required'}
                    </p>
                    {q.type !== 'text_input' && (
                      <div className="mt-2 space-y-1">
                        {q.answers.map((a) => (
                          <div key={a.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="text-gray-400">○</span>
                            {a.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {deployError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm">{deployError}</p>
          </div>
        )}

        {/* Deploy */}
        <div className="flex gap-4">
          <button
            onClick={() => setReviewMode(false)}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition font-medium"
          >
            Edit
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deploying...
              </>
            ) : (
              'Deploy Campaign'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={backLink}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4 inline-flex items-center gap-1"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:bg-gradient-to-b dark:from-white dark:to-gray-400 dark:bg-clip-text dark:text-transparent pb-1">New Campaign</h1>
      </div>

      {/* Campaign Info */}
      <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-6">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="Campaign title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none"
              placeholder="Describe your campaign..."
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={formData.endDate || ''}
              onChange={(value) => updateFormData({ endDate: value })}
              placeholder="Select end date"
              showEndTime
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Questions {formData.questions.length > 0 && `(${formData.questions.length})`}
          </h2>
        </div>

        <div className="space-y-4">
          {formData.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isEditing={editingQuestionId === question.id}
              onEdit={() => setEditingQuestionId(question.id)}
              onSave={() => setEditingQuestionId(null)}
              onUpdate={(data) => updateQuestion(question.id, data)}
              onDelete={() => deleteQuestion(question.id)}
            />
          ))}
        </div>

        <button
          onClick={handleAddQuestion}
          className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200 hover:border-cyan-500 hover:text-cyan-500 transition font-medium"
        >
          + Add Question
        </button>
      </div>

      {/* Review Button */}
      <button
        onClick={() => setReviewMode(true)}
        disabled={!isValid}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Review Campaign
      </button>
    </div>
  );
}

// Question Card Component
function QuestionCard({
  question,
  index,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onDelete,
}: {
  question: Question;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (data: Partial<Question>) => void;
  onDelete: () => void;
}) {
  const addAnswer = () => {
    const newAnswer: AnswerOption = {
      id: `a-${Date.now()}`,
      text: '',
    };
    onUpdate({ answers: [...question.answers, newAnswer] });
  };

  const updateAnswer = (answerId: string, text: string) => {
    onUpdate({
      answers: question.answers.map((a) => (a.id === answerId ? { ...a, text } : a)),
    });
  };

  const removeAnswer = (answerId: string) => {
    if (question.answers.length > 2) {
      onUpdate({
        answers: question.answers.filter((a) => a.id !== answerId),
      });
    }
  };

  if (isEditing) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-white/[0.02] border-2 border-cyan-500">
        <div className="space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question {index + 1}
            </label>
            <input
              type="text"
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="Enter your question"
              autoFocus
            />
          </div>

          {/* Question Type */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              >
                <option value="single_choice">Single choice</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="text_input">Text answer</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 py-3">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
              </label>
            </div>
          </div>

          {/* Answers */}
          {question.type !== 'text_input' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {question.answers.map((answer, answerIndex) => (
                  <div key={answer.id} className="flex gap-2">
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) => updateAnswer(answer.id, e.target.value)}
                      className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                      placeholder={`Option ${answerIndex + 1}`}
                    />
                    {question.answers.length > 2 && (
                      <button
                        onClick={() => removeAnswer(answer.id)}
                        className="px-3 text-gray-400 hover:text-red-500 transition"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addAnswer}
                  className="w-full py-2 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition"
                >
                  + Add option
                </button>
              </div>

            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              Delete
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed view
  return (
    <div
      onClick={onEdit}
      className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-cyan-500/50 transition cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-full text-xs font-medium">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-white font-medium truncate">
            {question.text || 'Untitled question'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {question.type === 'single_choice' && `Single choice • ${question.answers.length} options`}
            {question.type === 'multiple_choice' && `Multiple choice • ${question.answers.length} options`}
            {question.type === 'text_input' && 'Text answer'}
            {question.required && ' • Required'}
          </p>
        </div>
      </div>
    </div>
  );
}
