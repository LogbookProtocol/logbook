'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockCampaignDetails } from '@/lib/mock-data';

export default function CampaignParticipatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const campaign = mockCampaignDetails;
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = campaign.questions[currentStep];
  const isLastQuestion = currentStep === campaign.questions.length - 1;
  const progress = ((currentStep + 1) / campaign.questions.length) * 100;

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Submit to blockchain
    console.log('Submitting answers:', answers);
    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Redirect to campaign page
    router.push(`/campaigns/${campaign.id}`);
  };

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4 inline-block"
        >
          ← Back to campaign
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.title}</h1>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>
            Question {currentStep + 1} of {campaign.questions.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="p-8 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {currentQuestion.question}
          </h2>
          {currentQuestion.description && (
            <p className="text-gray-600 dark:text-gray-400">{currentQuestion.description}</p>
          )}
          {currentQuestion.required && (
            <span className="text-xs text-orange-600 dark:text-orange-400 mt-2 inline-block">Required</span>
          )}
        </div>

        {/* Single choice */}
        {currentQuestion.type === 'single-choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
                  answers[currentQuestion.id] === option.id
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.id}
                  checked={answers[currentQuestion.id] === option.id}
                  onChange={() => setAnswer(currentQuestion.id, option.id)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion.id] === option.id
                      ? 'border-cyan-500 bg-cyan-500'
                      : 'border-gray-400 dark:border-gray-500'
                  }`}
                >
                  {answers[currentQuestion.id] === option.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={
                    answers[currentQuestion.id] === option.id
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Multiple choice */}
        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const currentAnswers = answers[currentQuestion.id];
              const selected = Array.isArray(currentAnswers) && currentAnswers.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
                    selected
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : 'bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={selected}
                    onChange={(e) => {
                      const current = Array.isArray(answers[currentQuestion.id])
                        ? (answers[currentQuestion.id] as string[])
                        : [];
                      if (e.target.checked) {
                        setAnswer(currentQuestion.id, [...current, option.id]);
                      } else {
                        setAnswer(
                          currentQuestion.id,
                          current.filter((id: string) => id !== option.id)
                        );
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-400 dark:border-gray-500'
                    }`}
                  >
                    {selected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}>
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* Text answer */}
        {currentQuestion.type === 'text' && (
          <textarea
            rows={4}
            placeholder={currentQuestion.placeholder || 'Enter your answer...'}
            maxLength={currentQuestion.maxLength}
            value={(answers[currentQuestion.id] as string) || ''}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition resize-none"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-3 rounded-lg border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : isLastQuestion ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
