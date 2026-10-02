import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Agreements from "./pages/Agreements";
import Rent from "./pages/Rent";
import Inspections from "./pages/Inspections";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import SecurityDeposits from "./pages/SecurityDeposits";

// Removed: Tenants, Register (owner-only app)

export default createBrowserRouter({
  routes: [
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/auth/login",
      element: <Login />,
    },
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/properties",
      element: <Properties />,
    },
    {
      path: "/agreements",
      element: <Agreements />,
    },
    {
      path: "/rent",
      element: <Rent />,
    },
    {
      path: "/inspections",
      element: <Inspections />,
    },
    {
      path: "/documents",
      element: <Documents />,
    },
    {
      path: "/reports",
      element: <Reports />,
    },
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/security-deposits",
      element: <SecurityDeposits />,
    },
  ],
});