import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Farms from './pages/Farms.jsx';
import FarmDetails from './pages/FarmDetails.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Consultations from './pages/Consultations.jsx';
import Marketplace from './pages/Marketplace.jsx';
import MyOrders from './pages/MyOrders.jsx';
import AdminInventory from './pages/AdminInventory.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route redirects to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farms"
            element={
              <ProtectedRoute>
                <Farms />
              </ProtectedRoute>
            }
          />

          {/* Farm Details Route */}
          <Route
            path="/farms/:farmId"
            element={
              <ProtectedRoute>
                <FarmDetails />
              </ProtectedRoute>
            }
          />

          {/* Expert Consultations Route */}
          <Route
            path="/consultations"
            element={
              <ProtectedRoute>
                <Consultations />
              </ProtectedRoute>
            }
          />

          {/* Farmer Marketplace Routes */}
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin-inventory"
            element={
              <AdminRoute>
                <AdminInventory />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <AdminRoute>
                <AdminInventory />
              </AdminRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;