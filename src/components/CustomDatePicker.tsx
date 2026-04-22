import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'react-date-range';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface CustomDatePickerProps {
  selected: Date;
  onChange: (date: Date) => void;
  label?: string;
  minDate?: Date;
  placeholder?: string;
}

const CustomDatePicker = ({ selected, onChange, label, minDate, placeholder }: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg shadow-sm p-2.5 bg-white text-sm hover:border-primary transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-gray-400" />
          <span className={selected ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {selected ? format(selected, 'dd/MM/yyyy') : placeholder || 'Select date'}
          </span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Centered Calendar Modal */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-1 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">{label || 'Select Date'}</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400"
              >
                <X size={14} />
              </button>
            </div>
            <Calendar
              date={selected}
              onChange={(date) => {
                onChange(date);
                setIsOpen(false);
              }}
              minDate={minDate}
              color="#1CB89B"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CustomDatePicker;
