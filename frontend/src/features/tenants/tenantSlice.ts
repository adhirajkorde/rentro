import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTenants, createTenant, updateTenant, deleteTenant, searchTenants, filterTenants } from "../../services/api";

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

interface TenantFormValues {
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

const initialState = {
  tenants: [],
  loading: false,
  error: string | null,
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
  async ({ page = 1, limit = 10, filter = initialState.filter } = {}, { rejectWithValue }) => {
    try {
      const result = await getTenants({
        page: String(page),
        limit: String(limit),
        status: filter.status,
        property: filter.property,
      });
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

export const createTenant = createAsyncThunk(
  "tenants/create",
  async (tenantData: TenantFormValues, { rejectWithValue }) => {
    try {
      const result = await createTenant(tenantData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateTenant = createAsyncThunk(
  "tenants/update",
  async ({ id, tenantData }: { id: string; tenantData: TenantFormValues }, { rejectWithValue }) => {
    try {
      const result = await updateTenant({ id }, { ...tenantData });
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
      const result = await deleteTenant(id);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchTenants = createAsyncThunk(
  "tenants/search",
  async (query: string, { rejectWithValue }) => {
    try {
      const result = await searchTenants(`?q=${encodeURIComponent(query)}`);
      return { data: result.data || [] };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const filterTenants = createAsyncThunk(
  "tenants/filter",
  async (filter: typeof initialState.filter, { rejectWithValue }) => {
    try {
      const result = await filterTenants(filter);
      return {
        data: result.data || [],
        currentPage: 1,
        totalPages: 1,
        totalCount: result.data?.length || 0,
      };
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
});

export const { setTenantFilter, clearTenantFilter, setCurrentPage, clearTenantError } = tenantSlice.actions;

export default tenantReducer;

export type { Tenant, TenantFormValues };