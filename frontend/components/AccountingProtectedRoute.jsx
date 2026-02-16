import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// This component restricts accounting users to only registration department
const AccountingProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If accounting user, only allow registration pages
  if (user?.role === 'accounting') {
    const allowedPaths = ['/pre-register', '/register', '/login', '/']
    const isAllowed = allowedPaths.some(path => 
      location.pathname === path || 
      (path === '/' && location.pathname === '/') ||
      location.pathname.startsWith(path)
    )
    
    if (!isAllowed) {
      return <Navigate to="/register" replace />
    }
  }

  return children
}

export default AccountingProtectedRoute
