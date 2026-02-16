import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCompaniesData } from '../contexts/CompaniesDataContext'
import { useTranslation } from 'react-i18next'
import { companyNamesAPI } from '../services/api'
import * as XLSX from 'xlsx'
import '../styles/global-tables.css'
import './UnregisteredCompanies.css'

const UnregisteredCompanies = () => {
  const { 
    unregisteredCompanies,
    loading: contextLoading,
    error: contextError,
    fetchUnregisteredCompanies,
    deleteCompanyName,
    refreshAll
  } = useCompaniesData()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  
  // Force re-render when language changes
  const [languageKey, setLanguageKey] = useState(i18n.language)
  
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguageKey(lng)
    }
    
    i18n.on('languageChanged', handleLanguageChange)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    // Use context's fetch function which will sync with other components
    fetchUnregisteredCompanies().then(() => setLoading(false))
  }, [isAuthenticated, user, navigate, fetchUnregisteredCompanies])
  
  // Sync local error state with context error
  useEffect(() => {
    if (contextError) {
      setError(contextError)
    }
  }, [contextError])
  
  // Sync local loading state with context loading
  useEffect(() => {
    if (contextLoading.unregistered) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [contextLoading.unregistered])

  // Format date for display (DD/MM/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (e) {
      return '-'
    }
  }

  // Filter companies based on search term
  const filteredCompanies = unregisteredCompanies.filter(company => {
    const searchLower = searchTerm.toLowerCase()
    return (
      company.name?.toLowerCase().includes(searchLower) ||
      company.code?.toLowerCase().includes(searchLower) ||
      company.contactName?.toLowerCase().includes(searchLower) ||
      company.mobileNumber?.toLowerCase().includes(searchLower)
    )
  })

  // Handle delete single company
  const handleDelete = async (companyId, companyName) => {
    const confirmMessage = t('unregisteredCompanies.confirmDelete', { name: companyName }) || 
      `Are you sure you want to delete "${companyName}"? This action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setDeletingId(companyId)
      setError('')
      // Use context's delete function which automatically refreshes all tables
      await deleteCompanyName(companyId)
      setSuccess(t('unregisteredCompanies.deleteSuccess', { name: companyName }) || `Company "${companyName}" deleted successfully!`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to delete company:', err)
      setError(err.message || t('unregisteredCompanies.deleteError') || 'Failed to delete company')
    } finally {
      setDeletingId(null)
    }
  }

  // Handle export to Excel
  const handleExportToExcel = () => {
    try {
      if (filteredCompanies.length === 0) {
        setError(t('unregisteredCompanies.noCompaniesToExport') || 'No companies to export')
        return
      }

      // Prepare data for export
      const exportData = filteredCompanies.map((company, index) => ({
        '#': index + 1,
        [t('unregisteredCompanies.name') || 'Company Name']: company.name || '-',
        [t('unregisteredCompanies.code') || 'Code']: company.code || '-',
        [t('unregisteredCompanies.contactName') || 'Contact Name']: company.contactName || '-',
        [t('unregisteredCompanies.mobileNumber') || 'Phone Number']: company.mobileNumber || '-',
        [t('unregisteredCompanies.addedDate') || 'Added Date']: formatDate(company.createdAt),
        [t('unregisteredCompanies.status') || 'Status']: t('unregisteredCompanies.unregistered') || 'Unregistered'
      }))

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, t('unregisteredCompanies.title') || 'Unregistered Companies')

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `${t('unregisteredCompanies.exportFilename') || 'Unregistered_Companies'}_${date}.xlsx`

      // Download file
      XLSX.writeFile(workbook, filename)
      
      setSuccess(t('unregisteredCompanies.exportSuccess', { count: filteredCompanies.length }) || `Exported ${filteredCompanies.length} companies to Excel`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to export to Excel:', err)
      setError(err.message || t('unregisteredCompanies.exportError') || 'Failed to export to Excel')
    }
  }

  // Handle delete all unregistered companies
  const handleDeleteAll = async () => {
    if (filteredCompanies.length === 0) {
      setError(t('unregisteredCompanies.noCompaniesToDelete') || 'No companies to delete')
      return
    }

    const count = filteredCompanies.length
    const confirmMessage = t('unregisteredCompanies.confirmDeleteAll', { count }) || 
      `Are you sure you want to delete all ${count} unregistered companies? This action cannot be undone!`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setDeletingAll(true)
      setError('')
      
      // Delete all companies one by one using context function
      const deletePromises = filteredCompanies.map(company => 
        deleteCompanyName(company._id || company.id)
      )
      
      await Promise.all(deletePromises)
      
      const successMessage = t('unregisteredCompanies.deleteAllSuccess', { count }) || `Successfully deleted ${count} companies!`
      setSuccess(successMessage)
      
      // Context will automatically refresh all tables, so no need to manually clear
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to delete all companies:', err)
      setError(err.message || t('unregisteredCompanies.deleteAllError') || 'Failed to delete some companies')
    } finally {
      setDeletingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="unregistered-companies">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('unregisteredCompanies.loading') || 'Loading unregistered companies...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="unregistered-companies" key={languageKey}>
      <div className="unregistered-companies-container">
        <div className="page-header">
          <h1>{t('unregisteredCompanies.title') || 'Unregistered Companies'}</h1>
          <p className="page-subtitle">
            {t('unregisteredCompanies.subtitle') || 'Companies that have been added to the system but have not yet completed registration'}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={fetchUnregisteredCompanies} className="retry-button">
              {t('unregisteredCompanies.retry') || 'Retry'}
            </button>
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div className="controls-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder={t('unregisteredCompanies.searchPlaceholder') || 'Search by name, code, contact, or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="stats-container">
            <span className="stat-item">
              {t('unregisteredCompanies.total') || 'Total'}: <strong>{unregisteredCompanies.length}</strong>
            </span>
            <span className="stat-item">
              {t('unregisteredCompanies.filtered') || 'Filtered'}: <strong>{filteredCompanies.length}</strong>
            </span>
          </div>
          {filteredCompanies.length > 0 && (
            <>
              <button 
                onClick={handleExportToExcel} 
                className="export-button"
                title={t('unregisteredCompanies.exportToExcel') || 'Export to Excel'}
              >
                📊 {t('unregisteredCompanies.exportToExcel') || 'Export to Excel'}
              </button>
              <button 
                onClick={handleDeleteAll} 
                className="delete-all-button"
                disabled={deletingAll}
              >
                {deletingAll 
                  ? (t('unregisteredCompanies.deleting') || 'Deleting...') 
                  : (t('unregisteredCompanies.deleteAll') || 'Delete All')
                }
              </button>
            </>
          )}
          <button onClick={fetchUnregisteredCompanies} className="refresh-button">
            {t('unregisteredCompanies.refresh') || '🔄 Refresh'}
          </button>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <>
                <p>{t('unregisteredCompanies.noResults') || 'No companies found matching your search.'}</p>
                <button onClick={() => setSearchTerm('')} className="clear-search-button">
                  {t('unregisteredCompanies.clearSearch') || 'Clear Search'}
                </button>
              </>
            ) : (
              <p>{t('unregisteredCompanies.noUnregistered') || 'All companies have been registered! 🎉'}</p>
            )}
          </div>
        ) : (
          <div className="professional-table-container">
            <table className="professional-table unregistered-companies-table">
              <thead>
                <tr>
                  <th className="text-left">{t('unregisteredCompanies.name') || 'Company Name'}</th>
                  <th className="text-center">{t('unregisteredCompanies.code') || 'Code'}</th>
                  <th className="text-left">{t('unregisteredCompanies.contactName') || 'Contact Name'}</th>
                  <th className="text-left">{t('unregisteredCompanies.mobileNumber') || 'Phone Number'}</th>
                  <th className="text-center">{t('unregisteredCompanies.addedDate') || 'Added Date'}</th>
                  <th className="text-center">{t('unregisteredCompanies.status') || 'Status'}</th>
                  <th className="text-center">{t('unregisteredCompanies.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => {
                  const companyId = company._id || company.id
                  const isDeleting = deletingId === companyId
                  
                  return (
                    <tr key={companyId}>
                      <td className="company-name-cell text-left">
                        {company.name || '-'}
                      </td>
                      <td className="code-cell text-center">
                        <code>{company.code || '-'}</code>
                      </td>
                      <td className="text-left">{company.contactName || '-'}</td>
                      <td className="text-left">{company.mobileNumber || '-'}</td>
                      <td className="text-center">{formatDate(company.createdAt)}</td>
                      <td className="text-center">
                        <span className="status-badge unregistered">
                          {t('unregisteredCompanies.unregistered') || 'Unregistered'}
                        </span>
                      </td>
                      <td className="actions-cell text-center">
                        <button
                          onClick={() => handleDelete(companyId, company.name)}
                          className="action-icon-btn delete-icon-btn"
                          disabled={isDeleting || deletingAll}
                          title={isDeleting ? (t('unregisteredCompanies.deleting') || 'Deleting...') : (t('unregisteredCompanies.delete') || 'Delete')}
                          aria-label={isDeleting ? (t('unregisteredCompanies.deleting') || 'Deleting...') : (t('unregisteredCompanies.delete') || 'Delete')}
                        >
                          {isDeleting ? (
                            <span className="loading-spinner">⏳</span>
                          ) : (
                            <svg className="action-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnregisteredCompanies
