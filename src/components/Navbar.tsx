import { Link, useLocation } from 'react-router-dom';
import { LogOut, History } from 'lucide-react';
import halogo from '../assets/halogo.png';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navLinkClasses = (path: string) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-semibold transition-colors ${isActive(path)
      ? 'border-primary text-gray-900'
      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <img src={halogo} alt="Healthy Nara" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Healthy <span className="text-primary">Nara</span></span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link to="/" className={navLinkClasses('/')}>Invoices</Link>
              {isAdmin && <Link to="/report" className={navLinkClasses('/report')}>Report</Link>}
              {isAdmin && <Link to="/customers" className={navLinkClasses('/customers')}>Customers</Link>}
              {isAdmin && <Link to="/caregivers" className={navLinkClasses('/caregivers')}>Caregivers</Link>}

            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="flex items-center gap-2 sm:gap-4 border-r pr-4">
                {/* <Link
                  to="/update-payment"
                  className="p-2 text-gray-400 hover:text-primary group relative"
                  title="Update Payment"
                >
                  <CreditCard className="h-6 w-6" />
                </Link>
                <Link
                  to="/update-payout"
                  className="p-2 text-gray-400 hover:text-primary group relative"
                  title="Update Payout"
                >
                  <Banknote className="h-6 w-6" />
                </Link> */}
                <Link
                  to="/logs"
                  className="p-2 text-gray-400 hover:text-primary group relative"
                  title="Activity History"
                >
                  <History className="h-6 w-6" />
                </Link>
              </div>
            )}

            <div className="flex items-center gap-3 ml-2">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-gray-900 capitalize">{user.username}</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
