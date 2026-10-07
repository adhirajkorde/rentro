import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDocuments as apiGetDocuments,
  uploadDocument as apiUploadDocument,
  deleteDocument as apiDeleteDocument,
} from "../../services/api";

export interface KycDocument {
  _id: string;
  tenant: string;
  documentType: "aadhaar" | "pan" | "passport" | "driving-license" | "other";
  documentNumber: string;
  documentNumberMasked: string;
  fileUrl: string;
  publicId: string;
  uploadedAt: string;
  expiryDate: string | null;
  verificationStatus: "pending" | "verified" | "rejected" | "expired";
  verifiedBy: string | null;
  verifiedAt: string | null;
  notes: string;
}

export interface DocumentFormValues {
  tenant: string;
  documentType: "aadhaar" | "pan" | "passport" | "driving-license" | "other";
  documentNumber: string;
  fileUrl: string;
  publicId: string;
  expiryDate: string | null;
}

export interface DocumentState {
  documents: KycDocument[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filter: Record<string, any>;
}

const initialState: DocumentState = {
  documents: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  filter: {},
};

export const fetchDocuments = createAsyncThunk(
  "documents/fetchAll",
  async (arg: { page?: number; limit?: number; filter?: Record<string, any> } | undefined, { rejectWithValue }) => {
    try {
      const page = arg?.page || 1;
      const limit = arg?.limit || 10;
      const filter = arg?.filter || {};

      const params = new URLSearchParams();
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.type) params.set("type", filter.type);
      if (filter.status) params.set("status", filter.status);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await apiGetDocuments(`?${params.toString()}`);
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

export const createDocument = createAsyncThunk(
  "documents/create",
  async (documentData: DocumentFormValues, { rejectWithValue }) => {
    try {
      const result = await apiUploadDocument(documentData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documents/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await apiDeleteDocument(id);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const documentSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    setDocumentFilter(state, action) {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearDocumentFilter(state) {
      state.filter = {};
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    clearDocumentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action: any) => {
        state.loading = false;
        state.documents = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchDocuments.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch documents";
      });
  },
});

export const { setDocumentFilter, clearDocumentFilter, setCurrentPage, clearDocumentError } =
  documentSlice.actions;

export default documentSlice.reducer;