'use client';

import { useState } from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { DistributionMethod } from '@/types/campaign';
import { FieldBadge } from '../FieldBadge';

interface EconomicsProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function Economics({ onNext, onPrevious }: EconomicsProps) {
  const { formData, updateEconomics, approvePendingChange, rejectPendingChange, clearFieldUpdate } = useCampaignStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to check if field was updated
  const isFieldUpdated = (fieldPath: string) => {
    return formData.appliedChanges?.some(change => change.field === fieldPath);
  };

  // Helper to get pending change for field
  const getPendingChange = (fieldPath: string) => {
    return formData.pendingChanges?.find(change => change.field === fieldPath);
  };

  const distributionMethods: { value: DistributionMethod; label: string; description: string }[] = [
    { value: 'equal', label: 'Equal', description: 'Same amount for all respondents' },
    { value: 'based_on_answers', label: 'Based on answers', description: 'Varies by response quality' },
    { value: 'random_lottery', label: 'Random lottery', description: 'Random selection of winners' },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.economics.creatorPaysRespondents) {
      if (!formData.economics.rewardAmountPerRespondent || formData.economics.rewardAmountPerRespondent <= 0) {
        newErrors.rewardAmount = 'Reward amount must be greater than 0';
      }
    }

    if (formData.economics.respondentsPayCreator) {
      if (!formData.economics.participationFee || formData.economics.participationFee <= 0) {
        newErrors.participationFee = 'Participation fee must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const calculateEstimates = () => {
    const participants = formData.economics.expectedParticipants || 0;
    const reward = formData.economics.rewardAmountPerRespondent || 0;
    const fee = formData.economics.participationFee || 0;

    const totalCost = formData.economics.creatorPaysRespondents ? participants * reward : 0;
    const totalRevenue = formData.economics.respondentsPayCreator ? participants * fee : 0;
    const netAmount = totalRevenue - totalCost;

    return { totalCost, totalRevenue, netAmount, participants };
  };

  const { totalCost, totalRevenue, netAmount, participants } = calculateEstimates();

  return (
    <div className="space-y-6">
      {/* Creator Pays Respondents */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Creator Pays Respondents (Rewards)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Incentivize participation with rewards</p>
          </div>
          <button
            onClick={() => {
              const newValue = !formData.economics.creatorPaysRespondents;
              updateEconomics({
                creatorPaysRespondents: newValue,
                rewardAmountPerRespondent: newValue ? formData.economics.rewardAmountPerRespondent : undefined,
                distributionMethod: newValue ? formData.economics.distributionMethod || 'equal' : undefined,
              });
            }}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
              formData.economics.creatorPaysRespondents ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                formData.economics.creatorPaysRespondents ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {formData.economics.creatorPaysRespondents && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reward Amount per Respondent (SUI) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.economics.rewardAmountPerRespondent || ''}
                  onChange={(e) => {
                    updateEconomics({ rewardAmountPerRespondent: parseFloat(e.target.value) });
                    clearFieldUpdate('economics.rewardAmountPerRespondent');
                  }}
                  className={`w-full px-4 py-3 pr-32 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.rewardAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isFieldUpdated('economics.rewardAmountPerRespondent') && (
                    <FieldBadge type="updated" />
                  )}
                  {getPendingChange('economics.rewardAmountPerRespondent') && (
                    <FieldBadge
                      type="pending"
                      onApprove={() => {
                        const change = getPendingChange('economics.rewardAmountPerRespondent');
                        if (change) approvePendingChange(change.id);
                      }}
                      onReject={() => {
                        const change = getPendingChange('economics.rewardAmountPerRespondent');
                        if (change) rejectPendingChange(change.id);
                      }}
                    />
                  )}
                </div>
              </div>
              {errors.rewardAmount && <p className="mt-1 text-sm text-red-500">{errors.rewardAmount}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Distribution Method</label>
              <div className="space-y-2">
                {distributionMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                      formData.economics.distributionMethod === method.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="distributionMethod"
                      value={method.value}
                      checked={formData.economics.distributionMethod === method.value}
                      onChange={(e) => updateEconomics({ distributionMethod: e.target.value as DistributionMethod })}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{method.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Respondents Pay Creator */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Respondents Pay Creator (Participation Fee)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Charge a fee to participate</p>
          </div>
          <button
            onClick={() => {
              const newValue = !formData.economics.respondentsPayCreator;
              updateEconomics({
                respondentsPayCreator: newValue,
                participationFee: newValue ? formData.economics.participationFee : undefined,
              });
            }}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
              formData.economics.respondentsPayCreator ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                formData.economics.respondentsPayCreator ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {formData.economics.respondentsPayCreator && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Participation Fee (SUI) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.economics.participationFee || ''}
                onChange={(e) => {
                  updateEconomics({ participationFee: parseFloat(e.target.value) });
                  clearFieldUpdate('economics.participationFee');
                }}
                className={`w-full px-4 py-3 pr-32 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.participationFee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isFieldUpdated('economics.participationFee') && (
                  <FieldBadge type="updated" />
                )}
                {getPendingChange('economics.participationFee') && (
                  <FieldBadge
                    type="pending"
                    onApprove={() => {
                      const change = getPendingChange('economics.participationFee');
                      if (change) approvePendingChange(change.id);
                    }}
                    onReject={() => {
                      const change = getPendingChange('economics.participationFee');
                      if (change) rejectPendingChange(change.id);
                    }}
                  />
                )}
              </div>
            </div>
            {errors.participationFee && <p className="mt-1 text-sm text-red-500">{errors.participationFee}</p>}
          </div>
        )}
      </div>

      {/* Expected Participants */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Expected Participants (for estimates)</label>
        <div className="relative">
          <input
            type="number"
            min="0"
            value={formData.economics.expectedParticipants || ''}
            onChange={(e) => {
              updateEconomics({ expectedParticipants: parseInt(e.target.value) });
              clearFieldUpdate('economics.expectedParticipants');
            }}
            className="w-full px-4 py-3 pr-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="0"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isFieldUpdated('economics.expectedParticipants') && (
              <FieldBadge type="updated" />
            )}
            {getPendingChange('economics.expectedParticipants') && (
              <FieldBadge
                type="pending"
                onApprove={() => {
                  const change = getPendingChange('economics.expectedParticipants');
                  if (change) approvePendingChange(change.id);
                }}
                onReject={() => {
                  const change = getPendingChange('economics.expectedParticipants');
                  if (change) rejectPendingChange(change.id);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {participants > 0 && (formData.economics.creatorPaysRespondents || formData.economics.respondentsPayCreator) && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Expected Participants</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{participants}</span>
            </div>
            {formData.economics.creatorPaysRespondents && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Total Rewards Cost</span>
                <span className="font-medium text-red-600 dark:text-red-400">-{totalCost.toFixed(2)} SUI</span>
              </div>
            )}
            {formData.economics.respondentsPayCreator && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                <span className="font-medium text-green-600 dark:text-green-400">+{totalRevenue.toFixed(2)} SUI</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <span className="font-medium text-gray-900 dark:text-gray-100">Net Amount</span>
              <span
                className={`font-bold ${
                  netAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {netAmount >= 0 ? '+' : ''}
                {netAmount.toFixed(2)} SUI
              </span>
            </div>
          </div>
        </div>
      )}

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
          Next Step
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
