import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "@/context/useApp";
import { useAuth } from "@/context/useAuth";
import {
  Home,
  Package,
  ShoppingCart,
  UserStar,
  ShoppingBag,
  Settings,
  LogOut,
  Users,
  Building2,
  ChevronDown,
  FileText,
  Database,
  Wallet,
  SquarePercent,
  BadgePercent
} from "lucide-react";

export default function SideNav() {
  const { company,setCompany, setSuppliers } = useApp();
    const { logout } = useAuth();
  // State to track which dropdown is open
  const [openMenus, setOpenMenus] = useState({ master: false, reports: false });

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    { icon: <Home size={20} />, label: "Dashboard", path: "/" },
    // MASTER DROPDOWN
    {
      label: "Master",
      icon: <Database size={20} />,
      isDropdown: true,
      isOpen: openMenus.master,
      onToggle: () => toggleMenu("master"),
      subItems: [
        { icon: <Building2 size={18} />, label: "Company", path: "/company" },
        { icon: <Users size={18} />, label: "Customers", path: "/customer" },
        { icon: <UserStar size={18} />, label: "Suppliers", path: "/supplier" },
        { icon: <Package size={18} />, label: "Products", path: "/products" },
      ],
    },
    { icon: <ShoppingBag size={20} />, label: "Sales Bill", path: "/sales" },
    { icon: <ShoppingCart  size={20} />, label: "Purchase", path: "/purchase" },
    { icon: <Wallet size={20} />, label: "Expenses", path: "/expenses" },
    { icon: <Wallet size={20} />, label: "Quotation", path: "/quotation" },
    // REPORTS DROPDOWN
    {
      label: "Reports",
      icon: <FileText size={20} />,
      isDropdown: true,
      isOpen: openMenus.reports,
      onToggle: () => toggleMenu("reports"),
      subItems: [
        { icon: <SquarePercent size={20} />, label: "Sales GST", path: "/salesgstReport" },
        { icon: <BadgePercent size={20} />, label: "Purchase GST", path: "/purchasegstReport" },
        { icon: <BadgePercent size={20} />, label: "Sales Payment", path: "/salesPaymentReport" },
        { icon: <BadgePercent size={20} />, label: "Purchase Payment", path: "/purchasePaymentReport" },
      ],
    },
    // { icon: <Settings size={20} />, label: "Settings", path: "/settings" },
  ];


  
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
    <div className="fixed left-0 top-0 h-screen bg-blue-900 text-white flex flex-col transition-all duration-300 ease-in-out z-40 w-16 hover:w-64 group shadow-xl">
      {/* Logo Area */}
      <div className="flex items-center p-4 mb-4 border-b border-blue-800 overflow-hidden">
        <div className="min-w-[32px] flex justify-center">
          <img
            src={company?.logo}
            alt="Logo"
            className="w-8 h-8 border rounded-full border-blue-500"
          />
        </div>
        <span className="ml-4 font-bold text-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {company?.name || "POS"}
        </span>
      </div>

      {/* Menu Items */}
      <nav  className="flex-1 px-2 mt-4 overflow-y-auto no-scrollbar">
        {menuItems.map((item, index) => {
          if (item.isDropdown) {
            return (
              <div key={index} className="mb-2">
                {/* Parent Button */}
                <button
                  onClick={item.onToggle}
                  className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-blue-700 text-blue-200"
                >
                  <div className="min-w-[32px] flex justify-center">{item.icon}</div>
                  <span className="ml-4 flex-1 text-left whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.label}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 opacity-0 group-hover:opacity-100 ${
                      item.isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Sub-items Container */}
               <div
  className={`overflow-hidden transition-all duration-300 bg-blue-950/50 ${
    item.isOpen ? "max-h-64 mt-1" : "max-h-0"
  }`}
>
  {item.subItems.map((sub, subIdx) => (
    <NavLink
      key={subIdx}
      to={sub.path}
      className={({ isActive }) => `
        flex items-center py-2.5 pl-4 pr-4 rounded-lg transition-colors mb-1
        ${isActive ? "bg-blue-600 text-white" : "hover:bg-blue-800 text-blue-300 text-sm"}
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
      `}
    >
      {/* This renders the sub-item icon */}
      <div className="min-w-[32px] flex justify-center ml-8">
        {sub.icon ? sub.icon : <div className="w-1 h-1 bg-blue-400 rounded-full" />} 
      </div>

      <span className="ml-4 whitespace-nowrap">
        {sub.label}
      </span>
    </NavLink>
  ))}
</div>
              </div>
            );
          }

          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => `
                flex items-center p-3 mb-2 rounded-lg transition-colors overflow-hidden
                ${isActive ? "bg-blue-600 text-white" : "hover:bg-blue-700 text-blue-200"}
              `}
            >
              <div className="min-w-[32px] flex justify-center">{item.icon}</div>
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Action */}
      <div className="p-2 border-t border-blue-800 mb-5">
        <button className="w-full flex items-center p-3 rounded-lg hover:bg-red-600 transition-colors">
          <div className="min-w-[32px] flex justify-center text-red-400 group-hover:text-white">
            <LogOut size={20} />
          </div>
          <span onClick={handleLogout} className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}