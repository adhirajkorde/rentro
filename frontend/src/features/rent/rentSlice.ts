import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getRentRecords as apiGetRentRecords,
  createRentRecord as apiCreateRentRecord,
} from "../../services/api";

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

export interface CreateRentRecordValues {
  tenant: string;
  property: string;
  agreement: string | null;
  billingMonth: string;
  dueDate: string;
  rentAmount: number;
}

export interface RentState {
  rentRecords: RentRecord[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filter: Record<string, any>;
}

const initialState: RentState = {
  rentRecords: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  filter: {},
};

export const fetchRentRecords = createAsyncThunk(
  "rent/fetchAll",
  async (arg: { page?: number; limit?: number; filter?: Record<string, any> } | undefined, { rejectWithValue }) => {
    try {
      const page = arg?.page || 1;
      const limit = arg?.limit || 10;
      const filter = arg?.filter || {};

      const params = new URLSearchParams();
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.property) params.set("property", filter.property);
      if (filter.agreement) params.set("agreement", filter.agreement);
      if (filter.status) params.set("status", filter.status);
      if (filter.month) params.set("month", filter.month);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await apiGetRentRecords(`?${params.toString()}`);
      return {
        data: result.data?.data || result.data || [],
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
      const result = await apiCreateRentRecord(rentData);
      return result.data;
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchRentRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRentRecords.fulfilled, (state, action: any) => {
        state.loading = false;
        state.rentRecords = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchRentRecords.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch rent records";
      });
  },
});

export const { setRentFilter, clearRentFilter, setCurrentPage, clearRentError } = rentSlice.actions;

export default rentSlice.reducer;