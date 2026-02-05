import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import SideNav from "./SideNav";

export const MainLayout = () => {
  return (
    /* h-screen + overflow-hidden: Prevents the whole browser window from 
       scrolling horizontally. We only want the 'main' content to scroll vertically.
    */
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      {/* 1. Header stays at the top */}
      <Header />

      {/* 2. Middle Section: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden relative">

      {/* SideNav: 
           On mobile, usually hidden or compact. 
           On desktop, it sits on the left.
        */}
        <SideNav />

        {/* Main content area needs margin-left to avoid being hidden under the fixed SideNav */}
        {/* MAIN CONTENT AREA:
           - ml-0: No margin on mobile (sidebar should be a drawer or bottom bar).
           - md:ml-16: Apply the margin only from tablet size and up.
           - overflow-y-auto: Allows only this section to scroll up/down.
           - min-w-0: CRITICAL - prevents children (charts) from pushing the width.
        */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ml-0 md:ml-16 p-2 md:p-4 transition-all duration-300">
          <div className="max-w-full">
          <Outlet /> {/* Nested routes will render here */}
          </div>
        </main>
      </div>

      {/* 3. Footer stays at the bottom */}
      <Footer />
    </div>
  );
};
