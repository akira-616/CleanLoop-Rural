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

interface BpChartProps {
  visits: VisitRecord[];
}

export const BpChart: React.FC<BpChartProps> = ({ visits }) => {
  // Sort visits chronologically and filter those with BP
  const data = [...visits]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((v) => v.bp?.systolic !== null && v.bp?.systolic !== undefined)
    .map((v) => ({
      date: v.date.slice(5), // MM-DD
      fullDate: v.date,
      systolic: v.bp!.systolic,
      diastolic: v.bp!.diastolic,
    }));

  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
        No blood pressure records available for chart.
      </div>
    );
  }

  return (
    <div className="w-full h-52 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Systolic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Diastolic
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">mmHg</span>
      </div>

      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis
              domain={[60, 200]}
              ticks={[80, 100, 140, 160, 180]}
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
                      <div className="text-rose-300 font-bold">
                        BP: {d.systolic}/{d.diastolic} mmHg
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference line for 160 high systolic threshold */}
            <ReferenceLine
              y={CLINICAL_CONFIG.bp.highSystolic}
              stroke="#e11d48"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Threshold: ${CLINICAL_CONFIG.bp.highSystolic}`,
                position: 'top',
                fill: '#e11d48',
                fontSize: 9,
                fontWeight: 600,
              }}
            />
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#0ea5e9', stroke: '#ffffff', strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
