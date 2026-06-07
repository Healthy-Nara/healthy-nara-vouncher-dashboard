import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api';
import { Clock, FileText, DollarSign, Activity, PhoneCall, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const statCards = [
    {
      title: 'Total Leads',
      value: stats?.totalLeads || 0,
      icon: <PhoneCall size={20} />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-100',
    },
    {
      title: 'Active Bookings',
      value: stats?.assignedBookings || 0,
      icon: <Calendar size={20} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      icon: <FileText size={20} />,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-100',
    },
    {
      title: 'Total Revenue',
      value: `${stats?.totalRevenue?.toLocaleString() || 0} MMK`,
      icon: <DollarSign size={20} />,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Pending Payments',
      value: `${stats?.pendingPayments?.toLocaleString() || 0} MMK`,
      icon: <Clock size={20} />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-100',
    },
    {
      title: 'Accounts Receivable',
      value: `${stats?.accountsReceivable?.toLocaleString() || 0} MMK`,
      icon: <DollarSign size={20} />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Active NAs',
      value: stats?.activeNAs || 0,
      icon: <Activity size={20} />,
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      borderColor: 'border-teal-100',
    },
    {
      title: 'Total Profit',
      value: `${stats?.totalProfit?.toLocaleString() || 0} MMK`,
      icon: <Activity size={20} />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-100',
    },
  ];

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time overview of your business.</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`bg-white p-6 rounded-2xl shadow-sm border ${card.borderColor} flex items-center gap-5 transition-all hover:shadow-md hover:scale-[1.02]`}
          >
            <div className={`p-4 ${card.bgColor} ${card.textColor} rounded-xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
              <p className={`text-2xl font-black ${card.textColor}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lead Pipeline + Invoice Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">Lead Pipeline</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🟢</span>
                <span className="text-sm font-semibold text-gray-700">New</span>
              </div>
              <span className="text-sm font-bold text-green-600">{stats?.newLeads || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🟡</span>
                <span className="text-sm font-semibold text-gray-700">Contacted</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{stats?.contactedLeads || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔵</span>
                <span className="text-sm font-semibold text-gray-700">Sale Closed</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stats?.saleClosedLeads || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🟣</span>
                <span className="text-sm font-semibold text-gray-700">Active Customer</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{stats?.activeCustomers || 0}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm">❌</span>
                <span className="text-sm font-semibold text-gray-700">Lost</span>
              </div>
              <span className="text-sm font-bold text-red-600">{stats?.lostLeads || 0}</span>
            </div>
          </div>
        </div>

        {/* Invoice Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">Invoice Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Draft</span>
              </div>
              <span className="text-sm font-bold text-gray-600">{stats?.draftInvoices || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">Created</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stats?.createdInvoices || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-yellow-500" />
                <span className="text-sm font-semibold text-gray-700">Sent</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{stats?.sentInvoices || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-sm font-semibold text-gray-700">Payment Confirmed</span>
              </div>
              <span className="text-sm font-bold text-green-600">{stats?.confirmedInvoices || 0}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-sm font-semibold text-gray-700">Completed</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">{stats?.completedInvoices || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4">Booking Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-xl">
            <p className="text-2xl font-black text-yellow-600">{stats?.pendingBookings || 0}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Pending NA</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-2xl font-black text-blue-600">{stats?.assignedBookings || 0}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Assigned</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-black text-green-600">{stats?.completedBookings || 0}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-black text-gray-600">{stats?.totalBookings || 0}</p>
            <p className="text-xs font-bold text-gray-500 mt-1">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
