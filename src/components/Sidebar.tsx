import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Daily Report", icon: ClipboardList, path: "/", roles: ["admin"] },
  {
    label: "Leads",
    icon: PhoneCall,
    path: "/leads",
    roles: ["admin", "staff"],
  },
  {
    label: "Bookings",
    icon: CalendarDays,
    path: "/bookings",
    roles: ["admin", "staff"],
  },
  {
    label: "Public Bookings",
    icon: CalendarDays,
    path: "/bookings/public",
    roles: ["admin", "staff"],
  },
  {
    label: "Schedule",
    icon: CalendarSearch,
    path: "/schedule",
    roles: ["admin", "staff"],
  },
  {
    label: "Invoices",
    icon: FileText,
    path: "/invoices",
    roles: ["admin", "staff"],
  },
  {
    label: "Tickets",
    icon: LifeBuoy,
    path: "/tickets",
    roles: ["admin", "staff"],
  },
  {
    label: "Payouts",
    icon: Banknote,
    path: "/payouts",
    roles: ["admin", "staff"],
  },
  {
    label: "Expenses",
    icon: Wallet,
    path: "/expenses",
    roles: ["admin"],
  },
  { label: "Report", icon: BarChart3, path: "/report", roles: ["admin"] },
  {
    label: "Parents",
    icon: Users,
    path: "/parents",
    roles: ["admin", "staff"],
  },
  {
    label: "Caregivers",
    icon: HeartHandshake,
    path: "/caregivers",
    roles: ["admin", "staff"],
  },
  {
    label: "Bank Report",
    icon: PieChart,
    path: "/bank-report",
    roles: ["admin"],
  },
  {
    label: "NA Reports",
    icon: ClipboardCheck,
    path: "/na-reports",
    roles: ["admin"],
  },
  {
    label: "Duty Logs",
    icon: Clock,
    path: "/duty-logs",
    roles: ["admin"],
  },
  { label: "Activity Log", icon: History, path: "/logs", roles: ["admin"] },
  { label: "Accounts", icon: Settings, path: "/team", roles: ["superadmin"] },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);
  // superadmin sees admin items AND superadmin-only items; other roles only their exact role
  const canSee = (roles: string[]) => {
    const role = user?.role;
    if (role === "superadmin") return roles.includes("superadmin") || roles.includes("admin");
    return roles.includes(role || "");
  };

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors ${
      isActive(path)
        ? "bg-white/20 text-white border-r-2 border-white"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-[#2B5748] shadow-lg z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Nav Links */}
        <nav className="py-4 space-y-1">
          {navItems.map((item) => {
            if (!canSee(item.roles)) return null;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={linkClass(item.path)}
              >
                <Icon size={18} />
                {item.label}
                {/* {"isNew" in item && item.isNew && (
                  <span className="ml-auto text-[9px] font-bold bg-white text-[#1CB89B] px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )} */}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
