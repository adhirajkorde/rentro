const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("rentora_token");

export const apiClient = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  // If body is NOT FormData, set application/json
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("rentora_token");
    localStorage.removeItem("rentora_user");
  }

  // Handle binary PDF/blob responses
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf") || contentType.includes("text/csv") || options.responseType === "blob") {
    if (!res.ok) {
      throw new Error(`File download failed: ${res.statusText}`);
    }
    return res.blob();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Helper for trigger file download
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// ================= AUTH APIS =================
export const loginOwner = (credentials) =>
  apiClient("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const registerOwner = (data) =>
  apiClient("/auth/register", { method: "POST", body: JSON.stringify(data) });
export const getMe = () => apiClient("/auth/me");
export const updateProfile = (profileData) =>
  apiClient("/auth/profile", { method: "PUT", body: JSON.stringify(profileData) });
export const changePassword = (passwords) =>
  apiClient("/auth/change-password", { method: "POST", body: JSON.stringify(passwords) });

export const authApi = {
  login: loginOwner,
  register: registerOwner,
  getMe,
  updateProfile,
  changePassword,
};

// ================= DASHBOARD APIS =================
export const getDashboardStats = () => apiClient("/dashboard");
export const dashboardApi = {
  getStats: getDashboardStats,
};

// ================= PROPERTY APIS =================
export const getProperties = (params = "") => apiClient(`/properties${params ? `?${params}` : ""}`);
export const getProperty = (id) => apiClient(`/properties/${id}`);
export const createProperty = (formData) =>
  apiClient("/properties", { method: "POST", body: formData instanceof FormData ? formData : JSON.stringify(formData) });
export const updateProperty = (id, formData) =>
  apiClient(`/properties/${id}`, { method: "PUT", body: formData instanceof FormData ? formData : JSON.stringify(formData) });
export const deleteProperty = (id) => apiClient(`/properties/${id}`, { method: "DELETE" });

export const propertyApi = {
  getAll: (params) => getProperties(params),
  getById: (id) => getProperty(id),
  create: (formData) => createProperty(formData),
  update: (id, formData) => updateProperty(id, formData),
  delete: (id) => deleteProperty(id),
};

// ================= TENANT APIS =================
export const getTenants = (params = "") => apiClient(`/tenants${params ? `?${params}` : ""}`);
export const getTenant = (id) => apiClient(`/tenants/${id}`);
export const createTenant = (data) => apiClient("/tenants", { method: "POST", body: JSON.stringify(data) });
export const updateTenant = (id, data) => apiClient(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTenant = (id) => apiClient(`/tenants/${id}`, { method: "DELETE" });

export const tenantApi = {
  getAll: (params) => getTenants(params),
  getById: (id) => getTenant(id),
  create: (data) => createTenant(data),
  update: (id, data) => updateTenant(id, data),
  delete: (id) => deleteTenant(id),
};

// ================= AGREEMENT APIS =================
export const getAgreements = (params = "") => apiClient(`/agreements${params ? `?${params}` : ""}`);
export const getAgreement = (id) => apiClient(`/agreements/${id}`);
export const createAgreement = (data) => apiClient("/agreements", { method: "POST", body: JSON.stringify(data) });
export const updateAgreement = (id, data) => apiClient(`/agreements/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAgreement = (id) => apiClient(`/agreements/${id}`, { method: "DELETE" });
export const downloadAgreementPdf = async (id, filename = `Rental_Agreement_${id}.pdf`) => {
  const blob = await apiClient(`/agreements/${id}/pdf`, { responseType: "blob" });
  downloadBlob(blob, filename);
  return blob;
};

export const agreementApi = {
  getAll: (params) => getAgreements(params),
  getById: (id) => getAgreement(id),
  create: (data) => createAgreement(data),
  update: (id, data) => updateAgreement(id, data),
  delete: (id) => deleteAgreement(id),
  downloadPdf: (id, filename) => downloadAgreementPdf(id, filename),
  uploadSigned: (id, data) => updateAgreement(id, data),
};

// ================= RENT APIS =================
export const getRentRecords = (params = "") => apiClient(`/rent${params ? `?${params}` : ""}`);
export const getRentRecord = (id) => apiClient(`/rent/${id}`);
export const createRentRecord = (data) => apiClient("/rent", { method: "POST", body: JSON.stringify(data) });
export const updateRentRecord = (id, data) => apiClient(`/rent/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const rentApi = {
  getAll: (params) => getRentRecords(params),
  getById: (id) => getRentRecord(id),
  create: (data) => createRentRecord(data),
  update: (id, data) => updateRentRecord(id, data),
};

// ================= PAYMENT APIS =================
export const getPayments = (params = "") => apiClient(`/payments${params ? `?${params}` : ""}`);
export const recordPayment = (data) => apiClient("/payments", { method: "POST", body: JSON.stringify(data) });
export const downloadPaymentReceipt = async (id, filename = `Rent_Receipt_${id}.pdf`) => {
  const blob = await apiClient(`/payments/${id}/receipt`, { responseType: "blob" });
  downloadBlob(blob, filename);
  return blob;
};

export const paymentApi = {
  getAll: (params) => getPayments(params),
  create: (data) => recordPayment(data),
  downloadReceipt: (id, filename) => downloadPaymentReceipt(id, filename),
};

// ================= INSPECTION APIS =================
export const getInspections = (params = "") => apiClient(`/inspections${params ? `?${params}` : ""}`);
export const getInspection = (id) => apiClient(`/inspections/${id}`);
export const createInspection = (formData) =>
  apiClient("/inspections", { method: "POST", body: formData instanceof FormData ? formData : JSON.stringify(formData) });
export const updateInspection = (id, data) =>
  apiClient(`/inspections/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const addInspectionDamage = (id, damageData) =>
  apiClient(`/inspections/${id}/damages`, { method: "POST", body: JSON.stringify(damageData) });
export const compareInspections = (propertyId) => apiClient(`/inspections/compare/${propertyId}`);

export const inspectionApi = {
  getAll: (params) => getInspections(params),
  getById: (id) => getInspection(id),
  create: (formData) => createInspection(formData),
  update: (id, data) => updateInspection(id, data),
  addDamage: (id, damageData) => addInspectionDamage(id, damageData),
  compare: (propertyId) => compareInspections(propertyId),
};

// ================= DOCUMENT APIS =================
export const getDocuments = (params = "") => apiClient(`/documents${params ? `?${params}` : ""}`);
export const getDocument = (id) => apiClient(`/documents/${id}`);
export const uploadDocument = (formData) =>
  apiClient("/documents", { method: "POST", body: formData instanceof FormData ? formData : JSON.stringify(formData) });
export const updateDocument = (id, data) =>
  apiClient(`/documents/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteDocument = (id) => apiClient(`/documents/${id}`, { method: "DELETE" });

export const documentApi = {
  getAll: (params) => getDocuments(params),
  getById: (id) => getDocument(id),
  create: (formData) => uploadDocument(formData),
  update: (id, data) => updateDocument(id, data),
  delete: (id) => deleteDocument(id),
  verify: (id, data) => updateDocument(id, data),
};

// ================= MAINTENANCE APIS =================
export const getMaintenanceExpenses = (params = "") => apiClient(`/maintenance${params ? `?${params}` : ""}`);
export const createMaintenanceExpense = (formData) =>
  apiClient("/maintenance", { method: "POST", body: formData instanceof FormData ? formData : JSON.stringify(formData) });
export const updateMaintenanceExpense = (id, data) =>
  apiClient(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteMaintenanceExpense = (id) => apiClient(`/maintenance/${id}`, { method: "DELETE" });

export const maintenanceApi = {
  getAll: (params) => getMaintenanceExpenses(params),
  create: (formData) => createMaintenanceExpense(formData),
  update: (id, data) => updateMaintenanceExpense(id, data),
  delete: (id) => deleteMaintenanceExpense(id),
};

// ================= UTILITY APIS =================
export const getUtilityCharges = (params = "") => apiClient(`/utilities${params ? `?${params}` : ""}`);
export const createUtilityCharge = (formData) =>
  apiClient("/utilities", { method: "POST", body: formData instanceof FormData ? formData : JSON.stringify(formData) });
export const updateUtilityCharge = (id, data) =>
  apiClient(`/utilities/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteUtilityCharge = (id) => apiClient(`/utilities/${id}`, { method: "DELETE" });

export const utilityApi = {
  getAll: (params) => getUtilityCharges(params),
  create: (formData) => createUtilityCharge(formData),
  update: (id, data) => updateUtilityCharge(id, data),
  delete: (id) => deleteUtilityCharge(id),
};

// ================= SECURITY DEPOSIT APIS =================
export const getSecurityDeposits = (params = "") => apiClient(`/deposits${params ? `?${params}` : ""}`);
export const getSecurityDeposit = (id) => apiClient(`/deposits/${id}`);
export const createSecurityDeposit = (data) => apiClient("/deposits", { method: "POST", body: JSON.stringify(data) });
export const updateSecurityDeposit = (id, data) => apiClient(`/deposits/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const processFinalSettlement = (id, settlementData) =>
  apiClient(`/deposits/${id}/settle`, { method: "POST", body: JSON.stringify(settlementData) });

export const depositApi = {
  getAll: (params) => getSecurityDeposits(params),
  getById: (id) => getSecurityDeposit(id),
  create: (data) => createSecurityDeposit(data),
  update: (id, data) => updateSecurityDeposit(id, data),
  settle: (id, settlementData) => processFinalSettlement(id, settlementData),
};

// ================= REPORT APIS =================
export const getReportsSummary = () => apiClient("/reports/summary");
export const exportReportCsv = async (type = "summary", filename = `Report_${type}.csv`) => {
  const blob = await apiClient(`/reports/export?type=${type}`, { responseType: "blob" });
  downloadBlob(blob, filename);
  return blob;
};

export const reportApi = {
  getSummary: getReportsSummary,
  downloadCsv: (type, filename) => exportReportCsv(type, filename),
};

// ================= NOTIFICATION APIS =================
export const getNotifications = (params = "") => apiClient(`/notifications${params ? `?${params}` : ""}`);
export const markNotificationRead = (id) => apiClient(`/notifications/${id}/read`, { method: "PUT" });
export const markAllNotificationsRead = () => apiClient("/notifications/read-all", { method: "PUT" });

export const notificationApi = {
  getAll: getNotifications,
  markRead: markNotificationRead,
  markAllRead: markAllNotificationsRead,
};

// ================= UPLOAD API =================
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient("/upload", { method: "POST", body: formData });
};
