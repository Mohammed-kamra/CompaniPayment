import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { companiesAPI } from '../services/api'
import './PublicQueue.css'

const PublicQueue = () => {
  const { t, i18n } = useTranslation()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
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
    fetchPublicQueue()
  }, [])

  const fetchPublicQueue = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await companiesAPI.getPublicQueue()
      setCompanies(data || [])
    } catch (err) {
      console.error('Failed to fetch public queue:', err)
      setError(err.message || t('publicQueue.error') || 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase()
    return (
      company.name?.toLowerCase().includes(searchLower) ||
      company.userName?.toLowerCase().includes(searchLower)
    )
  })

  // Calculate position in queue (only unpaid companies count)
  const getQueuePosition = (company) => {
    const unpaidCompanies = companies.filter(c => !c.paid)
    const index = unpaidCompanies.findIndex(c => 
      c.name === company.name && c.userName === company.userName
    )
    return index >= 0 ? index + 1 : null
  }

  if (loading) {
    return (
      <div className="public-queue" key={languageKey}>
        <div className="public-queue-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('publicQueue.loading') || 'Loading queue...'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="public-queue" key={languageKey}>
      <div className="public-queue-container">
        <div className="page-header">
          <h1>{t('publicQueue.title') || 'Registration Queue'}</h1>
          <p className="page-subtitle">
            {t('publicQueue.subtitle') || 'View your position in the registration queue'}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={fetchPublicQueue} className="retry-button">
              {t('publicQueue.retry') || 'Retry'}
            </button>
          </div>
        )}

        <div className="queue-stats">
          <div className="stat-card">
            <div className="stat-label">{t('publicQueue.totalCompanies') || 'Total Companies'}</div>
            <div className="stat-value">{companies.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('publicQueue.paidCompanies') || 'Paid'}</div>
            <div className="stat-value paid-count">
              {companies.filter(c => c.paid).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('publicQueue.pendingCompanies') || 'Pending'}</div>
            <div className="stat-value pending-count">
              {companies.filter(c => !c.paid).length}
            </div>
          </div>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder={t('publicQueue.searchPlaceholder') || 'Search by company name or user name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <>
                <p>{t('publicQueue.noResults') || 'No companies found matching your search.'}</p>
                <button onClick={() => setSearchTerm('')} className="clear-search-button">
                  {t('publicQueue.clearSearch') || 'Clear Search'}
                </button>
              </>
            ) : (
              <p>{t('publicQueue.noCompanies') || 'No companies in the queue yet.'}</p>
            )}
          </div>
        ) : (
          <div className="queue-table-container">
            <table className="queue-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '80px' }}>
                    {t('publicQueue.position') || 'Position'}
                  </th>
                  <th className="text-left">
                    {t('publicQueue.companyName') || 'Company Name'}
                  </th>
                  <th className="text-left">
                    {t('publicQueue.userName') || 'User Name'}
                  </th>
                  <th className="text-center">
                    {t('publicQueue.paymentStatus') || 'Payment Status'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company, index) => {
                  const queuePosition = getQueuePosition(company)
                  return (
                    <tr key={index} className={company.paid ? 'row-paid' : 'row-pending'}>
                      <td className="text-center position-cell">
                        {company.paid ? (
                          <span className="position-badge paid-badge">-</span>
                        ) : queuePosition ? (
                          <span className="position-badge">{queuePosition}</span>
                        ) : (
                          <span className="position-badge">-</span>
                        )}
                      </td>
                      <td className="text-left company-name-cell">
                        {company.name || '-'}
                      </td>
                      <td className="text-left user-name-cell">
                        {company.userName || '-'}
                      </td>
                      <td className="text-center status-cell">
                        <span className={`payment-status-badge ${company.paid ? 'status-paid' : 'status-pending'}`}>
                          {company.paid 
                            ? (t('publicQueue.paid') || 'Paid')
                            : (t('publicQueue.pending') || 'Pending')
                          }
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="queue-info">
          <p className="info-text">
            {t('publicQueue.info') || 'This queue shows companies in registration order. Position numbers are only shown for companies with pending payment status.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PublicQueue
