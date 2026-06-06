import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Vendors from './pages/Vendors'
import RFQCreate from './pages/RFQCreate'
import Quotations from './pages/Quotations'
import QuotationCompare from './pages/QuotationCompare'
import Approvals from './pages/Approvals'
import PurchaseOrders from './pages/PurchaseOrders'
import ActivityLogs from './pages/ActivityLogs'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import SuperAdminPanel from './pages/SuperAdminPanel'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <Vendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/create"
          element={
            <ProtectedRoute>
              <RFQCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <ProtectedRoute>
              <Quotations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/compare"
          element={
            <ProtectedRoute>
              <QuotationCompare />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <Approvals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute>
              <PurchaseOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin-panel"
          element={
            <SuperAdminPanel />
          }
        />
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
