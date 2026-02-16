import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { usersAPI } from '../services/api'
import './ManageUsers.css'

const ManageUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
    status: 'active'
  })
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchUsers()
  }, [isAuthenticated, user, navigate])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await usersAPI.getAll()
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
    
    try {
      if (editingUser) {
        // Preserve email if it exists, but don't require it
        const updateData = { ...formData }
        // If email was not in formData but exists in editingUser, preserve it
        if (!updateData.email && editingUser.email) {
          updateData.email = editingUser.email
        }
        // Don't send empty password if not changing it
        if (!updateData.password) {
          delete updateData.password
        }
        await usersAPI.update(editingUser._id, updateData)
      } else {
        // Always set status to 'active' when creating a new user
        const createData = { ...formData, status: 'active' }
        // Remove email if empty for new users
        if (!createData.email) {
          delete createData.email
        }
        await usersAPI.create(createData)
      }
      await fetchUsers()
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '', // Preserve email when editing
      phone: user.phone || '',
      role: user.role || 'user',
      password: '', // Don't pre-fill password
      status: user.status || 'active'
    })
    setShowForm(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm(t('users.confirmDelete'))) {
      return
    }

    try {
      await usersAPI.delete(userId)
      await fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? t('users.activate') : t('users.deactivate')
    
    if (!window.confirm(t('users.confirmStatusChange', { action: statusText, name: user.name }) || `Are you sure you want to ${statusText} ${user.name}?`)) {
      return
    }

    try {
      await usersAPI.update(user._id, { status: newStatus })
      await fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      password: '',
      status: 'active'
    })
    setEditingUser(null)
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

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="manage-users">
      <div className="header-actions">
        <h1>{t('users.title')}</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          {t('users.addNew')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? t('users.edit') : t('users.addNew')}</h2>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>{t('users.name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('users.phone')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>{t('users.role')}</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">{t('users.roleUser')}</option>
                  <option value="accounting">{t('users.roleAccounting')}</option>
                  <option value="admin">{t('users.roleAdmin')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('users.password')} {!editingUser && '*'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  placeholder={editingUser ? t('users.passwordPlaceholder') : ''}
                />
                {editingUser && <small>{t('users.passwordHint')}</small>}
              </div>

              {/* Only show status field when editing, new users are always active */}
              {editingUser && (
                <div className="form-group">
                  <label>{t('users.status')}</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">{t('users.active')}</option>
                    <option value="inactive">{t('users.inactive')}</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? t('users.update') : t('users.create')}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  {t('users.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-grid">
        {users.length === 0 ? (
          <p className="empty-state">{t('users.noUsers')}</p>
        ) : (
          users.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-header">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3>{user.name}</h3>
                  {user.email && <p className="user-email">{user.email}</p>}
                </div>
                <div className={`status-badge status-${user.status || 'active'}`}>
                  {t(`users.statusLabels.${user.status || 'active'}`)}
                </div>
              </div>
              
              <div className="user-details">
                {user.phone && (
                  <p>
                    <strong>{t('users.phone')}:</strong>{' '}
                    <span 
                      className="clickable-phone"
                      onClick={() => handleOpenWhatsApp(user.phone)}
                      title={t('users.clickToWhatsApp') || 'Click to open WhatsApp'}
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
                <p><strong>{t('users.role')}:</strong> {t(`users.role${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}`)}</p>
              </div>
              
              <div className="card-actions">
                <button 
                  onClick={() => handleToggleStatus(user)} 
                  className={`btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                  title={user.status === 'active' ? t('users.deactivate') : t('users.activate')}
                >
                  {user.status === 'active' ? t('users.deactivate') : t('users.activate')}
                </button>
                <button onClick={() => handleEdit(user)} className="btn btn-sm btn-primary">
                  {t('users.edit')}
                </button>
                <button onClick={() => handleDelete(user._id)} className="btn btn-sm btn-danger">
                  {t('users.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ManageUsers
