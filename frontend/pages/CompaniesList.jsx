import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useCompaniesData } from '../contexts/CompaniesDataContext'
import { useNotification } from '../contexts/NotificationContext'
import { companiesAPI, groupsAPI, settingsAPI } from '../services/api'
import * as XLSX from 'xlsx'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/global-tables.css'
import './CompaniesList.css'

const CompaniesList = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { notify } = useNotification()
  const { 
    companies, 
    companyNames,
    loading: contextLoading,
    error: contextError,
    fetchCompanies,
    deleteCompany,
    refreshAll
  } = useCompaniesData()
  
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [filters, setFilters] = useState({
    selectedGroup: '',
    spentFilter: 'all', // 'all', 'spent', 'not-spent'
    paidFilter: 'all', // 'all', 'paid', 'not-paid'
    dateFrom: '',
    dateTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [showDeleteSection, setShowDeleteSection] = useState(false)
  const [deletingCompanies, setDeletingCompanies] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [websiteSettings, setWebsiteSettings] = useState(null)
  const [postRegistrationMessage, setPostRegistrationMessage] = useState('')

  // Get company-specific code by matching company name
  const getCompanyCode = (companyName) => {
    const companyNameEntry = companyNames.find(cn => cn.name === companyName)
    return companyNameEntry?.code || '-'
  }

  // Format date for display (HH:MM only - time only)
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    } catch (e) {
      return '-'
    }
  }

  const handleStatusToggle = async (companyId, field) => {
    const company = companies.find(c => c._id === companyId)
    if (!company) {
      console.error('Company not found:', companyId)
      return
    }

    const newValue = !company[field]
    setUpdatingStatus(prev => ({ ...prev, [companyId]: true }))

    try {
      // Prepare update data with only the field being toggled
      const updateData = { [field]: newValue }
      
      console.log('Updating status:', { companyId, field, newValue, updateData })
      
      const updatedCompany = await companiesAPI.updateStatus(companyId, updateData)
      
      console.log('Status updated successfully:', updatedCompany)
      
      // Update the companies list with the updated company
      // Context will automatically update companies state, but we can trigger a refresh
      await refreshAll()
      
      // Show success message briefly
      setShowSuccessMessage(true)
      notify('updated', t('settings.saved') || 'Status updated')
      setTimeout(() => setShowSuccessMessage(false), 2000)
    } catch (err) {
      console.error('Failed to update status:', err)
      notify('error', err.message)
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      })
      
      // Show user-friendly error message
      const errorMessage = err.message || `Failed to update ${field} status`
      setError(errorMessage)
      
      // Show error for 5 seconds (longer for network errors)
      setTimeout(() => setError(''), 5000)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [companyId]: false }))
    }
  }

  const handleSelectCompany = (companyId) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId)
      } else {
        return [...prev, companyId]
      }
    })
  }

  const handleSelectAll = (groupCompanies) => {
    const allSelected = groupCompanies.every(c => selectedCompanies.includes(c._id))
    if (allSelected) {
      // Deselect all in this group
      setSelectedCompanies(prev => prev.filter(id => 
        !groupCompanies.some(c => c._id === id)
      ))
    } else {
      // Select all in this group
      const groupIds = groupCompanies.map(c => c._id)
      setSelectedCompanies(prev => {
        const newSelection = [...prev]
        groupIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  const handleDeleteCompany = async (companyId) => {
    try {
      setDeletingCompanies(true)
      setError('')
      // Use context's delete function which automatically refreshes all tables
      await deleteCompany(companyId)
      notify('deleted', t('companiesList.deleteSuccess') || 'Company deleted successfully')
      setSelectedCompanies(prev => prev.filter(id => id !== companyId))
      setDeleteConfirmOpen(false)
      setCompanyToDelete(null)
    } catch (err) {
      console.error('Failed to delete company:', err)
      setError(err.message || 'Failed to delete company')
      notify('error', err.message)
    } finally {
      setDeletingCompanies(false)
    }
  }

  const handleBulkDelete = () => {
    if (selectedCompanies.length === 0) return
    setBulkDeleteConfirmOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      setDeletingCompanies(true)
      setError('')
      
      // Delete all selected companies using context function
      await Promise.all(selectedCompanies.map(id => deleteCompany(id)))
      notify('deleted', t('companiesList.bulkDeleteSuccess', { count: selectedCompanies.length }) || `${selectedCompanies.length} companies deleted`)
      setSelectedCompanies([])
      setShowDeleteSection(false)
      setBulkDeleteConfirmOpen(false)
    } catch (err) {
      console.error('Failed to delete companies:', err)
      setError(err.message || 'Failed to delete companies')
      notify('error', err.message)
      setBulkDeleteConfirmOpen(false)
    } finally {
      setDeletingCompanies(false)
    }
  }

  const handleExportToExcel = () => {
    if (companies.length === 0) {
      setError(t('companiesList.noCompaniesToExport') || 'No companies to export')
      return
    }

    try {
      // Group companies by groupId
      const grouped = companies.reduce((acc, company) => {
        const groupId = company.groupId ? normalizeId(company.groupId) : 'no-group'
        if (!acc[groupId]) {
          acc[groupId] = []
        }
        acc[groupId].push(company)
        return acc
      }, {})

      // Sort groups by date
      const groupsWithInfo = Object.keys(grouped)
        .map(groupId => {
          const groupCompanies = grouped[groupId]
          const group = groups.find(g => {
            const gId = normalizeId(g._id)
            const cGroupId = normalizeId(groupId)
            return gId === cGroupId
          })
          return {
            groupId,
            groupCompanies,
            group
          }
        })
        .filter(item => item !== null)
        .sort((a, b) => {
          const dateA = a.group?.date ? new Date(a.group.date) : new Date(0)
          const dateB = b.group?.date ? new Date(b.group.date) : new Date(0)
          return dateA - dateB
        })

      if (groupsWithInfo.length === 0) {
        setError(t('companiesList.noCompaniesToExport') || 'No companies to export')
        return
      }

      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Process each group and create a separate sheet
      groupsWithInfo.forEach((groupInfo, groupIndex) => {
        const { groupId, groupCompanies } = groupInfo
        const groupName = getGroupName(groupId)
        
        // Sort companies: unpaid first, then paid; within each, not spent first, then spent
        const sorted = [...groupCompanies].sort((a, b) => {
          if (a.paid !== b.paid) return a.paid ? 1 : -1
          if (a.spent !== b.spent) return a.spent ? 1 : -1
          return 0
        })

        // Prepare data for this group
        const groupData = sorted.map((company, index) => {
          const rowData = {
            [t('companiesList.registrantName') || 'Name']: company.registrantName || '-',
            [t('companiesList.name') || 'Company Name']: company.name,
            [t('companiesList.phone') || 'Mobile Number']: company.phoneNumber || '-',
            [t('companiesList.date') || 'Registration Time']: formatDate(company.createdAt),
            [t('companiesList.spent') || 'Spent']: company.spent ? 'Yes' : 'No',
            [t('companiesList.paid') || 'Paid']: company.paid ? 'Yes' : 'No',
            'Email': company.email || '-',
            'Address': company.address || '-'
          }
          
          return rowData
        })

        // Create worksheet for this group
        const worksheet = XLSX.utils.json_to_sheet(groupData)
        
        // Sanitize sheet name (Excel has restrictions on sheet names)
        let sheetName = groupName || `Group ${groupIndex + 1}`
        // Remove invalid characters and limit length to 31 characters (Excel limit)
        sheetName = sheetName.replace(/[\\\/\?\*\[\]]/g, '_').substring(0, 31)
        // Ensure unique sheet names
        let finalSheetName = sheetName
        let counter = 1
        while (workbook.SheetNames.includes(finalSheetName)) {
          finalSheetName = `${sheetName.substring(0, 28)}_${counter}`
          counter++
        }
        
        // Add sheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName)
      })

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `Registered_Companies_${date}.xlsx`

      // Write and download file
      XLSX.writeFile(workbook, filename)
      setError('')
      notify('info', t('companiesList.exportSuccess') || 'Exported to Excel successfully')
    } catch (err) {
      console.error('Failed to export to Excel:', err)
      setError(err.message || t('companiesList.exportError') || 'Failed to export to Excel')
      notify('error', err.message)
    }
  }

  // Fetch initial data - use context for companies and companyNames, but still fetch groups locally
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')
        // Use context's fetch function for companies (will sync with other components)
        await fetchCompanies()
        // Fetch groups separately (not part of sync)
        const groupsData = await groupsAPI.getAllForDisplay()
        setGroups(groupsData || [])
      } catch (err) {
        setError(err.message || t('companiesList.error'))
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
    
    // Sync local error and loading states with context
    if (contextError) {
      setError(contextError)
    }
    if (contextLoading.companies) {
      setLoading(true)
    }
    
    // Fetch website settings to check codesActive
    const fetchWebsiteSettings = async () => {
      try {
        const settings = await settingsAPI.getWebsiteSettings()
        setWebsiteSettings(settings)
        setPostRegistrationMessage(settings.postRegistrationMessage || '')
      } catch (err) {
        console.error('Failed to fetch website settings:', err)
      }
    }
    
    fetchWebsiteSettings()
  }, [location.state])

  // Fetch settings again when newly registered to ensure message is loaded
  useEffect(() => {
    if (location.state?.newlyRegistered) {
      const fetchSettings = async () => {
        try {
          const settings = await settingsAPI.getWebsiteSettings()
          setPostRegistrationMessage(settings.postRegistrationMessage || '')
          console.log('Post-registration message:', settings.postRegistrationMessage)
        } catch (err) {
          console.error('Failed to fetch post-registration message:', err)
        }
      }
      fetchSettings()
    }
  }, [location.state?.newlyRegistered])

  // Show success message if coming from registration
  useEffect(() => {
    if (location.state?.newlyRegistered) {
      setShowSuccessMessage(true)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
        // Clear the state after showing message
        window.history.replaceState({}, document.title)
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setShowSuccessMessage(false)
    }
  }, [location.state])

  // Helper function to normalize IDs for comparison
  const normalizeId = (id) => {
    if (!id) return ''
    if (typeof id === 'string' || typeof id === 'number') {
      return String(id).trim()
    }

    // Handle MongoDB/Object-like IDs
    if (typeof id === 'object') {
      // BSON serialized ObjectId
      if (id.$oid) return String(id.$oid).trim()

      // Populated object shapes: { _id: ... } or { id: ... }
      if (id._id) return normalizeId(id._id)
      if (id.id) return normalizeId(id.id)

      // Native ObjectId instances
      if (typeof id.toHexString === 'function') {
        return id.toHexString().trim()
      }

      // Avoid plain-object default toString => "[object Object]"
      if (typeof id.toString === 'function' && id.toString !== Object.prototype.toString) {
        return id.toString().trim()
      }
    }

    return String(id).trim()
  }

  // Group companies by groupId (normalize IDs to strings for consistent grouping)
  const groupedCompanies = companies.reduce((acc, company) => {
    const groupId = company.groupId ? normalizeId(company.groupId) : 'no-group'
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(company)
    return acc
  }, {})

  // Filter companies by search term and filters
  const filterCompanies = (companyList) => {
    let filtered = companyList

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(company => {
        const companyCode = websiteSettings?.codesActive !== false ? getCompanyCode(company.name) : null
        return (
          company.registrantName?.toLowerCase().includes(searchLower) ||
          company.name?.toLowerCase().includes(searchLower) ||
          company.phoneNumber?.toLowerCase().includes(searchLower) ||
          (companyCode && companyCode?.toLowerCase().includes(searchLower)) ||
          company.email?.toLowerCase().includes(searchLower) ||
          formatDate(company.createdAt)?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Group filter
    if (filters.selectedGroup && filters.selectedGroup !== 'all') {
      filtered = filtered.filter(company => {
        const companyGroupId = company.groupId ? normalizeId(company.groupId) : 'no-group'
        return companyGroupId === filters.selectedGroup
      })
    }

    // Spent filter
    if (filters.spentFilter === 'spent') {
      filtered = filtered.filter(company => company.spent === true)
    } else if (filters.spentFilter === 'not-spent') {
      filtered = filtered.filter(company => company.spent === false)
    }

    // Paid filter
    if (filters.paidFilter === 'paid') {
      filtered = filtered.filter(company => company.paid === true)
    } else if (filters.paidFilter === 'not-paid') {
      filtered = filtered.filter(company => company.paid === false)
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(company => {
        const companyDate = new Date(company.createdAt)
        companyDate.setHours(0, 0, 0, 0)
        return companyDate >= fromDate
      })
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(company => {
        const companyDate = new Date(company.createdAt)
        return companyDate <= toDate
      })
    }

    return filtered
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const resetFilters = () => {
    setFilters({
      selectedGroup: '',
      spentFilter: 'all',
      paidFilter: 'all',
      dateFrom: '',
      dateTo: ''
    })
    setSearchTerm('')
  }

  const handleCopyCompanyName = async (companyName, event) => {
    try {
      await navigator.clipboard.writeText(companyName)
      // Show visual feedback
      const target = event?.target
      if (target) {
        const originalText = target.textContent
        target.textContent = '✓ Copied!'
        target.style.color = 'var(--success-color)'
        setTimeout(() => {
          if (target) {
            target.textContent = originalText
            target.style.color = ''
          }
        }, 1500)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = companyName
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // Show feedback even with fallback
      const target = event?.target
      if (target) {
        const originalText = target.textContent
        target.textContent = '✓ Copied!'
        target.style.color = 'var(--success-color)'
        setTimeout(() => {
          if (target) {
            target.textContent = originalText
            target.style.color = ''
          }
        }, 1500)
      }
    }
  }

  const handleOpenWhatsApp = (phoneNumber) => {
    if (!phoneNumber) return
    
    // Remove any non-digit characters except +
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')
    
    // Open WhatsApp with the phone number
    const whatsappUrl = `https://wa.me/${cleanPhone}`
    window.open(whatsappUrl, '_blank')
  }

  // Get group name by ID - with improved matching
  const getGroupName = (groupId) => {
    if (!groupId || groupId === 'no-group') return 'No Group'
    if (!groups || groups.length === 0) return 'Loading...'
    
    // Normalize the groupId we're looking for
    const searchId = normalizeId(groupId)
    
    // Find matching group - try exact match first
    let group = groups.find(g => {
      if (!g || !g._id) return false
      const gId = normalizeId(g._id)
      // Exact match
      if (gId === searchId) return true
      // Try without any extra characters
      if (gId.replace(/[^a-zA-Z0-9]/g, '') === searchId.replace(/[^a-zA-Z0-9]/g, '')) return true
      return false
    })
    
    // If not found, try case-insensitive comparison
    if (!group) {
      const searchIdLower = searchId.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
      group = groups.find(g => {
        if (!g || !g._id) return false
        const gId = normalizeId(g._id).toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
        return gId === searchIdLower
      })
    }
    
    // Return the group name if found
    if (group && group.name) {
      return group.name
    }
    
    // Last resort fallback - show first 8 chars of ID
    return `Group ${searchId.substring(0, 8)}`
  }

  if (loading) {
    return (
      <div className="companies-list-page">
        <div className="loading-container">
          <div className="loading">{t('companiesList.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="companies-list-page">
      <div className="companies-list-container">
        <div className="list-header">
          <div className="header-content">
            <div>
              <h1>{t('companiesList.title')}</h1>
              <p className="list-subtitle">{t('companiesList.subtitle', { count: companies.length })}</p>
            </div>
            <button 
              onClick={handleExportToExcel} 
              className="export-excel-btn"
              disabled={companies.length === 0}
              title={t('companiesList.exportToExcel') || 'Export to Excel'}
            >
              📊 {t('companiesList.exportToExcel') || 'Export to Excel'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {showSuccessMessage && location.state?.newlyRegistered && (() => {
          // Find the newly registered company (most recent one)
          const newlyRegisteredCompany = companies.length > 0 
            ? companies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
            : null;
          
          // Get group information
          const companyGroup = newlyRegisteredCompany?.groupId 
            ? groups.find(g => {
                const gId = normalizeId(g._id);
                const cGroupId = normalizeId(newlyRegisteredCompany.groupId);
                return gId === cGroupId;
              })
            : null;
          
          // Format time
          const timeStr = companyGroup?.timeFrom && companyGroup?.timeTo
            ? `${companyGroup.timeFrom} - ${companyGroup.timeTo}`
            : '-';
          
          // Format date
          const dateStr = companyGroup?.date
            ? new Date(companyGroup.date + 'T00:00:00').toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '-';
          
          // Get day
          const dayStr = companyGroup?.day || '-';
          
          // Get group name
          const groupName = companyGroup?.name || '-';
          
          return (
            <div className="success-message" style={{
              padding: '15px',
              marginBottom: '20px',
              backgroundColor: '#d4edda',
              border: '2px solid #c3e6cb',
              borderRadius: '5px',
              color: '#155724',
              fontSize: '16px',
              position: 'relative'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                ✓ {t('registration.successfullyRecorded') || 'Successfully Recorded'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', marginBottom: '8px' }}>
                <div><strong>{t('registration.groupSelection') || t('registration.group') || 'Group Selection'}:</strong> {groupName}</div>
                <div><strong>{t('registration.time') || 'Time'}:</strong> {timeStr}</div>
                <div><strong>{t('registration.date') || 'Date'}:</strong> {dateStr}</div>
                <div><strong>{t('registration.day') || 'Day'}:</strong> {dayStr}</div>
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6c757d', 
                fontStyle: 'italic',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #c3e6cb'
              }}>
                {t('registration.autoDismissMessage') || 'This message will be removed after 5 seconds'}
              </div>
            </div>
          );
        })()}

        {/* Post-Registration Notification Message */}
        {location.state?.newlyRegistered && postRegistrationMessage && (
          <div className="post-registration-notification" style={{
            padding: '20px 25px',
            marginBottom: '20px',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            border: '3px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '18px',
            position: 'relative',
            boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)',
            marginTop: '20px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '1rem'
            }}>
              <span style={{ fontSize: '28px', flexShrink: 0 }}>📢</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  color: '#c4b5fd',
                  fontSize: '20px'
                }}>
                  {t('settings.postRegistrationNotification') || 'Important Notice'}
                </div>
                <div style={{ 
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  color: '#ffffff'
                }}>
                  {postRegistrationMessage}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="list-filters">
          <div className="filters-header">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('companiesList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '▲' : '▼'} {t('companiesList.filters') || 'Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>{t('companiesList.filterByGroup') || 'Filter by Group'}</label>
                <select
                  value={filters.selectedGroup}
                  onChange={(e) => handleFilterChange('selectedGroup', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('companiesList.allGroups') || 'All Groups'}</option>
                  {groups.map(group => (
                    <option key={normalizeId(group._id)} value={normalizeId(group._id)}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{t('companiesList.filterBySpent') || 'Spent Status'}</label>
                <select
                  value={filters.spentFilter}
                  onChange={(e) => handleFilterChange('spentFilter', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('companiesList.all') || 'All'}</option>
                  <option value="spent">{t('companiesList.spent') || 'Spent'}</option>
                  <option value="not-spent">{t('companiesList.notSpent') || 'Not Spent'}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t('companiesList.filterByPaid') || 'Paid Status'}</label>
                <select
                  value={filters.paidFilter}
                  onChange={(e) => handleFilterChange('paidFilter', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('companiesList.all') || 'All'}</option>
                  <option value="paid">{t('companiesList.paid') || 'Paid'}</option>
                  <option value="not-paid">{t('companiesList.notPaid') || 'Not Paid'}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t('companiesList.dateFrom') || 'Date From'}</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>{t('companiesList.dateTo') || 'Date To'}</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="filter-input"
                />
              </div>

              <button 
                className="reset-filters-btn"
                onClick={resetFilters}
              >
                {t('companiesList.resetFilters') || 'Reset Filters'}
              </button>
            </div>
          )}
        </div>

        {/* Delete Section */}
        <div className="delete-section">
          <div className="delete-section-header">
            <button 
              className="delete-toggle-btn"
              onClick={() => setShowDeleteSection(!showDeleteSection)}
            >
              {showDeleteSection ? '▲' : '▼'} {t('companiesList.deleteSection') || 'Delete Section'}
            </button>
            {selectedCompanies.length > 0 && (
              <span className="selected-count">
                {selectedCompanies.length} {t('companiesList.selected') || 'selected'}
              </span>
            )}
          </div>

          {showDeleteSection && (
            <div className="delete-panel">
              <div className="delete-actions">
                <button
                  className="bulk-delete-btn"
                  onClick={handleBulkDelete}
                  disabled={selectedCompanies.length === 0 || deletingCompanies}
                >
                  {deletingCompanies 
                    ? t('companiesList.deleting') || 'Deleting...' 
                    : t('companiesList.deleteSelected') || `Delete Selected (${selectedCompanies.length})`
                  }
                </button>
                <button
                  className="clear-selection-btn"
                  onClick={() => setSelectedCompanies([])}
                  disabled={selectedCompanies.length === 0}
                >
                  {t('companiesList.clearSelection') || 'Clear Selection'}
                </button>
              </div>
              <div className="delete-info">
                <p>{t('companiesList.deleteInfo') || 'Select companies using checkboxes and click "Delete Selected" to remove them.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal (single) */}
        {deleteConfirmOpen && companyToDelete && (
          <div className="delete-modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{t('companiesList.confirmDelete') || 'Confirm Delete'}</h3>
              <p>
                {t('companiesList.confirmDeleteMessage') || 'Are you sure you want to delete'}
                <strong> {companyToDelete.name}</strong>?
              </p>
              <div className="modal-actions">
                <button
                  className="confirm-delete-btn"
                  onClick={() => handleDeleteCompany(companyToDelete._id)}
                  disabled={deletingCompanies}
                >
                  {deletingCompanies
                    ? t('companiesList.deleting') || 'Deleting...'
                    : t('companiesList.delete') || 'Delete'
                  }
                </button>
                <button
                  className="cancel-delete-btn"
                  onClick={() => {
                    setDeleteConfirmOpen(false)
                    setCompanyToDelete(null)
                  }}
                  disabled={deletingCompanies}
                >
                  {t('companiesList.cancel') || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        <ConfirmModal
          open={bulkDeleteConfirmOpen}
          title={t('companiesList.confirmDelete') || 'Confirm Delete'}
          message={t('companiesList.confirmBulkDelete', { count: selectedCompanies.length }) || `Are you sure you want to delete ${selectedCompanies.length} company(ies)?`}
          confirmLabel={t('companiesList.delete') || 'Delete'}
          cancelLabel={t('companiesList.cancel') || 'Cancel'}
          variant="danger"
          loading={deletingCompanies}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={() => setBulkDeleteConfirmOpen(false)}
        />

        <div className="companies-list">
          {Object.keys(groupedCompanies).length === 0 ? (
            <div className="empty-state">
              <p>{t('companiesList.noCompanies')}</p>
            </div>
          ) : (() => {
            // Get groups with their information and sort by date (payment date)
            const groupsWithInfo = Object.keys(groupedCompanies)
              .map(groupId => {
                const groupCompanies = filterCompanies(groupedCompanies[groupId])
                if (groupCompanies.length === 0) return null
                
                // Find the group object
                const group = groups.find(g => {
                  if (!g || !g._id) return false
                  const gId = normalizeId(g._id)
                  const searchId = normalizeId(groupId)
                  return gId === searchId || 
                         gId.replace(/[^a-zA-Z0-9]/g, '') === searchId.replace(/[^a-zA-Z0-9]/g, '') ||
                         gId.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') === searchId.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
                })
                
                return {
                  groupId,
                  groupCompanies,
                  group,
                  groupName: getGroupName(groupId),
                  companyCount: groupCompanies.length
                }
              })
              .filter(item => item !== null)
              .sort((a, b) => {
                // Sort by date (payment date) - earlier dates first
                const dateA = a.group?.date ? new Date(a.group.date) : new Date(0)
                const dateB = b.group?.date ? new Date(b.group.date) : new Date(0)
                return dateA - dateB
              })
            
            return groupsWithInfo.map((groupInfo, index) => {
              const { groupId, groupCompanies, group, groupName, companyCount } = groupInfo
              
              // Sort companies: unpaid first, then paid (paid go to bottom)
              // Within each group, also sort by spent: not spent first, then spent
              const sortedGroupCompanies = [...groupCompanies].sort((a, b) => {
                // First sort by paid status: unpaid (false) comes before paid (true)
                if (a.paid !== b.paid) {
                  return a.paid ? 1 : -1
                }
                // If both have same paid status, sort by spent status
                if (a.spent !== b.spent) {
                  return a.spent ? 1 : -1
                }
                // If both have same paid and spent status, maintain original order
                return 0
              })
              
              // Format payment date as DD/MM/YYYY
              const paymentDate = group?.date
                ? (() => {
                    const date = new Date(group.date + 'T00:00:00')
                    const day = String(date.getDate()).padStart(2, '0')
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const year = date.getFullYear()
                    return `${day}/${month}/${year}`
                  })()
                : '-'
              
              return (
                <div key={groupId} className="group-section">
                  <h2 className="group-section-title">
                    <span className="group-name">{groupName}</span>
                    {paymentDate !== '-' && (
                      <span className="group-payment-date">
                        {t('companiesList.paymentDate') || 'Payment Date'}: {paymentDate}
                      </span>
                    )}
                    <span className="group-company-count">
                      ({companyCount} {t('companiesList.companies') || 'companies'})
                    </span>
                  </h2>
                  
                  <div className="professional-table-container">
                    <table className="professional-table registered-companies-table">
                      <thead>
                        <tr>
                          <th className="text-center" style={{ width: '50px' }}>
                            <input
                              type="checkbox"
                              checked={groupCompanies.length > 0 && groupCompanies.every(c => selectedCompanies.includes(c._id))}
                              onChange={() => handleSelectAll(groupCompanies)}
                              className="select-all-checkbox"
                              title={t('companiesList.selectAll') || 'Select All'}
                              aria-label={t('companiesList.selectAll') || 'Select All'}
                            />
                          </th>
                          <th className="text-center" style={{ width: '80px' }}>{t('companiesList.id') || 'ID'}</th>
                          <th className="text-left" style={{ width: '150px' }}>{t('companiesList.registrantName') || 'Name'}</th>
                          <th className="text-left" style={{ width: '200px' }}>{t('companiesList.name') || 'Company Name'}</th>
                          <th className="text-left" style={{ width: '150px' }}>{t('companiesList.phone') || 'Mobile Number'}</th>
                          <th className="text-center" style={{ width: '120px' }}>{t('companiesList.date') || 'Registration Time'}</th>
                          <th className="text-center" style={{ width: '80px' }}>{t('companiesList.spent') || 'Spent'}</th>
                          <th className="text-center" style={{ width: '80px' }}>{t('companiesList.paid') || 'Paid'}</th>
                          <th className="text-center" style={{ width: '100px' }}>{t('companiesList.actions') || 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGroupCompanies.map((company, companyIndex) => {
                          return (
                            <tr 
                              key={company._id} 
                              className={`registered-company-row ${company.spent ? 'row-spent' : ''} ${company.paid ? 'row-paid' : ''}`}
                            >
                              <td className="text-center checkbox-cell">
                                <input
                                  type="checkbox"
                                  checked={selectedCompanies.includes(company._id)}
                                  onChange={() => handleSelectCompany(company._id)}
                                  className="company-checkbox"
                                  aria-label={`Select ${company.name}`}
                                />
                              </td>
                              <td className="text-center code-cell">
                                <code
                                  className="clickable"
                                  onClick={(e) => {
                                    const companyId = company.code || getCompanyCode(company.name)
                                    if (companyId && companyId !== '-') {
                                      handleCopyCompanyName(companyId, e)
                                    }
                                  }}
                                  title={t('companiesList.clickToCopyId') || 'Click to copy ID'}
                                >
                                  {company.code || getCompanyCode(company.name)}
                                </code>
                              </td>
                              <td className="text-left">
                                <span className="registrant-name">{company.registrantName || '-'}</span>
                              </td>
                              <td className="text-left company-name-cell">
                                {company.logo && (
                                  <img src={company.logo} alt={company.name} className="company-logo-small" style={{ marginRight: '0.5rem', verticalAlign: 'middle', maxHeight: '24px' }} />
                                )}
                                <span 
                                  className={`company-name clickable ${company.paid ? 'paid-strikethrough' : ''}`}
                                  onClick={(e) => handleCopyCompanyName(company.name, e)}
                                  title="Click to copy company name"
                                >
                                  {company.name}
                                </span>
                              </td>
                              <td className="text-left">
                                {company.phoneNumber ? (
                                  <span 
                                    className={`phone-number clickable ${company.paid ? 'paid-strikethrough' : ''}`}
                                    onClick={() => handleOpenWhatsApp(company.phoneNumber)}
                                    title={t('companiesList.clickToWhatsApp') || 'Click to open WhatsApp'}
                                  >
                                    {company.phoneNumber}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="text-center">
                                <span className="registration-date">{formatDate(company.createdAt)}</span>
                              </td>
                              <td className="text-center">
                                <button
                                  className={`status-toggle spent-toggle ${company.spent ? 'active' : ''}`}
                                  onClick={() => handleStatusToggle(company._id, 'spent')}
                                  disabled={updatingStatus[company._id]}
                                  title={company.spent ? 'Mark as not spent' : 'Mark as spent'}
                                >
                                  {updatingStatus[company._id] ? '...' : (company.spent ? '✓' : '○')}
                                </button>
                              </td>
                              <td className="text-center">
                                <button
                                  className={`status-toggle paid-toggle ${company.paid ? 'active' : ''}`}
                                  onClick={() => handleStatusToggle(company._id, 'paid')}
                                  disabled={updatingStatus[company._id]}
                                  title={company.paid ? 'Mark as not paid' : 'Mark as paid'}
                                >
                                  {updatingStatus[company._id] ? '...' : (company.paid ? '✓' : '○')}
                                </button>
                              </td>
                              <td className="text-center actions-cell">
                                <button
                                  className="delete-company-btn action-icon-btn delete-icon-btn"
                                  onClick={() => {
                                    setCompanyToDelete(company)
                                    setDeleteConfirmOpen(true)
                                  }}
                                  disabled={deletingCompanies}
                                  title={t('companiesList.deleteCompany') || 'Delete Company'}
                                  aria-label={t('companiesList.deleteCompany') || 'Delete Company'}
                                >
                                  <svg className="action-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </div>
    </div>
  )
}

export default CompaniesList
