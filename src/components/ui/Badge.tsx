import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'teal'
    | 'amber'
    | 'emerald'
    | 'sky'
    | 'rose'
    | 'slate'
    | 'purple'
    | 'outline'
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'onDuty'
    | 'available'
    | 'away';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'teal',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<string, { badge: string; dot: string }> = {
    teal: {
      badge: 'bg-teal-50 text-teal-700 border-teal-200/80',
      dot: 'bg-teal-500',
    },
    emerald: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500',
    },
    sky: {
      badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
      dot: 'bg-sky-500',
    },
    rose: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
    },
    slate: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-500',
    },
    purple: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
      dot: 'bg-purple-500',
    },
    outline: {
      badge: 'bg-white text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    // Semantic mappings
    pending: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    confirmed: {
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
    },
    completed: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-500',
    },
    cancelled: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    onDuty: {
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
    },
    available: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    away: {
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const current = variantStyles[variant] || variantStyles.teal;

  const sizeStyles: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[11px] gap-1 rounded-full font-semibold',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-full font-semibold',
    lg: 'px-3 py-1.5 text-sm gap-2 rounded-full font-bold',
  };

  return (
    <span
      className={`inline-flex items-center border select-none transition-colors ${current.badge} ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
