import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CompaniesDataProvider } from './contexts/CompaniesDataContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AccountingProtectedRoute from './components/AccountingProtectedRoute'
import Login from './pages/Login'
import ManageGroups from './pages/ManageGroups'
import User from './pages/User'
import PreRegister from './pages/PreRegister'
import RegisterCompany from './pages/RegisterCompany'
import ManageCompanies from './pages/ManageCompanies'
import ManageCompanyNames from './pages/ManageCompanyNames'
import Settings from './pages/Settings'
import CompaniesList from './pages/CompaniesList'
import ManageUsers from './pages/ManageUsers'
import Dashboard from './pages/Dashboard'
import UnregisteredCompanies from './pages/UnregisteredCompanies'
import PublicQueue from './pages/PublicQueue'
import ManageTranslations from './pages/ManageTranslations'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CompaniesDataProvider>
        <NotificationProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PreRegister />} />
            <Route path="/pre-register" element={<PreRegister />} />
            <Route path="/register" element={<RegisterCompany />} />
            <Route path="/queue" element={<PublicQueue />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/companies-list" 
              element={
                <AccountingProtectedRoute>
                  <CompaniesList />
                </AccountingProtectedRoute>
              } 
            />
            <Route 
              path="/groups" 
              element={
                <ProtectedRoute>
                  <ManageGroups />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user" 
              element={
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/companies" 
              element={
                <ProtectedRoute>
                  <ManageCompanies />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/company-names" 
              element={
                <ProtectedRoute>
                  <ManageCompanyNames />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/unregistered-companies" 
              element={
                <ProtectedRoute>
                  <UnregisteredCompanies />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/translations" 
              element={
                <ProtectedRoute>
                  <ManageTranslations />
                </ProtectedRoute>
              }
            />
            {/* Catch-all route for unmatched paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      </Router>
        </NotificationProvider>
      </CompaniesDataProvider>
    </AuthProvider>
  )
}

export default App
