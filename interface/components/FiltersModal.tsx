'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type CampaignType = 'voting' | 'test' | 'fundraising' | 'registration' | 'feedback' | 'lottery' | 'other';
export type CampaignStatus = 'upcoming' | 'active' | 'ended';

export interface Filters {
  // Campaign lifecycle
  startDateFrom: string;
  startDateTo: string;
  endDateFrom: string;
  endDateTo: string;
  statuses: CampaignStatus[];

  // Campaign type
  types: CampaignType[];

  // Economic logic
  requiresPayment: boolean | null; // null = all, true = requires payment, false = free
  rewardsParticipants: boolean | null; // null = all, true = rewards, false = no rewards

  // Authorship & search
  creatorAddress: string;
  searchQuery: string;
}

interface FiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function FiltersModal({ open, onOpenChange, filters, onFiltersChange }: FiltersModalProps) {
  const [mounted, setMounted] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onOpenChange]);

  const toggleType = (type: CampaignType) => {
    setLocalFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const toggleStatus = (status: CampaignStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      startDateFrom: '',
      startDateTo: '',
      endDateFrom: '',
      endDateTo: '',
      statuses: [],
      types: [],
      requiresPayment: null,
      rewardsParticipants: null,
      creatorAddress: '',
      searchQuery: ''
    };
    setLocalFilters(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    count += localFilters.types.length;
    count += localFilters.statuses.length;
    if (localFilters.startDateFrom) count++;
    if (localFilters.startDateTo) count++;
    if (localFilters.endDateFrom) count++;
    if (localFilters.endDateTo) count++;
    if (localFilters.requiresPayment !== null) count++;
    if (localFilters.rewardsParticipants !== null) count++;
    if (localFilters.creatorAddress) count++;
    if (localFilters.searchQuery) count++;
    return count;
  };

  if (!open || !mounted) return null;

  const typeLabels: Record<CampaignType, string> = {
    voting: 'Voting',
    test: 'Test / Certification',
    fundraising: 'Fundraising',
    registration: 'Registration',
    feedback: 'Feedback',
    lottery: 'Lottery',
    other: 'Other'
  };

  const statusLabels: Record<CampaignStatus, string> = {
    upcoming: 'Upcoming',
    active: 'Active',
    ended: 'Ended'
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Filters
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Search Query */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Search in campaign title
              </label>
              <input
                type="text"
                value={localFilters.searchQuery}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Enter keywords..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* Campaign Lifecycle */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Campaign Lifecycle
              </h3>
              <div className="space-y-3">
                {/* Start Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                      Start date from
                    </label>
                    <input
                      type="date"
                      value={localFilters.startDateFrom}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, startDateFrom: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                      Start date to
                    </label>
                    <input
                      type="date"
                      value={localFilters.startDateTo}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, startDateTo: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
                {/* End Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                      End date from
                    </label>
                    <input
                      type="date"
                      value={localFilters.endDateFrom}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, endDateFrom: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                      End date to
                    </label>
                    <input
                      type="date"
                      value={localFilters.endDateTo}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, endDateTo: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
                {/* Status */}
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(statusLabels) as CampaignStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`px-3 py-2 rounded-lg border-2 transition text-center ${
                          localFilters.statuses.includes(status)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-xs font-medium">{statusLabels[status]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Type */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Campaign Type
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(typeLabels) as CampaignType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-2 rounded-lg border-2 transition text-left ${
                      localFilters.types.includes(type)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{typeLabels[type]}</span>
                      {localFilters.types.includes(type) && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Economic Logic */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Economic Logic
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setLocalFilters(prev => ({
                    ...prev,
                    requiresPayment: prev.requiresPayment === true ? null : true
                  }))}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition text-left ${
                    localFilters.requiresPayment === true
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Requires payment to participate</span>
                    {localFilters.requiresPayment === true && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setLocalFilters(prev => ({
                    ...prev,
                    rewardsParticipants: prev.rewardsParticipants === true ? null : true
                  }))}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition text-left ${
                    localFilters.rewardsParticipants === true
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Rewards participants</span>
                    {localFilters.rewardsParticipants === true && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Authorship */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Authorship
              </h3>
              <input
                type="text"
                value={localFilters.creatorAddress}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, creatorAddress: e.target.value }))}
                placeholder="Creator address..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition"
            >
              Reset all
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 rounded-lg transition"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
