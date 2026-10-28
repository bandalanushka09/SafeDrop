import React from 'react';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

export const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found matching current criteria.',
  emptyAction,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-surface-border overflow-hidden">
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-surface-border">
        <EmptyState title="No records" message={emptyMessage} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-surface-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-surface-border text-xs uppercase text-text-secondary font-semibold tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border text-text-primary">
            {data.map((row, rowIdx) => (
              <tr key={row._id || row.id || rowIdx} className="hover:bg-slate-50/75 transition-colors">
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3.5 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                  >
                    {typeof col.cell === 'function' ? col.cell(row, rowIdx) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;

