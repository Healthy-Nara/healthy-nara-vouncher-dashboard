import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import UpdatePayment from './pages/UpdatePayment';
import UpdatePayout from './pages/UpdatePayout';
import InvoiceDetail from './pages/InvoiceDetail';
import Customers from './pages/Customers';
import Caregivers from './pages/Caregivers';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
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
                <Route path="/customers" element={
                  <PrivateRoute roles={['admin']}>
                    <Customers />
                  </PrivateRoute>
                } />
                <Route path="/caregivers" element={
                  <PrivateRoute roles={['admin']}>
                    <Caregivers />
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
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
