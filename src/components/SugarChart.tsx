import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { VisitRecord } from '../domain/types';
import { CLINICAL_CONFIG } from '../domain/config';

interface SugarChartProps {
  visits: VisitRecord[];
}

export const SugarChart: React.FC<SugarChartProps> = ({ visits }) => {
  // Sort visits chronologically and filter those with sugar readings
  const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date));

  const data = sorted
    .filter((v) => v.sugar?.value !== null && v.sugar?.value !== undefined)
    .map((v) => {
      const isFasting = v.sugar?.type === 'fasting';
      return {
        date: v.date.slice(5),
        fullDate: v.date,
        // Only connect line for fasting readings
        fastingValue: isFasting ? v.sugar!.value : null,
        // Non-fasting displayed separately
        nonFastingValue: !isFasting ? v.sugar!.value : null,
        type: v.sugar?.type || 'unknown',
        value: v.sugar!.value,
      };
    });

  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
        No blood sugar readings recorded.
      </div>
    );
  }

  return (
    <div className="w-full h-52 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Fasting Line
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 font-normal">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-white" />
            Non-fasting (Hollow)
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">mg/dL</span>
      </div>

      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis
              domain={[80, 240]}
              ticks={[100, 140, 180, 220]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg border border-slate-700">
                      <div className="font-semibold text-slate-300">{d.fullDate}</div>
                      <div className="text-amber-300 font-bold">
                        Sugar: {d.value} mg/dL ({d.type})
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference line for 180 high fasting sugar */}
            <ReferenceLine
              y={CLINICAL_CONFIG.sugar.highFastingMgDl}
              stroke="#d97706"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Threshold: ${CLINICAL_CONFIG.sugar.highFastingMgDl}`,
                position: 'top',
                fill: '#d97706',
                fontSize: 9,
                fontWeight: 600,
              }}
            />
            {/* Fasting connected line */}
            <Line
              type="monotone"
              dataKey="fastingValue"
              stroke="#f59e0b"
              strokeWidth={2.5}
              connectNulls
              dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6 }}
            />
            {/* Non-fasting hollow points */}
            <Line
              type="monotone"
              dataKey="nonFastingValue"
              stroke="transparent"
              dot={{ r: 5, fill: '#ffffff', stroke: '#64748b', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
