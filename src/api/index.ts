import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap standard API format { success, message, data } → just data
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials: any) => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

export const fetchMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const fetchInvoices = async (params = {}) => {
  const { data } = await api.get('/invoices', { params });
  return data;
};

export const fetchInvoiceByNumber = async (invoiceNumber: string) => {
  const { data } = await api.get(`/invoices/${invoiceNumber}`);
  return data;
};

export const createInvoice = async (invoiceData: any) => {
  const { data } = await api.post('/invoices', invoiceData);
  return data;
};

export const updateCustomerPayment = async (invoiceNumber: string, paymentData: any) => {
  const { data } = await api.post(`/invoices/${invoiceNumber}/payments`, paymentData);
  return data;
};

export const updateCaregiverPayout = async (invoiceNumber: string, payoutData: any) => {
  const { data } = await api.post(`/invoices/${invoiceNumber}/payouts`, payoutData);
  return data;
};

export const updateInvoiceStatus = async (invoiceNumber: string, statusData: any) => {
  const { data } = await api.patch(`/invoices/${invoiceNumber}/status`, statusData);
  return data;
};

export const updateInvoice = async (invoiceNumber: string, invoiceData: any) => {
  const { data } = await api.put(`/invoices/${invoiceNumber}`, invoiceData);
  return data;
};

export const deleteInvoice = async (invoiceNumber: string) => {
  const { data } = await api.delete(`/invoices/${invoiceNumber}`);
  return data;
};

export const fetchStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};

// --- Parent API (local MongoDB) ---
export const fetchParents = async () => {
  const { data } = await api.get('/parents');
  return data;
};

export const fetchParentById = async (id: string) => {
  const { data } = await api.get(`/parents/${id}`);
  return data;
};

export const fetchParentBookings = async (id: string) => {
  const { data } = await api.get(`/parents/${id}/bookings`);
  return data;
};

export const createParent = async (parentData: any) => {
  const { data } = await api.post('/parents', parentData);
  return data;
};

export const updateParent = async (id: string, parentData: any) => {
  const { data } = await api.put(`/parents/${id}`, parentData);
  return data;
};

export const deleteParent = async (id: string) => {
  const { data } = await api.delete(`/parents/${id}`);
  return data;
};

// --- Caregiver API (local MongoDB) ---
export const fetchCaregivers = async () => {
  const { data } = await api.get('/caregivers');
  return data;
};

export const fetchCaregiverById = async (id: string) => {
  const { data } = await api.get(`/caregivers/${id}`);
  return data;
};

export const createCaregiver = async (caregiverData: any) => {
  const { data } = await api.post('/caregivers', caregiverData);
  return data;
};

export const updateCaregiver = async (id: string, caregiverData: any) => {
  const { data } = await api.put(`/caregivers/${id}`, caregiverData);
  return data;
};

export const deleteCaregiver = async (id: string) => {
  const { data } = await api.delete(`/caregivers/${id}`);
  return data;
};

export const fetchCaregiverStats = async (id: string) => {
  const { data } = await api.get(`/caregivers/${id}/stats`);
  return data;
};

export const fetchLogs = async () => {
  const { data } = await api.get('/logs');
  return data;
};

// --- Lead API ---
export const fetchLeads = async (stage?: string) => {
  const params = stage ? { stage } : {};
  const { data } = await api.get('/leads', { params });
  return data;
};

export const fetchLeadById = async (id: string) => {
  const { data } = await api.get(`/leads/${id}`);
  return data;
};

export const createLead = async (leadData: any) => {
  const { data } = await api.post('/leads', leadData);
  return data;
};

export const updateLead = async (id: string, leadData: any) => {
  const { data } = await api.put(`/leads/${id}`, leadData);
  return data;
};

export const updateLeadStage = async (id: string, stage: string, lostReason?: string) => {
  const { data } = await api.patch(`/leads/${id}/stage`, { stage, lostReason });
  return data;
};

export const addConversationLog = async (id: string, note: string) => {
  const { data } = await api.post(`/leads/${id}/logs`, { note });
  return data;
};

export const updateConversationLog = async (leadId: string, logId: string, note: string) => {
  const { data } = await api.put(`/leads/${leadId}/logs/${logId}`, { note });
  return data;
};

export const deleteConversationLog = async (leadId: string, logId: string) => {
  const { data } = await api.delete(`/leads/${leadId}/logs/${logId}`);
  return data;
};

export const convertLead = async (id: string, convertData: any) => {
  const { data } = await api.post(`/leads/${id}/convert`, convertData);
  return data;
};

export const deleteLead = async (id: string) => {
  const { data } = await api.delete(`/leads/${id}`);
  return data;
};

// --- Booking API ---
export const fetchBookings = async (status?: string) => {
  const params = status ? { status } : {};
  const { data } = await api.get('/bookings', { params });
  return data;
};

export const fetchBookingsByLead = async (leadId: string) => {
  const { data } = await api.get('/bookings', { params: { leadId } });
  return data;
};

export const fetchBookingById = async (id: string) => {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
};

export const createBooking = async (bookingData: any) => {
  const { data } = await api.post('/bookings', bookingData);
  return data;
};

export const createBookingFromParent = async (parentData: any) => {
  const { data } = await api.post('/bookings/from-parent', parentData);
  return data;
};

export const updateBooking = async (id: string, bookingData: any) => {
  const { data } = await api.put(`/bookings/${id}`, bookingData);
  return data;
};

