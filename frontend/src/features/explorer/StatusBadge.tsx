import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'PASSED' | 'FAILED' | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
}) => {
  const isPassed = status.toUpperCase() === 'PASSED';

  if (isPassed) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-semibold tracking-wide uppercase transition-colors ${
          size === 'sm' ? 'text-[10px]' : 'text-xs px-2.5 py-1'
        } bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        PASSED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-semibold tracking-wide uppercase transition-colors ${
        size === 'sm' ? 'text-[10px]' : 'text-xs px-2.5 py-1'
      } bg-rose-500/10 text-rose-400 border border-rose-500/25 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      FAILED
    </span>
  );
};
