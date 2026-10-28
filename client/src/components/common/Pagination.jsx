import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 20,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-t-0 border-surface-border rounded-b-lg text-xs text-text-secondary">
      <div>
        Showing <span className="font-semibold text-text-primary">{startRecord}</span> to{' '}
        <span className="font-semibold text-text-primary">{endRecord}</span> of{' '}
        <span className="font-semibold text-text-primary">{total}</span> entries
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <div className="px-2 text-xs font-medium text-text-primary">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 ml-1 inline" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;

