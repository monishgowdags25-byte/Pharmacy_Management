import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import Users from '../pages/Users';
import Categories from '../pages/Categories';
import Medicines from '../pages/Medicines';
import Suppliers from '../pages/Suppliers';
import Inventory from '../pages/Inventory';
import Batches from '../pages/Batches';
import Purchases from '../pages/Purchases';
import CreatePurchase from '../pages/CreatePurchase';
import POS from '../pages/POS';
import SalesHistory from '../pages/SalesHistory';
import Customers from '../pages/Customers';
import Prescriptions from '../pages/Prescriptions';
import Returns from '../pages/Returns';
import Expenses from '../pages/Expenses';
import Reports from '../pages/Reports';
import Notifications from '../pages/Notifications';
import AuditLogs from '../pages/AuditLogs';
import Settings from '../pages/Settings';
import ProtectedRoute from '../components/ProtectedRoute';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useToast } from '../context/ToastContext';

const AppRoutes = () => {
  const { showToast } = useToast();

  const handleAddNewRecord = (section) => {
    showToast(`Initialization of ${section} records is scheduled for subsequent phases!`, 'info');
  };

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Dashboard Scope (Requires Login) */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard Subroutes */}
        <Route index element={<Dashboard />} />
        
        {/* Profile (All Authenticated roles) */}
        <Route path="profile" element={<Profile />} />

        {/* Staff Administration (ADMIN only) */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          } 
        />

        {/* Medicines Catalogue (ADMIN, PHARMACIST, INVENTORY_MANAGER) */}
        <Route 
          path="medicines" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER']}>
              <Medicines />
            </ProtectedRoute>
          } 
        />

        {/* Category Management (ADMIN, PHARMACIST, INVENTORY_MANAGER) */}
        <Route 
          path="categories" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER']}>
              <Categories />
            </ProtectedRoute>
          } 
        />

        {/* Suppliers Directory (ADMIN, INVENTORY_MANAGER) */}
        <Route 
          path="suppliers" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
              <Suppliers />
            </ProtectedRoute>
          } 
        />

        {/* Inventory Stock (ADMIN, PHARMACIST, INVENTORY_MANAGER) */}
        <Route 
          path="inventory" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER']}>
              <Inventory />
            </ProtectedRoute>
          } 
        />

        {/* Batches Stock (ADMIN, PHARMACIST, INVENTORY_MANAGER) */}
        <Route 
          path="batches" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER']}>
              <Batches />
            </ProtectedRoute>
          } 
        />
        
        {/* Procurement Purchases List (ADMIN, INVENTORY_MANAGER) */}
        <Route 
          path="purchases" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
              <Purchases />
            </ProtectedRoute>
          } 
        />

        {/* Create Procurement Purchase (ADMIN, INVENTORY_MANAGER) */}
        <Route 
          path="purchases/create" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
              <CreatePurchase />
            </ProtectedRoute>
          } 
        />

        {/* Retail POS Register Checkout (ADMIN, PHARMACIST, CASHIER) */}
        <Route 
          path="pos" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CASHIER']}>
              <POS />
            </ProtectedRoute>
          } 
        />

        {/* Sales Transactions History (ADMIN, PHARMACIST, CASHIER) */}
        <Route 
          path="sales" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CASHIER']}>
              <SalesHistory />
            </ProtectedRoute>
          } 
        />

        {/* Returns Ledger (ADMIN, PHARMACIST, CASHIER) */}
        <Route 
          path="returns" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CASHIER']}>
              <Returns />
            </ProtectedRoute>
          } 
        />

        {/* Expenses Ledger (ADMIN, INVENTORY_MANAGER) */}
        <Route 
          path="expenses" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_MANAGER']}>
              <Expenses />
            </ProtectedRoute>
          } 
        />

        {/* Customer Directory (ADMIN, PHARMACIST, CASHIER) */}
        <Route 
          path="customers" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CASHIER']}>
              <Customers />
            </ProtectedRoute>
          } 
        />

        {/* Medical Prescriptions (ADMIN, PHARMACIST, CASHIER) */}
        <Route 
          path="prescriptions" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CASHIER']}>
              <Prescriptions />
            </ProtectedRoute>
          } 
        />

        {/* Reports (ADMIN, INVENTORY_MANAGER) */}
        <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN','INVENTORY_MANAGER']}><Reports /></ProtectedRoute>} />

        {/* Notifications (All Staff) */}
        <Route path="notifications" element={<ProtectedRoute allowedRoles={['ADMIN','PHARMACIST','INVENTORY_MANAGER','CASHIER']}><Notifications /></ProtectedRoute>} />

        {/* Audit Logs (ADMIN only) */}
        <Route path="audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditLogs /></ProtectedRoute>} />

        {/* System & ERP Settings (All Staff Roles) */}
        <Route path="settings" element={<ProtectedRoute allowedRoles={['ADMIN','PHARMACIST','INVENTORY_MANAGER','CASHIER']}><Settings /></ProtectedRoute>} />

        {/* Catch-all unmatched dashboard route */}
        <Route 
          path="*" 
          element={
            <ErrorState 
              title="Page Not Found" 
              message="The page you are trying to reach does not exist or has been moved."
              onRetry={() => window.location.href = '/'}
            />
          } 
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
