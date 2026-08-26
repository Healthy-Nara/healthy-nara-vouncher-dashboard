import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  change,
  trend = 'up',
  sparklineData = [10, 20, 15, 25, 18, 30, 28],
  className = '',
}) => {
  // Generate simple sparkline SVG path from numbers
  const max = Math.max(...sparklineData, 1);
  const min = Math.min(...sparklineData, 0);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      {/* Top row: Icon + Title + Trend Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-700">{title}</span>
        </div>

        {change && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              trend === 'down'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-teal-50 text-teal-700'
            }`}
          >
            {trend === 'down' ? (
              <TrendingDown size={12} className="text-rose-500" />
            ) : (
              <TrendingUp size={12} className="text-teal-600" />
            )}
            <span>{change}</span>
          </span>
        )}
      </div>

      {/* Middle & Sparkline row */}
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Sparkline chart SVG */}
        <div className="pb-1">
          <svg
            width={width}
            height={height}
            className="overflow-visible stroke-teal-500 fill-none"
          >
            <polyline
              fill="none"
              stroke="#14B8A6"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
