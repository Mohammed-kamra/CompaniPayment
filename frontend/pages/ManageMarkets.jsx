import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { marketsAPI, marketUsersAPI } from '../services/api'
import ConfirmModal from '../components/ConfirmModal'
import './ManageMarkets.css'

const ManageMarkets = () => {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMarket, setEditingMarket] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    phoneNumber: '',
    location: '',
    marketType: 'small market'
  })
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState(null)
  const [users, setUsers] = useState([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee'
  })
  const [deleteMarketConfirmOpen, setDeleteMarketConfirmOpen] = useState(false)
  const [marketToDelete, setMarketToDelete] = useState(null)
  const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchMarkets()
  }, [isAuthenticated, user, navigate])

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await marketsAPI.getAll()
      setMarkets(data)
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
    try {
      setError('')
      if (editingMarket && editingMarket._id) {
        await marketsAPI.update(editingMarket._id, formData)
      } else {
        await marketsAPI.create(formData)
      }

      setShowForm(false)
      setEditingMarket(null)
      setFormData({ name: '', logo: '', phoneNumber: '', location: '', marketType: 'small market' })
      fetchMarkets()
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message)
      }
    }
  }

  const handleEdit = (market) => {
    setEditingMarket(market)
    setFormData({
      name: market.name || '',
      logo: market.logo || '',
      phoneNumber: market.phoneNumber || '',
      location: market.location || '',
      marketType: market.marketType || 'small market'
    })
    setShowForm(true)
  }

  const handleDeleteClick = (market) => {
    setMarketToDelete(market)
    setDeleteMarketConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!marketToDelete) return
    try {
      await marketsAPI.delete(marketToDelete._id)
      fetchMarkets()
      setDeleteMarketConfirmOpen(false)
      setMarketToDelete(null)
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message)
      }
      setDeleteMarketConfirmOpen(false)
    }
  }

  const handleView = (market) => {
    setEditingMarket({...market, _id: null})
    setFormData({
      name: market.name || '',
      logo: market.logo || '',
      phoneNumber: market.phoneNumber || '',
      location: market.location || '',
      marketType: market.marketType || 'small market'
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({ name: '', logo: '', phoneNumber: '', location: '', marketType: 'small market' })
    setEditingMarket(null)
    setShowForm(false)
  }

  const handleOpenWhatsApp = (phoneNumber) => {
    if (!phoneNumber) return
    
    // Remove any non-digit characters except + for international format
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '')
    
    // Open WhatsApp with the phone number
    const whatsappUrl = `https://wa.me/${cleanedNumber}`
    window.open(whatsappUrl, '_blank')
  }

  // User management functions
  const handleManageUsers = async (market) => {
    setSelectedMarket(market)
    setShowUserModal(true)
    await fetchUsers(market._id)
  }

  const fetchUsers = async (marketId) => {
    try {
      setError('')
      const data = await marketUsersAPI.getAll(marketId)
      setUsers(data)
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message)
      }
    }
  }

  const handleUserInputChange = (e) => {
    const { name, value } = e.target
    setUserFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      if (editingUser) {
        await marketUsersAPI.update(selectedMarket._id, editingUser._id || editingUser.id, userFormData)
      } else {
        await marketUsersAPI.create(selectedMarket._id, userFormData)
      }
      setShowUserForm(false)
      setEditingUser(null)
      setUserFormData({ name: '', email: '', phone: '', role: 'employee' })
      await fetchUsers(selectedMarket._id)
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message)
      }
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'employee'
    })
    setShowUserForm(true)
  }

  const handleDeleteUserClick = (u) => {
    setUserToDelete(u)
    setDeleteUserConfirmOpen(true)
  }

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete || !selectedMarket) return
    try {
      await marketUsersAPI.delete(selectedMarket._id, userToDelete._id || userToDelete.id)
      await fetchUsers(selectedMarket._id)
      setDeleteUserConfirmOpen(false)
      setUserToDelete(null)
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message)
      }
      setDeleteUserConfirmOpen(false)
    }
  }

  const resetUserForm = () => {
    setUserFormData({ name: '', email: '', phone: '', role: 'employee' })
    setEditingUser(null)
    setShowUserForm(false)
  }

  const closeUserModal = () => {
    setShowUserModal(false)
    setSelectedMarket(null)
    setUsers([])
    resetUserForm()
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="manage-markets">
      <div className="header-actions">
        <h1>{t('markets.title')}</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          {t('markets.addNew')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMarket && !editingMarket._id ? t('markets.view') : editingMarket?._id ? t('markets.edit') : t('markets.addNew')}</h2>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="market-form">
              <div className="form-group">
                <label>{t('markets.name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={editingMarket && !editingMarket._id}
                />
              </div>

              <div className="form-group">
                <label>{t('markets.logo')}</label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                  disabled={editingMarket && !editingMarket._id}
                />
              </div>

              <div className="form-group">
                <label>{t('markets.phoneNumber')} *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  disabled={editingMarket && !editingMarket._id}
                />
              </div>

              <div className="form-group">
                <label>{t('markets.location')} *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t('markets.locationPlaceholder')}
                  required
                  disabled={editingMarket && !editingMarket._id}
                />
              </div>

              <div className="form-group">
                <label>{t('markets.marketType')} *</label>
                <select
                  name="marketType"
                  value={formData.marketType}
                  onChange={handleInputChange}
                  required
                  disabled={editingMarket && !editingMarket._id}
                  className="form-select"
                >
                  <option value="small market">{t('markets.types.small')}</option>
                  <option value="supermarket">{t('markets.types.supermarket')}</option>
                  <option value="hypermarket">{t('markets.types.hypermarket')}</option>
                </select>
              </div>

              {!(editingMarket && !editingMarket._id) && (
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingMarket ? t('markets.update') : t('markets.create')}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    {t('markets.cancel')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="markets-grid">
        {markets.length === 0 ? (
          <p className="empty-state">{t('markets.noMarkets')}</p>
        ) : (
          markets.map(market => (
            <div key={market._id} className="market-card">
              {market.logo && (
                <img src={market.logo} alt={market.name} className="market-logo" />
              )}
              <h3>{market.name}</h3>
              <p>
                <strong>{t('markets.phone')}:</strong>{' '}
                {market.phoneNumber ? (
                  <span 
                    className="clickable-phone"
                    onClick={() => handleOpenWhatsApp(market.phoneNumber)}
                    title={t('markets.clickToWhatsApp') || 'Click to open WhatsApp'}
                    style={{ 
                      color: 'var(--primary-color, #d4af37)', 
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {market.phoneNumber}
                  </span>
                ) : (
                  '-'
                )}
              </p>
              {market.location && (
                <p><strong>{t('markets.location')}:</strong> {market.location}</p>
              )}
              {market.marketType && (
                <p><strong>{t('markets.marketType')}:</strong> {
                  market.marketType === 'small market' 
                    ? t('markets.types.small')
                    : t(`markets.types.${market.marketType}`) || market.marketType
                }</p>
              )}
              
              <div className="card-actions">
                <button onClick={() => handleView(market)} className="btn btn-sm btn-info">
                  {t('markets.view')}
                </button>
                <button onClick={() => handleEdit(market)} className="btn btn-sm btn-primary">
                  {t('markets.edit')}
                </button>
                <button onClick={() => handleManageUsers(market)} className="btn btn-sm btn-secondary">
                  {t('markets.manageUsers')}
                </button>
                <button onClick={() => handleDeleteClick(market)} className="btn btn-sm btn-danger">
                  {t('markets.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Management Modal */}
      {showUserModal && selectedMarket && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('markets.manageUsers')} - {selectedMarket.name}</h2>
              <button onClick={closeUserModal} className="close-btn">×</button>
            </div>
            
            <div className="user-management">
              <div className="user-header">
                <button onClick={() => setShowUserForm(true)} className="btn btn-primary">
                  {t('markets.addUser')}
                </button>
              </div>

              {showUserForm && (
                <div className="user-form-section">
                  <h3>{editingUser ? t('markets.editUser') : t('markets.addUser')}</h3>
                  <form onSubmit={handleUserSubmit} className="user-form">
                    <div className="form-group">
                      <label>{t('markets.userName')} *</label>
                      <input
                        type="text"
                        name="name"
                        value={userFormData.name}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('markets.userEmail')} *</label>
                      <input
                        type="email"
                        name="email"
                        value={userFormData.email}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('markets.userPhone')}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={userFormData.phone}
                        onChange={handleUserInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('markets.userRole')}</label>
                      <select
                        name="role"
                        value={userFormData.role}
                        onChange={handleUserInputChange}
                        className="form-select"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        {editingUser ? t('markets.update') : t('markets.create')}
                      </button>
                      <button type="button" onClick={resetUserForm} className="btn btn-secondary">
                        {t('markets.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="users-list">
                {users.length === 0 ? (
                  <p className="empty-state">{t('markets.noUsers')}</p>
                ) : (
                  <div className="users-grid">
                    {users.map(user => (
                      <div key={user._id || user.id} className="user-card">
                        <h4>{user.name}</h4>
                        <p><strong>{t('markets.userEmail')}:</strong> {user.email}</p>
                        {user.phone && (
                          <p>
                            <strong>{t('markets.userPhone')}:</strong>{' '}
                            <span 
                              className="clickable-phone"
                              onClick={() => handleOpenWhatsApp(user.phone)}
                              title={t('markets.clickToWhatsApp') || 'Click to open WhatsApp'}
                              style={{ 
                                color: 'var(--primary-color, #d4af37)', 
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              {user.phone}
                            </span>
                          </p>
                        )}
                        <p><strong>{t('markets.userRole')}:</strong> {user.role}</p>
                        <div className="user-actions">
                          <button onClick={() => handleEditUser(user)} className="btn btn-sm btn-primary">
                            {t('markets.edit')}
                          </button>
                          <button onClick={() => handleDeleteUserClick(user)} className="btn btn-sm btn-danger">
                            {t('markets.delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteMarketConfirmOpen}
        title={t('markets.confirmDeleteTitle') || 'Confirm Delete'}
        message={t('markets.confirmDelete') || 'Are you sure you want to delete this market?'}
        confirmLabel={t('common.delete') || 'Delete'}
        cancelLabel={t('common.cancel') || 'Cancel'}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteMarketConfirmOpen(false); setMarketToDelete(null) }}
      />

      <ConfirmModal
        open={deleteUserConfirmOpen}
        title={t('markets.confirmDeleteUserTitle') || 'Confirm Delete'}
        message={userToDelete ? (t('markets.confirmDeleteUser') || 'Are you sure you want to delete this user?') : ''}
        confirmLabel={t('common.delete') || 'Delete'}
        cancelLabel={t('common.cancel') || 'Cancel'}
        variant="danger"
        onConfirm={handleDeleteUserConfirm}
        onCancel={() => { setDeleteUserConfirmOpen(false); setUserToDelete(null) }}
      />
    </div>
  )
}

export default ManageMarkets
