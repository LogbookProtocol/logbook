'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ColumnId =
  | 'campaign'
  | 'type'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'creator'
  | 'requiresPayment'
  | 'rewardsParticipants'
  | 'participation';

export interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  alwaysVisible?: boolean; // Колонки, которые нельзя скрыть
}

interface ColumnsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export function ColumnsModal({ open, onOpenChange, columns, onColumnsChange }: ColumnsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setLocalColumns(columns);
    }
  }, [open, columns]);

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

  const toggleColumn = (columnId: ColumnId) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === columnId && !col.alwaysVisible
          ? { ...col, visible: !col.visible }
          : col
      )
    );
  };

  const handleApply = () => {
    onColumnsChange(localColumns);
    onOpenChange(false);
  };

  const handleReset = () => {
    // Сброс к дефолтным значениям
    const defaultColumns: ColumnConfig[] = [
      { id: 'campaign', label: 'Campaign', visible: true, alwaysVisible: true },
      { id: 'type', label: 'Type', visible: true },
      { id: 'status', label: 'Status', visible: true },
      { id: 'startDate', label: 'Start Date', visible: false },
      { id: 'endDate', label: 'End Date', visible: true },
      { id: 'creator', label: 'Creator', visible: false },
      { id: 'requiresPayment', label: 'Requires Payment', visible: false },
      { id: 'rewardsParticipants', label: 'Rewards', visible: false },
      { id: 'participation', label: 'Your Participation', visible: true },
    ];
    setLocalColumns(defaultColumns);
  };

  const getVisibleColumnsCount = () => {
    return localColumns.filter(col => col.visible).length;
  };

  if (!open || !mounted) return null;

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
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Columns
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getVisibleColumnsCount()} column{getVisibleColumnsCount() !== 1 ? 's' : ''} visible
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
          <div className="p-6 space-y-2">
            {localColumns.map((column) => (
              <button
                key={column.id}
                onClick={() => toggleColumn(column.id)}
                disabled={column.alwaysVisible}
                className={`w-full px-4 py-3 rounded-lg border-2 transition text-left ${
                  column.visible
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                } ${
                  column.alwaysVisible ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{column.label}</span>
                    {column.alwaysVisible && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">(required)</span>
                    )}
                  </div>
                  {column.visible && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition"
            >
              Reset to default
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
                Apply columns
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// Дефолтные колонки
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'campaign', label: 'Campaign', visible: true, alwaysVisible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'startDate', label: 'Start Date', visible: false },
  { id: 'endDate', label: 'End Date', visible: true },
  { id: 'creator', label: 'Creator', visible: false },
  { id: 'requiresPayment', label: 'Requires Payment', visible: false },
  { id: 'rewardsParticipants', label: 'Rewards', visible: false },
  { id: 'participation', label: 'Your Participation', visible: true },
];
