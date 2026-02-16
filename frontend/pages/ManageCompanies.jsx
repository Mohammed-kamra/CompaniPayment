import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { companyNamesAPI } from '../services/api'
import * as XLSX from 'xlsx'
import './ManageCompanies.css'

const ManageCompanies = () => {
  const [companyNames, setCompanyNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingName, setEditingName] = useState(null)
  const [formData, setFormData] = useState({
    name: ''
  })
  const [importData, setImportData] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const fileInputRef = useRef(null)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchCompanyNames()
  }, [isAuthenticated, user, navigate])

  const fetchCompanyNames = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await companyNamesAPI.getAll()
      setCompanyNames(data)
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingName && editingName._id) {
        await companyNamesAPI.update(editingName._id, formData)
        setSuccess(t('companyNames.updated'))
      } else {
        await companyNamesAPI.create(formData)
        setSuccess(t('companyNames.created'))
      }
      await fetchCompanyNames()
      resetForm()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (companyName) => {
    setEditingName(companyName)
    setFormData({
      name: companyName.name || ''
    })
    setShowForm(true)
  }

  const handleView = (companyName) => {
    setEditingName({ ...companyName, _id: null })
    setFormData({
      name: companyName.name || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('companyNames.confirmDelete'))) {
      return
    }

    try {
      await companyNamesAPI.delete(id)
      setSuccess(t('companyNames.deleted'))
      await fetchCompanyNames()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteAll = async () => {
    if (companyNames.length === 0) {
      setError(t('companyNames.noNamesToDelete'))
      return
    }

    const confirmMessage = t('companyNames.confirmDeleteAll', { count: companyNames.length })
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setError('')
      const result = await companyNamesAPI.deleteAll()
      setSuccess(t('companyNames.deletedAll', { count: result.deletedCount || companyNames.length }))
      await fetchCompanyNames()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: ''
    })
    setEditingName(null)
    setShowForm(false)
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
          
          // Convert to JSON array
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
          
          // Extract company names from first column
          const names = []
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (Array.isArray(row) && row.length > 0) {
              const cellValue = row[0]
              if (cellValue !== null && cellValue !== undefined) {
                const name = String(cellValue).trim()
                // Skip empty strings and common header words
                if (name && 
                    name !== '' && 
                    !name.toLowerCase().match(/^(name|company|company name|companyname)$/i)) {
                  names.push(name)
                }
              }
            }
          }

          if (names.length === 0) {
            setError(t('companyNames.noNames'))
            return
          }

          setImportData(names.join('\n'))
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
          // Parse CSV - handle different line endings and quoted values
          const lines = text.split(/\r?\n/).filter(line => line.trim())
          const names = lines.map((line, index) => {
            // Handle CSV - take first column
            // Handle quoted values properly
            let columns = []
            if (line.includes('"')) {
              // Handle quoted CSV values
              const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g
              let match
              while ((match = regex.exec(line)) !== null) {
                columns.push((match[1] || match[2] || '').replace(/""/g, '"').trim())
              }
            } else {
              // Simple comma split
              columns = line.split(',').map(col => col.trim())
            }
            return columns[0] || ''
          }).filter((name, index) => {
            // Filter out empty names and common header words
            const trimmedName = name ? name.trim() : ''
            return trimmedName && 
                   trimmedName !== '' && 
                   !trimmedName.toLowerCase().match(/^(name|company|company name|companyname)$/i)
          })

          if (names.length === 0) {
            setError(t('companyNames.noNames'))
            return
          }

          setImportData(names.join('\n'))
          setShowImport(true)
        } catch (err) {
          setError(t('companyNames.importError') + ': ' + err.message)
        }
      }
      reader.readAsText(file, 'UTF-8')
    } else {
      setError(t('companyNames.unsupportedFileType'))
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
      // Parse the import data (newline-separated or comma-separated)
      let names = []

      if (importData.includes(',')) {
        // Comma-separated
        names = importData.split(',').map(name => name.trim()).filter(name => name)
      } else {
        // Newline-separated
        names = importData.split('\n').map(name => name.trim()).filter(name => name)
      }

      if (names.length === 0) {
        setError(t('companyNames.noNames'))
        return
      }

      const result = await companyNamesAPI.import(names)
      setImportResult(result)
      setImportData('')
      setShowImport(false)
      setSuccess(t('companyNames.importSuccess', { count: result.imported }))
      await fetchCompanyNames()
      setTimeout(() => {
        setSuccess('')
        setImportResult(null)
      }, 5000)
    } catch (err) {
      setError(err.message || t('companyNames.importError'))
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="manage-companies">
      <div className="header-actions">
        <h1>{t('companyNames.title')}</h1>
        <div className="action-buttons">
          <button onClick={() => setShowImport(true)} className="btn btn-secondary">
            {t('companyNames.import')}
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            {t('companyNames.addNew')}
          </button>
          {companyNames.length > 0 && (
            <button onClick={handleDeleteAll} className="btn btn-danger">
              {t('companyNames.deleteAll')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

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
              <h2>{editingName && !editingName._id ? t('companyNames.view') : editingName?._id ? t('companyNames.edit') : t('companyNames.addNew')}</h2>
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
                  disabled={editingName && !editingName._id}
                  placeholder={t('companyNames.namePlaceholder')}
                />
              </div>

              {editingName && editingName.code && (
                <div className="form-group">
                  <label>{t('companyNames.code')}</label>
                  <input
                    type="text"
                    value={editingName.code}
                    readOnly
                    disabled
                    className="readonly-input"
                  />
                  <small>{t('companyNames.codeHint')}</small>
                </div>
              )}

              {!editingName && (
                <div className="form-group">
                  <label>{t('companyNames.code')}</label>
                  <input
                    type="text"
                    value={t('companyNames.codeAuto')}
                    readOnly
                    disabled
                    className="readonly-input"
                    placeholder={t('companyNames.codeAuto')}
                  />
                  <small>{t('companyNames.codeHint')}</small>
                </div>
              )}

              {editingName && editingName._id === null && (
                <>
                  <div className="form-group">
                    <label>{t('companyNames.createdAt')}</label>
                    <input
                      type="text"
                      value={new Date(editingName.createdAt).toLocaleString()}
                      readOnly
                      disabled
                      className="readonly-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('companyNames.updatedAt')}</label>
                    <input
                      type="text"
                      value={new Date(editingName.updatedAt).toLocaleString()}
                      readOnly
                      disabled
                      className="readonly-input"
                    />
                  </div>
                </>
              )}

              {!(editingName && !editingName._id) && (
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingName ? t('companyNames.update') : t('companyNames.create')}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    {t('companyNames.cancel')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="company-names-list">
        {companyNames.length === 0 ? (
          <p className="empty-state">{t('companyNames.noNames')}</p>
        ) : (
          <div className="table-container">
            <table className="company-names-table">
              <thead>
                <tr>
                  <th>{t('companyNames.name')}</th>
                  <th>{t('companyNames.code')}</th>
                  <th>{t('companyNames.createdAt')}</th>
                  <th>{t('companyNames.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {companyNames.map(companyName => (
                  <tr key={companyName._id}>
                    <td>{companyName.name}</td>
                    <td><strong className="code-display">{companyName.code || '-'}</strong></td>
                    <td>{new Date(companyName.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => handleView(companyName)} className="btn btn-sm btn-info">
                          {t('companyNames.view')}
                        </button>
                        <button onClick={() => handleEdit(companyName)} className="btn btn-sm btn-primary">
                          {t('companyNames.edit')}
                        </button>
                        <button onClick={() => handleDelete(companyName._id)} className="btn btn-sm btn-danger">
                          {t('companyNames.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageCompanies
