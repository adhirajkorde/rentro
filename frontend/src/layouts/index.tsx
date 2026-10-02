import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const LoginLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-rentora-background text-rentora-foreground p-6">
      <div className="max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== "/auth/login") {
      navigate("/auth/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <p className="text-center py-12">Please login to access the dashboard</p>
    );
  }

  return (
    <div className="min-h-screen bg-rentora-background text-rentora-foreground">
      <Navbar />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Sidebar />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const user = useSelector((state: any) => state.auth.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    // logout dispatch would go here
    navigate("/auth/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-rentora-border px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-bg rentora-accent flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="text-xl font-semibold">Rentora</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/dashboard"
            className="text-rentora-muted hover:text-rentora-accent transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/properties"
            className="text-rentora-muted hover:text-rentora-accent transition-colors"
          >
            Properties
          </a>
          <a
            href="/agreements"
            className="text-rentora-muted hover:text-rentora-accent transition-colors"
          >
            Agreements
          </a>
          <a
            href="/rent"
            className="text-rentora-muted hover:text-rentora-accent transition-colors"
          >
            Rent & Payments
          </a>
          <button onClick={handleLogout} className="text-sm text-rentora-accent font-medium">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = () => {
  return (
    <aside
      className="w-64 bg-rentora-card border-r border-rentora-flex-shrink-0"
    >
      <div className="p-4 pt-6">
        <h3 className="font-medium text-rentora-dark text-sm mb-6">
          Rentora
        </h3>
        <nav>
          <ul className="space-y-2">
            <li>
              <a
                href="/dashboard"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-rentora-light transition-colors"
                onClick={() => navigate("/dashboard")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="21" x2="15" y2="21" />
                </svg>
                <span className="ml-3">Dashboard</span>
              </a>
            </li>
            <li>
              <a
                href="/properties"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-rentora-light transition-colors"
                onClick={() => navigate("/properties")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v2l7 6h2l7-6v20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7l7-6z" />
                  <polyline points="3 3 3 20 20 20 20 3" />
                </svg>
                <span className="ml-3">Properties</span>
              </a>
            </li>
            <li>
              <a
                href="/agreements"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-rentora-light transition-colors"
                onClick={() => navigate("/agreements")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" /><path d="M14 2v2l6 6v6h-4l-2 4l-4-4l-2 4L14 22l4-4h6a2 2 0 0 0 2-2v-6.3l-.5-3.4L18 9l-2-2.3" /></svg>
                <span className="ml-3">Agreements</span>
              </a>
            </li>
            <li>
              <a
                href="/rent"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-rentora-light transition-colors"
                onClick={() => navigate("/rent")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" /><path d="M14 2v2l6 6v6h-4l-2 4l-4-4l-2 4L14 22l4-4h6a2 2 0 0 0 2-2v-6.3l-.5-3.4L18 9l-2-2.3" /></svg>
                <span className="ml-3">Rent & Payments</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export { LoginLayout, MainLayout };