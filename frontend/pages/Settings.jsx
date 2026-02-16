import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { settingsAPI } from '../services/api'
import './Settings.css'

const Settings = () => {
  const [settings, setSettings] = useState({
    isOpen: false,
    message: '',
    openTime: '',
    closeTime: '',
    autoSchedule: false,
    codesActive: true,
    postRegistrationMessage: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchSettings()
  }, [isAuthenticated, user, navigate])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await settingsAPI.getWebsiteSettings()
      // Ensure all fields are present, including postRegistrationMessage
      setSettings({
        isOpen: data.isOpen || false,
        message: data.message || '',
        openTime: data.openTime || '',
        closeTime: data.closeTime || '',
        autoSchedule: data.autoSchedule || false,
        codesActive: data.codesActive !== undefined ? data.codesActive : true,
        postRegistrationMessage: data.postRegistrationMessage || ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      // Ensure all required fields are included and properly formatted
      const settingsToSave = {
        isOpen: settings.isOpen === true,
        message: String(settings.message || ''),
        openTime: String(settings.openTime || ''),
        closeTime: String(settings.closeTime || ''),
        autoSchedule: settings.autoSchedule === true,
        codesActive: settings.codesActive !== undefined ? settings.codesActive === true : true,
        postRegistrationMessage: String(settings.postRegistrationMessage || '')
      }
      
      console.log('Saving settings:', settingsToSave)
      const result = await settingsAPI.updateWebsiteSettings(settingsToSave)
      console.log('Settings saved successfully:', result)
      setSuccess(t('settings.saved'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      const errorMessage = err.message || err.error || 'Failed to save settings. Please try again.'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>
            <span className="header-icon">⚙️</span>
            {t('settings.title') || 'Settings'}
          </h1>
          <p className="header-subtitle">Manage your website settings and preferences</p>
        </div>

        {error && <div className="alert-message error-message">{error}</div>}
        {success && <div className="alert-message success-message">{success}</div>}

        <form onSubmit={handleSave} className="settings-form">
          {/* Manual Site Status Section */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon">🌐</div>
              <div className="card-title-group">
                <h2>{t('settings.manualControl') || 'Manual Site Status'}</h2>
                <p className="card-description">
                  {t('settings.manualControlDescription') || 'Manually turn the website online or offline'}
                </p>
              </div>
            </div>
            
            <div className="card-content">
              <div className="toggle-group">
                <label className="modern-toggle">
                  <input
                    type="checkbox"
                    name="isOpen"
                    checked={settings.isOpen}
                    onChange={handleInputChange}
                    disabled={settings.autoSchedule}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {t('settings.websiteOpen') || 'Website is Online'}
                    {settings.autoSchedule && (
                      <span className="disabled-badge"> (Auto-scheduled)</span>
                    )}
                  </span>
                </label>
                <p className="field-hint">
                  {settings.autoSchedule 
                    ? (t('settings.manualDisabledHint') || 'Manual control is disabled when automatic schedule is active')
                    : (t('settings.manualControlHint') || 'Toggle to manually open or close the website')
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Scheduled Maintenance Section */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon">⏰</div>
              <div className="card-title-group">
                <h2>{t('settings.automaticSchedule') || 'Scheduled Maintenance'}</h2>
                <p className="card-description">
                  {t('settings.automaticScheduleDescription') || 'Set opening and closing times for automatic website operation'}
                </p>
              </div>
            </div>

            <div className="card-content">
              <div className="toggle-group">
                <label className="modern-toggle">
                  <input
                    type="checkbox"
                    name="autoSchedule"
                    checked={settings.autoSchedule}
                    onChange={handleInputChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {t('settings.enableAutomaticSchedule') || 'Enable Scheduled Maintenance'}
                  </span>
                </label>
                <p className="field-hint">
                  {t('settings.autoScheduleHint') || 'Automatically open and close website based on scheduled times'}
                </p>
              </div>

              {settings.autoSchedule && (
                <div className="time-schedule-wrapper">
                  <div className="time-inputs-grid">
                    <div className="time-input-field">
                      <label className="time-label">
                        <span className="time-icon">🕐</span>
                        {t('settings.openTime') || 'Opening Time'}
                      </label>
                      <input
                        type="time"
                        name="openTime"
                        value={settings.openTime}
                        onChange={handleInputChange}
                        required={settings.autoSchedule}
                        className="modern-time-input"
                      />
                      <p className="field-hint">
                        {t('settings.openTimeHint') || 'Time when the website will automatically open'}
                      </p>
                    </div>

                    <div className="time-separator">
                      <div className="separator-line"></div>
                      <div className="separator-arrow">→</div>
                      <div className="separator-line"></div>
                    </div>

                    <div className="time-input-field">
                      <label className="time-label">
                        <span className="time-icon">🕐</span>
                        {t('settings.closeTime') || 'Closing Time'}
                      </label>
                      <input
                        type="time"
                        name="closeTime"
                        value={settings.closeTime}
                        onChange={handleInputChange}
                        required={settings.autoSchedule}
                        className="modern-time-input"
                      />
                      <p className="field-hint">
                        {t('settings.closeTimeHint') || 'Time when the website will automatically close'}
                      </p>
                    </div>
                  </div>
                  
                  {settings.openTime && settings.closeTime && (
                    <div className="schedule-preview-card">
                      <div className="preview-icon">📅</div>
                      <div className="preview-content">
                        <p className="preview-label">Schedule Preview</p>
                        <p className="preview-times">
                          Opens at <strong>{settings.openTime}</strong> and closes at <strong>{settings.closeTime}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Company Registration Code Section */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon">🔢</div>
              <div className="card-title-group">
                <h2>{t('settings.codesSection') || 'Company Registration Code'}</h2>
                <p className="card-description">
                  {t('settings.codesSectionDescription') || 'Require companies to enter an activation code during sign-up'}
                </p>
              </div>
            </div>
            
            <div className="card-content">
              <div className="toggle-group">
                <label className="modern-toggle">
                  <input
                    type="checkbox"
                    name="codesActive"
                    checked={settings.codesActive}
                    onChange={handleInputChange}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {t('settings.codesActive') || 'Require Registration Code'}
                  </span>
                </label>
                <p className="field-hint">
                  {t('settings.codesActiveHint') || 'When enabled, users must enter a valid registration code to complete company registration'}
                </p>
              </div>

              <div className={`status-indicator ${settings.codesActive ? 'active' : 'inactive'}`}>
                <div className="status-icon-wrapper">
                  <span className="status-icon">{settings.codesActive ? '✓' : '✗'}</span>
                </div>
                <div className="status-text-wrapper">
                  <p className="status-title">
                    {settings.codesActive ? 'Codes Required' : 'Codes Optional'}
                  </p>
                  <p className="status-description">
                    {settings.codesActive 
                      ? (t('settings.codesStatusActive') || 'Registration codes are required on the main page')
                      : (t('settings.codesStatusInactive') || 'Registration codes are not required on the main page')
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Post-Registration Notification Section */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon">📢</div>
              <div className="card-title-group">
                <h2>{t('settings.postRegistrationNotification') || 'Post-Registration Notification'}</h2>
                <p className="card-description">
                  {t('settings.postRegistrationNotificationDescription') || 'Customize the message shown to users after they register'}
                </p>
              </div>
            </div>
            
            <div className="card-content">
              <div className="textarea-field">
                <label className="field-label">
                  {t('settings.postRegistrationMessage') || 'Notification Message'}
                </label>
                <textarea
                  name="postRegistrationMessage"
                  value={settings.postRegistrationMessage}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder={t('settings.postRegistrationMessagePlaceholder') || 'Enter a message to show companies after registration (e.g., "Thank you for registering! Please check your email for further instructions.")'}
                  className="modern-textarea"
                />
                <p className="field-hint">
                  {t('settings.postRegistrationMessageHint') || 'This message will be displayed prominently after companies complete their registration. Leave empty to show no notification.'}
                </p>
              </div>

              {settings.postRegistrationMessage && (
                <div className="notification-preview-card">
                  <div className="preview-header">
                    <span className="preview-icon">👁️</span>
                    <span className="preview-title">Preview</span>
                  </div>
                  <div className="preview-message">
                    {settings.postRegistrationMessage}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner"></span>
                  {t('settings.saving') || 'Saving...'}
                </>
              ) : (
                <>
                  <span className="button-icon">💾</span>
                  {t('settings.save') || 'Save Settings'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings
