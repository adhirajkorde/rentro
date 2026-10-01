import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Agreements from "./pages/Agreements";
import Rent from "./pages/Rent";
import Inspections from "./pages/Inspections";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

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
      path: "/auth/register",
      element: <Register />,
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
      path: "/tenants",
      element: <Tenants />,
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
  ],
});