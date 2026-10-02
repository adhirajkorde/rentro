import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface ReportStats {
  totalProperties: number;
  availableProperties: number;
  occupiedProperties: number;
  totalTenants: number;
  monthlyExpectedRent: number;
  monthlyCollectedRent: number;
  pendingRent: number;
  overdueRent: number;
  securityDeposits: number;
  expiringAgreements: number;
  pendingDocuments: number;
  pendingInspections: number;
  totalPayments: number;
  totalRefundedDeposits: number;
}

interface ReportFilters {
  property?: string;
  tenant?: string;
  agreement?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

const initialState = {
  stats: {} as ReportStats,
  loading: false,
  error: string | null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setStats(state, action) {
      state.stats = { ...state.stats, ...action.payload };
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { setStats, clearError } = reportsSlice.actions;

export default reportsReducer;

export type { ReportStats, ReportFilters };