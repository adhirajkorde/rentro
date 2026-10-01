import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import router from "./routes";
import LoginLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";

const App = () => {
  const isAuthenticated = useAuth();

  return isAuthenticated ? (
    <RouterProvider router={router} />
  ) : (
    <LoginLayout>
      <RouterProvider router={router} />
    </LoginLayout>
  );
};

// Simple auth check hook
const useAuth = () => {
  const { user, isAuthenticated } = useReducer((state: any) => state, {
    user: null,
    isAuthenticated: false,
  });
  
  // In a real app, this would check the Redux store
  return isAuthenticated;
};

export default App;