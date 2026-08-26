import React from 'react';

export const Table: React.FC<
  React.TableHTMLAttributes<HTMLTableElement> & { containerClassName?: string }
> = ({ className = '', containerClassName = '', ...props }) => (
  <div className={`w-full overflow-auto ${containerClassName}`}>
    <table
      className={`w-full text-left text-xs sm:text-sm border-collapse ${className}`}
      {...props}
    />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  ...props
}) => (
  <thead
    className={`sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 shadow-xs ${className}`}
    {...props}
  />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  ...props
}) => (
  <tbody
    className={`divide-y divide-slate-100 text-slate-700 font-normal ${className}`}
    {...props}
  />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  ...props
}) => (
  <tr
    className={`hover:bg-slate-50/80 transition-colors ${className}`}
    {...props}
  />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  ...props
}) => (
  <th className={`px-4 py-3.5 whitespace-nowrap font-extrabold ${className}`} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  ...props
}) => (
  <td className={`px-4 py-3.5 whitespace-nowrap align-middle ${className}`} {...props} />
);

export const TableFooterBar: React.FC<{
  showingText?: string;
  updatedText?: string;
  children?: React.ReactNode;
}> = ({ showingText = 'Showing entries', updatedText = 'Last updated just now', children }) => {
  return (
    <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
      <span>{showingText}</span>
      {children}
      <span>{updatedText}</span>
    </div>
  );
};
