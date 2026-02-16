import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { preRegisterAPI, settingsAPI, groupsAPI } from '../services/api'
import './PreRegister.css'

const PreRegister = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  // Helper function to translate day names
  const translateDay = (dayName) => {
    if (!dayName) return ''
    const dayMap = {
      en: {
        'Sunday': 'Sunday',
        'Monday': 'Monday',
        'Tuesday': 'Tuesday',
        'Wednesday': 'Wednesday',
        'Thursday': 'Thursday',
        'Friday': 'Friday',
        'Saturday': 'Saturday'
      },
      ku: {
        'Sunday': 'یەکشەممە',
        'Monday': 'دووشەممە',
        'Tuesday': 'سێشەممە',
        'Wednesday': 'چوارشەممە',
        'Thursday': 'پێنجشەممە',
        'Friday': 'هەینی',
        'Saturday': 'شەممە'
      },
      ar: {
        'Sunday': 'الأحد',
        'Monday': 'الإثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت'
      }
    }
    const currentLang = i18n.language || 'en'
    const lang = currentLang.startsWith('ku') ? 'ku' : currentLang.startsWith('ar') ? 'ar' : 'en'
    return dayMap[lang][dayName] || dayName
  }
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    companyName: '',
    code: '',
    groupId: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [websiteClosed, setWebsiteClosed] = useState(false)
  const [closedMessage, setClosedMessage] = useState('')
  const [websiteSettings, setWebsiteSettings] = useState(null)
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [autoFilledFields, setAutoFilledFields] = useState({
    name: false,
    mobileNumber: false,
    companyName: false
  })
  const [codeError, setCodeError] = useState('')
  const [loadingCode, setLoadingCode] = useState(false)
  const codeDebounceTimer = useRef(null)
  const isMountedRef = useRef(true)


  // Check for success message in sessionStorage on mount and restore notification
  useEffect(() => {
    const successMsg = sessionStorage.getItem('preRegisterSuccessMessage')
    const successTime = sessionStorage.getItem('preRegisterSuccessTime')
    
    // Show notification if it was created less than 10 seconds ago
    if (successMsg && successTime) {
      const timeDiff = Date.now() - parseInt(successTime)
      if (timeDiff < 10000) {
        console.log('🔄 Restoring success notification from sessionStorage')
        
        if (typeof document !== 'undefined' && document.body) {
          // Check if notification already exists
          if (!document.getElementById('pre-register-success-notification')) {
            const notification = document.createElement('div')
            notification.id = 'pre-register-success-notification'
            notification.className = 'success-notification-toast'
            notification.style.cssText = `
              padding: 20px 25px;
              background-color: #d1fae5;
              border: 3px solid #10b981;
              border-radius: 12px;
              color: #065f46;
              font-size: 18px;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 1rem;
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
              word-wrap: break-word;
              overflow-wrap: break-word;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 99999;
              min-width: 320px;
              max-width: 90%;
              pointer-events: auto;
            `
            notification.innerHTML = `
              <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <span style="font-size: 28px; flex-shrink: 0;">✓</span>
                  <span style="flex: 1; min-width: 0; line-height: 1.6;">${successMsg}</span>
                  <button style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: inherit; opacity: 0.7; padding: 0; margin-left: 0.5rem; line-height: 1;" onclick="sessionStorage.removeItem('preRegisterSuccessMessage'); sessionStorage.removeItem('preRegisterSuccessTime'); window.location.reload();">×</button>
                </div>
                <button onclick="sessionStorage.removeItem('preRegisterSuccessMessage'); sessionStorage.removeItem('preRegisterSuccessTime'); window.location.reload();" style="background-color: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; transition: background-color 0.2s;">OK</button>
              </div>
            `
            notification.onclick = (e) => {
              // Don't close when clicking inside the notification, only on buttons
              if (e.target === notification || e.target.closest('button')) {
                return
              }
            }
            document.body.appendChild(notification)
            
            // Notification stays until user clicks OK - no auto-remove
          }
        }
        
      } else {
        // Clear old success message
        sessionStorage.removeItem('preRegisterSuccessMessage')
        sessionStorage.removeItem('preRegisterSuccessTime')
      }
    }
  }, [])
  
  useEffect(() => {
    const checkWebsiteStatus = async () => {
      try {
        const status = await settingsAPI.getWebsiteSettings()
        setWebsiteSettings(status)
        if (!status.isOpen) {
          setWebsiteClosed(true)
          setClosedMessage(status.message || t('preRegister.websiteClosed'))
        } else {
          setWebsiteClosed(false)
          setClosedMessage('')
        }
      } catch (err) {
        console.error('Failed to check website status:', err)
      }
    }

    const fetchGroups = async () => {
      try {
        setLoadingGroups(true)
        const groupsData = await groupsAPI.getAllPublic()
        setGroups(groupsData || [])
      } catch (err) {
        console.error('Failed to fetch groups:', err)
      } finally {
        setLoadingGroups(false)
      }
    }

    // Initial load
    checkWebsiteStatus()
    fetchGroups()
    // No longer need to fetch company names since we removed the dropdown
    
    // Check status very frequently (every 2 seconds) to catch when countdown ends
    // This ensures the website opens/closes immediately when time runs out
    const statusInterval = setInterval(checkWebsiteStatus, 2000)
    
    return () => {
      clearInterval(statusInterval)
      isMountedRef.current = false
    }
  }, [t])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear code error when user starts typing
    if (name === 'code') {
      setCodeError('')
      // If code is cleared, reset auto-filled fields
      if (!value.trim()) {
        setAutoFilledFields({
          name: false,
          mobileNumber: false,
          companyName: false
        })
        setFormData(prev => ({
          ...prev,
          name: '',
          mobileNumber: '',
          companyName: ''
        }))
      }
    }
  }

  // Handle code input change with debounce
  const handleCodeInputChange = (e) => {
    const code = e.target.value.trim()
    
    // Update code in form data immediately
    setFormData(prev => ({ ...prev, code: code }))
    setCodeError('')
    
    // Clear existing timer
    if (codeDebounceTimer.current) {
      clearTimeout(codeDebounceTimer.current)
    }
    
    // If code is empty, clear auto-filled fields immediately
    if (!code) {
      setAutoFilledFields({
        name: false,
        mobileNumber: false,
        companyName: false
      })
      setFormData(prev => ({
        ...prev,
        name: '',
        mobileNumber: '',
        companyName: ''
      }))
      return
    }
    
    // Only fetch if code has minimum length (e.g., 3 characters)
    if (code.length < 3) {
      return
    }
    
    // Debounce: wait 500ms after user stops typing before fetching
    codeDebounceTimer.current = setTimeout(() => {
      fetchCompanyByCode(code)
    }, 500)
  }

  // Handle code input blur (immediate fetch when user leaves the field)
  const handleCodeBlur = (e) => {
    const code = e.target.value.trim()
    
    // Clear debounce timer
    if (codeDebounceTimer.current) {
      clearTimeout(codeDebounceTimer.current)
      codeDebounceTimer.current = null
    }
    
    // If code is empty, clear auto-filled fields
    if (!code) {
      setAutoFilledFields({
        name: false,
        mobileNumber: false,
        companyName: false
      })
      setFormData(prev => ({
        ...prev,
        name: '',
        mobileNumber: '',
        companyName: ''
      }))
      return
    }
    
    // Only fetch if code has minimum length
    if (code.length >= 3) {
      fetchCompanyByCode(code)
    }
  }

  // Fetch company data by code
  const fetchCompanyByCode = async (code) => {
    if (!code || code.length < 3) {
      return
    }
    
    setLoadingCode(true)
    try {
      const companyData = await preRegisterAPI.getByCode(code)
      
      if (!companyData) {
        // Code not found
        setCodeError(t('preRegister.codeNotFound') || 'Company code not found. Please check your code and try again.')
        setAutoFilledFields({
          name: false,
          mobileNumber: false,
          companyName: false
        })
        setFormData(prev => ({
          ...prev,
          name: '',
          mobileNumber: '',
          companyName: ''
        }))
      } else {
        // Code found - auto-fill fields
        setFormData(prev => ({
          ...prev,
          name: companyData.name || '',
          mobileNumber: companyData.mobileNumber || '',
          companyName: companyData.companyName || ''
        }))
        setAutoFilledFields({
          name: true,
          mobileNumber: true,
          companyName: true
        })
        setCodeError('')
        
        // Set company name from fetched data
        if (companyData.companyName) {
          setFormData(prev => ({
            ...prev,
            companyName: companyData.companyName
          }))
        }
      }
    } catch (err) {
      console.error('Error fetching company by code:', err)
      setCodeError(err.message || t('preRegister.codeError') || 'Failed to fetch company data. Please try again.')
      setAutoFilledFields({
        name: false,
        mobileNumber: false,
        companyName: false
      })
      setFormData(prev => ({
        ...prev,
        name: '',
        mobileNumber: '',
        companyName: ''
      }))
    } finally {
      setLoadingCode(false)
    }
  }

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (codeDebounceTimer.current) {
        clearTimeout(codeDebounceTimer.current)
      }
    }
  }, [])

  // Removed handleCompanySelect - no longer needed since we removed the dropdown

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Block submission if system is closed
    if (websiteClosed) {
      setError(t('preRegister.websiteClosed') || 'Registration is currently closed. Please wait until the system is open.')
      return
    }
    
    console.log('Form submission started. Form data:', formData)
    
    // STRICT VALIDATION - All fields are required before submission
    const missingFields = []
    
    // Name is required
    if (!formData.name || formData.name.trim() === '') {
      missingFields.push(t('preRegister.name') || 'Name')
      setError(t('preRegister.name') + ' ' + (t('registration.fieldErrors.nameRequired') || 'is required'))
      return
    }
    
    // Mobile Number is required
    if (!formData.mobileNumber || formData.mobileNumber.trim() === '') {
      missingFields.push(t('preRegister.mobileNumber') || 'Mobile Number')
      setError(t('preRegister.mobileNumber') + ' ' + (t('registration.fieldErrors.phoneRequired') || 'is required'))
      return
    }
    
    // Company Name is required
    if (!formData.companyName || formData.companyName.trim() === '') {
      missingFields.push(t('preRegister.companyName') || 'Company Name')
      setError(t('preRegister.companyName') + ' ' + (t('registration.fieldErrors.nameRequired') || 'is required'))
      return
    }
    
    // Code is required only if codes are explicitly enabled
    if (websiteSettings?.codesActive === true && (!formData.code || formData.code.trim() === '')) {
      missingFields.push(t('preRegister.registrationCode') || 'Code')
      setError(t('preRegister.registrationCode') + ' ' + (t('registration.fieldErrors.nameRequired') || 'is required'))
      return
    }
    
    // Group is REQUIRED - cannot submit without selecting a group
    if (!formData.groupId || formData.groupId.trim() === '') {
      missingFields.push(t('preRegister.selectGroup') || 'Group')
      setError(t('preRegister.selectGroup') + ' ' + (t('registration.fieldErrors.groupRequired') || 'is required. Please select a group.'))
      return
    }
    
    // Validate groupId format (MongoDB ObjectId)
    if (formData.groupId && !/^[0-9a-fA-F]{24}$/.test(formData.groupId.trim())) {
      setError(t('preRegister.invalidGroup') || 'Invalid group selected. Please select a group again.')
      return
    }

    // If any fields are missing, show error and block submission
    if (missingFields.length > 0) {
      const errorMsg = t('registration.validation.fillRequiredFields') || `Please fill in all required fields: ${missingFields.join(', ')}`
      console.error('Validation failed:', errorMsg)
      setError(errorMsg)
      return
    }

    setLoading(true)
    
    // Safety timeout to prevent infinite loading (longer than API timeout)
    let loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Pre-registration taking too long, automatically clearing loading state')
      if (isMountedRef.current) {
        setLoading(false)
        setError(t('preRegister.timeoutError') || 'Registration is taking longer than expected. Please check your connection and try again.')
      }
    }, 50000) // 50 second overall loading timeout (longer than API timeout)

    try {
      // Prepare data to send
      const submitData = {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        companyName: formData.companyName.trim(),
        groupId: formData.groupId.trim()
      }

      // Only include code if codes are explicitly enabled (true)
      // When codes are disabled or undefined, do NOT send code to backend
      const codesActive = websiteSettings?.codesActive === true
      if (codesActive && formData.code && formData.code.trim()) {
        submitData.code = formData.code.trim()
      }

      // Validate groupId format before sending (MongoDB ObjectId format)
      if (submitData.groupId && !/^[0-9a-fA-F]{24}$/.test(submitData.groupId)) {
        console.warn('⚠️ Invalid groupId format:', submitData.groupId)
        clearTimeout(loadingTimeout)
        setLoading(false)
        setError(t('preRegister.invalidGroup') || 'Invalid group selected. Please select a group again.')
        return
      }

      console.log('Pre-registration data:', submitData)
      console.log('Codes active:', codesActive)
      console.log('Website settings:', websiteSettings)
      
      // Add timeout to API call to prevent infinite waiting
      console.log('🚀 Starting pre-register API call...')
      const result = await preRegisterAPI.submit(submitData)
      console.log('✅ Pre-registration successful:', result)
      
      // Get company name BEFORE clearing anything
      const registeredCompanyName = formData.companyName || ''
      
      // Use postRegistrationMessage from settings if available, otherwise use default success message
      console.log('🔍 Checking websiteSettings:', websiteSettings)
      console.log('🔍 postRegistrationMessage:', websiteSettings?.postRegistrationMessage)
      
      let successMsg = ''
      if (websiteSettings?.postRegistrationMessage && websiteSettings.postRegistrationMessage.trim()) {
        // Use the custom message from settings
        successMsg = websiteSettings.postRegistrationMessage
        console.log('✅ Using custom message from settings:', successMsg)
      } else {
        // Fall back to default success message
        const selectedGroup = groups.find(g => g._id === formData.groupId)
        const groupName = selectedGroup ? selectedGroup.name : ''
        successMsg = groupName 
          ? t('preRegister.successWithGroup', { companyName: registeredCompanyName, groupName }) || `Successfully pre-registered ${registeredCompanyName} in group ${groupName}!`
          : t('preRegister.success', { companyName: registeredCompanyName }) || `Successfully pre-registered ${registeredCompanyName}!`
        console.log('✅ Using default success message:', successMsg)
      }
      
      console.log('✅ Creating success notification for pre-registration:', successMsg)
      
      // IMMEDIATELY create notification in DOM - SYNCHRONOUSLY, before anything else
      // Store in sessionStorage so it persists even if page refreshes
      sessionStorage.setItem('preRegisterSuccessMessage', successMsg)
      sessionStorage.setItem('preRegisterSuccessTime', Date.now().toString())
      
      if (typeof document !== 'undefined' && document.body) {
        // Remove any existing notifications first
        const existingNotifications = document.querySelectorAll('.success-notification-toast')
        existingNotifications.forEach(el => el.remove())
        
        console.log('🔧 Creating notification immediately in DOM')
        const notification = document.createElement('div')
        notification.id = 'pre-register-success-notification'
        notification.className = 'success-notification-toast'
        notification.style.cssText = `
          padding: 20px 25px;
          background-color: #d1fae5;
          border: 3px solid #10b981;
          border-radius: 12px;
          color: #065f46;
          font-size: 18px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          word-wrap: break-word;
          overflow-wrap: break-word;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 99999;
          min-width: 320px;
          max-width: 90%;
          pointer-events: auto;
        `
        notification.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span style="font-size: 28px; flex-shrink: 0;">✓</span>
              <span style="flex: 1; min-width: 0; line-height: 1.6;">${successMsg}</span>
              <button style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: inherit; opacity: 0.7; padding: 0; margin-left: 0.5rem; line-height: 1;" onclick="sessionStorage.removeItem('preRegisterSuccessMessage'); sessionStorage.removeItem('preRegisterSuccessTime'); window.location.reload();">×</button>
            </div>
            <button onclick="sessionStorage.removeItem('preRegisterSuccessMessage'); sessionStorage.removeItem('preRegisterSuccessTime'); window.location.reload();" style="background-color: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; transition: background-color 0.2s;">OK</button>
          </div>
        `
        notification.onclick = (e) => {
          // Don't close when clicking inside the notification, only on the × button or OK button
          if (e.target === notification || e.target.closest('button')) {
            return
          }
        }
        document.body.appendChild(notification)
        console.log('✅ Notification created in DOM immediately - will stay until OK is clicked')
      }
      
      // Show alert as immediate feedback
      alert('SUCCESS: ' + successMsg)
      
      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout)
      
      // Check if still mounted before updating state
      if (!isMountedRef.current) {
        setLoading(false)
        return
      }
      
      // Clear loading state
      setLoading(false)
      
      // Store pre-registration ID in sessionStorage to allow access to full registration
      if (result.preRegistrationId) {
        sessionStorage.setItem('preRegistrationId', result.preRegistrationId)
      }
      
      // Clear form data
      setFormData({
        name: '',
        mobileNumber: '',
        companyName: '',
        code: '',
        groupId: ''
      })
      
      // Clear error state
      setError('')
      
      // Refresh the page after showing notification (notification will be restored from sessionStorage)
      // Wait a moment to ensure notification is visible before refresh
      setTimeout(() => {
        window.location.reload()
      }, 500) // Small delay to let user see the notification
    } catch (err) {
      // Clear loading timeout first
      clearTimeout(loadingTimeout)
      
      // ALWAYS clear loading state IMMEDIATELY on error to prevent UI freeze
      console.error('❌ Error caught in handleSubmit, clearing loading state...')
      
      // Log the full error immediately for debugging
      console.error('❌ Full error object:', err)
      console.error('❌ Error message:', err.message)
      console.error('❌ Error name:', err.name)
      console.error('❌ Error status:', err.status)
      console.error('❌ Error details:', err.details)
      console.error('❌ Error stack:', err.stack)
      
      setLoading(false)
      
      // Also clear it in next tick as backup (in case of render issues)
      setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }, 0)
      
      // Only log and set error if component is still mounted
      if (!isMountedRef.current) {
        console.warn('⚠️ Component unmounted, skipping error display')
        return
      }
      
      console.error('📋 Pre-registration error details:', {
        message: err.message,
        error: err.error,
        status: err.status,
        details: err.details,
        stack: err.stack,
        name: err.name,
        fullError: err
      })
      
      // Handle network errors and timeouts
      if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed to connect'))) {
        const errorMsg = err.message.includes('Failed to connect') 
          ? err.message 
          : 'Network error: Could not connect to server. Please check if the backend server is running on http://localhost:5000'
        setError(errorMsg)
        return
      } else if (err.message && err.message.includes('timeout')) {
        setError(err.message)
        return
      }
      
      // Extract error message from the error object
      console.log('🔍 Full error object in catch:', {
        message: err.message,
        error: err.error,
        status: err.status,
        details: err.details,
        allKeys: Object.keys(err),
        fullError: err
      })
      
      let errorMessage = t('preRegister.error') || 'Failed to submit registration. Please try again.'
      
      // Handle specific error cases
      if (err.status === 400) {
        // Bad Request - show the specific error message from backend
        // Try multiple ways to extract the error message (in order of preference)
        if (err.details && err.details.error) {
          errorMessage = err.details.error
        } else if (err.details && typeof err.details === 'string') {
          errorMessage = err.details
        } else if (err.error) {
          errorMessage = err.error
        } else if (err.message && !err.message.includes('pre-registration')) {
          errorMessage = err.message
        } else {
          errorMessage = 'Invalid data. Please check all required fields are filled correctly.'
        }
        
        console.log('📝 Final error message to display:', errorMessage)
        setError(errorMessage)
      } else {
        // Show the full error message with status code
        if (err.status) {
          errorMessage += ` (Status: ${err.status})`
        }
        setError(errorMessage)
      }
    }
  }

    return (
    <div className={`pre-register ${websiteClosed ? 'website-closed' : ''}`}>
      {websiteClosed && (
        <div className="closed-background-overlay">
          <span className="closed-watermark">CLOSED</span>
        </div>
      )}
      <div className="pre-register-container">
        <h1>{t('preRegister.title')}</h1>
        <p className="pre-register-subtitle">{t('preRegister.subtitle')}</p>

        {error && (
          <div className="error-message" style={{ 
            padding: '15px', 
            marginBottom: '20px', 
            backgroundColor: '#fee', 
            border: '2px solid #fcc', 
            borderRadius: '5px',
            color: '#c00',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {error}
          </div>
        )}

        {websiteClosed && (
          <div className="website-closed-message" style={{ 
            padding: '2rem', 
            marginBottom: '2rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '2px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>{t('preRegister.websiteClosed')}</h2>
            {closedMessage && <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{closedMessage}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="pre-register-form" noValidate style={{ 
          pointerEvents: websiteClosed ? 'none' : 'auto', 
          opacity: websiteClosed ? 0.6 : 1,
          position: 'relative',
          zIndex: websiteClosed ? 0 : 1
        }}>
          {websiteSettings?.codesActive === true && (
          <div className="form-group">
            <label>{t('preRegister.registrationCode')} *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleCodeInputChange}
              onBlur={handleCodeBlur}
              required
              placeholder={t('preRegister.codePlaceholder') || 'Enter your company code'}
              disabled={loadingCode}
              style={{ 
                opacity: loadingCode ? 0.6 : 1,
                position: 'relative'
              }}
            />
            {loadingCode && (
              <small className="form-hint" style={{ color: '#3b82f6', display: 'block', marginTop: '0.5rem' }}>
                {t('preRegister.loadingCode') || 'Loading company data...'}
              </small>
            )}
            {codeError && (
              <div className="field-error-message" style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem', 
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span>
                <span>{codeError}</span>
              </div>
            )}
            {!codeError && !loadingCode && formData.code && (
              <small className="form-hint" style={{ color: '#10b981', display: 'block', marginTop: '0.5rem' }}>
                {t('preRegister.codeHint') || 'Enter your company code to auto-fill the form'}
              </small>
            )}
          </div>
          )}

          <div className="form-group">
            <label>{t('preRegister.name')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder={t('preRegister.namePlaceholder')}
              readOnly={autoFilledFields.name}
              style={{
                backgroundColor: autoFilledFields.name ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                color: autoFilledFields.name ? 'var(--text-primary)' : 'var(--text-primary)',
                cursor: autoFilledFields.name ? 'not-allowed' : 'text',
                borderColor: autoFilledFields.name ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)',
                borderWidth: autoFilledFields.name ? '2px' : '2px',
                fontWeight: autoFilledFields.name ? '500' : 'normal',
                opacity: autoFilledFields.name ? '1' : '1'
              }}
            />
            {autoFilledFields.name && (
              <small className="form-hint" style={{ color: '#10b981', display: 'block', marginTop: '0.5rem', fontWeight: '500' }}>
                ✓ {t('preRegister.autoFilled') || 'Auto-filled from company code'}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>{t('preRegister.mobileNumber')} *</label>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              required
              placeholder={t('preRegister.mobilePlaceholder')}
              readOnly={autoFilledFields.mobileNumber}
              style={{
                backgroundColor: autoFilledFields.mobileNumber ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                color: autoFilledFields.mobileNumber ? 'var(--text-primary)' : 'var(--text-primary)',
                cursor: autoFilledFields.mobileNumber ? 'not-allowed' : 'text',
                borderColor: autoFilledFields.mobileNumber ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)',
                borderWidth: autoFilledFields.mobileNumber ? '2px' : '2px',
                fontWeight: autoFilledFields.mobileNumber ? '500' : 'normal',
                opacity: autoFilledFields.mobileNumber ? '1' : '1'
              }}
            />
            {autoFilledFields.mobileNumber && (
              <small className="form-hint" style={{ color: '#10b981', display: 'block', marginTop: '0.5rem', fontWeight: '500' }}>
                ✓ {t('preRegister.autoFilled') || 'Auto-filled from company code'}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>{t('preRegister.companyName') || 'Company Name'} *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              readOnly
              required
              placeholder={t('preRegister.companyNamePlaceholder') || 'Company name will appear here after entering code'}
              style={{
                backgroundColor: formData.companyName ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                color: formData.companyName ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'not-allowed',
                borderColor: formData.companyName ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)',
                borderWidth: '2px',
                fontWeight: formData.companyName ? '500' : 'normal',
                opacity: formData.companyName ? '1' : '0.7'
              }}
            />
            {formData.companyName && (
              <small className="form-hint" style={{ color: '#10b981', display: 'block', marginTop: '0.5rem', fontWeight: '500' }}>
                ✓ {t('preRegister.autoFilled') || 'Auto-filled from company code'}
              </small>
            )}
            {!formData.companyName && (
              <small className="form-hint" style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                {t('preRegister.companyNameHint') || 'Enter your company code above to auto-fill the company name'}
              </small>
            )}
          </div>
          
          {websiteSettings?.codesActive !== true && (
            <div className="info-message" style={{ 
              padding: '0.75rem 1rem', 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.3)', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}>
              ℹ️ Code registration is currently disabled. You can register without entering a code.
            </div>
          )}

          <div className="form-group group-selection-container">
            <label>{t('preRegister.selectGroup')} *</label>
            <input
              type="hidden"
              name="groupId"
              value={formData.groupId || ''}
            />
            {loadingGroups ? (
              <div className="loading-groups">{t('preRegister.loadingGroups')}</div>
            ) : groups.length === 0 ? (
              <div className="no-groups">{t('preRegister.noGroups')}</div>
            ) : (
              <div className="groups-card-container">
                {groups.map(group => {
                  const registeredCount = group.registeredCount || group.companies?.length || 0;
                  const maxCompanies = group.maxCompanies || 0;
                  const remaining = maxCompanies > 0 ? maxCompanies - registeredCount : '∞';
                  const isFull = maxCompanies > 0 && registeredCount >= maxCompanies;
                  
                  // Format date
                  const dateStr = group.date ? new Date(group.date).toLocaleDateString() : '';
                  const translatedDay = group.day ? translateDay(group.day) : '';
                  const dayStr = translatedDay ? ` - ${translatedDay}` : '';
                  const dateDisplay = dateStr ? `${dateStr}${dayStr}` : '';
                  
                  return (
                    <div
                      key={group._id}
                      className={`group-selection-card ${formData.groupId === group._id ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                      onClick={() => !isFull && setFormData(prev => ({ ...prev, groupId: group._id }))}
                      role="button"
                      tabIndex={isFull ? -1 : 0}
                      onKeyDown={(e) => {
                        if (!isFull && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setFormData(prev => ({ ...prev, groupId: group._id }));
                        }
                      }}
                    >
                      <div className="group-card-header">
                        <h4 className="group-card-name">{group.name}</h4>
                        {formData.groupId === group._id && (
                          <span className="selected-badge">✓ {t('preRegister.selected')}</span>
                        )}
                        {isFull && (
                          <span className="full-badge">{t('preRegister.groupFull')}</span>
                        )}
                      </div>
                      
                      <div className="group-card-details">
                        {group.timeRange && (
                          <div className="group-detail-item">
                            <span className="detail-icon">🕐</span>
                            <span className="detail-label">{t('preRegister.time')}:</span>
                            <span className="detail-value">{group.timeRange}</span>
                          </div>
                        )}
                        {dateDisplay && (
                          <div className="group-detail-item">
                            <span className="detail-icon">📅</span>
                            <span className="detail-label">{t('preRegister.date')}:</span>
                            <span className="detail-value">{dateDisplay}</span>
                          </div>
                        )}
                        <div className="group-detail-item">
                          <span className="detail-icon">👥</span>
                          <span className="detail-label">{t('preRegister.availability')}:</span>
                          <span className={`detail-value ${isFull ? 'full-text' : 'available-text'}`}>
                            {isFull ? t('preRegister.groupFull') : t('preRegister.remainingSlots', { count: remaining })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!formData.groupId && groups.length > 0 && (
              <small className="form-hint">{t('preRegister.selectGroupHint')}</small>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {t('nav.register') || 'Register'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">
              {t('preRegister.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PreRegister
