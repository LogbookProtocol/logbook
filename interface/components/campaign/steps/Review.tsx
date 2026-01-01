'use client';

import { useState } from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { mockContent } from '@/lib/mock/content';
import { ContentIcon } from '@/components/content/ContentIcon';

interface ReviewProps {
  onPrevious: () => void;
  onEditStep: (step: number) => void;
}

export function Review({ onPrevious, onEditStep }: ReviewProps) {
  const { formData, resetForm } = useCampaignStore();
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);

    try {
      // TODO: Implement actual Sui blockchain deployment
      // This is a placeholder for the deployment logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // On success, clear the form including appliedChanges
      resetForm();

      // Redirect to campaign page
      // window.location.href = '/campaign/success';
      console.log('Campaign deployed successfully!', formData);
    } catch (err: any) {
      setError(err.message || 'Failed to deploy campaign');
    } finally {
      setIsDeploying(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const campaignTypeLabels: Record<string, string> = {
    survey: 'Survey',
    voting: 'Voting',
    certification: 'Certification',
    registration: 'Registration',
    competition: 'Competition',
  };

  const accessControlLabels: Record<string, string> = {
    public: 'Public',
    link_only: 'Link-only',
    whitelist: 'Whitelist',
    application_based: 'Application-based',
  };

  const distributionMethodLabels: Record<string, string> = {
    equal: 'Equal',
    based_on_answers: 'Based on answers',
    random_lottery: 'Random lottery',
  };

  const estimatedGasCost = 0.05; // Placeholder for gas estimation

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* General Information Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">General Information</h3>
          <button
            onClick={() => onEditStep(1)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Campaign Title:</span>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{formData.generalInfo.title}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Description:</span>
            <p className="text-gray-900 dark:text-gray-100">{formData.generalInfo.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Campaign Type:</span>
              <p className="text-gray-900 dark:text-gray-100">{campaignTypeLabels[formData.generalInfo.campaignType]}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Access Control:</span>
              <p className="text-gray-900 dark:text-gray-100">{accessControlLabels[formData.generalInfo.accessControl]}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {formData.generalInfo.warmupStartDate && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Warm-up Start:</span>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(formData.generalInfo.warmupStartDate)}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Campaign Start:</span>
              <p className="text-gray-900 dark:text-gray-100">{formatDate(formData.generalInfo.campaignStartDate)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Campaign End:</span>
              <p className="text-gray-900 dark:text-gray-100">{formatDate(formData.generalInfo.campaignEndDate)}</p>
            </div>
          </div>
          {formData.generalInfo.accessControl === 'whitelist' && formData.generalInfo.whitelistAddresses && (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Whitelisted Addresses:</span>
              <p className="text-gray-900 dark:text-gray-100">{formData.generalInfo.whitelistAddresses.length} addresses</p>
            </div>
          )}
        </div>
      </div>

      {/* Economics Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Economics</h3>
          <button
            onClick={() => onEditStep(2)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3">
          {formData.economics.creatorPaysRespondents ? (
            <>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Reward per Respondent:</span>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{formData.economics.rewardAmountPerRespondent} SUI</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Distribution Method:</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {distributionMethodLabels[formData.economics.distributionMethod || 'equal']}
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No rewards for respondents</p>
          )}

          {formData.economics.respondentsPayCreator ? (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Participation Fee:</span>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{formData.economics.participationFee} SUI</p>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Free participation</p>
          )}

          {formData.economics.expectedParticipants && (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Expected Participants:</span>
              <p className="text-gray-900 dark:text-gray-100">{formData.economics.expectedParticipants}</p>
            </div>
          )}
        </div>
      </div>

      {/* Questions Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Questions ({formData.questions.length})
          </h3>
          <button
            onClick={() => onEditStep(3)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="space-y-4">
          {formData.questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-2">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                      {question.type}
                    </span>
                    {question.required && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{question.text}</p>

                  {question.mediaUrl && (
                    <div className="mt-2">
                      {question.mediaType === 'image' && (
                        <img src={question.mediaUrl} alt="Question media" className="max-h-32 rounded" />
                      )}
                      {question.mediaType === 'video' && (
                        <video src={question.mediaUrl} className="max-h-32 rounded" />
                      )}
                      {question.mediaType === 'document' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">📎 {question.mediaName}</p>
                      )}
                    </div>
                  )}

                  {question.type !== 'text_input' && question.type !== 'file_upload' && (
                    <div className="mt-3 space-y-1">
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="flex items-center gap-2 text-xs">
                          {question.type === 'certification' && (
                            <span className={answer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                              {answer.isCorrect ? '✓' : '○'}
                            </span>
                          )}
                          <span className="text-gray-700 dark:text-gray-300">{answer.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'voting' && question.votingRule && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Decision Rule:{' '}
                      {question.votingRule === 'simple_majority' && 'Simple Majority'}
                      {question.votingRule === 'supermajority' && `Supermajority (${question.supermajorityPercentage}%)`}
                      {question.votingRule === 'custom' && 'Custom Rule'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attached Content Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Attached Content ({formData.attachedContentIds?.length || 0})
          </h3>
          <button
            onClick={() => onEditStep(4)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit
          </button>
        </div>
        {formData.attachedContentIds && formData.attachedContentIds.length > 0 ? (
          <div className="space-y-2">
            {formData.attachedContentIds.map((contentId) => {
              const content = mockContent.find((c) => c.id === contentId);
              if (!content) return null;
              return (
                <div
                  key={contentId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <ContentIcon isFolder size={20} />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{content.title}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No content attached</p>
        )}
      </div>

      {/* Gas Estimate */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Deployment Cost</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Estimated gas cost:</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{estimatedGasCost} SUI</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          This is an estimated cost. Actual cost may vary based on network conditions.
        </p>
      </div>

      {/* Deploy Button */}
      <div className="flex flex-col items-center gap-4 pt-6">
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isDeploying ? (
            <>
              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Deploying...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Deploy Campaign
            </>
          )}
        </button>

        <button
          onClick={onPrevious}
          disabled={isDeploying}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
      </div>
    </div>
  );
}
