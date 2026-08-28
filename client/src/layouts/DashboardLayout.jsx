import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem('token');

  // Route Authentication Guard
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header navbar */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* Dynamic page viewport */}
        <main id="main-content" className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8 focus:outline-none">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
