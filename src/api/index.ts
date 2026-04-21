import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const HEALTHY_NARA_API_URL = import.meta.env.VITE_HEALTHY_NARA_API_URL || 'https://api.healthynara.com/api/v1';

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

// --- Customer API (External Healthy Nara API) ---
export const fetchCustomers = async () => {
  const { data } = await axios.get(`${HEALTHY_NARA_API_URL}/parent`);
  // Map parentPersona fields to our customer shape
  return data.data.parentPersona.map((p: any) => ({
    _id: p._id,
    name: p.parentName,
    phone: p.contactNumber,
    address: p.address,
    email: '', // external API doesn't provide email
    township: p.township,
    religion: p.religion,
    nearestBusStop: p.nearestBusStop,
    durationOfBusStopToHome: p.durationOfBusStopToHome,
    createdAt: p.createdAt,
  }));
};

export const fetchCustomerById = async (id: string) => {
  const { data } = await axios.get(`${HEALTHY_NARA_API_URL}/parent/${id}`);
  return data.data;
};

export const createCustomer = async (customerData: any) => {
  console.log('Sending customer data:', customerData);
  const { data } = await api.post('/customers', customerData);
  return data;
};

export const deleteCustomer = async (id: string) => {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
};

// --- Caregiver API (External Healthy Nara API) ---
export const fetchCaregivers = async () => {
  const { data } = await axios.get(`${HEALTHY_NARA_API_URL}/caregiver-persona`);
  // Map caregiver fields to our shape
  return data.data.map((c: any) => ({
    _id: c._id,
    name: c.caregiverName,
    phone: c.contactNumber,
    gender: c.gender,
    township: c.township,
    address: c.address,
    NRC: c.NRC,
    birthDate: c.birthDate,
  }));
};

export const createCaregiver = async (caregiverData: any) => {
  const { data } = await api.post('/caregivers', caregiverData);
  return data;
};

export const deleteCaregiver = async (id: string) => {
  const { data } = await api.delete(`/caregivers/${id}`);
  return data;
};

export const fetchLogs = async () => {
  const { data } = await api.get('/logs');
  return data;
};

export default api;
