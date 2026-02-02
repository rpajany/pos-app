import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { api, safeCall, logoutUser } from "@/services/ApiService";

// Add 'export' here so the hook can import it
//  export const AuthContext = createContext(null);
  // const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const localToken = localStorage.getItem("token");

      // 1. If there's no token at all, don't even try the API
      if (!localToken) {
        setLoading(false);
        return;
      }

      // 2. If we HAVE a token, try to fetch the user
      // If it's expired, our Axios Interceptor will automatically
      // handle the refresh and return the successful result here.
      const result = await safeCall(api.get("/auth/me"));

      if (result.success) {
        setUser(result.data);
      } else {
        // Only clear if the refresh also failed
        localStorage.removeItem("token");
        setUser(null);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const result = await safeCall(api.post("/auth/login", credentials));
    if (result.success) {
      const newToken = result.data.token;
      localStorage.setItem("token", newToken);

      // Manually set the header for the current session
      // api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      setUser(result.data.user);
    }
    return result;
  };

  const logout = async () => {
    await logoutUser(); // Use the logic we built earlier
    localStorage.removeItem("token"); // Clear the local access token
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, api, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook is safe to export alongside the component
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

/* 

    3. Usage in a Component : -

    import { useAuth } from '../context/AuthContext';
    import { toast } from 'react-toastify';

    const ProfilePage = () => {
    const { api, user, logout } = useAuth();

    const updateProfile = async () => {
        const result = await api.put('/user/update', { name: 'New Name' });
        
        if (result.success) {
        toast.success("Profile updated!");
        } else {
        toast.error(result.message);
        }
    };

    return (
        <div>
        <h1>Welcome, {user?.name}</h1>
        <button onClick={updateProfile}>Update Profile</button>
        <button onClick={logout}>Logout</button>
        </div>
    );
    };

*/
