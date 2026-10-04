import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { VisitRecord } from '../domain/types';

interface WeightSparklineProps {
  visits: VisitRecord[];
}

export const WeightSparkline: React.FC<WeightSparklineProps> = ({ visits }) => {
  const data = [...visits]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((v) => v.weight_kg !== null && v.weight_kg !== undefined && v.weight_kg > 0)
    .map((v) => ({
      date: v.date.slice(5),
      fullDate: v.date,
      weight: v.weight_kg!,
    }));

  if (data.length < 2) {
    return (
      <div className="text-xs text-slate-400 italic py-2">
        Not enough weight readings for sparkline.
      </div>
    );
  }

  const minWeight = Math.floor(Math.min(...data.map((d) => d.weight)) - 2);
  const maxWeight = Math.ceil(Math.max(...data.map((d) => d.weight)) + 2);

  return (
    <div className="w-full bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700">Weight Progression</span>
        <span className="text-xs font-bold text-slate-800">
          {data[data.length - 1].weight} kg{' '}
          <span className="text-[10px] text-slate-400 font-normal">
            (from {data[0].weight} kg)
          </span>
        </span>
      </div>
      <div className="w-full h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -25, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} />
            <YAxis domain={[minWeight, maxWeight]} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow">
                      {d.fullDate}: {d.weight} kg
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3, fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
