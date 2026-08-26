import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  BarChart3,
  Users,
  HeartHandshake,
  History,
  PhoneCall,
  CalendarDays,
  CalendarSearch,
  Banknote,
  Wallet,
  PieChart,
  ClipboardList,
  ClipboardCheck,
  Clock,
  LifeBuoy,
  Settings,
  LogOut,
  BookOpen,
} from 'lucide-react';
import { Avatar } from './ui/Avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Daily Report', icon: ClipboardList, path: '/', roles: ['admin'] },
  { label: 'Leads', icon: PhoneCall, path: '/leads', roles: ['admin', 'staff'] },
  { label: 'Bookings', icon: CalendarDays, path: '/bookings', roles: ['admin', 'staff'] },
  { label: 'Public Bookings', icon: CalendarSearch, path: '/bookings/public', roles: ['admin', 'staff'] },
  { label: 'Schedule', icon: CalendarSearch, path: '/schedule', roles: ['admin', 'staff'] },
  { label: 'Invoices', icon: FileText, path: '/invoices', roles: ['admin', 'staff'] },
  { label: 'Blog Posts', icon: BookOpen, path: '/blogs', roles: ['admin', 'staff'] },
  { label: 'Tickets', icon: LifeBuoy, path: '/tickets', roles: ['admin', 'staff'] },
  { label: 'Payouts', icon: Banknote, path: '/payouts', roles: ['admin', 'staff'] },
  { label: 'Expenses', icon: Wallet, path: '/expenses', roles: ['admin'] },
  { label: 'Report', icon: BarChart3, path: '/report', roles: ['admin'] },
  { label: 'Parents', icon: Users, path: '/parents', roles: ['admin', 'staff'] },
  { label: 'Caregivers', icon: HeartHandshake, path: '/caregivers', roles: ['admin', 'staff'] },
  { label: 'Bank Report', icon: PieChart, path: '/bank-report', roles: ['admin'] },
  { label: 'NA Reports', icon: ClipboardCheck, path: '/na-reports', roles: ['admin'] },
  { label: 'Duty Logs', icon: Clock, path: '/duty-logs', roles: ['admin'] },
  { label: 'Activity Log', icon: History, path: '/logs', roles: ['admin'] },
  { label: 'Accounts', icon: Settings, path: '/team', roles: ['superadmin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  const canSee = (roles: string[]) => {
    const role = user?.role;
    if (role === 'superadmin') return roles.includes('superadmin') || roles.includes('admin');
    return roles.includes(role || '');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Logo & Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
            {/* Teal Logo Icon with HN */}
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-sm shadow-xs shadow-teal-500/30">
              HN
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                Healthy Nara
              </h1>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                CARE PLATFORM
              </p>
            </div>
          </div>

          {/* Section Category Header */}
          <div className="px-5 pt-4 pb-1">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-1">
              WORKSPACE
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-0.5">
            {navItems
              .filter((item) => canSee(item.roles))
              .map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                      active
                        ? 'bg-teal-50 text-teal-800 shadow-xs border border-teal-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={`transition-colors shrink-0 ${
                          active
                            ? 'text-teal-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {/* Active Indicator Dot */}
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Bottom User Profile / Support Card */}
        <div className="p-3 border-t border-slate-100 bg-white">
          {user && (
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={user.username} size="sm" />
                <div className="truncate">
                  <p className="text-xs font-extrabold text-slate-900 truncate leading-tight">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.role === 'superadmin' ? 'Super Admin' : user.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
