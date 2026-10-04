import React from 'react';
import { ConfidenceLevel } from '../domain/types';
import { AlertCircle, Check, HelpCircle } from 'lucide-react';

interface ConfidenceChipProps {
  confidence: ConfidenceLevel;
  doctorChecked?: boolean;
  edited?: boolean;
}

export const ConfidenceChip: React.FC<ConfidenceChipProps> = ({
  confidence,
  doctorChecked,
  edited,
}) => {
  if (edited) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-full">
        <Check className="w-3 h-3 text-teal-700" />
        Doctor edited
      </span>
    );
  }

  if (doctorChecked) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
        <Check className="w-3 h-3 text-emerald-700" />
        Checked ✓
      </span>
    );
  }

  const styles = {
    high: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'High confidence',
      icon: Check,
    },
    medium: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Medium confidence',
      icon: HelpCircle,
    },
    low: {
      bg: 'bg-amber-100 text-amber-900 border-amber-400 font-semibold ring-1 ring-amber-400/40',
      label: 'Low confidence • Please check',
      icon: AlertCircle,
    },
  }[confidence];

  const Icon = styles.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${styles.bg}`}
      title={styles.label}
    >
      <Icon className="w-3 h-3" />
      {styles.label}
    </span>
  );
};
