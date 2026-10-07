import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProperties as apiGetProperties,
  createProperty as apiCreateProperty,
  updateProperty as apiUpdateProperty,
  deleteProperty as apiDeleteProperty,
} from "../../services/api";

export interface Property {
  _id: string;
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishingStatus: string;
  monthlyRent: number;
  securityDeposit: number;
  maintenanceCharge: number;
  electricityDetails: string;
  waterDetails: string;
  owner: string;
  propertyManager: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFormValues {
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishingStatus: string;
  monthlyRent: number;
  securityDeposit: number;
  maintenanceCharge: number;
  electricityDetails: string;
  waterDetails: string;
  propertyManager: string;
  status: string;
}

export interface PropertyState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filter: Record<string, any>;
}

const initialState: PropertyState = {
  properties: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  filter: {
    type: "",
    status: "",
    city: "",
    state: "",
    minRent: 0,
    maxRent: 0,
    q: "",
  },
};

export const fetchProperties = createAsyncThunk(
  "properties/fetchAll",
  async (arg: { page?: number; limit?: number; filter?: Record<string, any> } | undefined, { rejectWithValue }) => {
    try {
      const page = arg?.page || 1;
      const limit = arg?.limit || 10;
      const filter = arg?.filter || initialState.filter;

      const params = new URLSearchParams();
      if (filter.q) params.set("q", filter.q);
      if (filter.type) params.set("type", filter.type);
      if (filter.status) params.set("status", filter.status);
      if (filter.city) params.set("city", filter.city);
      if (filter.state) params.set("state", filter.state);
      if (filter.minRent) params.set("minRent", String(filter.minRent));
      if (filter.maxRent) params.set("maxRent", String(filter.maxRent));
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await apiGetProperties(`?${params.toString()}`);
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

export const createProperty = createAsyncThunk(
  "properties/create",
  async (propertyData: PropertyFormValues, { rejectWithValue }) => {
    try {
      const result = await apiCreateProperty(propertyData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProperty = createAsyncThunk(
  "properties/update",
  async ({ id, propertyData }: { id: string; propertyData: Partial<PropertyFormValues> }, { rejectWithValue }) => {
    try {
      const result = await apiUpdateProperty(id, propertyData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteProperty = createAsyncThunk(
  "properties/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await apiDeleteProperty(id);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const propertySlice = createSlice({
  name: "properties",
  initialState,
  reducers: {
    setPropertyFilter(state, action) {
      state.filter = { ...state.filter, ...action.payload };
      state.currentPage = 1;
    },
    clearPropertyFilter(state) {
      state.filter = { ...initialState.filter };
      state.currentPage = 1;
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    clearPropertyError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action: any) => {
        state.loading = false;
        state.properties = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchProperties.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch properties";
      });
  },
});

export const { setPropertyFilter, clearPropertyFilter, setCurrentPage, clearPropertyError } =
  propertySlice.actions;

export default propertySlice.reducer;