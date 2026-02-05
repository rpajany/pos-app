import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "@/context/useApp";
import { useAuth } from "@/context/useAuth";
import {
  Home, Package, ShoppingCart, UserStar, ShoppingBag, Settings, LogOut,
  Users, Building2, ChevronDown, FileText, Database, Wallet, SquarePercent,
  FileCheckCorner, BadgePercent, Menu, X // Added Menu and X icons
} from "lucide-react";

export default function SideNav() {
  const { company, setCompany, setSuppliers } = useApp();
  const { logout } = useAuth();
  
  // NEW: State for mobile toggle
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Keep state for desktop toggle logic
  const [openMenus, setOpenMenus] = useState({ master: false, reports: false });

  const toggleMenu = (menu) => {
    // Only allow toggling if we are NOT on mobile
    if (window.innerWidth >= 768) {
      setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.clear();
    setCompany(null);
    setSuppliers([]);
    window.location.href = "/login";
  };

  const menuItems = [
    { icon: <Home size={20} />, label: "Dashboard", path: "/" },
    {
      label: "Master",
      icon: <Database size={20} />,
      isDropdown: true,
      // Logic: If mobile, it's ALWAYS open. If desktop, use state.
      isOpen: isMobileOpen ? true : openMenus.master,
      onToggle: () => toggleMenu("master"),
      subItems: [
        { icon: <Building2 size={18} />, label: "Company", path: "/company" },
        { icon: <Users size={18} />, label: "Customers", path: "/customer" },
        { icon: <UserStar size={18} />, label: "Suppliers", path: "/supplier" },
        { icon: <Package size={18} />, label: "Products", path: "/products" },
      ],
    },
    { icon: <ShoppingBag size={20} />, label: "Sales Bill", path: "/sales" },
    { icon: <ShoppingCart size={20} />, label: "Purchase", path: "/purchase" },
    { icon: <Wallet size={20} />, label: "Expenses", path: "/expenses" },
    { icon: <FileCheckCorner size={20} />, label: "Quotation", path: "/quotation" },
    {
      label: "Reports",
      icon: <FileText size={20} />,
      isDropdown: true,
      isOpen: isMobileOpen ? true : openMenus.reports,
      onToggle: () => toggleMenu("reports"),
      subItems: [
        { icon: <SquarePercent size={20} />, label: "Sales GST", path: "/salesgstReport" },
        { icon: <BadgePercent size={20} />, label: "Purchase GST", path: "/purchasegstReport" },
        { icon: <BadgePercent size={20} />, label: "Sales Payment", path: "/salesPaymentReport" },
        { icon: <BadgePercent size={20} />, label: "Purchase Payment", path: "/purchasePaymentReport" },
      ],
    },
  ];

  return (
   
     <>
      {/* MOBILE TOGGLE BUTTON */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-3 left-4 z-50 p-2 bg-blue-900 text-white rounded-md md:hidden shadow-lg"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* SIDEBAR CONTAINER */}
      <div className={`
        fixed left-0 top-0 h-screen bg-blue-900 text-white flex flex-col transition-all duration-300 ease-in-out z-45 
        md:w-16 md:hover:w-64 group shadow-2xl
        ${isMobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0"}
      `}>

        {/* Logo Area */}
        <div className="flex items-center p-4 mb-2 border-b border-blue-800 shrink-0">
          <div className="min-w-[32px] flex justify-center">
            <img src={company?.logo} alt="Logo" className="w-8 h-8 rounded-full bg-white p-0.5" />
          </div>
          <span className={`ml-4 font-bold text-xl transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {company?.name || "POS"}
          </span>
        </div>

        {/* Menu Items - Added no-scrollbar and overflow-y-auto for sliding */}
        <nav className="flex-1 px-2 mt-2 overflow-y-auto no-scrollbar space-y-1">
          {menuItems.map((item, index) => {
            if (item.isDropdown) {
              return (
                <div key={index} className="mb-1">
                  {/* Dropdown Header: Cursor default on mobile since it's not clickable */}
                  <div 
                    onClick={item.onToggle} 
                    className={`w-full flex items-center p-3 rounded-lg transition-colors text-blue-200 
                    ${!isMobileOpen ? "hover:bg-blue-700 cursor-pointer" : "cursor-default md:cursor-pointer md:hover:bg-blue-700"}`}
                  >
                    <div className="min-w-[32px] flex justify-center">{item.icon}</div>
                    <span className={`ml-4 flex-1 text-sm font-bold uppercase tracking-wider transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      {item.label}
                    </span>
                    {/* Hide arrow on mobile */}
                    <ChevronDown size={14} className={`hidden md:block transition-transform ${item.isOpen ? "rotate-180" : ""} ${isMobileOpen ? "opacity-0" : "group-hover:opacity-100"}`} />
                  </div>

                  {/* Dropdown Content - Always expanded if isMobileOpen is true */}
                  <div className={`overflow-hidden transition-all duration-300 ${item.isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                    {item.subItems.map((sub, subIdx) => (
                      <NavLink 
                        key={subIdx} 
                        to={sub.path} 
                        onClick={() => setIsMobileOpen(false)} 
                        className={({ isActive }) => `
                          flex items-center py-2.5 rounded-lg transition-colors mb-1
                          ${isActive ? "bg-blue-600 text-white" : "hover:bg-blue-800/50 text-blue-300 text-sm"}
                          ${isMobileOpen ? "opacity-100" : "md:opacity-0 md:group-hover:opacity-100"}
                        `}
                      >
                        <div className="min-w-[32px] flex justify-center ml-4 md:ml-8">
                          {sub.icon}
                        </div>
                        <span className="ml-4 whitespace-nowrap">{sub.label}</span>
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
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center p-3 mb-1 rounded-lg transition-colors
                  ${isActive ? "bg-blue-600 text-white" : "hover:bg-blue-700 text-blue-200"}
                `}
              >
                <div className="min-w-[32px] flex justify-center">{item.icon}</div>
                <span className={`ml-4 whitespace-nowrap transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-blue-800 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg hover:bg-red-600 transition-colors">
            <div className="min-w-[32px] flex justify-center text-red-400">
              <LogOut size={20} />
            </div>
            <span className={`ml-4 transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
 
  );
}