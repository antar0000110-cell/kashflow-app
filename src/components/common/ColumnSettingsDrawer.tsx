import React from 'react';
import { ChevronDown, ChevronUp, Check, SlidersHorizontal } from 'lucide-react';

export interface ColumnDefinition {
  key: string;
  label: string;
  visible: boolean;
}

export interface ColumnSettingsProps {
  isOpen: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  columns: ColumnDefinition[];
  onColumnChange?: (key: string, visible: boolean) => void;
  onToggleColumn?: (key: string, visible: boolean) => void;
  onSelectAll?: () => void;
  onReset?: () => void;
}

export const ColumnSettingsDrawer: React.FC<ColumnSettingsProps> = ({
  isOpen,
  onToggle,
  onClose,
  columns,
  onColumnChange,
  onToggleColumn,
  onSelectAll,
  onReset,
}) => {
  const handleToggle = (key: string, visible: boolean) => {
    if (onColumnChange) {
      onColumnChange(key, visible);
    } else if (onToggleColumn) {
      onToggleColumn(key, visible);
    }
  };

  return (
    <div className="mb-3 select-none">
      {/* Trigger Button if onToggle provided */}
      {onToggle && (
        <button
          onClick={onToggle}
          className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs ${
            isOpen
              ? 'bg-[#721825] text-white'
              : 'bg-[#8B1E2D] text-white hover:bg-[#721825]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Column Settings</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Expandable Panel */}
      {isOpen && (
        <div className="mt-2 p-3 bg-white border border-slate-200 rounded shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
            <span className="font-semibold text-slate-800">Customize Table Columns:</span>
            <div className="flex items-center gap-2">
              {onSelectAll && (
                <button
                  onClick={onSelectAll}
                  className="text-[11px] text-[#8B1E2D] hover:underline font-semibold"
                >
                  Select All
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline"
                >
                  Reset Default
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-[11px] text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer hover:text-[#8B1E2D] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={(e) => handleToggle(col.key, e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#8B1E2D] focus:ring-[#8B1E2D] focus:ring-1"
                />
                <span className="truncate">{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
