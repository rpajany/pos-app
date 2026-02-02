import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import SideNav from "./SideNav";

export const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header stays at the top */}
      <Header />

      {/* 2. Middle Section: Sidebar + Main Content */}
      <div className="flex flex-1">
        {/* SideNav sits on the left */}
        <SideNav />

        {/* Main content area needs margin-left to avoid being hidden under the fixed SideNav */}
        <main className="grow ml-16 p-4 transition-all duration-300">
          <Outlet /> {/* Nested routes will render here */}
        </main>
      </div>

      {/* 3. Footer stays at the bottom */}
      <Footer />
    </div>
  );
};
