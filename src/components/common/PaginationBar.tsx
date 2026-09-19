import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 py-2 px-1 text-xs text-slate-600 border-t border-slate-200">
      {/* Pagination arrows */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="min-w-7 h-7 px-2 flex items-center justify-center rounded bg-[#8B1E2D] text-white font-mono font-bold text-xs shadow-2xs">
          {currentPage}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Showing range text */}
      <div className="text-[11px] font-medium text-slate-600">
        Showing from <span className="font-bold text-slate-900">{startItem}</span> to{' '}
        <span className="font-bold text-slate-900">{endItem}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> records
      </div>

      {/* Page size dropdown */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-6.5 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 font-mono focus:outline-none focus:border-[#8B1E2D]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </div>
  );
};
