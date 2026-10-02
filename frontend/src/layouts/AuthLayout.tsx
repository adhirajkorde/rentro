import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== "/auth/login") {
      navigate("/auth/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-rentora-background text-rentora-foreground p-6">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </div>
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

export default AuthLayout;