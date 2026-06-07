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
import BankReport from './pages/BankReport';
import PublicBooking from './pages/PublicBooking';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
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
            <Route path="/login" element={<Login />} />

            {/* Admin routes - with auth + layout */}
            <Route path="*" element={
              <div className="min-h-screen bg-gray-50 text-gray-900">
                <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="pt-14 min-h-screen">
                  <main className="container mx-auto px-4 py-8">
                    <Routes>
                      <Route path="/" element={
                        <PrivateRoute roles={['admin']}>
                          <DailyReport />
                        </PrivateRoute>
                      } />
                      <Route path="/invoices" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Invoices />
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
                        <PrivateRoute roles={['admin']}>
                          <UpdatePayment />
                        </PrivateRoute>
                      } />
                      <Route path="/update-payout/:invoiceNumber?" element={
                        <PrivateRoute roles={['admin']}>
                          <UpdatePayout />
                        </PrivateRoute>
                      } />
                      <Route path="/invoice/:invoiceNumber" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <InvoiceDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/parents" element={
                        <PrivateRoute roles={['admin']}>
                          <Parents />
                        </PrivateRoute>
                      } />
                      <Route path="/parents/:id" element={
                        <PrivateRoute roles={['admin']}>
                          <ParentDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/caregivers" element={
                        <PrivateRoute roles={['admin']}>
                          <Caregivers />
                        </PrivateRoute>
                      } />
                      <Route path="/caregivers/:id" element={
                        <PrivateRoute roles={['admin']}>
                          <CaregiverDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/leads" element={
                        <PrivateRoute roles={['admin']}>
                          <Leads />
                        </PrivateRoute>
                      } />
                      <Route path="/leads/:id" element={
                        <PrivateRoute roles={['admin']}>
                          <LeadDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/bookings" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <Bookings />
                        </PrivateRoute>
                      } />
                      <Route path="/bookings/:id" element={
                        <PrivateRoute roles={['admin', 'staff']}>
                          <BookingDetail />
                        </PrivateRoute>
                      } />
                      <Route path="/schedule" element={
                        <PrivateRoute roles={['admin']}>
                          <Schedule />
                        </PrivateRoute>
                      } />
                      <Route path="/payouts" element={
                        <PrivateRoute roles={['admin']}>
                          <Payouts />
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
