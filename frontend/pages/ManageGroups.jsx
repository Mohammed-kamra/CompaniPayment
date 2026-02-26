import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { groupsAPI } from '../services/api'
import ConfirmModal from '../components/ConfirmModal'
import './ManageGroups.css'

const ManageGroups = () => {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    companies: [],
    timeFrom: '',
    timeTo: '',
    date: '',
    day: '',
    maxCompanies: ''
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState(null)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchGroups()
  }, [isAuthenticated, user, navigate])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await groupsAPI.getAll()
      setGroups(data)
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

  const getDayName = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00') // Add time to avoid timezone issues
    const dayNames = {
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      ku: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
      ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    }
    const lang = localStorage.getItem('i18nextLng') || 'en'
    const dayIndex = date.getDay()
    
    if (lang === 'ku') {
      return dayNames.ku[dayIndex]
    } else if (lang === 'ar') {
      return dayNames.ar[dayIndex]
    }
    return dayNames.en[dayIndex]
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Automatically set day when date is selected
      if (name === 'date' && value) {
        updated.day = getDayName(value)
      }
      
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (submitting) return // Prevent double submission
    
    try {
      setError('')
      setSubmitting(true)
      
      // Prepare form data with proper type conversions
      const submitData = {
        name: formData.name.trim(),
        companies: formData.companies || [],
        timeFrom: formData.timeFrom,
        timeTo: formData.timeTo,
        date: formData.date,
        day: formData.day,
        maxCompanies: formData.maxCompanies === '' ? 0 : parseInt(formData.maxCompanies) || 0
      }
      
      // Validate required fields
      if (!submitData.name || !submitData.name.trim()) {
        setError(t('groups.nameRequired') || 'Group name is required')
        setSubmitting(false)
        return
      }
      
      if (!submitData.timeFrom || !submitData.timeTo) {
        setError(t('groups.timeRequired') || 'Time range is required')
        setSubmitting(false)
        return
      }
      
      if (!submitData.date) {
        setError(t('groups.dateRequired') || 'Date is required')
        setSubmitting(false)
        return
      }
      
      // Validate maxCompanies (0 is allowed for unlimited)
      if (submitData.maxCompanies < 0) {
        setError(t('groups.maxCompaniesInvalid') || 'Maximum companies cannot be negative')
        setSubmitting(false)
        return
      }
      
      console.log('Submitting group data:', submitData)
      
      if (editingGroup && editingGroup._id) {
        await groupsAPI.update(editingGroup._id, submitData)
      } else {
        await groupsAPI.create(submitData)
      }

      setShowForm(false)
      setEditingGroup(null)
      resetForm()
      await fetchGroups()
    } catch (err) {
      console.error('Error creating/updating group:', err)
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message || t('groups.error') || 'Failed to save group')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (group) => {
    setEditingGroup(group)
    const date = group.date || ''
    const day = date ? getDayName(date) : (group.day || '')
    setFormData({
      name: group.name || '',
      companies: group.companies || [],
      timeFrom: group.timeFrom || '',
      timeTo: group.timeTo || '',
      date: date,
      day: day,
      maxCompanies: group.maxCompanies || ''
    })
    setShowForm(true)
  }

  const handleDeleteClick = (group) => {
    setGroupToDelete(group)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return
    try {
      await groupsAPI.delete(groupToDelete._id)
      fetchGroups()
      setDeleteConfirmOpen(false)
      setGroupToDelete(null)
    } catch (err) {
      if (err.message.includes('Access denied') || err.message.includes('Unauthorized')) {
        setError(err.message)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(err.message)
      }
      setDeleteConfirmOpen(false)
    }
  }

  const handleView = (group) => {
    setEditingGroup({...group, _id: null})
    const date = group.date || ''
    const day = date ? getDayName(date) : (group.day || '')
    setFormData({
      name: group.name || '',
      companies: group.companies || [],
      timeFrom: group.timeFrom || '',
      timeTo: group.timeTo || '',
      date: date,
      day: day,
      maxCompanies: group.maxCompanies || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      companies: [],
      timeFrom: '',
      timeTo: '',
      date: '',
      day: '',
      maxCompanies: ''
    })
    setEditingGroup(null)
    setShowForm(false)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="manage-groups">
      <div className="header-actions">
        <h1>{t('groups.title')}</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          {t('groups.addNew')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGroup && !editingGroup._id ? t('groups.view') : editingGroup?._id ? t('groups.edit') : t('groups.addNew')}</h2>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="group-form">
              <div className="form-group">
                <label>{t('groups.name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={editingGroup && !editingGroup._id}
                />
              </div>

              <div className="form-group">
                <label>{t('groups.timeRange')} *</label>
                <div className="time-range-inputs">
                  <input
                    type="time"
                    name="timeFrom"
                    value={formData.timeFrom}
                    onChange={handleInputChange}
                    required
                    disabled={editingGroup && !editingGroup._id}
                    className="time-input"
                  />
                  <span className="time-separator">{t('groups.to')}</span>
                  <input
                    type="time"
                    name="timeTo"
                    value={formData.timeTo}
                    onChange={handleInputChange}
                    required
                    disabled={editingGroup && !editingGroup._id}
                    className="time-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('groups.date')} *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  disabled={editingGroup && !editingGroup._id}
                />
              </div>

              <div className="form-group">
                <label>{t('groups.day')}</label>
                <input
                  type="text"
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  readOnly
                  disabled={editingGroup && !editingGroup._id}
                  className="readonly-input"
                  placeholder={t('groups.dayAuto')}
                />
                <small>{t('groups.dayHint')}</small>
              </div>

              <div className="form-group">
                <label>{t('groups.maxCompanies')} *</label>
                <input
                  type="number"
                  name="maxCompanies"
                  value={formData.maxCompanies}
                  onChange={handleInputChange}
                  required
                  min="0"
                  disabled={editingGroup && !editingGroup._id}
                  placeholder={t('groups.maxCompaniesPlaceholder')}
                />
                <small>{t('groups.maxCompaniesHint')}</small>
              </div>

              {!(editingGroup && !editingGroup._id) && (
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? t('groups.saving') || 'Saving...' : (editingGroup ? t('groups.update') : t('groups.create'))}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary" disabled={submitting}>
                    {t('groups.cancel')}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="groups-grid">
        {groups.length === 0 ? (
          <p className="empty-state">{t('groups.noGroups')}</p>
        ) : (
          groups.map(group => (
            <div key={group._id} className="group-card">
              <h3>{group.name}</h3>
              {(group.timeFrom || group.timeTo) && (
                <p><strong>{t('groups.timeRange')}:</strong> {group.timeFrom || '00:00'} {t('groups.to')} {group.timeTo || '00:00'}</p>
              )}
              {group.date && (
                <p><strong>{t('groups.date')}:</strong> {new Date(group.date + 'T00:00:00').toLocaleDateString()}</p>
              )}
              {group.day && (
                <p><strong>{t('groups.day')}:</strong> {group.day}</p>
              )}
              <p><strong>{t('groups.companiesCount')}:</strong> {group.registeredCount || group.companies?.length || 0} / {group.maxCompanies || '∞'}</p>
              {group.maxCompanies && (group.registeredCount || group.companies?.length || 0) >= group.maxCompanies && (
                <p className="group-full-badge">{t('groups.groupFull')}</p>
              )}
              
              <div className="card-actions">
                <button onClick={() => handleView({...group, _id: null})} className="btn btn-sm btn-info">
                  {t('groups.view')}
                </button>
                <button onClick={() => handleEdit(group)} className="btn btn-sm btn-primary">
                  {t('groups.edit')}
                </button>
                <button onClick={() => handleDeleteClick(group)} className="btn btn-sm btn-danger">
                  {t('groups.delete')}
                </button>
              </div>
            </div>
          ))
        )}

      <ConfirmModal
        open={deleteConfirmOpen}
        title={t('groups.confirmDeleteTitle') || 'Confirm Delete'}
        message={groupToDelete ? (t('groups.confirmDelete') || 'Are you sure you want to delete this group?') : ''}
        confirmLabel={t('common.delete') || 'Delete'}
        cancelLabel={t('common.cancel') || 'Cancel'}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteConfirmOpen(false); setGroupToDelete(null) }}
      />
      </div>
    </div>
  )
}

export default ManageGroups
