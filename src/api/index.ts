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

export const fetchStats = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const { data } = await api.get(`/stats?${params.toString()}`);
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

export const importParents = async (parents: any[]) => {
  const { data } = await api.post('/parents/import', { parents });
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

export const createPublicBooking = async (bookingData: any) => {
  const { data } = await api.post('/bookings/public/new-booking', bookingData);
  return data;
};

export const importBookings = async (bookings: any[]) => {
  const { data } = await api.post('/bookings/import', { bookings });
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

// --- Expense API ---
export const fetchExpenses = async () => {
  const { data } = await api.get('/expenses');
  return data;
};
export const createExpense = async (expenseData: any) => {
  const { data } = await api.post('/expenses', expenseData);
  return data;
};
export const updateExpense = async (id: string, expenseData: any) => {
  const { data } = await api.put(`/expenses/${id}`, expenseData);
  return data;
};
export const deleteExpense = async (id: string) => {
  const { data } = await api.delete(`/expenses/${id}`);
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

export const generateNAReportAISummary = async (id: string) => {
  const { data } = await api.post(`/admin/na-reports/${id}/ai-summary`);
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

// --- Ticket API ---
export const fetchTickets = async (params?: { search?: string; status?: string }) => {
  const { data } = await api.get('/tickets', { params });
  return data;
};

export const fetchTicketById = async (id: string) => {
  const { data } = await api.get(`/tickets/${id}`);
  return data;
};

export const createTicket = async (ticketData: any) => {
  const { data } = await api.post('/tickets', ticketData);
  return data;
};

export const assignTicket = async (id: string, userId: string | undefined) => {
  const { data } = await api.put(`/tickets/${id}/assign`, { userId });
  return data;
};

export const updateTicketStatus = async (id: string, status: string) => {
  const { data } = await api.put(`/tickets/${id}/status`, { status });
  return data;
};

export const addTicketComment = async (id: string, message: string) => {
  const { data } = await api.post(`/tickets/${id}/comments`, { message });
  return data;
};

export const fetchTicketUsers = async () => {
  const { data } = await api.get('/tickets/users');
  return data;
};

export const deleteTicket = async (id: string) => {
  const { data } = await api.delete(`/tickets/${id}`);
  return data;
};

// --- Team / Users API (admin) ---
export const fetchUsers = async () => {
  const { data } = await api.get('/users');
  return data;
};

export const createUser = async (userData: { username: string; password: string; role?: string }) => {
  const { data } = await api.post('/users', userData);
  return data;
};

export const updateUser = async (id: string, userData: { role?: string; isActive?: boolean; telegramChatId?: string }) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data;
};

export const resetUserPassword = async (id: string, newPassword: string) => {
  const { data } = await api.put(`/users/${id}/password`, { newPassword });
  return data;
};

// --- Blog API ---
export interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  category: string;
  tags?: string[];
  author?: string;
  authorName?: string;
  status: "Draft" | "Published" | "Archived";
  isFeatured?: boolean;
  publishedAt?: string;
  readTimeMinutes?: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  blogs: BlogItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
  };
}

export const fetchBlogs = async (params: Record<string, any> = {}): Promise<BlogListResponse> => {
  const { data } = await api.get('/blogs', { params });
  return data;
};

export const fetchBlogById = async (idOrSlug: string): Promise<BlogItem> => {
  const { data } = await api.get(`/blogs/${idOrSlug}`);
  return data;
};

export const createBlog = async (blogData: Partial<BlogItem>): Promise<BlogItem> => {
  const { data } = await api.post('/blogs', blogData);
  return data;
};

export const updateBlog = async (id: string, blogData: Partial<BlogItem>): Promise<BlogItem> => {
  const { data } = await api.put(`/blogs/${id}`, blogData);
  return data;
};

export const updateBlogStatus = async (id: string, status: "Draft" | "Published" | "Archived"): Promise<BlogItem> => {
  const { data } = await api.patch(`/blogs/${id}/status`, { status });
  return data;
};

export const deleteBlog = async (id: string): Promise<void> => {
  const { data } = await api.delete(`/blogs/${id}`);
  return data;
};

export default api;

