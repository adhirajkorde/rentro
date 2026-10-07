import axios from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem("rentora_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Auth APIs
export const registerUser = async (userData: any) => {
  const { data } = await api.post("/auth/register", userData);
  return data;
};

export const loginUser = async (credentials: any) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

// Property APIs
export const getProperties = async (params: string = "") => {
  const { data } = await api.get(`/properties${params}`);
  return data;
};

export const createProperty = async (propertyData: any) => {
  const { data } = await api.post("/properties", propertyData);
  return data;
};

export const updateProperty = async (id: string, propertyData: any) => {
  const { data } = await api.put(`/properties/${id}`, propertyData);
  return data;
};

export const deleteProperty = async (id: string) => {
  const { data } = await api.delete(`/properties/${id}`);
  return data;
};

// Tenant APIs
export const getTenants = async (params: string = "") => {
  const { data } = await api.get(`/tenants${params}`);
  return data;
};

export const createTenant = async (tenantData: any) => {
  const { data } = await api.post("/tenants", tenantData);
  return data;
};

export const updateTenant = async (id: string, tenantData: any) => {
  const { data } = await api.put(`/tenants/${id}`, tenantData);
  return data;
};

export const deleteTenant = async (id: string) => {
  const { data } = await api.delete(`/tenants/${id}`);
  return data;
};

// Agreement APIs
export const getAgreements = async (params: string = "") => {
  const { data } = await api.get(`/agreements${params}`);
  return data;
};

export const createAgreement = async (agreementData: any) => {
  const { data } = await api.post("/agreements", agreementData);
  return data;
};

export const updateAgreement = async (id: string | { id: string }, agreementData?: any) => {
  const agreementId = typeof id === "object" ? id.id : id;
  const { data } = await api.put(`/agreements/${agreementId}`, agreementData);
  return data;
};

export const deleteAgreement = async (id: string) => {
  const { data } = await api.delete(`/agreements/${id}`);
  return data;
};

export const toggleAgreementStatus = async (arg: { id: string; body?: any; status?: string }) => {
  const body = arg.body || { status: arg.status };
  const { data } = await api.patch(`/agreements/${arg.id}/status`, body);
  return data;
};

// Rent APIs
export const getRentRecords = async (params: string = "") => {
  const { data } = await api.get(`/rent${params}`);
  return data;
};

export const createRentRecord = async (rentData: any) => {
  const { data } = await api.post("/rent", rentData);
  return data;
};

// Payment APIs
export const getPayments = async (params: string = "") => {
  const { data } = await api.get(`/payments${params}`);
  return data;
};

export const recordPayment = async (paymentData: any) => {
  const { data } = await api.post("/payments", paymentData);
  return data;
};

// Inspection APIs
export const getInspections = async (params: string = "") => {
  const { data } = await api.get(`/inspections${params}`);
  return data;
};

export const createInspection = async (inspectionData: any) => {
  const { data } = await api.post("/inspections", inspectionData);
  return data;
};

export const updateInspection = async (id: string, inspectionData: any) => {
  const { data } = await api.put(`/inspections/${id}`, inspectionData);
  return data;
};

export const deleteInspection = async (id: string) => {
  const { data } = await api.delete(`/inspections/${id}`);
  return data;
};

// Document APIs
export const getDocuments = async (params: string = "") => {
  const { data } = await api.get(`/documents${params}`);
  return data;
};

export const uploadDocument = async (documentData: any) => {
  const { data } = await api.post("/documents", documentData);
  return data;
};

export const deleteDocument = async (id: string) => {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
};

// Notification APIs
export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
};

export default api;