import { createSlice } from "@reduxjs/toolkit";

export interface ReportStats {
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

export interface ReportFilters {
  property?: string;
  tenant?: string;
  agreement?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ReportsState {
  stats: Partial<ReportStats>;
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  stats: {},
  loading: false,
  error: null,
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

export default reportsSlice.reducer;