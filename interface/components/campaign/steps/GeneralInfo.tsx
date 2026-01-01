'use client';

import { useState } from 'react';
import { useCampaignStore } from '@/store/campaignStore';
import { CampaignType, AccessControl } from '@/types/campaign';
import { FieldBadge } from '../FieldBadge';

interface GeneralInfoProps {
  onNext: () => void;
}

export function GeneralInfo({ onNext }: GeneralInfoProps) {
  const { formData, updateGeneralInfo, approvePendingChange, rejectPendingChange, clearFieldUpdate } = useCampaignStore();

  // Helper to check if field was updated
  const isFieldUpdated = (fieldPath: string) => {
    return formData.appliedChanges?.some(change => change.field === fieldPath);
  };

  // Helper to get pending change for field
  const getPendingChange = (fieldPath: string) => {
    return formData.pendingChanges?.find(change => change.field === fieldPath);
  };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showWhitelistInput, setShowWhitelistInput] = useState(false);
  const [whitelistText, setWhitelistText] = useState('');

  const campaignTypes: { value: CampaignType; label: string }[] = [
    { value: 'survey', label: 'Survey' },
    { value: 'voting', label: 'Voting' },
    { value: 'certification', label: 'Certification' },
    { value: 'registration', label: 'Registration' },
    { value: 'competition', label: 'Competition' },
  ];

  const accessControls: { value: AccessControl; label: string; description: string }[] = [
    { value: 'public', label: 'Public', description: 'Anyone can participate' },
    { value: 'link_only', label: 'Link-only', description: 'Only people with the link' },
    { value: 'whitelist', label: 'Whitelist', description: 'Only approved addresses' },
    { value: 'application_based', label: 'Application-based', description: 'Requires approval' },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.generalInfo.title.trim()) {
      newErrors.title = 'Campaign title is required';
    }

    if (!formData.generalInfo.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.generalInfo.campaignStartDate) {
      newErrors.campaignStartDate = 'Start date is required';
    }

    if (!formData.generalInfo.campaignEndDate) {
      newErrors.campaignEndDate = 'End date is required';
    }

    if (
      formData.generalInfo.campaignStartDate &&
      formData.generalInfo.campaignEndDate &&
      new Date(formData.generalInfo.campaignEndDate) <= new Date(formData.generalInfo.campaignStartDate)
    ) {
      newErrors.campaignEndDate = 'End date must be after start date';
    }

    if (
      formData.generalInfo.warmupStartDate &&
      formData.generalInfo.campaignStartDate &&
      new Date(formData.generalInfo.campaignStartDate) <= new Date(formData.generalInfo.warmupStartDate)
    ) {
      newErrors.campaignStartDate = 'Campaign start must be after warm-up start';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handleWhitelistUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setWhitelistText(text);
        const addresses = text
          .split(/[\n,]/)
          .map((addr) => addr.trim())
          .filter((addr) => addr.length > 0);
        updateGeneralInfo({ whitelistAddresses: addresses });
      };
      reader.readAsText(file);
    }
  };

  const handleWhitelistTextChange = (text: string) => {
    setWhitelistText(text);
    const addresses = text
      .split(/[\n,]/)
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
    updateGeneralInfo({ whitelistAddresses: addresses });
  };

  return (
    <div className="space-y-6">
      {/* Campaign Title */}
      <div>
        <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
          Campaign Title <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.generalInfo.title}
            onChange={(e) => {
              updateGeneralInfo({ title: e.target.value });
              clearFieldUpdate('generalInfo.title');
            }}
            className={`w-full px-4 py-3 pr-32 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter campaign title..."
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isFieldUpdated('generalInfo.title') && (
              <FieldBadge type="updated" />
            )}
            {getPendingChange('generalInfo.title') && (
              <FieldBadge
                type="pending"
                onApprove={() => {
                  const change = getPendingChange('generalInfo.title');
                  if (change) approvePendingChange(change.id);
                }}
                onReject={() => {
                  const change = getPendingChange('generalInfo.title');
                  if (change) rejectPendingChange(change.id);
                }}
              />
            )}
          </div>
        </div>
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={formData.generalInfo.description}
            onChange={(e) => {
              updateGeneralInfo({ description: e.target.value });
              clearFieldUpdate('generalInfo.description');
            }}
            rows={4}
            className={`w-full px-4 py-3 pr-32 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Describe your campaign..."
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {isFieldUpdated('generalInfo.description') && (
              <FieldBadge type="updated" />
            )}
            {getPendingChange('generalInfo.description') && (
              <FieldBadge
                type="pending"
                onApprove={() => {
                  const change = getPendingChange('generalInfo.description');
                  if (change) approvePendingChange(change.id);
                }}
                onReject={() => {
                  const change = getPendingChange('generalInfo.description');
                  if (change) rejectPendingChange(change.id);
                }}
              />
            )}
          </div>
        </div>
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
      </div>

      {/* Campaign Type */}
      <div>
        <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
          Campaign Type <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={formData.generalInfo.campaignType}
            onChange={(e) => {
              updateGeneralInfo({ campaignType: e.target.value as CampaignType });
              clearFieldUpdate('generalInfo.campaignType');
            }}
            className="w-full px-4 py-3 pr-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {campaignTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            {isFieldUpdated('generalInfo.campaignType') && (
              <FieldBadge type="updated" />
            )}
            {getPendingChange('generalInfo.campaignType') && (
              <div className="pointer-events-auto">
                <FieldBadge
                  type="pending"
                  onApprove={() => {
                    const change = getPendingChange('generalInfo.campaignType');
                    if (change) approvePendingChange(change.id);
                  }}
                  onReject={() => {
                    const change = getPendingChange('generalInfo.campaignType');
                    if (change) rejectPendingChange(change.id);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Access Control <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {accessControls.map((control) => (
            <label
              key={control.value}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition relative ${
                formData.generalInfo.accessControl === control.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="accessControl"
                value={control.value}
                checked={formData.generalInfo.accessControl === control.value}
                onChange={(e) => {
                  updateGeneralInfo({ accessControl: e.target.value as AccessControl });
                  clearFieldUpdate('generalInfo.accessControl');
                  setShowWhitelistInput(e.target.value === 'whitelist');
                }}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">{control.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{control.description}</div>
              </div>
              {formData.generalInfo.accessControl === control.value && (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  {isFieldUpdated('generalInfo.accessControl') && (
                    <FieldBadge type="updated" />
                  )}
                  {getPendingChange('generalInfo.accessControl') && (
                    <FieldBadge
                      type="pending"
                      onApprove={() => {
                        const change = getPendingChange('generalInfo.accessControl');
                        if (change) approvePendingChange(change.id);
                      }}
                      onReject={() => {
                        const change = getPendingChange('generalInfo.accessControl');
                        if (change) rejectPendingChange(change.id);
                      }}
                    />
                  )}
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Whitelist Addresses */}
      {(formData.generalInfo.accessControl === 'whitelist' || showWhitelistInput) && (
        <div>
          <label className="block text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
            Whitelist Addresses
          </label>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="whitelist-upload"
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
                Upload CSV
              </label>
              <input
                id="whitelist-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleWhitelistUpload}
                className="hidden"
              />
            </div>
            <textarea
              value={whitelistText}
              onChange={(e) => handleWhitelistTextChange(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm"
              placeholder="Enter addresses (one per line or comma-separated)&#10;0x123...&#10;0x456..."
            />
            {formData.generalInfo.whitelistAddresses && formData.generalInfo.whitelistAddresses.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formData.generalInfo.whitelistAddresses.length} addresses added
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">Timeline</h3>

        {/* Warm-up Period Start */}
        <div>
          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">Warm-up Period Start (Optional)</label>
          <div className="relative">
            <input
              type="datetime-local"
              value={formData.generalInfo.warmupStartDate || ''}
              onChange={(e) => {
                updateGeneralInfo({ warmupStartDate: e.target.value });
                clearFieldUpdate('generalInfo.warmupStartDate');
              }}
              className="w-full px-4 py-3 pr-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              {isFieldUpdated('generalInfo.warmupStartDate') && (
                <div className="pointer-events-auto">
                  <FieldBadge type="updated" />
                </div>
              )}
              {getPendingChange('generalInfo.warmupStartDate') && (
                <div className="pointer-events-auto">
                  <FieldBadge
                    type="pending"
                    onApprove={() => {
                      const change = getPendingChange('generalInfo.warmupStartDate');
                      if (change) approvePendingChange(change.id);
                    }}
                    onReject={() => {
                      const change = getPendingChange('generalInfo.warmupStartDate');
                      if (change) rejectPendingChange(change.id);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Start Date */}
        <div>
          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
            Campaign Start Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={formData.generalInfo.campaignStartDate}
              onChange={(e) => {
                updateGeneralInfo({ campaignStartDate: e.target.value });
                clearFieldUpdate('generalInfo.campaignStartDate');
              }}
              className={`w-full px-4 py-3 pr-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                errors.campaignStartDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              {isFieldUpdated('generalInfo.campaignStartDate') && (
                <div className="pointer-events-auto">
                  <FieldBadge type="updated" />
                </div>
              )}
              {getPendingChange('generalInfo.campaignStartDate') && (
                <div className="pointer-events-auto">
                  <FieldBadge
                    type="pending"
                    onApprove={() => {
                      const change = getPendingChange('generalInfo.campaignStartDate');
                      if (change) approvePendingChange(change.id);
                    }}
                    onReject={() => {
                      const change = getPendingChange('generalInfo.campaignStartDate');
                      if (change) rejectPendingChange(change.id);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          {errors.campaignStartDate && <p className="mt-1 text-sm text-red-500">{errors.campaignStartDate}</p>}
        </div>

        {/* Campaign End Date */}
        <div>
          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-2">
            Campaign End Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={formData.generalInfo.campaignEndDate}
              onChange={(e) => {
                updateGeneralInfo({ campaignEndDate: e.target.value });
                clearFieldUpdate('generalInfo.campaignEndDate');
              }}
              className={`w-full px-4 py-3 pr-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                errors.campaignEndDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              {isFieldUpdated('generalInfo.campaignEndDate') && (
                <div className="pointer-events-auto">
                  <FieldBadge type="updated" />
                </div>
              )}
              {getPendingChange('generalInfo.campaignEndDate') && (
                <div className="pointer-events-auto">
                  <FieldBadge
                    type="pending"
                    onApprove={() => {
                      const change = getPendingChange('generalInfo.campaignEndDate');
                      if (change) approvePendingChange(change.id);
                    }}
                    onReject={() => {
                      const change = getPendingChange('generalInfo.campaignEndDate');
                      if (change) rejectPendingChange(change.id);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          {errors.campaignEndDate && <p className="mt-1 text-sm text-red-500">{errors.campaignEndDate}</p>}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-6">
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
