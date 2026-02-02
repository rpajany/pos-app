//context/AppProvider.js
import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { AppContext } from "./AppContext";

export const AppProvider = ({ children }) => {
  const [company, setCompany] = useState(null); // Global Shop Data
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
//   const [token, setToken] = useState(localStorage.getItem("token"));

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem("token");

  console.log("isAuthenticated :", isAuthenticated);
  const fetchCompany = async () => {
    // if (!localStorage.getItem("token")) return; // Guard clause
    const result = await safeCall(api.get("/company"));
    if (result.success && result.data) setCompany(result.data);
  };

  const fetchSuppliers = async () => {
    // if (!localStorage.getItem("token")) return; // Guard clause
    const res = await safeCall(api.get("/supplier"));
    if (res?.data) setSuppliers(res.data);
  };

  // Only run if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompany();
      fetchSuppliers();
    }
  }, [isAuthenticated]); // // Triggers whenever token changes (login or logout)

  return (
    <AppContext.Provider
      value={{
        company,
        setCompany,
        fetchCompany,
        fetchSuppliers,
        suppliers,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
