import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getTenants as apiGetTenants,
  createTenant as apiCreateTenant,
  updateTenant as apiUpdateTenant,
  deleteTenant as apiDeleteTenant,
} from "../../services/api";

export interface Tenant {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  address: string;
  emergencyContact: { name: string; phone: string };
  familyOccupantDetails: string;
  moveInDate: string | null;
  moveOutDate: string | null;
  currentProperty: string | null;
  previousRentalHistory: Array<{ property: string; duration: string; reason: string }>;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFormValues {
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  address: string;
  emergencyContact: { name: string; phone: string };
  familyOccupantDetails: string;
  moveInDate: string | null;
  moveOutDate: string | null;
  currentProperty: string | null;
}

export interface TenantState {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filter: Record<string, any>;
}

const initialState: TenantState = {
  tenants: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  filter: {
    status: "",
    property: "",
  },
};

export const fetchTenants = createAsyncThunk(
  "tenants/fetchAll",
  async (arg: { page?: number; limit?: number; filter?: Record<string, any> } | undefined, { rejectWithValue }) => {
    try {
      const page = arg?.page || 1;
      const limit = arg?.limit || 10;
      const filter = arg?.filter || initialState.filter;

      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.property) params.set("property", filter.property);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await apiGetTenants(`?${params.toString()}`);
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

export const createTenant = createAsyncThunk(
  "tenants/create",
  async (tenantData: TenantFormValues, { rejectWithValue }) => {
    try {
      const result = await apiCreateTenant(tenantData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateTenant = createAsyncThunk(
  "tenants/update",
  async ({ id, tenantData }: { id: string; tenantData: Partial<TenantFormValues> }, { rejectWithValue }) => {
    try {
      const result = await apiUpdateTenant(id, tenantData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteTenant = createAsyncThunk(
  "tenants/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await apiDeleteTenant(id);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const tenantSlice = createSlice({
  name: "tenants",
  initialState,
  reducers: {
    setTenantFilter(state, action) {
      state.filter = { ...state.filter, ...action.payload };
      state.currentPage = 1;
    },
    clearTenantFilter(state) {
      state.filter = { ...initialState.filter };
      state.currentPage = 1;
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    clearTenantError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action: any) => {
        state.loading = false;
        state.tenants = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchTenants.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tenants";
      });
  },
});

export const { setTenantFilter, clearTenantFilter, setCurrentPage, clearTenantError } = tenantSlice.actions;

export default tenantSlice.reducer;