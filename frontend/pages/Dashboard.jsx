import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { companiesAPI, groupsAPI, companyNamesAPI } from '../services/api'
import './Dashboard.css'
// import '../styles/dashboard.css'

const Dashboard = () => {
  const { t } = useTranslation()
  const [companies, setCompanies] = useState([])
  const [groups, setGroups] = useState([])
  const [unregisteredCount, setUnregisteredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPaymentDate, setEditingPaymentDate] = useState(null)
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentTime, setPaymentTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [companiesData, groupsData, unregisteredData] = await Promise.all([
        companiesAPI.getAllAdmin(),
        groupsAPI.getAll(),
        companyNamesAPI.getUnregistered().catch(() => [])
      ])
      setCompanies(companiesData || [])
      setGroups(groupsData || [])
      setUnregisteredCount(Array.isArray(unregisteredData) ? unregisteredData.length : 0)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

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

  // Get group name by ID
  const getGroupName = (groupId) => {
    if (!groupId) return '-'
    const group = groups.find(g => g._id === groupId)
    return group ? group.name : '-'
  }

  // Start editing payment date
  const handleEditPaymentDate = (company) => {
    setEditingPaymentDate(company._id)
    if (company.paymentDate) {
      const date = new Date(company.paymentDate)
      const dateStr = date.toISOString().split('T')[0]
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      setPaymentDate(dateStr)
      setPaymentTime(timeStr)
    } else {
      // Set default to tomorrow at 10:00 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setPaymentDate(tomorrow.toISOString().split('T')[0])
      setPaymentTime('10:00')
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingPaymentDate(null)
    setPaymentDate('')
    setPaymentTime('')
  }

  // Save payment date
  const handleSavePaymentDate = async (companyId) => {
    if (!paymentDate || !paymentTime) {
      setError(t('dashboard.paymentDateRequired') || 'Please select both date and time')
      return
    }

    try {
      setSaving(true)
      setError('')
      
      // Combine date and time
      const dateTimeString = `${paymentDate}T${paymentTime}:00`
      const paymentDateTime = new Date(dateTimeString)
      
      // Update company with payment date
      const updatedCompany = await companiesAPI.update(companyId, {
        paymentDate: paymentDateTime.toISOString()
      })
      
      // Update local state
      setCompanies(prev => prev.map(c => 
        c._id === companyId ? updatedCompany : c
      ))
      
      setEditingPaymentDate(null)
      setPaymentDate('')
      setPaymentTime('')
    } catch (err) {
      console.error('Failed to update payment date:', err)
      setError(err.message || 'Failed to update payment date')
    } finally {
      setSaving(false)
    }
  }

  // Remove payment date
  const handleRemovePaymentDate = async (companyId) => {
    try {
      setSaving(true)
      setError('')
      
      const updatedCompany = await companiesAPI.update(companyId, {
        paymentDate: null
      })
      
      setCompanies(prev => prev.map(c => 
        c._id === companyId ? updatedCompany : c
      ))
    } catch (err) {
      console.error('Failed to remove payment date:', err)
      setError(err.message || 'Failed to remove payment date')
    } finally {
      setSaving(false)
    }
  }

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      company.name?.toLowerCase().includes(search) ||
      company.phoneNumber?.toLowerCase().includes(search) ||
      company.code?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="loading-message">{t('dashboard.loading') || 'Loading...'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="page-title">{t('dashboard.title') || 'Admin Dashboard'}</h1>
          <p className="dashboard-subtitle">
            {t('dashboard.subtitle') || 'Manage registered companies and assign payment collection dates'}
          </p>
        </div>

        {error && (
          <div className="error-message" style={{ 
            padding: '12px', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        <div className="dashboard-report">
          <h2 className="dashboard-report-title">{t('dashboard.report') || 'Report'}</h2>
          <div className="dashboard-report-cards">
            <div className="dashboard-report-card dashboard-report-card-registered">
              <span className="dashboard-report-label">{t('dashboard.registeredCompanies') || 'Registered Companies'}</span>
              <span className="dashboard-report-value">{companies.length}</span>
            </div>
            <div className="dashboard-report-card dashboard-report-card-unregistered">
              <span className="dashboard-report-label">{t('dashboard.unregisteredCompanies') || 'Unregistered Companies'}</span>
              <span className="dashboard-report-value">{unregisteredCount}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('dashboard.searchPlaceholder') || 'Search companies...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="stats-box">
            <span className="stat-item">
              {t('dashboard.totalCompanies') || 'Total Companies'}: <strong>{companies.length}</strong>
            </span>
            <span className="stat-item">
              {t('dashboard.withPaymentDate') || 'With Payment Date'}: <strong>
                {companies.filter(c => c.paymentDate).length}
              </strong>
            </span>
          </div>
        </div>

        <div className="companies-table-container">
          <table className="companies-table">
            <thead>
              <tr>
                <th>{t('dashboard.companyName') || 'Company Name'}</th>
                <th>{t('dashboard.code') || 'Code'}</th>
                <th>{t('dashboard.phone') || 'Phone'}</th>
                <th>{t('dashboard.group') || 'Group'}</th>
                <th>{t('dashboard.registrationDate') || 'Registration Date'}</th>
                <th>{t('dashboard.paymentDate') || 'Payment Collection Date & Time'}</th>
                <th>{t('dashboard.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    {t('dashboard.noCompanies') || 'No companies found'}
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company._id}>
                    <td>{company.name || '-'}</td>
                    <td>{company.code || '-'}</td>
                    <td>{company.phoneNumber || '-'}</td>
                    <td>{getGroupName(company.groupId)}</td>
                    <td>{formatDate(company.createdAt)}</td>
                    <td>
                      {editingPaymentDate === company._id ? (
                        <div className="payment-date-editor">
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="date-input"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <input
                            type="time"
                            value={paymentTime}
                            onChange={(e) => setPaymentTime(e.target.value)}
                            className="time-input"
                          />
                          <div className="editor-actions">
                            <button
                              onClick={() => handleSavePaymentDate(company._id)}
                              disabled={saving}
                              className="btn btn-primary btn-sm"
                            >
                              {saving ? t('dashboard.saving') || 'Saving...' : t('dashboard.save') || 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="btn btn-secondary btn-sm"
                            >
                              {t('dashboard.cancel') || 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="payment-date-display">
                          <span className={company.paymentDate ? 'has-date' : 'no-date'}>
                            {formatDateTime(company.paymentDate)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {editingPaymentDate !== company._id && (
                          <>
                            <button
                              onClick={() => handleEditPaymentDate(company)}
                              className="btn btn-primary btn-sm"
                            >
                              {company.paymentDate 
                                ? t('dashboard.editDate') || 'Edit Date' 
                                : t('dashboard.assignDate') || 'Assign Date'}
                            </button>
                            {company.paymentDate && (
                              <button
                                onClick={() => handleRemovePaymentDate(company._id)}
                                disabled={saving}
                                className="btn btn-danger btn-sm"
                              >
                                {t('dashboard.removeDate') || 'Remove'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
