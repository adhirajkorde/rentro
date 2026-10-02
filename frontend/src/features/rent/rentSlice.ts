import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getRentRecords, createRentRecord, updateRentRecord, getTenantRentHistory } from "../../services/api";

export interface RentRecord {
  _id: string;
  tenant: string;
  property: string;
  agreement: string | null;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "paid" | "unpaid" | "partially-paid" | "overdue" | "waived";
  paymentDate: string | null;
  paymentMethod: "cash" | "upi" | "bank-transfer" | "card" | "other" | null;
  lateFee: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRentRecordValues {
  tenant: string;
  property: string;
  agreement: string | null;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
}

const initialState = {
  rentRecords: [],
  loading: false,
  error: string | null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
};

export const fetchRentRecords = createAsyncThunk(
  "rent/fetchAll",
  async ({ page = 1, limit = 10, filter = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.property) params.set("property", filter.property);
      if (filter.agreement) params.set("agreement", filter.agreement);
      if (filter.status) params.set("status", filter.status);
      if (filter.month) params.set("month", filter.month);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await getRentRecords(`${?params}`);
      return {
        data: result.data?.data || [],
        currentPage: result.data?.page || page,
        totalPages: result.data?.pages || 1,
        totalCount: result.data?.total || 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createRentRecord = createAsyncThunk(
  "rent/create",
  async (rentData: CreateRentRecordValues, { rejectWithValue }) => {
    try {
      const result = await createRentRecord(rentData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateRentRecord = createAsyncThunk(
  "rent/update",
  async ({ id, rentData }: { id: string; rentData: { paidAmount?: number; paymentMethod?: string; notes?: string; status?: string } }, { rejectWithValue }) => {
    try {
      const result = await updateRentRecord({ id, body: rentData });
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getTenantRentHistory = createAsyncThunk(
  "rent/tenantHistory",
  async (tenantId: string, { rejectWithValue }) => {
    try {
      const result = await getTenantRentHistory(tenantId);
      return { data: result.data || [] };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const rentSlice = createSlice({
  name: "rent",
  initialState,
  reducers: {
    setRentFilter(state, action) {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearRentFilter(state) {
      state.filter = {};
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    clearRentError(state) {
      state.error = null;
    },
  },
});

export const { setRentFilter, clearRentFilter, setCurrentPage, clearRentError } = rentSlice.actions;

export default rentReducer;

export type { RentRecord, CreateRentRecordValues };