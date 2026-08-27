import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Avatar } from './ui/Avatar';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const routeTitles: Record<string, string> = {
  '/': 'Daily Report',
  '/bookings': 'Bookings',
  '/bookings/public': 'Public Bookings',
  '/schedule': 'Schedule',
  '/invoices': 'Invoices',
  '/create-invoice': 'Create Invoice',
  '/payouts': 'Caregiver Payouts',
  '/expenses': 'Expenses',
  '/report': 'Financial Reports',
  '/parents': 'Parents Directory',
  '/caregivers': 'Caregivers Directory',
  '/leads': 'Leads Pipeline',
  '/bank-report': 'Bank Reconciliation',
  '/na-reports': 'Nurse Aid Reports',
  '/duty-logs': 'Care Duty Logs',
  '/tickets': 'Support Tickets',
  '/logs': 'Activity Logs',
  '/team': 'Team & Accounts',
};

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  // Derive current page title from path
  const currentTitle =
    Object.keys(routeTitles).find((path) =>
      path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
    ) ? routeTitles[Object.keys(routeTitles).find((path) =>
      path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
    )!] : 'Dashboard';

  const todayFormatted = format(new Date(), 'EEE, dd-MM-yyyy');

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-slate-200/80 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-base font-extrabold text-slate-900 leading-tight">
            {currentTitle}
          </h2>
          <p className="text-[11px] font-semibold text-slate-400">
            {todayFormatted}
          </p>
        </div>
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer select-none"
          >
            <Avatar name={user.username || 'Admin'} size="sm" />
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {user.username}
              </span>
              <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 py-2 animate-fadeIn">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.username}</p>
                  <p className="text-[11px] text-teal-600 font-semibold uppercase">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
