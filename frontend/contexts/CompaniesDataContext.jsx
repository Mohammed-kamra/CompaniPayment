import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { companiesAPI, companyNamesAPI } from '../services/api'

const CompaniesDataContext = createContext()

export const useCompaniesData = () => {
  const context = useContext(CompaniesDataContext)
  if (!context) {
    throw new Error('useCompaniesData must be used within CompaniesDataProvider')
  }
  return context
}

export const CompaniesDataProvider = ({ children }) => {
  const [companies, setCompanies] = useState([])
  const [companyNames, setCompanyNames] = useState([])
  const [unregisteredCompanies, setUnregisteredCompanies] = useState([])
  const [loading, setLoading] = useState({ companies: false, companyNames: false, unregistered: false })
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Fetch all registered companies
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, companies: true }))
      setError('')
      const data = await companiesAPI.getAll()
      setCompanies(data || [])
      setLastUpdate(Date.now())
      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch companies')
      console.error('Error fetching companies:', err)
      throw err
    } finally {
      setLoading(prev => ({ ...prev, companies: false }))
    }
  }, [])

  // Fetch all company names
  const fetchCompanyNames = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, companyNames: true }))
      setError('')
      const data = await companyNamesAPI.getAll()
      setCompanyNames(data || [])
      setLastUpdate(Date.now())
      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch company names')
      console.error('Error fetching company names:', err)
      throw err
    } finally {
      setLoading(prev => ({ ...prev, companyNames: false }))
    }
  }, [])
  
  // Fetch company names for registration (public endpoint)
  const fetchCompanyNamesForRegistration = useCallback(async () => {
    try {
      setError('')
      const data = await companyNamesAPI.getCompanyNamesForRegistration()
      // This is a subset of companyNames, so we don't need to update state
      // But we can use it if needed
      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch company names for registration')
      console.error('Error fetching company names for registration:', err)
      throw err
    }
  }, [])

  // Fetch unregistered companies
  const fetchUnregisteredCompanies = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, unregistered: true }))
      setError('')
      const data = await companyNamesAPI.getUnregistered()
      setUnregisteredCompanies(data || [])
      setLastUpdate(Date.now())
      return data
    } catch (err) {
      setError(err.message || 'Failed to fetch unregistered companies')
      console.error('Error fetching unregistered companies:', err)
      throw err
    } finally {
      setLoading(prev => ({ ...prev, unregistered: false }))
    }
  }, [])

  // Refresh all data simultaneously
  const refreshAll = useCallback(async () => {
    try {
      setError('')
      await Promise.all([
        fetchCompanies(),
        fetchCompanyNames(),
        fetchUnregisteredCompanies()
      ])
    } catch (err) {
      setError(err.message || 'Failed to refresh data')
      console.error('Error refreshing all data:', err)
    }
  }, [fetchCompanies, fetchCompanyNames, fetchUnregisteredCompanies])

  // Update company name and refresh all related data
  const updateCompanyName = useCallback(async (id, data) => {
    try {
      setError('')
      await companyNamesAPI.update(id, data)
      // Refresh all data to keep everything in sync
      await refreshAll()
    } catch (err) {
      setError(err.message || 'Failed to update company name')
      throw err
    }
  }, [refreshAll])

  // Delete company name and refresh all related data
  const deleteCompanyName = useCallback(async (id) => {
    try {
      setError('')
      await companyNamesAPI.delete(id)
      // Refresh all data to keep everything in sync
      await refreshAll()
    } catch (err) {
      setError(err.message || 'Failed to delete company name')
      throw err
    }
  }, [refreshAll])

  // Create company name and refresh all related data
  const createCompanyName = useCallback(async (data) => {
    try {
      setError('')
      await companyNamesAPI.create(data)
      // Refresh all data to keep everything in sync
      await refreshAll()
    } catch (err) {
      setError(err.message || 'Failed to create company name')
      throw err
    }
  }, [refreshAll])

  // Update company and refresh all related data
  const updateCompany = useCallback(async (id, data) => {
    try {
      setError('')
      await companiesAPI.update(id, data)
      // Refresh all data to keep everything in sync
      await refreshAll()
    } catch (err) {
      setError(err.message || 'Failed to update company')
      throw err
    }
  }, [refreshAll])

  // Delete company and refresh all related data
  const deleteCompany = useCallback(async (id) => {
    try {
      setError('')
      await companiesAPI.delete(id)
      // Refresh all data to keep everything in sync
      await refreshAll()
    } catch (err) {
      setError(err.message || 'Failed to delete company')
      throw err
    }
  }, [refreshAll])

  // Create company and refresh all related data
  const createCompany = useCallback(async (data) => {
    try {
      setError('')
      const result = await companiesAPI.create(data)
      // Refresh all data to keep everything in sync
      await refreshAll()
      return result
    } catch (err) {
      setError(err.message || 'Failed to create company')
      throw err
    }
  }, [refreshAll])

  const value = {
    // Data
    companies,
    companyNames,
    unregisteredCompanies,
    loading,
    error,
    lastUpdate,
    
    // Fetch functions
    fetchCompanies,
    fetchCompanyNames,
    fetchCompanyNamesForRegistration,
    fetchUnregisteredCompanies,
    refreshAll,
    
    // Mutation functions (auto-refresh after mutation)
    updateCompanyName,
    deleteCompanyName,
    createCompanyName,
    updateCompany,
    deleteCompany,
    createCompany,
    
    // Direct setters (for local optimistic updates if needed)
    setCompanies,
    setCompanyNames,
    setUnregisteredCompanies
  }

  return (
    <CompaniesDataContext.Provider value={value}>
      {children}
    </CompaniesDataContext.Provider>
  )
}
