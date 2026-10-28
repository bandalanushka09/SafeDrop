import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = {
  active: '#0F766E', // brand teal
  under_inspection: '#B45309', // warning amber
  temporarily_unavailable: '#B91C1C', // critical red
  deactivated: '#64748B', // slate
};

export const SourceStatusChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-text-secondary">
        No water source data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN',
    value: item.count || 0,
    rawStatus: item.status,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.rawStatus] || '#0F766E'}
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

export default SourceStatusChart;