export const assignBookingNA = async (id: string, caregiverId: string) => {
  const { data } = await api.patch(`/bookings/${id}/assign`, { caregiverId });
  return data;
};

export const updateBookingStatus = async (id: string, status: string) => {
  const { data } = await api.patch(`/bookings/${id}/status`, { status });
  return data;
};

export const matchCaregivers = async (id: string) => {
  const { data } = await api.get(`/bookings/${id}/match`);
  return data;
};

export const generateInvoiceFromBooking = async (id: string, invoiceData: any) => {
  const { data } = await api.post(`/bookings/${id}/generate-invoice`, invoiceData);
  return data;
};

export const deleteBooking = async (id: string) => {
  const { data } = await api.delete(`/bookings/${id}`);
  return data;
};

// --- Public Booking API (no auth) ---
export const fetchPublicBooking = async (token: string) => {
  const { data } = await api.get(`/bookings/public/${token}`);
  return data;
};

export const updatePublicBookingParent = async (token: string, parentData: any) => {
  const { data } = await api.put(`/bookings/public/${token}/parent`, parentData);
  return data;
};

export const selectBookingNA = async (token: string, caregiverId: string) => {
  const { data } = await api.post(`/bookings/public/${token}/select`, { caregiverId });
  return data;
};

export const fetchPublicBookingChildren = async (token: string) => {
  const { data } = await api.get(`/bookings/public/${token}/children`);
  return data;
};

export const addPublicBookingChild = async (token: string, childData: any) => {
  const { data } = await api.post(`/bookings/public/${token}/children`, childData);
  return data;
};

export const deletePublicBookingChild = async (token: string, index: number) => {
  const { data } = await api.delete(`/bookings/public/${token}/children/${index}`);
  return data;
};

export const updatePublicBookingDetails = async (token: string, detailsData: any) => {
  const { data } = await api.put(`/bookings/public/${token}/details`, detailsData);
  return data;
};

// --- Schedule API ---
export const fetchSchedule = async () => {
  const { data } = await api.get('/schedule');
  return data;
};

export const fetchCaregiverAvailability = async (id: string) => {
  const { data } = await api.get(`/caregivers/${id}/availability`);
  return data;
};

// --- Invoice Lock/Unlock API ---
export const lockInvoice = async (invoiceNumber: string) => {
  const { data } = await api.patch(`/invoices/${invoiceNumber}/lock`);
  return data;
};

export const unlockInvoice = async (invoiceNumber: string) => {
  const { data } = await api.patch(`/invoices/${invoiceNumber}/unlock`);
  return data;
};

// --- Payout Summary API ---
export const fetchPayoutSummary = async () => {
  const { data } = await api.get('/payouts/summary');
  return data;
};

export const fetchFinancialReport = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const { data } = await api.get(`/reports/financial?${params.toString()}`);
  return data;
};

// --- NA API (separate auth) ---
const naApi = axios.create({
  baseURL: API_BASE_URL,
});

naApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('na_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

naApi.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export const naLogin = async (credentials: { username: string; password: string }) => {
  const { data } = await naApi.post('/na/auth/login', credentials);
  return data;
};

export const fetchNAMe = async () => {
  const { data } = await naApi.get('/na/auth/me');
  return data;
};

export const changeNAPassword = async (passwords: { currentPassword: string; newPassword: string }) => {
  const { data } = await naApi.put('/na/auth/change-password', passwords);
  return data;
};

export const startNADuty = async (bookingId: string) => {
  const { data } = await naApi.post('/na/duty/start', { bookingId });
  return data;
};

export const finishNADuty = async (dutyLogId: string) => {
  const { data } = await naApi.post('/na/duty/finish', { dutyLogId });
  return data;
};

export const getNADutyStatus = async () => {
  const { data } = await naApi.get('/na/duty/status');
  return data;
};

export const createNAReport = async (reportData: any) => {
  const { data } = await naApi.post('/na/reports', reportData);
  return data;
};

export const getNAReports = async (params?: { date?: string }) => {
  const { data } = await naApi.get('/na/reports', { params });
  return data;
};

export const getNAReportById = async (id: string) => {
  const { data } = await naApi.get(`/na/reports/${id}`);
  return data;
};

export const updateNAReport = async (id: string, reportData: any) => {
  const { data } = await naApi.put(`/na/reports/${id}`, reportData);
  return data;
};

export const deleteNAReport = async (id: string) => {
  const { data } = await naApi.delete(`/na/reports/${id}`);
  return data;
};

// --- Admin NA API ---
export const getAdminNAReports = async (params?: { date?: string; caregiverId?: string; status?: string }) => {
  const { data } = await api.get('/admin/na-reports', { params });
  return data;
};

export const getAdminNAReportById = async (id: string) => {
  const { data } = await api.get(`/admin/na-reports/${id}`);
  return data;
};

export const getAdminDutyLogs = async (params?: { date?: string; caregiverId?: string }) => {
  const { data } = await api.get('/admin/duty-logs', { params });
  return data;
};

// --- Family API (public) ---
export const getFamilyReports = async (token: string) => {
  const { data } = await api.get(`/family/${token}/reports`);
  return data;
};

export const getFamilyReportByDate = async (token: string, date: string) => {
  const { data } = await api.get(`/family/${token}/reports/${date}`);
  return data;
};

export default api;
