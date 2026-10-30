import React from 'react';
import {
  CheckCircle2,
  CalendarCheck2,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { PRIMARY_STATUS, STATUS_CONFIG } from '../../../shared/constants.js';

export function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    color: 'slate',
    meaning: '',
  };

  const getStyle = () => {
    switch (config.color) {
      case 'green':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: CalendarCheck2,
          iconColor: 'text-blue-600',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: AlertCircle,
          iconColor: 'text-amber-600',
        };
      case 'red':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: AlertTriangle,
          iconColor: 'text-rose-600',
        };
      case 'violet':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: Eye,
          iconColor: 'text-purple-600',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: HelpCircle,
          iconColor: 'text-slate-500',
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5 font-medium',
    lg: 'text-base px-4 py-2 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border shadow-xs ${style.bg} ${sizeClasses[size]}`}
      title={config.meaning}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}

