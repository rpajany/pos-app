import React, { useState } from "react";
import { useApp } from "@/context/useApp";
import { useAuth } from "@/context/useAuth";
import logo from "@/assets/react.svg";
import user_logo from "@/assets/default-user.png";

export default function Header() {
  const { company, setCompany, setSuppliers,suppliers } = useApp();
  const { logout } = useAuth();
  const [toggle, setToggle] = useState(false);

  // console.log("company :", company)
  // console.log("suppliers :", suppliers)

  const handleLogout = async () => {
    console.log("Logging out...");
    await logout();
    localStorage.clear();
    setCompany(null);
    setSuppliers([]);
    window.location.href = "/login";
    // Add your logout logic here (e.g., clear localStorage, redirect to login)
  };

  return (
    <div className="w-full flex justify-between items-center z-50 px-4 p-2 bg-blue-300 relative">
      {/* Logo Section */}
      <div className="flex gap-2 items-center">
        <img
          // src={logo}
          src={company?.logo?company.logo: logo}
          alt="Logo"
          className="w-10 h-10 border rounded-full p-1 border-blue-500"
        />
        <h5 className="font-bold">{company?.name ? company.name : "POS"}</h5>
      </div>

      {/* User Icon Toggle */}
      <div
        className="cursor-pointer hover:opacity-80 transition-all"
        onClick={() => setToggle(!toggle)}
      >
        <img
          src={user_logo}
          alt="User"
          className="w-8 h-8 rounded-full border border-blue-500 bg-white"
        />
      </div>

      {/* Logout Dropdown */}
      {toggle && (
        <>
          {/* Transparent Backdrop to close the popup when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setToggle(false)}
          ></div>

          {/* Popup Window */}
          <div className="absolute top-12 right-4 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
              User Settings
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
