import { Link } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import halogo from '../assets/halogo.png';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[#148f73] z-50 shadow-sm">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Toggle Sidebar"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src={halogo} alt="Healthy Nara" className="h-7 w-7 rounded-lg object-contain" />
            <span className="text-base font-extrabold text-white tracking-tight hidden sm:inline">
              Healthy <span className="text-white/80">Nara</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-white capitalize">{user.username}</span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{user.role}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
