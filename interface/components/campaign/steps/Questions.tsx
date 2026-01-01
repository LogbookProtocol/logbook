'use client';

import { useState } from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { Question, QuestionType, VotingRule, AnswerOption } from '@/types/campaign';

interface QuestionsProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function Questions({ onNext, onPrevious }: QuestionsProps) {
  const { formData, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = useCampaignStore();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'survey', label: 'Survey' },
    { value: 'voting', label: 'Voting' },
    { value: 'certification', label: 'Certification' },
    { value: 'text_input', label: 'Text Input' },
    { value: 'file_upload', label: 'File Upload' },
  ];

  const votingRules: { value: VotingRule; label: string }[] = [
    { value: 'simple_majority', label: 'Simple Majority (>50%)' },
    { value: 'supermajority', label: 'Supermajority' },
    { value: 'custom', label: 'Custom Rule' },
  ];

  const createNewQuestion = (): Question => ({
    id: `q_${Date.now()}`,
    text: '',
    type: 'survey',
    answers: [
      { id: `a_${Date.now()}_1`, text: '' },
      { id: `a_${Date.now()}_2`, text: '' },
    ],
    required: true,
  });

  const handleAddQuestion = () => {
    const newQuestion = createNewQuestion();
    addQuestion(newQuestion);
    setSelectedQuestionId(newQuestion.id);
    setEditingQuestion(newQuestion);
  };

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestionId(question.id);
    setEditingQuestion({ ...question });
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    const newErrors: Record<string, string> = {};

    if (!editingQuestion.text.trim()) {
      newErrors.text = 'Question text is required';
    }

    if (editingQuestion.type !== 'text_input' && editingQuestion.type !== 'file_upload') {
      const validAnswers = editingQuestion.answers.filter((a) => a.text.trim());
      if (validAnswers.length < 2) {
        newErrors.answers = 'At least 2 answer options are required';
      }

      if (editingQuestion.type === 'certification' && !validAnswers.some((a) => a.isCorrect)) {
        newErrors.certification = 'At least one correct answer must be marked';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      updateQuestion(editingQuestion.id, editingQuestion);
      setErrors({});
    }
  };

  const handleDeleteQuestion = (id: string) => {
    deleteQuestion(id);
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null);
      setEditingQuestion(null);
    }
  };

  const handleAddAnswer = () => {
    if (!editingQuestion) return;
    const newAnswer: AnswerOption = {
      id: `a_${Date.now()}`,
      text: '',
    };
    setEditingQuestion({
      ...editingQuestion,
      answers: [...editingQuestion.answers, newAnswer],
    });
  };

  const handleRemoveAnswer = (answerId: string) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      answers: editingQuestion.answers.filter((a) => a.id !== answerId),
    });
  };

  const handleUpdateAnswer = (answerId: string, text: string) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      answers: editingQuestion.answers.map((a) => (a.id === answerId ? { ...a, text } : a)),
    });
  };

  const handleToggleCorrectAnswer = (answerId: string) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      answers: editingQuestion.answers.map((a) => (a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a)),
    });
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingQuestion) {
      // In production, upload to storage and get URL
      // For now, create a local object URL
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
      setEditingQuestion({
        ...editingQuestion,
        mediaUrl: url,
        mediaType: type,
        mediaName: file.name,
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...formData.questions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);

    reorderQuestions(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.questions.length === 0) {
      newErrors.global = 'At least one question is required';
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {errors.global && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {errors.global}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px]">
        {/* Left Side: Question List (40%) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Questions ({formData.questions.length})</h3>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto">
            {formData.questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No questions yet. Click "Add Question" to get started.</p>
              </div>
            ) : (
              formData.questions.map((question, index) => (
                <div
                  key={question.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSelectQuestion(question)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedQuestionId === question.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 cursor-grab">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Q{index + 1}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {question.type}
                        </span>
                        {question.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                        {question.text || 'Untitled question'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(question.id);
                      }}
                      className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Question Editor (60%) */}
        <div className="lg:col-span-3">
          {!editingQuestion ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>Select a question to edit or add a new one</p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Question Editor</h3>
                <button
                  onClick={handleSaveQuestion}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                >
                  Save Question
                </button>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.text ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your question..."
                />
                {errors.text && <p className="mt-1 text-sm text-red-500">{errors.text}</p>}
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Question Type</label>
                <select
                  value={editingQuestion.type}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {questionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media Attachment */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Media Attachment (Optional)</label>
                <div className="space-y-3">
                  <label
                    htmlFor={`media-upload-${editingQuestion.id}`}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload Image/Video/Document
                  </label>
                  <input
                    id={`media-upload-${editingQuestion.id}`}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Max size: 10MB for images, 50MB for videos</p>

                  {editingQuestion.mediaUrl && (
                    <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <button
                        onClick={() => setEditingQuestion({ ...editingQuestion, mediaUrl: undefined, mediaType: undefined, mediaName: undefined })}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {editingQuestion.mediaType === 'image' && (
                        <img src={editingQuestion.mediaUrl} alt="Preview" className="max-h-48 rounded" />
                      )}
                      {editingQuestion.mediaType === 'video' && (
                        <video src={editingQuestion.mediaUrl} controls className="max-h-48 rounded" />
                      )}
                      {editingQuestion.mediaType === 'document' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{editingQuestion.mediaName}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Answer Options */}
              {editingQuestion.type !== 'text_input' && editingQuestion.type !== 'file_upload' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Answer Options <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {editingQuestion.answers.map((answer, index) => (
                      <div key={answer.id} className="flex items-center gap-2">
                        {editingQuestion.type === 'certification' && (
                          <input
                            type="checkbox"
                            checked={answer.isCorrect || false}
                            onChange={() => handleToggleCorrectAnswer(answer.id)}
                            className="w-5 h-5 text-blue-600 rounded"
                            title="Mark as correct answer"
                          />
                        )}
                        <input
                          type="text"
                          value={answer.text}
                          onChange={(e) => handleUpdateAnswer(answer.id, e.target.value)}
                          className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder={`Answer ${index + 1}`}
                        />
                        {editingQuestion.answers.length > 2 && (
                          <button
                            onClick={() => handleRemoveAnswer(answer.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.answers && <p className="mt-1 text-sm text-red-500">{errors.answers}</p>}
                  {errors.certification && <p className="mt-1 text-sm text-red-500">{errors.certification}</p>}
                  <button
                    onClick={handleAddAnswer}
                    className="mt-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                  >
                    + Add Answer
                  </button>
                </div>
              )}

              {/* Voting Rules */}
              {editingQuestion.type === 'voting' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Decision Rule</label>
                  <select
                    value={editingQuestion.votingRule || 'simple_majority'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, votingRule: e.target.value as VotingRule })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    {votingRules.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.label}
                      </option>
                    ))}
                  </select>

                  {editingQuestion.votingRule === 'supermajority' && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Required Percentage</label>
                      <input
                        type="number"
                        min="51"
                        max="100"
                        value={editingQuestion.supermajorityPercentage || 66}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, supermajorityPercentage: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  )}

                  {editingQuestion.votingRule === 'custom' && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Custom Rule Description</label>
                      <textarea
                        value={editingQuestion.customRuleDescription || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, customRuleDescription: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Describe your custom voting rule..."
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Required Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Required Question</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Participants must answer this question</div>
                </div>
                <button
                  onClick={() => setEditingQuestion({ ...editingQuestion, required: !editingQuestion.required })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    editingQuestion.required ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      editingQuestion.required ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          Next
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
