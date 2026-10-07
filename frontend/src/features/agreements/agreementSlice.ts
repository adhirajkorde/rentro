import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAgreements as apiGetAgreements,
  createAgreement as apiCreateAgreement,
  updateAgreement as apiUpdateAgreement,
  deleteAgreement as apiDeleteAgreement,
  toggleAgreementStatus as apiToggleAgreementStatus,
} from "../../services/api";

export interface Agreement {
  _id: string;
  owner: string;
  tenant: string;
  property: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  noticePeriod: number;
  maintenanceResponsibility: string;
  utilityResponsibility: string;
  termsAndConditions: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementFormValues {
  tenant: string;
  property: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  noticePeriod: number;
  maintenanceResponsibility: string;
  utilityResponsibility: string;
  termsAndConditions: string;
}

export interface AgreementState {
  agreements: Agreement[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filter: Record<string, any>;
}

const initialState: AgreementState = {
  agreements: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  filter: {},
};

export const fetchAgreements = createAsyncThunk(
  "agreements/fetchAll",
  async (arg: { page?: number; limit?: number; filter?: Record<string, any> } | undefined, { rejectWithValue }) => {
    try {
      const page = arg?.page || 1;
      const limit = arg?.limit || 10;
      const filter = arg?.filter || {};

      const params = new URLSearchParams();
      if (filter.owner) params.set("owner", filter.owner);
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.property) params.set("property", filter.property);
      if (filter.status) params.set("status", filter.status);
      if (filter.expiring) params.set("expiring", "1");
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await apiGetAgreements(`?${params.toString()}`);
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

export const createAgreement = createAsyncThunk(
  "agreements/create",
  async (agreementData: AgreementFormValues, { rejectWithValue }) => {
    try {
      const result = await apiCreateAgreement(agreementData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAgreement = createAsyncThunk(
  "agreements/update",
  async ({ id, agreementData }: { id: string; agreementData: AgreementFormValues }, { rejectWithValue }) => {
    try {
      const result = await apiUpdateAgreement(id, agreementData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAgreement = createAsyncThunk(
  "agreements/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await apiDeleteAgreement(id);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleAgreementStatus = createAsyncThunk(
  "agreements/toggleStatus",
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const result = await apiToggleAgreementStatus({ id, status });
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const agreementSlice = createSlice({
  name: "agreements",
  initialState,
  reducers: {
    setAgreementFilter(state, action) {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearAgreementFilter(state) {
      state.filter = {};
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    clearAgreementError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgreements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgreements.fulfilled, (state, action: any) => {
        state.loading = false;
        state.agreements = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchAgreements.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch agreements";
      });
  },
});

export const { setAgreementFilter, clearAgreementFilter, setCurrentPage, clearAgreementError } =
  agreementSlice.actions;

export default agreementSlice.reducer;