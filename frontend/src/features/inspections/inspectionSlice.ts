import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getInspections as apiGetInspections,
  createInspection as apiCreateInspection,
  updateInspection as apiUpdateInspection,
} from "../../services/api";

export interface Inspection {
  _id: string;
  property: string;
  tenant: string;
  inspector: string;
  inspectionDate: string;
  type: "move-in" | "move-out" | "routine";
  electricityMeter: number | null;
  waterMeter: number | null;
  gasMeter: number | null;
  generalCondition: "excellent" | "good" | "fair" | "poor";
  walls: "excellent" | "good" | "fair" | "poor";
  floors: "excellent" | "good" | "fair" | "poor";
  doors: "excellent" | "good" | "fair" | "poor";
  windows: "excellent" | "good" | "fair" | "poor";
  kitchen: "excellent" | "good" | "fair" | "poor";
  bathroom: "excellent" | "good" | "fair" | "poor";
  furniture: "excellent" | "good" | "fair" | "poor";
  appliances: "excellent" | "good" | "fair" | "poor";
  otherRemarks: string;
  status: "pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface InspectionFormValues {
  property: string;
  tenant: string;
  inspector: string;
  inspectionDate: string;
  type: "move-in" | "move-out" | "routine";
  electricityMeter: number | null;
  waterMeter: number | null;
  gasMeter: number | null;
  generalCondition: "excellent" | "good" | "fair" | "poor";
  walls: "excellent" | "good" | "fair" | "poor";
  floors: "excellent" | "good" | "fair" | "poor";
  doors: "excellent" | "good" | "fair" | "poor";
  windows: "excellent" | "good" | "fair" | "poor";
  kitchen: "excellent" | "good" | "fair" | "poor";
  bathroom: "excellent" | "good" | "fair" | "poor";
  furniture: "excellent" | "good" | "fair" | "poor";
  appliances: "excellent" | "good" | "fair" | "poor";
  otherRemarks: string;
}

export interface InspectionState {
  inspections: Inspection[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filter: Record<string, any>;
}

const initialState: InspectionState = {
  inspections: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  filter: {},
};

export const fetchInspections = createAsyncThunk(
  "inspections/fetchAll",
  async (arg: { page?: number; limit?: number; filter?: Record<string, any> } | undefined, { rejectWithValue }) => {
    try {
      const page = arg?.page || 1;
      const limit = arg?.limit || 10;
      const filter = arg?.filter || {};

      const params = new URLSearchParams();
      if (filter.property) params.set("property", filter.property);
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.type) params.set("type", filter.type);
      if (filter.status) params.set("status", filter.status);
      if (filter.inspector) params.set("inspector", filter.inspector);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await apiGetInspections(`?${params.toString()}`);
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

export const createInspection = createAsyncThunk(
  "inspections/create",
  async (inspectionData: InspectionFormValues, { rejectWithValue }) => {
    try {
      const result = await apiCreateInspection(inspectionData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateInspection = createAsyncThunk(
  "inspections/update",
  async ({ id, inspectionData }: { id: string; inspectionData: Partial<InspectionFormValues> }, { rejectWithValue }) => {
    try {
      const result = await apiUpdateInspection(id, inspectionData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const inspectionSlice = createSlice({
  name: "inspections",
  initialState,
  reducers: {
    setInspectionFilter(state, action) {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearInspectionFilter(state) {
      state.filter = {};
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    clearInspectionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInspections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInspections.fulfilled, (state, action: any) => {
        state.loading = false;
        state.inspections = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchInspections.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch inspections";
      });
  },
});

export const { setInspectionFilter, clearInspectionFilter, setCurrentPage, clearInspectionError } =
  inspectionSlice.actions;

export default inspectionSlice.reducer;