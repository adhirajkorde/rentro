import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For cookies/auth
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("rentora_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth
      localStorage.removeItem("rentora_token");
    }
    return Promise.reject(error);
  }
);

// Property APIs
export const getProperties = async () => {
  const { data } = await api.get("/properties");
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
export const getTenants = async () => {
  const { data } = await api.get("/tenants");
  return data;
};

export const createTenant = async (tenantData: any) => {
  const { data } = await api.post("/tenants", tenantData);
  return data;
};

// Agreement APIs
export const getAgreements = async () => {
  const { data } = await api.get("/agreements");
  return data;
};

export const createAgreement = async (agreementData: any) => {
  const { data } = await api.post("/agreements", agreementData);
  return data;
};

// Rent APIs
export const getRentRecords = async () => {
  const { data } = await api.get("/rent");
  return data;
};

export const createRentRecord = async (rentData: any) => {
  const { data } = await api.post("/rent", rentData);
  return data;
};

// Payment APIs
export const getPayments = async () => {
  const { data } = await api.get("/payments");
  return data;
};

export const recordPayment = async (paymentData: any) => {
  const { data } = await api.post("/payments", paymentData);
  return data;
};

// Inspection APIs
export const getInspections = async () => {
  const { data } = await api.get("/inspections");
  return data;
};

export const createInspection = async (inspectionData: any) => {
  const { data } = await api.post("/inspections", inspectionData);
  return data;
};

// Document APIs
export const getDocuments = async () => {
  const { data } = await api.get("/documents");
  return data;
};

export const uploadDocument = async (documentData: any) => {
  const { data } = await api.post("/documents", documentData);
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