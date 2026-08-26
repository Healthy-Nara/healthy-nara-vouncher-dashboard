import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-6 border-b border-slate-200 overflow-x-auto ${className}`}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? 'bg-teal-100 text-teal-800 font-bold'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.count}
              </span>
            )}
            {/* Active Underline Pill */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
