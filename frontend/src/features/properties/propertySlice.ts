import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getProperties, createProperty as apiCreateProperty, updateProperty as apiUpdateProperty, deleteProperty as apiDeleteProperty, searchProperties as apiSearchProperties, filterProperties as apiFilterProperties } from "../../services/api";

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

interface PropertyFormValues {
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

const initialState: {
  properties: Property[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filter: {
    type: string;
    status: string;
    city: string;
    state: string;
    minRent: number;
    maxRent: number;
    q: string;
  };
} = {
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
  async ({ page = 1, limit = 10, filter = initialState.filter } = {}, { rejectWithValue }) => {
    try {
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

      const result = await getProperties(`${?params}`);
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

export const createProperty = createAsyncThunk(
  "properties/create",
  async (propertyData: PropertyFormValues, { rejectWithValue }) => {
    try {
      const result = await createProperty(propertyData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProperty = createAsyncThunk(
  "properties/update",
  async ({ id, propertyData }: { id: string; propertyData: PropertyFormValues }, { rejectWithValue }) => {
    try {
      const result = await updateProperty(`${id}`, propertyData);
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
      const result = await deleteProperty(`${id}`);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchProperties = createAsyncThunk(
  "properties/search",
  async (query: string, { rejectWithValue }) => {
    try {
      const result = await searchProperties(`?q=${encodeURIComponent(query)}`);
      return {
        data: result.data || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const filterProperties = createAsyncThunk(
  "properties/filter",
  async (filter: typeof initialState.filter, { rejectWithValue }) => {
    try {
      const result = await filterProperties(filter);
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
});

export const { setPropertyFilter, clearPropertyFilter, setCurrentPage, clearPropertyError } =
  propertySlice.actions;

export default propertyReducer;

export type { Property, PropertyFormValues };