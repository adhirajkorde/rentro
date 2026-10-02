import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getInspections, createInspection, updateInspection, getPropertyInspections } from "../../services/api";

export interface InspectionMedia {
  _id: string;
  inspection: string;
  url: string;
  type: "photo" | "video";
  caption: string;
  order: number;
  publicId: string;
  createdAt: string;
}

export interface DamageRecord {
  _id: string;
  inspection: string;
  item: string;
  description: string;
  previousCondition: "excellent" | "good" | "fair" | "poor";
  currentCondition: "excellent" | "good" | "fair" | "poor" | null;
  repairRequired: boolean;
  estimatedCost: number;
  deductionAmount: number;
  notes: string;
  createdAt: string;
}

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

interface InspectionFormValues {
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

const initialState = {
  inspections: [],
  loading: false,
  error: string | null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
};

export const fetchInspections = createAsyncThunk(
  "inspections/fetchAll",
  async ({ page = 1, limit = 10, filter = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filter.property) params.set("property", filter.property);
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.type) params.set("type", filter.type);
      if (filter.status) params.set("status", filter.status);
      if (filter.inspector) params.set("inspector", filter.inspector);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await getInspections(`${?params}`);
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

export const createInspection = createAsyncThunk(
  "inspections/create",
  async (inspectionData: InspectionFormValues, { rejectWithValue }) => {
    try {
      const result = await createInspection(inspectionData);
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
      const result = await updateInspection({ id }, inspectionData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPropertyInspections = createAsyncThunk(
  "inspections/property",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const result = await getPropertyInspections(propertyId);
      return { data: result.data || [] };
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
});

export const { setInspectionFilter, clearInspectionFilter, setCurrentPage, clearInspectionError } =
  inspectionSlice.actions;

export default inspectionReducer;

export type { Inspection, InspectionFormValues, InspectionMedia, DamageRecord };