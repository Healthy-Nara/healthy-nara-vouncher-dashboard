import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import UpdatePayment from './pages/UpdatePayment';
import UpdatePayout from './pages/UpdatePayout';
import InvoiceDetail from './pages/InvoiceDetail';
import Parents from './pages/Parents';
import ParentDetail from './pages/ParentDetail';
import Caregivers from './pages/Caregivers';
import CaregiverDetail from './pages/CaregiverDetail';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Schedule from './pages/Schedule';
import DailyReport from './pages/DailyReport';
import Payouts from './pages/Payouts';
import Expenses from './pages/Expenses';
import BankReport from './pages/BankReport';
import PublicBooking from './pages/PublicBooking';
import PublicNewBooking from './pages/PublicNewBooking';
import PublicBookingsList from './pages/PublicBookingsList';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// NA Pages
// Admin NA Pages
import NAReports from './pages/NAReports';
import NAReportDetail from './pages/NAReportDetail';
import DutyLogs from './pages/DutyLogs';

// Family Page
import FamilyReports from './pages/FamilyReports';

// Ticket Pages
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Team from './pages/Team';

// Blog Pages
import Blogs from './pages/Blogs';
import BlogEditor from './pages/BlogEditor';
import BlogDetail from './pages/BlogDetail';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && user.role !== 'superadmin' && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const HomePage = () => {
  const { user } = useAuth();
  if (user?.role === 'staff') return <Bookings />;
  return <DailyReport />;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes - no auth, no layout */}
            <Route path="/book/:token" element={<PublicBooking />} />
            <Route path="/book-now" element={<PublicNewBooking />} />
            <Route path="/login" element={<Login />} />

            {/* Family routes - public, no auth */}
            <Route path="/family/:token" element={<FamilyReports />} />

            {/* Admin routes - with auth + layout */}
            <Route path="*" element={
              <div className="h-screen bg-[#F8FAFC] text-slate-900 flex flex-col overflow-hidden">
                <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="lg:pl-64 pt-16 h-screen flex flex-col overflow-hidden">
                  <main className="max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-5 flex-1 flex flex-col min-h-0 overflow-y-auto animate-fadeIn">
                    <Routes>
                      <Route path="/" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <HomePage />
                        </PrivateRoute>
                      } />
                      <Route path="/invoices" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Invoices />
                        </PrivateRoute>
                      } />
                      <Route path="/blogs" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Blogs />
                        </PrivateRoute>
                      } />
                      <Route path="/blogs/new" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <BlogEditor />
                        </PrivateRoute>
                      } />
                      <Route path="/blogs/edit/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <BlogEditor />
                        </PrivateRoute>
                      } />
                      <Route path="/blogs/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <BlogDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/report" element={
                        <PrivateRoute roles={['admin']}>
                          <Dashboard />
                        </PrivateRoute>
                      } />
                      <Route path="/create-invoice" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <CreateInvoice />
                        </PrivateRoute>
                      } />
                      <Route path="/update-payment/:invoiceNumber?" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <UpdatePayment />
                        </PrivateRoute>
                      } />
                      <Route path="/update-payout/:invoiceNumber?" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <UpdatePayout />
                        </PrivateRoute>
                      } />
                      <Route path="/invoice/:invoiceNumber" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <InvoiceDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/parents" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Parents />
                        </PrivateRoute>
                      } />
                      <Route path="/parents/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <ParentDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/caregivers" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Caregivers />
                        </PrivateRoute>
                      } />
                      <Route path="/caregivers/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <CaregiverDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/leads" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Leads />
                        </PrivateRoute>
                      } />
                      <Route path="/leads/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <LeadDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/bookings" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Bookings />
                        </PrivateRoute>
                      } />
                      <Route path="/bookings/public" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <PublicBookingsList />
                        </PrivateRoute>
                      } />
                      <Route path="/bookings/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <BookingDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/schedule" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Schedule />
                        </PrivateRoute>
                      } />
                      <Route path="/payouts" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Payouts />
                        </PrivateRoute>
                      } />
                      <Route path="/expenses" element={
                        <PrivateRoute roles={['admin']}>
                          <Expenses />
                        </PrivateRoute>
                      } />
                      <Route path="/bank-report" element={
                        <PrivateRoute roles={['admin']}>
                          <BankReport />
                        </PrivateRoute>
                      } />
                      <Route path="/logs" element={
                        <PrivateRoute roles={['admin']}>
                          <Logs />
                        </PrivateRoute>
                      } />
                      <Route path="/na-reports" element={
                        <PrivateRoute roles={['admin']}>
                          <NAReports />
                        </PrivateRoute>
                      } />
                      <Route path="/na-reports/:id" element={
                        <PrivateRoute roles={['admin']}>
                          <NAReportDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/duty-logs" element={
                        <PrivateRoute roles={['admin']}>
                          <DutyLogs />
                        </PrivateRoute>
                      } />
                      <Route path="/tickets" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Tickets />
                        </PrivateRoute>
                      } />
                      <Route path="/tickets/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <TicketDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/team" element={
                        <PrivateRoute roles={['superadmin']}>
                          <Team />
                        </PrivateRoute>
                      } />
                    </Routes>
                  </main>
                </div>
              </div>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
