import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../api';
import { CreditCard, Banknote, Clock, FileText, DollarSign, Activity } from 'lucide-react';

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      icon: <FileText size={20} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100',
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
      title: 'Pending Payouts',
      value: `${stats?.pendingPayouts?.toLocaleString() || 0} MMK`,
      icon: <Banknote size={20} />,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-100',
    },
    {
      title: 'Total Payouts',
      value: `${stats?.totalPayouts?.toLocaleString() || 0} MMK`,
      icon: <CreditCard size={20} />,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-100',
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Financial Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time financial status and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
      {/* Optional: Add a simple chart or recent activity summary here later */}
    </div>
  );
};

export default Dashboard;
