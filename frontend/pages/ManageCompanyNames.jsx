import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCompaniesData } from '../contexts/CompaniesDataContext'
import { useNotification } from '../contexts/NotificationContext'
import { useTranslation } from 'react-i18next'
import { companyNamesAPI } from '../services/api'
import * as XLSX from 'xlsx'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/global-tables.css'
import './ManageCompanyNames.css'

const ManageCompanyNames = () => {
  const { 
    companyNames, 
    loading: contextLoading, 
    error: contextError,
    fetchCompanyNames,
    createCompanyName,
    updateCompanyName,
    deleteCompanyName,
    refreshAll
  } = useCompaniesData()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewingName, setViewingName] = useState(null)
  const [editingName, setEditingName] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [inlineEditValue, setInlineEditValue] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    mobileNumber: '',
    code: '',
    notes: ''
  })
  const [importData, setImportData] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
  const fileInputRef = useRef(null)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { notify } = useNotification()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    // Use context's fetch function which will sync with other components
    fetchCompanyNames().then(() => setLoading(false))
  }, [isAuthenticated, user, navigate, fetchCompanyNames])
  
  // Sync local error state with context error
  useEffect(() => {
    if (contextError) {
      setError(contextError)
    }
  }, [contextError])
  
  // Sync local loading state with context loading
  useEffect(() => {
    if (contextLoading.companyNames) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [contextLoading.companyNames])

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

  // Format date and time for display (DD/MM/YYYY HH:MM)
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (e) {
      return '-'
    }
  }

  // fetchCompanyNames is now provided by context - no need for local function

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    try {
      if (editingName) {
        await updateCompanyName(editingName._id, formData)
        setSuccess(t('companyNames.updated'))
        notify('updated', t('companyNames.updated'))
      } else {
        await createCompanyName(formData)
        setSuccess(t('companyNames.created'))
        notify('added', t('companyNames.created'))
      }
      resetForm()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    }
  }

  const handleView = (companyName) => {
    setViewingName(companyName)
    setEditingName(null)
    setFormData({
      name: companyName.name || '',
      contactName: companyName.contactName || '',
      mobileNumber: companyName.mobileNumber || '',
      code: companyName.code || '',
      notes: companyName.notes || ''
    })
    setShowForm(true)
  }

  const handleEdit = (companyName) => {
    setEditingName(companyName)
    setViewingName(null)
    setFormData({
      name: companyName.name || '',
      contactName: companyName.contactName || '',
      mobileNumber: companyName.mobileNumber || '',
      code: companyName.code || '',
      notes: companyName.notes || ''
    })
    setShowForm(true)
  }

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    try {
      await deleteCompanyName(deleteTargetId)
      setSuccess(t('companyNames.deleted'))
      notify('deleted', t('companyNames.deleted'))
      setTimeout(() => setSuccess(''), 3000)
      setDeleteConfirmOpen(false)
      setDeleteTargetId(null)
    } catch (err) {
      setError(err.message)
      notify('error', err.message)
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
      setDeleteConfirmOpen(false)
    }
  }

  const handleDeleteAllClick = () => {
    if (companyNames.length === 0) {
      setError(t('companyNames.noNamesToDelete') || 'No company names to delete')
      setTimeout(() => setError(''), 3000)
      return
    }
    setDeleteAllConfirmOpen(true)
  }

  const handleDeleteAllConfirm = async () => {
    try {
      const successMessage = t('companyNames.allDeleted') || `All ${companyNames.length} company names deleted successfully!`
      await companyNamesAPI.deleteAll()
      setSuccess(successMessage)
      notify('deleted', successMessage)
      await fetchCompanyNames()
      setTimeout(() => setSuccess(''), 3000)
      setDeleteAllConfirmOpen(false)
    } catch (err) {
      setError(err.message)
      notify('error', err.message)
      setTimeout(() => setError(''), 5000)
      setDeleteAllConfirmOpen(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contactName: '',
      mobileNumber: '',
      code: '',
      notes: ''
    })
    setEditingName(null)
    setViewingName(null)
    setShowForm(false)
  }

  const handleInlineEditStart = (id, field, currentValue) => {
    setEditingRow(id)
    setEditingField(field)
    setInlineEditValue(currentValue || '')
  }

  const handleInlineEditCancel = () => {
    setEditingRow(null)
    setEditingField(null)
    setInlineEditValue('')
  }

  const handleInlineEditSave = async (id, field) => {
    try {
      const updateData = { [field]: inlineEditValue.trim() }
      await companyNamesAPI.update(id, updateData)
      setSuccess(t('companyNames.updated'))
      await fetchCompanyNames()
      handleInlineEditCancel()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
      handleInlineEditCancel()
    }
  }

  const handleInlineEditKeyDown = (e, id, field) => {
    if (e.key === 'Enter') {
      handleInlineEditSave(id, field)
    } else if (e.key === 'Escape') {
      handleInlineEditCancel()
    }
  }

  const handleCopyCode = async (code, event) => {
    if (!code) return
    
    try {
      await navigator.clipboard.writeText(code)
      // Show visual feedback
      const target = event?.target
      if (target) {
        const originalText = target.textContent
        const originalBg = target.style.backgroundColor
        target.textContent = '✓ Copied!'
        target.style.backgroundColor = 'var(--success-color, #10b981)'
        target.style.color = 'white'
        setTimeout(() => {
          if (target) {
            target.textContent = originalText
            target.style.backgroundColor = originalBg
            target.style.color = ''
          }
        }, 1500)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // Show feedback even with fallback
      const target = event?.target
      if (target) {
        const originalText = target.textContent
        const originalBg = target.style.backgroundColor
        target.textContent = '✓ Copied!'
        target.style.backgroundColor = 'var(--success-color, #10b981)'
        target.style.color = 'white'
        setTimeout(() => {
          if (target) {
            target.textContent = originalText
            target.style.backgroundColor = originalBg
            target.style.color = ''
          }
        }, 1500)
      }
    }
  }

  const handleOpenWhatsApp = (phoneNumber) => {
    if (!phoneNumber) return
    
    // Remove any non-digit characters except + for international format
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '')
    
    // Open WhatsApp with the phone number
    const whatsappUrl = `https://wa.me/${cleanedNumber}`
    window.open(whatsappUrl, '_blank')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split('.').pop()

    // Handle Excel files (.xlsx, .xls)
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Convert to JSON array with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
          
          if (jsonData.length === 0) {
            setError(t('companyNames.noNames') || 'No data found in file')
            return
          }

          // Check if first row is headers (case-insensitive matching)
          const firstRow = jsonData[0] || []
          const hasHeaders = firstRow.some(cell => {
            const cellStr = String(cell || '').toLowerCase()
            return cellStr.includes('company') || cellStr.includes('name') || 
                   cellStr.includes('contact') || cellStr.includes('mobile') || 
                   cellStr.includes('phone')
          })

          const startRow = hasHeaders ? 1 : 0
          const companies = []

          // Find column indices (case-insensitive)
          // Expected order: Column 1 = Company Name, Column 2 = Contact Name (Name), Column 3 = Phone Number, Column 4 = Code
          let nameCol = 0, contactCol = -1, mobileCol = -1, codeCol = -1
          if (hasHeaders && firstRow.length > 0) {
            firstRow.forEach((cell, idx) => {
              const cellStr = String(cell || '').toLowerCase().trim()
              
              // Column 1: Company Name (must include "company" and "name")
              if (cellStr.includes('company') && cellStr.includes('name')) {
                nameCol = idx
              }
              // Column 2: Contact Name or just "Name" (if not company name)
              else if ((cellStr.includes('contact') && cellStr.includes('name')) || 
                       (cellStr === 'name' && idx === 1)) {
                contactCol = idx
              }
              // Column 3: Phone Number or Mobile Number
              else if ((cellStr.includes('mobile') || cellStr.includes('phone')) && 
                       (cellStr.includes('number') || cellStr.includes('mobile') || cellStr.includes('phone'))) {
                mobileCol = idx
              }
              // Column 4: Code
              else if (cellStr.includes('code')) {
                codeCol = idx
              }
            })
            
            // If not found by headers, use default positions
            if (nameCol === -1) nameCol = 0
            if (contactCol === -1 && firstRow.length > 1) contactCol = 1
            if (mobileCol === -1 && firstRow.length > 2) mobileCol = 2
            if (codeCol === -1 && firstRow.length > 3) codeCol = 3
          } else {
            // No headers: Column 1 = Company Name, Column 2 = Contact Name, Column 3 = Phone Number, Column 4 = Code
            nameCol = 0
            contactCol = 1
            mobileCol = 2
            codeCol = 3
          }

          for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (!Array.isArray(row) || row.length === 0) continue

            // Column 1: Company Name
            const name = String(row[nameCol] || '').trim()
            if (!name || name.toLowerCase().match(/^(name|company|company name|companyname)$/i)) continue

            // Column 2: Contact Name (Name)
            const contactName = (contactCol >= 0 && row[contactCol] !== undefined) 
              ? String(row[contactCol] || '').trim() 
              : ''
            
            // Column 3: Phone Number (Mobile Number)
            const mobileNumber = (mobileCol >= 0 && row[mobileCol] !== undefined) 
              ? String(row[mobileCol] || '').trim() 
              : ''
            
            // Column 4: Code (optional - if empty, will be auto-generated)
            const code = (codeCol >= 0 && row[codeCol] !== undefined) 
              ? String(row[codeCol] || '').trim() 
              : ''

            companies.push({
              name,
              contactName: contactName || '',
              mobileNumber: mobileNumber || '',
              code: code || ''
            })
          }

          if (companies.length === 0) {
            setError(t('companyNames.noNames') || 'No valid company names found')
            return
          }

          // Format for textarea display: Column 1 = Name, Column 2 = Contact Name, Column 3 = Phone Number, Column 4 = Code
          const formattedData = companies.map(c => {
            if (c.contactName || c.mobileNumber || c.code) {
              return `${c.name},${c.contactName || ''},${c.mobileNumber || ''},${c.code || ''}`
            }
            return c.name
          }).join('\n')

          setImportData(formattedData)
          setShowImport(true)
        } catch (err) {
          setError(t('companyNames.importError') + ': ' + err.message)
        }
      }
      reader.readAsArrayBuffer(file)
    }
    // Handle CSV and TXT files
    else if (fileExtension === 'csv' || fileExtension === 'txt') {
    const reader = new FileReader()
    reader.onload = (event) => {
        try {
      const text = event.target.result
          const lines = text.split(/\r?\n/).filter(line => line.trim())
          
          if (lines.length === 0) {
            setError(t('companyNames.noNames') || 'No data found in file')
            return
          }

          // Check if first line is headers
          const firstLine = lines[0] || ''
          const hasHeaders = firstLine.toLowerCase().includes('company') || 
                           firstLine.toLowerCase().includes('name') ||
                           firstLine.toLowerCase().includes('contact') ||
                           firstLine.toLowerCase().includes('mobile')

          const startLine = hasHeaders ? 1 : 0
          const companies = []

          // Parse CSV with proper quoted value handling
          const parseCSVLine = (line) => {
            const columns = []
            let current = ''
            let inQuotes = false
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                  current += '"'
                  i++
                } else {
                  inQuotes = !inQuotes
                }
              } else if (char === ',' && !inQuotes) {
                columns.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            columns.push(current.trim())
            return columns
          }

          for (let i = startLine; i < lines.length; i++) {
            const columns = parseCSVLine(lines[i])
            if (columns.length === 0) continue

            // Column 1: Company Name
            const name = (columns[0] || '').trim()
            if (!name || name.toLowerCase().match(/^(name|company|company name|companyname)$/i)) continue

            // Column 2: Contact Name (Name)
            const contactName = (columns[1] || '').trim()
            
            // Column 3: Phone Number (Mobile Number)
            const mobileNumber = (columns[2] || '').trim()
            
            // Column 4: Code (optional - if empty, will be auto-generated)
            const code = (columns[3] || '').trim()

            companies.push({
              name,
              contactName: contactName || '',
              mobileNumber: mobileNumber || '',
              code: code || ''
            })
          }

          if (companies.length === 0) {
            setError(t('companyNames.noNames') || 'No valid company names found')
            return
          }

          // Format for textarea display: Column 1 = Name, Column 2 = Contact Name, Column 3 = Phone Number, Column 4 = Code
          const formattedData = companies.map(c => {
            if (c.contactName || c.mobileNumber || c.code) {
              return `${c.name},${c.contactName || ''},${c.mobileNumber || ''},${c.code || ''}`
            }
            return c.name
          }).join('\n')

          setImportData(formattedData)
      setShowImport(true)
        } catch (err) {
          setError(t('companyNames.importError') + ': ' + err.message)
        }
      }
      reader.readAsText(file, 'UTF-8')
    } else {
      setError(t('companyNames.unsupportedFileType') || 'Unsupported file type')
    }
  }

  const handleImport = async () => {
    if (!importData.trim()) {
      setError(t('companyNames.importEmpty'))
      return
    }

    setError('')
    setImportResult(null)
    setSuccess('')

    try {
      // Parse the import data - support both single column (name only) and multi-column (name,contact,mobile)
      const lines = importData.split('\n').filter(line => line.trim())
      const companies = []

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // Check if line contains commas (multi-column format)
        // Expected format: Column 1 = Company Name, Column 2 = Contact Name, Column 3 = Phone Number, Column 4 = Code
        if (trimmedLine.includes(',')) {
          const columns = trimmedLine.split(',').map(col => col.trim())
          // Column 1: Company Name
          const name = columns[0] || ''
          
          if (!name || name.toLowerCase().match(/^(name|company|company name|companyname)$/i)) continue

          companies.push({
            name: name,
            // Column 2: Contact Name (Name)
            contactName: columns[1] || '',
            // Column 3: Phone Number (Mobile Number)
            mobileNumber: columns[2] || '',
            // Column 4: Code (optional - if empty, will be auto-generated)
            code: columns[3] || ''
          })
      } else {
          // Single column format (name only)
          if (trimmedLine.toLowerCase().match(/^(name|company|company name|companyname)$/i)) continue
          
          companies.push({
            name: trimmedLine,
            contactName: '',
            mobileNumber: ''
          })
        }
      }

      if (companies.length === 0) {
        setError(t('companyNames.noNames'))
        return
      }

      const result = await companyNamesAPI.import(companies)
      setImportResult(result)
      setImportData('')
      setShowImport(false)
      const successMsg = t('companyNames.importSuccess', { count: result.imported })
      setSuccess(successMsg)
      notify('added', successMsg)
      await fetchCompanyNames()
      setTimeout(() => {
        setSuccess('')
        setImportResult(null)
      }, 5000)
    } catch (err) {
      setError(err.message || t('companyNames.importError'))
      notify('error', err.message || t('companyNames.importError'))
    }
  }

  const handleExportToExcel = () => {
    if (companyNames.length === 0) {
      setError(t('companyNames.noNamesToExport') || 'No company names to export')
      return
    }

    try {
      // Prepare data for export - order: Contact Name, Mobile Number, Company Name, Code, Created At
      const exportData = companyNames.map((item, index) => ({
        '#': index + 1,
        [t('companyNames.contactName') || 'Contact Name']: item.contactName || '-',
        [t('companyNames.mobileNumber') || 'Mobile Number']: item.mobileNumber || '-',
        [t('companyNames.name') || 'Company Name']: item.name,
        [t('companyNames.code') || 'ID']: item.code || '-',
        [t('companyNames.createdAt') || 'Created At']: formatDateTime(item.createdAt),
        [t('companyNames.notes') || 'Notes']: item.notes || '-',
        [t('companyNames.updatedAt') || 'Updated At']: item.updatedAt ? formatDateTime(item.updatedAt) : '-'
      }))

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Names')

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `Company_Names_${date}.xlsx`

      // Write and download file
      XLSX.writeFile(workbook, filename)
      const exportMsg = t('companyNames.exportSuccess') || `Exported ${companyNames.length} company names to Excel`
      setSuccess(exportMsg)
      notify('info', exportMsg)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || t('companyNames.exportError') || 'Failed to export to Excel')
      notify('error', err.message)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="manage-company-names">
      <div className="header-actions">
        <h1>{t('companyNames.title')}</h1>
        <div className="action-buttons">
          <button onClick={handleExportToExcel} className="btn btn-export" disabled={companyNames.length === 0}>
            📊 {t('companyNames.exportToExcel') || 'Export to Excel'}
          </button>
          <button onClick={() => setShowImport(true)} className="btn btn-secondary">
            {t('companyNames.import')}
          </button>
          <button onClick={handleDeleteAllClick} className="btn btn-danger" disabled={companyNames.length === 0}>
            🗑️ {t('companyNames.deleteAll') || 'Delete All'}
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            {t('companyNames.addNew')}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Search Box */}
      <div className="search-box">
        <input
          type="text"
          placeholder={t('companyNames.searchPlaceholder') || 'Search by company name...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {showImport && (
        <div className="modal-overlay" onClick={() => { setShowImport(false); setImportData(''); setImportResult(null) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('companyNames.importTitle')}</h2>
              <button onClick={() => { setShowImport(false); setImportData(''); setImportResult(null) }} className="close-btn">×</button>
            </div>
            
            <div className="import-section">
              <div className="form-group">
                <label>{t('companyNames.uploadFile')}</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls,.txt"
                  className="file-input"
                />
                <small>{t('companyNames.fileHint')}</small>
              </div>

              <div className="form-group">
                <label>{t('companyNames.importLabel')}</label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows="10"
                  placeholder={t('companyNames.importPlaceholder')}
                  className="import-textarea"
                />
                <small>{t('companyNames.importHint')}</small>
              </div>

              <div className="form-actions">
                <button onClick={handleImport} className="btn btn-primary" disabled={!importData.trim()}>
                  {t('companyNames.import')}
                </button>
                <button onClick={() => { setShowImport(false); setImportData(''); setImportResult(null) }} className="btn btn-secondary">
                  {t('companyNames.cancel')}
                </button>
              </div>

              {importResult && (
                <div className="import-result">
                  <h3>{t('companyNames.importResult')}</h3>
                  <p className="success-text">{t('companyNames.imported', { count: importResult.imported })}</p>
                  {importResult.skipped > 0 && (
                    <p className="warning-text">{t('companyNames.skipped', { count: importResult.skipped })}</p>
                  )}
                  {importResult.errors > 0 && (
                    <p className="error-text">{t('companyNames.importErrors', { count: importResult.errors })}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {viewingName ? t('companyNames.view') : editingName ? t('companyNames.edit') : t('companyNames.addNew')}
              </h2>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="company-name-form">
              <div className="form-group">
                <label>{t('companyNames.name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={!!viewingName}
                  placeholder={t('companyNames.namePlaceholder')}
                />
              </div>

              <div className="form-group">
                <label>{t('companyNames.contactName')}</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  disabled={!!viewingName}
                  placeholder={t('companyNames.contactNamePlaceholder')}
                />
              </div>

              <div className="form-group">
                <label>{t('companyNames.mobileNumber')}</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  disabled={!!viewingName}
                  placeholder={t('companyNames.mobileNumberPlaceholder')}
                />
              </div>

              <div className="form-group">
                <label>{t('companyNames.code')}</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  disabled={!!viewingName}
                  placeholder={t('companyNames.codePlaceholder') || 'Enter company ID'}
                  maxLength="4"
                  pattern="[0-9]{4}"
                />
                <small>{t('companyNames.codeHint') || 'Enter a 4-digit ID'}</small>
              </div>

              <div className="form-group">
                <label>{t('companyNames.notes')}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  disabled={!!viewingName}
                  placeholder={t('companyNames.notesPlaceholder')}
                />
              </div>

              {viewingName && (
                <div className="view-info">
                  <p><strong>{t('companyNames.createdAt')}:</strong> {formatDateTime(viewingName.createdAt)}</p>
                  {viewingName.updatedAt && viewingName.updatedAt !== viewingName.createdAt && (
                    <p><strong>{t('companyNames.updatedAt')}:</strong> {formatDateTime(viewingName.updatedAt)}</p>
                  )}
                </div>
              )}

              {!viewingName && (
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingName ? t('companyNames.update') : t('companyNames.create')}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    {t('companyNames.cancel')}
                  </button>
                </div>
              )}
              {viewingName && (
                <div className="form-actions">
                  <button type="button" onClick={() => handleEdit(viewingName)} className="btn btn-primary">
                    {t('companyNames.edit')}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    {t('companyNames.close')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="company-names-list">
        {(() => {
          // Filter company names based on search term
          const filteredCompanyNames = searchTerm
            ? companyNames.filter(companyName =>
                companyName.name?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : companyNames

          if (filteredCompanyNames.length === 0) {
            return (
              <p className="empty-state">
                {searchTerm 
                  ? t('companyNames.noResults', { searchTerm }) || `No companies found matching "${searchTerm}"`
                  : t('companyNames.noNames')
                }
              </p>
            )
          }

          return (
          <div className="professional-table-container">
            <table className="professional-table">
              <thead>
                <tr>
                  <th>{t('companyNames.name')}</th>
                    <th>{t('companyNames.contactName')}</th>
                    <th>{t('companyNames.mobileNumber')}</th>
                  <th>{t('companyNames.code')}</th>
                  <th>{t('companyNames.createdAt')}</th>
                  <th>{t('companyNames.actions')}</th>
                </tr>
              </thead>
              <tbody>
                  {filteredCompanyNames.map(companyName => (
                  <tr key={companyName._id}>
                      <td className="company-name-cell text-left">{companyName.name}</td>
                      <td 
                        className="editable-cell text-left"
                        onClick={() => handleInlineEditStart(companyName._id, 'contactName', companyName.contactName)}
                        title={t('companyNames.clickToEdit') || 'Click to edit'}
                      >
                        {editingRow === companyName._id && editingField === 'contactName' ? (
                          <div className="inline-edit-container">
                            <input
                              type="text"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => handleInlineEditSave(companyName._id, 'contactName')}
                              onKeyDown={(e) => handleInlineEditKeyDown(e, companyName._id, 'contactName')}
                              className="inline-edit-input"
                              autoFocus
                            />
                            <div className="inline-edit-buttons">
                              <button
                                type="button"
                                onClick={() => handleInlineEditSave(companyName._id, 'contactName')}
                                className="btn-save-inline"
                                title={t('companyNames.save') || 'Save'}
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={handleInlineEditCancel}
                                className="btn-cancel-inline"
                                title={t('companyNames.cancel') || 'Cancel'}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="editable-content">{companyName.contactName || <em className="empty-value">-</em>}</span>
                        )}
                      </td>
                      <td 
                        className="editable-cell text-left"
                        onClick={() => handleInlineEditStart(companyName._id, 'mobileNumber', companyName.mobileNumber)}
                        title={t('companyNames.clickToEdit') || 'Click to edit'}
                      >
                        {editingRow === companyName._id && editingField === 'mobileNumber' ? (
                          <div className="inline-edit-container">
                            <input
                              type="tel"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => handleInlineEditSave(companyName._id, 'mobileNumber')}
                              onKeyDown={(e) => handleInlineEditKeyDown(e, companyName._id, 'mobileNumber')}
                              className="inline-edit-input"
                              autoFocus
                            />
                            <div className="inline-edit-buttons">
                              <button
                                type="button"
                                onClick={() => handleInlineEditSave(companyName._id, 'mobileNumber')}
                                className="btn-save-inline"
                                title={t('companyNames.save') || 'Save'}
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={handleInlineEditCancel}
                                className="btn-cancel-inline"
                                title={t('companyNames.cancel') || 'Cancel'}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : companyName.mobileNumber ? (
                          <span 
                            className="editable-content clickable-phone"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenWhatsApp(companyName.mobileNumber)
                            }}
                            title={t('companyNames.clickToWhatsApp') || 'Click to open WhatsApp'}
                          >
                            {companyName.mobileNumber}
                          </span>
                        ) : (
                          <span className="editable-content"><em className="empty-value">-</em></span>
                        )}
                      </td>
                      <td className="code-cell text-center">
                        {companyName.code ? (
                          <code
                            className="clickable-code"
                            onClick={(e) => handleCopyCode(companyName.code, e)}
                            title={t('companyNames.clickToCopy') || 'Click to copy ID'}
                          >
                            {companyName.code}
                          </code>
                        ) : (
                          <code>-</code>
                        )}
                      </td>
                    <td className="text-center">{formatDate(companyName.createdAt)}</td>
                    <td className="actions-cell text-center">
                      <div className="table-actions">
                        <button 
                          onClick={() => handleEdit(companyName)} 
                          className="action-icon-btn edit-icon-btn"
                          title={t('companyNames.edit') || 'Edit Company'}
                          aria-label={t('companyNames.edit') || 'Edit Company'}
                        >
                          <svg className="action-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(companyName._id)} 
                          className="action-icon-btn delete-icon-btn"
                          title={t('companyNames.delete') || 'Delete'}
                          aria-label={t('companyNames.delete') || 'Delete'}
                        >
                          <svg className="action-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        })()}

        <ConfirmModal
          open={deleteConfirmOpen}
          title={t('companyNames.confirmDeleteTitle') || 'Confirm Delete'}
          message={t('companyNames.confirmDelete') || 'Are you sure you want to delete this company name?'}
          confirmLabel={t('common.delete') || 'Delete'}
          cancelLabel={t('common.cancel') || 'Cancel'}
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null) }}
        />

        <ConfirmModal
          open={deleteAllConfirmOpen}
          title={t('companyNames.confirmDeleteTitle') || 'Confirm Delete'}
          message={t('companyNames.confirmDeleteAll', { count: companyNames.length }) || `Are you sure you want to delete all ${companyNames.length} company names? This action cannot be undone!`}
          confirmLabel={t('common.delete') || 'Delete'}
          cancelLabel={t('common.cancel') || 'Cancel'}
          variant="danger"
          onConfirm={handleDeleteAllConfirm}
          onCancel={() => setDeleteAllConfirmOpen(false)}
        />
      </div>
    </div>
  )
}

export default ManageCompanyNames