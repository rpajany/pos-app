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
  const [openMenus, setOpenMenus] = useState({ master: false, reports: false });

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
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
    { icon: <ShoppingCart size={20} />, label: "Purchase", path: "/purchase" },
    { icon: <Wallet size={20} />, label: "Expenses", path: "/expenses" },
    { icon: <FileCheckCorner size={20} />, label: "Quotation", path: "/quotation" },
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
  ];

  return (
    <>
      {/* MOBILE TOGGLE BUTTON (Only visible on small screens) */}
      {/* MOBILE TOGGLE BUTTON: 
          Adjusted top-3 for better alignment inside the Header area. 
      */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-3 left-4 z-60 p-2 bg-blue-900 text-white rounded-md md:hidden shadow-lg active:scale-90 transition-transform"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* MOBILE OVERLAY (Closes sidebar when clicking outside) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-45 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER  / Desktop: Narrow (16/64px) and hover-expand /  Mobile: Full drawer logic  */} 
      <div className={`
        fixed left-0 top-0 h-screen bg-blue-900 text-white flex flex-col transition-all duration-300 ease-in-out z-40 
       /* Desktop: Narrow (16/64px) and hover-expand */
        md:w-16 md:hover:w-64 group shadow-2xl 
        /* Mobile: Full drawer logic */
        ${isMobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0"}
      `}>

        {/* Logo Area (Hidden on mobile because the Header already shows it) */} 
        <div className="flex items-center p-4 mb-4 border-b border-blue-800 overflow-hidden shrink-0">
          <div className="min-w-[32px] flex justify-center">
            <img src={company?.logo} alt="Logo" className="w-8 h-8 border rounded-full border-blue-500 bg-white p-0.5" />
          </div>
          {/* Change: Allow text to be visible if mobile open OR desktop hover */}
          <span className={`ml-4 font-bold text-xl whitespace-nowrap transition-opacity duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {company?.name || "POS"}
          </span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2 mt-4 overflow-y-auto no-scrollbar space-y-1">
          {menuItems.map((item, index) => {
            if (item.isDropdown) {
              return (
                <div key={index} className="mb-2">
                  <button onClick={item.onToggle} className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-blue-700 text-blue-200">
                    <div className="min-w-[32px] flex justify-center">{item.icon}</div>
                    <span className={`ml-4 flex-1 text-left text-sm font-medium  whitespace-nowrap transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      {item.label}
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${item.isOpen ? "rotate-180" : ""}`} />
                  </button>

              {/* Dropdown Content */}
<div className={`overflow-hidden transition-all duration-300 bg-blue-950/50 
  ${item.isOpen ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
  
  {item.subItems.map((sub, subIdx) => (
    <NavLink 
      key={subIdx} 
      to={sub.path} 
      onClick={() => setIsMobileOpen(false)} 
      className={({ isActive }) => `
        flex items-center py-2.5 pl-4 pr-4 rounded-lg transition-colors mb-1
        ${isActive ? "bg-blue-600 text-white" : "hover:bg-blue-800 text-blue-300 text-sm"}
        /* Simplified visibility logic */
        ${isMobileOpen ? "opacity-100" : "md:opacity-0 md:group-hover:opacity-100"}
      `}
    >
      <div className="min-w-[32px] flex justify-center ml-4 md:ml-8">
        {sub.icon ? sub.icon : <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
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
                onClick={() => setIsMobileOpen(false)} // Auto-close on link click
                className={({ isActive }) => `
                  flex items-center p-3 mb-2 rounded-lg transition-colors overflow-hidden
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
        <div className="p-2 border-t border-blue-800 mb-5">
          <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg hover:bg-red-600 transition-colors">
            <div className="min-w-[32px] flex justify-center text-red-400 group-hover:text-white">
              <LogOut size={20} />
            </div>
            <span className={`ml-4 whitespace-nowrap transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );
}