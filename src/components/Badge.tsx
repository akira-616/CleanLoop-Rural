import React from 'react';
import { FlagLevel } from '../domain/types';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BadgeProps {
  level: FlagLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  lang?: 'en' | 'hi';
}

export const FlagBadge: React.FC<BadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
  className = '',
  lang = 'en',
}) => {
  const configs = {
    RED: {
      bg: 'bg-rose-50 text-rose-800 border-rose-300 ring-rose-200/50',
      textEn: 'RED FLAG • Needs Review',
      textHi: 'रेड फ्लैग • समीक्षा आवश्यक',
      icon: AlertTriangle,
      dot: 'bg-rose-600',
    },
    ORANGE: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-200/50',
      textEn: 'ORANGE • Attention',
      textHi: 'ऑरेंज • ध्यान दें',
      icon: AlertCircle,
      dot: 'bg-amber-600',
    },
    GREEN: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-200/50',
      textEn: 'GREEN • On Track',
      textHi: 'ग्रीन • सामान्य',
      icon: CheckCircle2,
      dot: 'bg-emerald-600',
    },
  };

  const current = configs[level];
  const Icon = current.icon;
  const label = lang === 'hi' ? current.textHi : current.textEn;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border shadow-xs font-medium ${current.bg} ${sizeClasses} ${className}`}
      role="status"
      aria-label={label}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot} shrink-0 animate-pulse`} />
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
