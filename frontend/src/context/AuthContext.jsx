import React, { createContext, useContext, useState, useEffect } from "react";
import { loginOwner, registerOwner, getMe, updateProfile as updateProfileApi, changePassword as changePasswordApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("rentora_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("rentora_token") || "");
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("rentora_token");
    localStorage.removeItem("rentora_user");
  };

  // Hydrate auth session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("rentora_token");
      if (storedToken) {
        try {
          const res = await getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem("rentora_user", JSON.stringify(res.data));
          }
        } catch (error) {
          console.error("Session verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginOwner({ email, password });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("rentora_token", res.data.token);
      localStorage.setItem("rentora_user", JSON.stringify(res.data.user));
    }
    return res;
  };

  const register = async (fullName, email, password) => {
    const res = await registerOwner({ fullName, email, password });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("rentora_token", res.data.token);
      localStorage.setItem("rentora_user", JSON.stringify(res.data.user));
    }
    return res;
  };

  const updateProfile = async (profileData) => {
    const res = await updateProfileApi(profileData);
    if (res.success && res.data) {
      setUser(res.data);
      localStorage.setItem("rentora_user", JSON.stringify(res.data));
    }
    return res;
  };

  const changePassword = async (passwords) => {
    return changePasswordApi(passwords);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        updateProfile,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
