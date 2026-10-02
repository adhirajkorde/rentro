import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDocuments, createDocument, updateDocument, deleteDocument } from "../../services/api";

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

interface DocumentFormValues {
  tenant: string;
  documentType: "aadhaar" | "pan" | "passport" | "driving-license" | "other";
  documentNumber: string;
  fileUrl: string;
  publicId: string;
  expiryDate: string | null;
}

const initialState = {
  documents: [],
  loading: false,
  error: string | null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
};

export const fetchDocuments = createAsyncThunk(
  "documents/fetchAll",
  async ({ page = 1, limit = 10, filter = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filter.tenant) params.set("tenant", filter.tenant);
      if (filter.type) params.set("type", filter.type);
      if (filter.status) params.set("status", filter.status);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const result = await getDocuments(`${?params}`);
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

export const createDocument = createAsyncThunk(
  "documents/create",
  async (documentData: DocumentFormValues, { rejectWithValue }) => {
    try {
      const result = await createDocument(documentData);
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateDocument = createAsyncThunk(
  "documents/update",
  async ({ id, documentData }: { id: string; documentData: Partial<DocumentFormValues> }, { rejectWithValue }) => {
    try {
      const result = await updateDocument({ id }, documentData);
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
      const result = await deleteDocument(id);
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
});

export const { setDocumentFilter, clearDocumentFilter, setCurrentPage, clearDocumentError } =
  documentSlice.actions;

export default documentReducer;

export type { KycDocument, DocumentFormValues };