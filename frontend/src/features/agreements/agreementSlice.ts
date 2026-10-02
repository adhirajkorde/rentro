import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAgreements, createAgreement, updateAgreement, deleteAgreement, toggleAgreementStatus } from "../../services/api";

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

interface AgreementFormValues {
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

const initialState = {
  agreements: [],
  loading: false,
  error: string | null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
};

export const fetchAgreements = createAsyncThunk(
  "agreements/fetchAll",
  async ({ page = 1, limit = 10, filter = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filter.owner) params.set("owner", filter.owner);
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.property) params.set("property", filter.property);
      if (filter.status) params.set("status", filter.status);
      if (filter.expiring) params.set("expiring", "1");
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await getAgreements(`${?params}`);
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

export const createAgreement = createAsyncThunk(
  "agreements/create",
  async (agreementData: AgreementFormValues, { rejectWithValue }) => {
    try {
      const result = await createAgreement(agreementData);
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
      const result = await updateAgreement({ id }, agreementData);
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
      const result = await deleteAgreement(id);
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
      const result = await toggleAgreementStatus({ id, body: { status } });
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
});

export const { setAgreementFilter, clearAgreementFilter, setCurrentPage, clearAgreementError } =
  agreementSlice.actions;

export default agreementReducer;

export type { Agreement, AgreementFormValues };