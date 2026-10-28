import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const STATUS_COLORS = {
  submitted: '#2563EB', // blue
  under_review: '#B45309', // amber
  action_required: '#EA580C', // orange
  resolved: '#15803D', // green
  rejected: '#64748B', // slate
};

export const ReportsByStatusChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-text-secondary">
        No report status data
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
            nameKey="label"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.status] || '#0F766E'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#172B2A',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportsByStatusChart;

