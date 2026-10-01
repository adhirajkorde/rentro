import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import propertyReducer from "./features/properties/propertySlice";
import tenantReducer from "./features/tenants/tenantSlice";
import agreementReducer from "./features/agreements/agreementSlice";
import rentReducer from "./features/rent/rentSlice";
import notificationReducer from "./features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertyReducer,
    tenants: tenantReducer,
    agreements: agreementReducer,
    rent: rentReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;