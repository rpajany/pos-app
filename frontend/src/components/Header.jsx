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
     /* LAYOUT: 
       - h-14 md:h-16: Slightly taller on desktop for a premium feel.
       - px-4 md:px-8: More horizontal padding on larger screens.
    */
    <header className="w-full flex justify-between items-center z-50 px-4 md:px-8 h-14 md:h-16 p-2 bg-blue-400 shadow-md  relative">
     
      {/* Logo Section */}
      <div className="flex gap-3 items-center">
        <img
          // src={logo}
          src={company?.logo?company.logo: logo}
          alt="Logo"
           /* Responsive image size: 8 units on mobile, 10 on desktop */
          className="w-8 h-8 md:w-10 md:h-10 border-2 rounded-full p-0.5  bg-white object-contain border-blue-500"
        />
        <h5 className="font-bold text-white tracking-tight text-sm md:text-lg lg:text-xl">{company?.name ? company.name : "POS SYSTEM"}</h5>
      </div>

      {/* User Icon Toggle */}  {/* We can hide text on mobile and show it on desktop for clarity */}
      <div
      
        className="cursor-pointer hover:scale-105 active:scale-95 transition-transform  "
        onClick={() => setToggle(!toggle)}
      >
        <img
          src={user_logo}
          alt="User"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-blue-500   bg-gray-100 shadow-sm"
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

          {/* Popup Window */}  {/* RESPONSIVE POPUP:
             - Increased width on desktop (w-48) vs mobile (w-40)
             - Slightly larger text on desktop
          */}
          <div className="absolute top-12 right-4 w-40  md:right-8 md:w-48 bg-white rounded-md shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 text-xs text-gray-500 border-b bg-gray-50">
              User Settings
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3  text-sm md:text-base text-gray-500 hover:text-red-600 transition-colors flex items-center font-medium gap-2"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
