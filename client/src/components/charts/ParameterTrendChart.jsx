import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const ParameterTrendChart = ({ data = [], parameter = 'ph' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-text-secondary">
        No measurement trend data for {parameter.toUpperCase()}
      </div>
    );
  }

  const unit = data[0]?.unit || '';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#172B2A',
            }}
            formatter={(value) => [`${value} ${unit}`, 'Measured Value']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
          />
          <Line
            type="monotone"
            dataKey="average"
            name={`Average (${unit})`}
            stroke="#0F766E"
            strokeWidth={2}
            dot={{ r: 4, fill: '#0F766E' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ParameterTrendChart;

