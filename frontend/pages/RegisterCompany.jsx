import React, { useState, useEffect, useMemo } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { companiesAPI, groupsAPI, preRegisterAPI, settingsAPI, companyNamesAPI } from '../services/api'
import './RegisterCompany.css'

const RegisterCompany = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Helper function to format date as DD/MM/YYYY (matching CompaniesList format exactly)
  const formatDate = (dateInput) => {
    if (!dateInput) return ''
    try {
      let dateString = String(dateInput).trim()
      
      // If date already has time component, extract just the date part
      if (dateString.includes('T')) {
        dateString = dateString.split('T')[0]
      }
      
      // CRITICAL: Handle MM/DD/YYYY format (e.g., "1/13/2026" or "01/13/2026")
      // This is the most common issue - JavaScript interprets this as MM/DD/YYYY
      const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      const match = dateString.match(mmddyyyyPattern)
      if (match) {
        const [, month, day, year] = match
        // Convert MM/DD/YYYY to YYYY-MM-DD for proper parsing
        // This ensures we parse it correctly as year-month-day
        dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      
      // Parse the date - always add T00:00:00 to avoid timezone issues
      const date = new Date(dateString + 'T00:00:00')
      
      // Validate date
      if (isNaN(date.getTime())) {
        return ''
      }
      
      // Format as DD/MM/YYYY - use UTC methods to avoid timezone shifts
      const day = String(date.getUTCDate()).padStart(2, '0')
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const year = date.getUTCFullYear()
      const formatted = `${day}/${month}/${year}`
      
      return formatted
    } catch (error) {
      return ''
    }
  }

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
    contactName: '',
    phoneNumber: '',
    address: '',
    logo: '',
    description: '',
    businessType: '',
    registrationNumber: '',
    taxId: '',
    website: '',
    registrationFee: 0,
    groupId: '',
    selectedCompanyId: '',
    companyId: ''
  })
  const [groups, setGroups] = useState([])
  const [companyNames, setCompanyNames] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isErrorNotification, setIsErrorNotification] = useState(false)
  
  // Track notification state changes and ensure it renders
  useEffect(() => {
    // If notification should be shown, verify it exists in DOM after a brief delay
    if (showNotification && notificationMessage) {
      const checkTimer = setTimeout(() => {
        const notificationEl = document.querySelector('.success-notification-toast')
        
        // Fallback: If notification not found, create it directly in DOM
        if (!notificationEl) {
          const fallbackNotification = document.createElement('div')
          fallbackNotification.className = `success-notification-toast ${isErrorNotification ? 'error-notification' : ''}`
          fallbackNotification.style.cssText = `
            padding: 20px 25px;
            background-color: ${isErrorNotification ? '#fee2e2' : '#d1fae5'};
            border: 3px solid ${isErrorNotification ? '#ef4444' : '#10b981'};
            border-radius: 12px;
            color: ${isErrorNotification ? '#991b1b' : '#065f46'};
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 6px 20px ${isErrorNotification ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'};
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
          fallbackNotification.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 28px; flex-shrink: 0;">${isErrorNotification ? '⚠️' : '✓'}</span>
                <span style="flex: 1; min-width: 0; line-height: 1.6;">${notificationMessage}</span>
                <button style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: inherit; opacity: 0.7; padding: 0; margin-left: 0.5rem; line-height: 1;" onclick="sessionStorage.removeItem('preRegisterSuccessMessage'); sessionStorage.removeItem('preRegisterSuccessTime'); window.location.reload();">×</button>
              </div>
              <button onclick="sessionStorage.removeItem('preRegisterSuccessMessage'); sessionStorage.removeItem('preRegisterSuccessTime'); window.location.reload();" style="background-color: ${isErrorNotification ? '#ef4444' : '#10b981'}; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; transition: background-color 0.2s;">OK</button>
            </div>
          `
          fallbackNotification.onclick = (e) => {
            // Don't close when clicking inside the notification, only on the × button or OK button
            if (e.target === fallbackNotification || e.target.closest('button')) {
              return
            }
          }
          document.body.appendChild(fallbackNotification)
        }
      }, 200) // Check after 200ms to give React time to render
      
      return () => clearTimeout(checkTimer)
    }
    
    // Auto-dismiss success notification after 10 seconds (or keep it until manually dismissed)
    // Only auto-dismiss if it's a success notification (not error)
    if (showNotification && !isErrorNotification && notificationMessage) {
      const timer = setTimeout(() => {
        // Remove any fallback notifications
        const fallbackNotifications = document.querySelectorAll('.success-notification-toast')
        fallbackNotifications.forEach(el => el.remove())
        setShowNotification(false)
        setNotificationMessage('')
      }, 10000) // 10 seconds - gives user plenty of time to see the success message
      return () => clearTimeout(timer)
    }
  }, [showNotification, notificationMessage, isErrorNotification])
  
  // Don't clear success message automatically - let it stay until redirect
  // The message will be cleared when navigating away
  
  // Clear field errors when user starts typing
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }
  const [websiteSettings, setWebsiteSettings] = useState(null)
  const [idValid, setIdValid] = useState(false)
  const [idError, setIdError] = useState('')

  // Check if user has completed pre-registration and fetch groups
  useEffect(() => {
    // Don't redirect if we just successfully registered (check for success state)
    if (location.state?.newlyRegistered) {
      return
    }
    
    const preRegistrationId = sessionStorage.getItem('preRegistrationId')
    const preRegistered = location.state?.preRegistered

    if (!preRegistrationId && !preRegistered) {
      // Redirect to pre-registration if not completed
      navigate('/pre-register', { replace: true })
      return
    }

    // Check if this pre-registration has already been used
    const checkExistingRegistration = async () => {
      if (location.state?.preRegistrationData) {
        const preData = location.state.preRegistrationData
        // Pre-fill form with pre-registration data
        setFormData(prev => ({
          ...prev,
          name: preData.companyName || prev.name,
          phoneNumber: preData.mobileNumber || prev.phoneNumber,
          groupId: preData.groupId || prev.groupId
        }))
      } else if (preRegistrationId) {
        // Try to fetch pre-registration data to get groupId
        try {
          const preData = await preRegisterAPI.getById(preRegistrationId)
          if (preData && preData.groupId) {
            setFormData(prev => ({
              ...prev,
              groupId: preData.groupId
            }))
          }
        } catch (err) {
          console.error('Failed to fetch pre-registration data:', err)
        }
      }
    }

    checkExistingRegistration()

    // Fetch website settings for countdown timer and to check if closed
    const fetchWebsiteSettings = async () => {
      try {
        const status = await settingsAPI.getWebsiteSettings()
        setWebsiteSettings(status)
        // Update closed state based on status
        if (!status.isOpen) {
          // System is closed - ensure form is disabled
        }
      } catch (err) {
        console.error('Failed to fetch website settings:', err)
      }
    }
    

    // Fetch active groups for selection
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true)
        const groupsData = await groupsAPI.getAllPublic()
        console.log('Fetched groups data:', groupsData)
        if (groupsData && groupsData.length > 0) {
          console.log('First group date:', groupsData[0].date, 'type:', typeof groupsData[0].date)
        }
        setGroups(groupsData)
      } catch (err) {
        console.error('Failed to fetch groups:', err)
        setError(t('registration.groupsError'))
      } finally {
        setLoadingGroups(false)
      }
    }

    // Fetch company names for selection
    const fetchCompanyNames = async () => {
      try {
        setLoadingCompanies(true)
        setError('')
        const companies = await companyNamesAPI.getCompanyNamesForRegistration()
        console.log('Fetched company names:', companies)
        setCompanyNames(companies || [])
        if (!companies || companies.length === 0) {
          console.warn('No company names found')
        }
      } catch (err) {
        console.error('Failed to fetch company names:', err)
        setError(t('registration.companyNamesError') + ': ' + err.message)
      } finally {
        setLoadingCompanies(false)
      }
    }

    // Fetch settings on mount
    fetchWebsiteSettings()
    
    // Check status very frequently (every 2 seconds) to catch when countdown ends
    // This ensures the website opens/closes immediately when time runs out
    const statusInterval = setInterval(fetchWebsiteSettings, 2000)

    fetchGroups()
    fetchCompanyNames()
    
    return () => clearInterval(statusInterval)
  }, [navigate, location, t])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field when user starts typing
    clearFieldError(name)
    setError('')
    
    // Real-time validation for required fields
    if (['name', 'phoneNumber', 'address'].includes(name)) {
      if (!value.trim()) {
        const errorKey = name === 'name' ? 'nameRequired' : name === 'phoneNumber' ? 'phoneRequired' : 'addressRequired'
        setFieldErrors(prev => ({ ...prev, [name]: t(`registration.fieldErrors.${errorKey}`) }))
      } else {
        clearFieldError(name)
      }
    }
  }

  const handleCompanySelect = (e) => {
    const selectedId = e.target.value
    console.log('Company selected:', selectedId, 'Available companies:', companyNames)
    setFormData(prev => ({ ...prev, selectedCompanyId: selectedId }))
    
    if (selectedId) {
      const selectedCompany = companyNames.find(c => c._id === selectedId || c.id === selectedId)
      console.log('Found company:', selectedCompany)
      if (selectedCompany) {
        setFormData(prev => ({
          ...prev,
          name: selectedCompany.name,
          companyId: selectedCompany._id || selectedCompany.id
        }))
      } else {
        console.error('Company not found for ID:', selectedId)
      }
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        companyId: ''
      }))
    }
  }

  const handleIdChange = async (e) => {
    const id = e.target.value.trim()
    setFormData(prev => ({ ...prev, companyId: id }))
    setIdValid(false)
    setIdError('')
    
    // If ID is provided, validate it
    if (id) {
      try {
        // Check if ID exists in the loaded companyNames list (from company name management)
        const matchingCompany = companyNames.find(c => {
          const companyId = c._id || c.id
          const inputId = String(id).trim()
          return String(companyId) === inputId
        })
        
        if (!matchingCompany) {
          // ID does not exist in company name management
          setIdError(t('registration.idNotRegistered') || 'This ID is not registered in company name management. Please enter a valid company ID.')
          setIdValid(false)
          // Clear form fields if invalid ID
          setFormData(prev => ({
            ...prev,
            selectedCompanyId: '',
            name: '',
            contactName: '',
            phoneNumber: ''
          }))
          return
        }
        
        // ID exists in company name management - auto-fill form with company data
        setFormData(prev => ({
          ...prev,
          selectedCompanyId: matchingCompany._id || matchingCompany.id,
          name: matchingCompany.name || prev.name,
          contactName: matchingCompany.contactName || prev.contactName,
          phoneNumber: matchingCompany.mobileNumber || prev.phoneNumber
        }))
        setIdValid(true)
        setIdError('')
      } catch (err) {
        console.error('Error validating company ID:', err)
        setIdError(t('registration.idNotFound') || 'ID not found. Please enter a valid company ID.')
        setIdValid(false)
        // Clear form fields on error
        setFormData(prev => ({
          ...prev,
          selectedCompanyId: '',
          name: '',
          contactName: '',
          phoneNumber: ''
        }))
      }
    } else {
      // ID cleared, reset validation
      setIdError('')
      setIdValid(false)
      setFormData(prev => ({
        ...prev,
        selectedCompanyId: '',
        name: '',
        contactName: '',
        phoneNumber: '',
        companyId: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Block submission if system is closed
    if (websiteSettings && !websiteSettings.isOpen) {
      setError(t('registration.websiteClosed') || 'Registration is currently closed. Please wait until the system is open.')
      return
    }
    
    // Validate code ONLY if codes are explicitly enabled (true)
    // When codesActive is false or undefined, skip all ID validation and allow registration
    const codesActive = websiteSettings?.codesActive === true
    
    if (codesActive) {
      if (!formData.companyId || formData.companyId.trim() === '') {
        setError(t('registration.idRequired') || 'Please enter a company ID.')
        return
      }
      
      const inputId = String(formData.companyId).trim()
      
      // CRITICAL: Check if ID exists in company name management (companyNames list)
      // This is the main validation - ID MUST match an ID from Manage Company Names
      const idExistsInManageCompanyNames = companyNames.some(c => {
        const companyId = c._id || c.id
        return String(companyId) === inputId
      })
      
      // BLOCK SUBMISSION if ID doesn't match
      if (!idExistsInManageCompanyNames) {
        setError(t('registration.idNotRegistered') || 'This ID does not match any ID in Manage Company Names. Registration cannot be completed.')
        return
      }
      
      // Also verify ID validation state - but allow if ID exists in list even if validation hasn't completed
      if (!idValid && !idExistsInManageCompanyNames) {
        setError(t('registration.idInvalid') || 'ID validation failed. Please enter a valid registered company ID.')
        return
      }
      
      // Final verification: double-check the ID matches before allowing submission
      const finalIdCheck = companyNames.find(c => {
        const companyId = c._id || c.id
        return String(companyId) === inputId
      })
      
      if (!finalIdCheck) {
        setError(t('registration.idNotRegistered') || 'ID verification failed. This ID does not exist in Manage Company Names.')
        return
      }
    }
    
    console.log('Form submission started. Form data:', formData)
    
    // STRICT VALIDATION - All required fields must be filled before submission
    const newFieldErrors = {}
    let hasErrors = false
    
    // Name is REQUIRED - block submission if empty
    if (!formData.name || formData.name.trim() === '') {
      newFieldErrors.name = t('registration.fieldErrors.nameRequired') || 'Name is required'
      hasErrors = true
    }
    
    // Phone Number is REQUIRED - block submission if empty
    if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      newFieldErrors.phoneNumber = t('registration.fieldErrors.phoneRequired') || 'Phone number is required'
      hasErrors = true
    }
    
    // Company selection is REQUIRED - block submission if not selected
    if (!formData.selectedCompanyId || formData.selectedCompanyId.trim() === '') {
      newFieldErrors.selectedCompanyId = t('registration.chooseCompany') + ' ' + (t('registration.fieldErrors.nameRequired') || 'is required')
      hasErrors = true
    }
    
    // Address is REQUIRED - block submission if empty
    if (!formData.address || formData.address.trim() === '') {
      newFieldErrors.address = t('registration.fieldErrors.addressRequired') || 'Address is required'
      hasErrors = true
    }
    
    // Group is REQUIRED - cannot submit without selecting a group
    if (!formData.groupId || formData.groupId.trim() === '') {
      newFieldErrors.groupId = t('registration.fieldErrors.groupRequired') || 'Please select a group'
      hasErrors = true
    } else {
      // Validate groupId format (MongoDB ObjectId)
      if (!/^[0-9a-fA-F]{24}$/.test(formData.groupId.trim())) {
        newFieldErrors.groupId = t('registration.fieldErrors.groupInvalid') || 'Invalid group selected. Please select a group again.'
        hasErrors = true
      }
    }
    
    // BLOCK SUBMISSION if any required field is missing
    if (hasErrors) {
      setFieldErrors(newFieldErrors)
      setError(t('registration.validation.fillRequiredFields') || 'Please fill in all required fields: Name, Phone Number, Company, and Group')
      // Scroll to first error field
      const firstErrorField = Object.keys(newFieldErrors)[0]
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
                          document.querySelector(`[data-group-id="${formData.groupId}"]`)
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        errorElement.focus()
      }
      return
    }
    
    // Clear field errors if validation passes
    setFieldErrors({})

    // Set loading state
    setLoading(true)
    
    // Safety timeout to prevent infinite loading (8 seconds max)
    let loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Registration taking too long, automatically clearing loading state')
      setLoading(false)
      setError(t('registration.validation.networkError') || 'Registration is taking longer than expected. Please check your connection and try again.')
    }, 8000)

    try {

      // Prepare data to send - only include fields the backend expects
      // Ensure all required fields are trimmed and not empty
      const name = formData.name ? String(formData.name).trim() : ''
      const phoneNumber = formData.phoneNumber ? String(formData.phoneNumber).trim() : ''
      const address = formData.address ? String(formData.address).trim() : ''
      
      // Final validation before sending
      if (!name || name === '') {
        setError(t('registration.fieldErrors.nameRequired') || 'Company name is required')
        setLoading(false)
        return
      }
      if (!phoneNumber || phoneNumber === '') {
        setError(t('registration.fieldErrors.phoneRequired') || 'Phone number is required')
        setLoading(false)
        return
      }
      if (!address || address === '') {
        setError(t('registration.fieldErrors.addressRequired') || 'Address is required')
        setLoading(false)
        return
      }
      
      // Ensure groupId is included and valid
      if (!formData.groupId || formData.groupId.trim() === '') {
        setError(t('registration.fieldErrors.groupRequired') || 'Please select a group')
        setLoading(false)
        clearTimeout(loadingTimeout)
        return
      }
      
      // Validate groupId format one more time
      if (!/^[0-9a-fA-F]{24}$/.test(formData.groupId.trim())) {
        setError(t('registration.fieldErrors.groupInvalid') || 'Invalid group selected. Please select a group again.')
        setLoading(false)
        clearTimeout(loadingTimeout)
        return
      }
      
      const registrationData = {
        name: name,
        phoneNumber: phoneNumber,
        address: address,
        groupId: formData.groupId.trim() // REQUIRED - must include groupId
      }
      
      // Log data being sent for debugging
      console.log('📤 Preparing registration data:', {
        name: registrationData.name,
        phoneNumber: registrationData.phoneNumber ? '***' : undefined,
        address: registrationData.address ? '***' : undefined,
        nameLength: registrationData.name.length,
        phoneNumberLength: registrationData.phoneNumber.length,
        addressLength: registrationData.address.length,
        hasGroupId: !!formData.groupId,
        groupId: formData.groupId
      })

      // Only include optional fields if they have values
      if (formData.logo && formData.logo.trim()) {
        registrationData.logo = formData.logo.trim()
      }
      if (formData.description && formData.description.trim()) {
        registrationData.description = formData.description.trim()
      }
      if (formData.businessType && formData.businessType.trim()) {
        registrationData.businessType = formData.businessType.trim()
      }
      if (formData.registrationNumber && formData.registrationNumber.trim()) {
        registrationData.registrationNumber = formData.registrationNumber.trim()
      }
      if (formData.taxId && formData.taxId.trim()) {
        registrationData.taxId = formData.taxId.trim()
      }
      if (formData.website && formData.website.trim()) {
        registrationData.website = formData.website.trim()
      }
      if (formData.registrationFee && formData.registrationFee > 0) {
        registrationData.registrationFee = formData.registrationFee
      }

      // GroupId is REQUIRED - must be included in registration
      if (!formData.groupId || formData.groupId.trim() === '') {
        setError(t('registration.fieldErrors.groupRequired') || 'Please select a group')
        setLoading(false)
        clearTimeout(loadingTimeout)
        return
      }
      
      const groupId = formData.groupId.trim()
      // Validate groupId format (MongoDB ObjectId)
      if (!/^[0-9a-fA-F]{24}$/.test(groupId)) {
        setError(t('registration.fieldErrors.groupInvalid') || 'Invalid group selected. Please select a group again.')
        setLoading(false)
        clearTimeout(loadingTimeout)
        return
      }
      
      // Include groupId in registration data (REQUIRED)
      registrationData.groupId = groupId

      // Note: We don't send companyId to backend
      // The backend looks up the code from companyNames collection based on company name
      // The companyId validation on frontend is just to ensure the company exists in Manage Company Names

      console.log('Registration data:', registrationData)
      console.log('Website settings:', websiteSettings)
      console.log('Codes active:', websiteSettings?.codesActive)
      console.log('Website open:', websiteSettings?.isOpen)
      console.log('Form data:', formData)
      console.log('API endpoint:', `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/companies`)
      
      // Add timeout to API call to prevent infinite waiting
      console.log('🚀 Starting API call...')
      const apiCallPromise = companiesAPI.register(registrationData).catch(err => {
        console.error('❌ API call promise rejected:', err)
        throw err
      })
      const apiTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('⏱️ API call timeout after 7 seconds')
          reject(new Error('Request timeout: The server is taking too long to respond. Please try again.'))
        }, 7000) // 7 second timeout (less than loading timeout)
      })
      
      const result = await Promise.race([apiCallPromise, apiTimeoutPromise])
      console.log('✅ Registration successful:', result)
      console.log('✅ Result details:', JSON.stringify(result, null, 2))
      
      // IMMEDIATE ALERT to confirm registration succeeded (temporary for debugging)
      // alert('Registration succeeded! Check console for details.')
      
      // Clear the loading timeout since we got a response
      clearTimeout(loadingTimeout)
      
      // Get company name BEFORE clearing form data
      const registeredCompanyName = formData.name || result.name || ''
      
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
          ? t('registration.successMessageWithGroup', { companyName: registeredCompanyName, groupName }) || `Successfully registered ${registeredCompanyName} in group ${groupName}!`
          : t('registration.successMessage', { companyName: registeredCompanyName }) || `Successfully registered ${registeredCompanyName}!`
        console.log('✅ Using default success message:', successMsg)
      }
      
      // Set notification state - force synchronous updates to ensure re-render
      console.log('✅ Final success message:', successMsg)
      
      // IMMEDIATELY create notification in DOM - don't wait for React re-render
      if (typeof document !== 'undefined' && document.body) {
        // Remove any existing notifications first
        const existingNotifications = document.querySelectorAll('.success-notification-toast')
        existingNotifications.forEach(el => el.remove())
        
        console.log('🔧 Creating notification immediately in DOM')
        const notification = document.createElement('div')
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
          animation: slideInRightBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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
      
      // Set React state for consistency (even though we're using DOM directly)
      setSuccessMessage(successMsg)
      setNotificationMessage(successMsg)
      setIsErrorNotification(false)
      setShowNotification(true)
      
      console.log('✅ Success states set and DOM elements created')
      
      // Clear pre-registration session after successful registration
      sessionStorage.removeItem('preRegistrationId')
      
      // Clear form data immediately
      setFormData({
        name: '',
        phoneNumber: '',
        address: '',
        logo: '',
        description: '',
        businessType: '',
        registrationNumber: '',
        taxId: '',
        website: '',
        registrationFee: 0,
        groupId: '',
        selectedCompanyId: '',
        companyId: '',
        contactName: ''
      })
      
      // Clear loading state FIRST to prevent UI freeze
      setLoading(false)
      setFieldErrors({})
      setError('')
      
      // Stay on the registration page - user can register another company or navigate manually
    } catch (err) {
      console.error('❌ ERROR in handleSubmit catch block:', err)
      console.error('❌ Error details:', {
        message: err.message,
        error: err.error,
        status: err.status,
        stack: err.stack
      })
      alert('ERROR: ' + (err.message || 'Registration failed. Check console for details.'))
      
      // Clear loading timeout first
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
      
      // ALWAYS clear loading state IMMEDIATELY on error to prevent UI freeze
      console.error('❌ Error caught in handleSubmit, clearing loading state...')
      setLoading(false)
      
      // Also clear it in next tick as backup (in case of render issues)
      setTimeout(() => {
        setLoading(false)
      }, 0)
      
      console.error('❌ Error caught, loading state cleared automatically')
      
      console.error('Registration error details:', {
        message: err.message,
        error: err.error,
        status: err.status,
        stack: err.stack,
        name: err.name,
        fullError: err
      })
      
      // Log to help debug
      console.error('Error type:', typeof err)
      console.error('Error constructor:', err.constructor?.name)
      console.error('Is Error instance:', err instanceof Error)
      
      // Extract error message from the error object
      let errorMessage = err.message || err.error || t('registration.error') || 'Failed to register company. Please try again.'
      
      // Handle network errors and timeouts
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = t('registration.validation.networkError')
      } else if (err.message && err.message.includes('timeout')) {
        errorMessage = err.message
      } else if (err.message && err.message.includes('CORS')) {
        errorMessage = t('registration.validation.corsError')
      }
      
      // Show error for network/timeout issues
      if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('CORS')) {
        setError(errorMessage)
        setNotificationMessage(errorMessage)
        setIsErrorNotification(true)
        setShowNotification(true)
        setTimeout(() => {
          setShowNotification(false)
        }, 5000)
        // Loading already cleared at start of catch, but ensure it's cleared
        setLoading(false)
        return
      }
      
      // Parse backend errors and map to field errors if possible
      const backendFieldErrors = {}
      
      // Check if error is about duplicate registration
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        setError(errorMessage)
        // Show error notification
        setNotificationMessage(errorMessage)
        setIsErrorNotification(true)
        setShowNotification(true)
        setTimeout(() => {
          setShowNotification(false)
        }, 5000)
        // Clear session if already registered
        sessionStorage.removeItem('preRegistrationId')
      } else if (err.status === 400) {
        // Bad Request - try to map to specific fields
        console.error('🔍 400 Bad Request - analyzing error message:', errorMessage)
        console.error('🔍 Error details:', err.details)
        
        // Extract missing fields from error details if available
        if (err.details && err.details.missingFields) {
          err.details.missingFields.forEach(field => {
            backendFieldErrors[field] = t(`registration.validation.${field}Required`) || `${field} is required`
          })
        }
        
        // Check for missing fields
        if (errorMessage.toLowerCase().includes('missing required fields') || errorMessage.toLowerCase().includes('required')) {
          if (errorMessage.toLowerCase().includes('name')) {
            backendFieldErrors.name = errorMessage
          }
          if (errorMessage.toLowerCase().includes('phone')) {
            backendFieldErrors.phoneNumber = errorMessage
          }
          if (errorMessage.toLowerCase().includes('address')) {
            backendFieldErrors.address = errorMessage
          }
        } else if (errorMessage.toLowerCase().includes('name')) {
          backendFieldErrors.name = errorMessage
        } else if (errorMessage.toLowerCase().includes('phone')) {
          backendFieldErrors.phoneNumber = errorMessage
        } else if (errorMessage.toLowerCase().includes('address')) {
          backendFieldErrors.address = errorMessage
        } else if (errorMessage.toLowerCase().includes('group')) {
          backendFieldErrors.groupId = errorMessage
        } else if (errorMessage.toLowerCase().includes('id') || errorMessage.toLowerCase().includes('code')) {
          backendFieldErrors.companyId = errorMessage
        }
        
        // If we have error details, use them
        if (err.details && err.details.missingFields) {
          err.details.missingFields.forEach(field => {
            if (field === 'name') backendFieldErrors.name = errorMessage
            if (field === 'phoneNumber') backendFieldErrors.phoneNumber = errorMessage
            if (field === 'address') backendFieldErrors.address = errorMessage
          })
        }
        
        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors(backendFieldErrors)
          // Use the actual backend error message instead of generic message
          const errorMsg = errorMessage || t('registration.validation.fixErrorsHighlighted')
          setError(errorMsg)
          // Show error notification
          setNotificationMessage(errorMsg)
          setIsErrorNotification(true)
          setShowNotification(true)
          setTimeout(() => {
            setShowNotification(false)
          }, 5000)
        } else {
          // No field-specific errors, but still show the backend error message
          setError(errorMessage)
          setNotificationMessage(errorMessage)
          setIsErrorNotification(true)
          setShowNotification(true)
          setTimeout(() => {
            setShowNotification(false)
          }, 5000)
          
          // Log to console for debugging
          console.error('❌ Registration failed with 400 error:', errorMessage)
          console.error('❌ Full error object:', err)
        }
      } else {
        // Show the full error message with status code
        if (err.status) {
          errorMessage += ` (Status: ${err.status})`
        }
        setError(errorMessage)
        // Show error notification
        setNotificationMessage(errorMessage)
        setIsErrorNotification(true)
        setShowNotification(true)
        setTimeout(() => {
          setShowNotification(false)
        }, 5000)
      }
      
      // Loading state is already cleared at the start of catch block
      // This ensures UI never freezes
    } finally {
      // Clear loading timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
      
      // Final safety net - ALWAYS clear loading state to prevent stuck form
      // Use both immediate and delayed clearing to ensure it works
      setLoading(false)
      
      // Also set it in next tick as backup
      setTimeout(() => {
        setLoading(false)
      }, 0)
    }
  }

  const isClosed = websiteSettings && !websiteSettings.isOpen

  // Calculate if submit button should be disabled
  const isSubmitDisabled = useMemo(() => {
    // Check basic required fields
    if (loading || !formData.name || !formData.phoneNumber || !formData.address) {
      return true
    }
    
    // Check ID validation ONLY if codes are explicitly enabled (true)
    // When codesActive is false or undefined, allow submission without ID
    const codesActive = websiteSettings?.codesActive === true
    
    if (codesActive) {
      const inputId = formData.companyId ? String(formData.companyId).trim() : ''
      
      // ID must be entered
      if (!inputId) {
        return true
      }
      
      // ID must exist in Manage Company Names
      const idExists = companyNames.some(c => {
        const companyId = c._id || c.id
        return String(companyId) === inputId
      })
      
      if (!idExists || !idValid) {
        return true
      }
    }
    
    // Group selection is REQUIRED - cannot submit without group
    if (!formData.groupId || formData.groupId.trim() === '') {
      return true
    }
    
    // Validate groupId format (MongoDB ObjectId)
    if (!/^[0-9a-fA-F]{24}$/.test(formData.groupId.trim())) {
      return true
    }
    
    // Company selection is REQUIRED
    if (!formData.selectedCompanyId || formData.selectedCompanyId.trim() === '') {
      return true
    }
    
    return false
  }, [loading, formData.name, formData.phoneNumber, formData.address, formData.selectedCompanyId, formData.groupId, formData.companyId, websiteSettings?.codesActive, companyNames, idValid])

  return (
    <div className={`register-company ${isClosed ? 'website-closed' : ''}`}>
      {isClosed && (
        <div className="closed-background-overlay">
          <span className="closed-watermark">CLOSED</span>
        </div>
      )}
      <div className="register-container">
        {error && (
          <div className="error-message" style={{ 
            padding: '15px 20px', 
            marginBottom: '20px', 
            backgroundColor: '#fee', 
            border: '2px solid #fcc', 
            borderRadius: '8px',
            color: '#c00',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>⚠️</span>
            <span style={{ flex: 1, minWidth: 0 }}>{error}</span>
          </div>
        )}
        
        {/* Success Notification Toast */}
        {(() => {
          const shouldRender = showNotification && notificationMessage
          const bodyExists = typeof document !== 'undefined' && document.body
          console.log('🔔 Notification render check:', { 
            showNotification, 
            notificationMessage, 
            shouldRender, 
            bodyExists,
            successMessage 
          })
          return null
        })()}
        {showNotification && notificationMessage && createPortal(
          <div 
            className={`success-notification-toast ${isErrorNotification ? 'error-notification' : ''}`}
            style={{ 
              padding: '20px 25px', 
              backgroundColor: isErrorNotification ? '#fee2e2' : '#d1fae5', 
              border: `3px solid ${isErrorNotification ? '#ef4444' : '#10b981'}`, 
              borderRadius: '12px',
              color: isErrorNotification ? '#991b1b' : '#065f46',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: `0 6px 20px ${isErrorNotification ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999,
              minWidth: '320px',
              maxWidth: '90%',
              animation: 'slideInRightBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              // Don't close when clicking inside the notification, only on buttons
              if (e.target.closest('button')) {
                return
              }
            }}
            role="alert"
            aria-live="assertive"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{isErrorNotification ? '⚠️' : '✓'}</span>
                <span style={{ flex: 1, minWidth: 0, lineHeight: '1.6' }}>{notificationMessage}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    sessionStorage.removeItem('preRegisterSuccessMessage')
                    sessionStorage.removeItem('preRegisterSuccessTime')
                    window.location.reload()
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'inherit',
                    opacity: 0.7,
                    padding: '0',
                    marginLeft: '0.5rem',
                    lineHeight: '1'
                  }}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  sessionStorage.removeItem('preRegisterSuccessMessage')
                  sessionStorage.removeItem('preRegisterSuccessTime')
                  window.location.reload()
                }}
                style={{
                  backgroundColor: isErrorNotification ? '#ef4444' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background-color 0.2s'
                }}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}


        {isClosed && (
          <div className="website-closed-message" style={{ 
            padding: '2rem', 
            marginBottom: '2rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '2px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '10px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>{t('registration.websiteClosed') || 'Registration is Currently Closed'}</h2>
            {websiteSettings?.message && <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{websiteSettings.message}</p>}
          </div>
        )}


        {/* Debug panel - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '20px', 
            backgroundColor: '#f0f0f0', 
            border: '1px solid #ccc', 
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <strong>Debug Info:</strong>
            <div>Name: {formData.name || '(empty)'}</div>
            <div>Phone: {formData.phoneNumber || '(empty)'}</div>
            <div>Address: {formData.address || '(empty)'}</div>
            <div>GroupId: {formData.groupId || '(empty)'}</div>
            <div>Selected Company ID: {formData.selectedCompanyId || '(empty)'}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Companies loaded: {companyNames.length}</div>
            <div>Groups loaded: {groups.length}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form" noValidate autoComplete="on" style={{ 
          pointerEvents: isClosed ? 'none' : 'auto', 
          opacity: isClosed ? 0.6 : 1,
          position: 'relative',
          zIndex: isClosed ? 0 : 1
        }}>
          <div className="form-section">
            <h3>{t('registration.basicInfo')}</h3>
            
            {websiteSettings?.codesActive !== true && (
              <div className="info-message" style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: '1.5'
              }}>
                ℹ️ {t('registration.info.codeDisabled')}
              </div>
            )}
            
            {websiteSettings?.codesActive === true && (
            <div className="form-group">
                <label htmlFor="companyId">{t('registration.id') || 'Company ID'} *</label>
                <input
                  type="text"
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleIdChange}
                  placeholder={t('registration.idPlaceholder') || 'Enter company ID to auto-fill'}
                  required
                  autoComplete="off"
                  className={fieldErrors.companyId || idError ? 'field-error' : idValid ? 'field-success' : ''}
                  style={{ 
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    padding: '0.75rem',
                    borderColor: fieldErrors.companyId || idError ? '#ef4444' : idValid ? '#10b981' : undefined,
                    borderWidth: fieldErrors.companyId || idError || idValid ? '2px' : '1px'
                  }}
                />
                {(fieldErrors.companyId || idError) && (
                  <div className="field-error-message" style={{ 
                    color: '#ef4444', 
                    fontSize: '0.875rem', 
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>⚠️</span>
                    <span>{fieldErrors.companyId || idError}</span>
                  </div>
                )}
                {idValid && !fieldErrors.companyId && !idError && (
                  <div className="field-success-message" style={{ 
                    color: '#10b981', 
                    fontSize: '0.875rem', 
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>✓</span>
                    <span>{t('registration.idVerified') || 'ID verified'}</span>
                  </div>
                )}
                {idError && (
                  <small className="form-error" style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>
                    {idError}
                  </small>
                )}
                {idValid && !idError && (
                  <small className="form-hint" style={{ color: '#10b981', display: 'block', marginTop: '0.5rem' }}>
                    {t('registration.idValid') || '✓ Valid ID'}
                  </small>
                )}
                {!idError && !idValid && (!formData.companyId || formData.companyId.length === 0) && (
                  <small className="form-hint">
                    {t('registration.idHint') || 'Enter your company ID to auto-fill company details'}
                  </small>
                )}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="selectedCompanyId">{t('registration.chooseCompany')} *</label>
              {loadingCompanies ? (
                <div className="loading-companies">{t('registration.loadingCompanies')}</div>
              ) : companyNames.length === 0 ? (
                <div className="no-companies">{t('registration.noCompanies')}</div>
              ) : (
                <select
                  id="selectedCompanyId"
                  name="selectedCompanyId"
                  value={formData.selectedCompanyId || ''}
                  onChange={handleCompanySelect}
                  required
                  autoComplete="organization"
                  className="company-select"
                  disabled={loadingCompanies}
                  style={{ pointerEvents: loadingCompanies ? 'none' : 'auto', opacity: loadingCompanies ? 0.6 : 1 }}
                >
                  <option value="">{t('registration.selectCompany')}</option>
                  {companyNames.map(company => (
                    <option key={company._id || company.id} value={company._id || company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
              {formData.name && (
                <small className="form-hint">
                  {t('registration.selectedCompany')}: {formData.name}
                </small>
              )}
            </div>

            {formData.contactName && (
            <div className="form-group">
                <label htmlFor="contactName">{t('registration.success.contactName')}</label>
              <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                onChange={handleInputChange}
                  placeholder={t('registration.success.contactNamePlaceholder')}
                  readOnly
                  autoComplete="name"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small className="form-hint">
                  {t('registration.success.autoFilled')}
                </small>
            </div>
            )}

            <div className="form-group">
              <label htmlFor="phoneNumber">{t('registration.phoneNumber')} *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                autoComplete="tel"
                placeholder={t('registration.phonePlaceholder')}
                className={fieldErrors.phoneNumber ? 'field-error' : formData.phoneNumber && !fieldErrors.phoneNumber ? 'field-success' : ''}
                style={{
                  borderColor: fieldErrors.phoneNumber ? '#ef4444' : formData.phoneNumber && !fieldErrors.phoneNumber ? '#10b981' : undefined,
                  borderWidth: fieldErrors.phoneNumber || (formData.phoneNumber && !fieldErrors.phoneNumber) ? '2px' : '1px'
                }}
              />
              {fieldErrors.phoneNumber && (
                <div className="field-error-message" style={{ 
                  color: '#ef4444', 
                  fontSize: '0.875rem', 
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>⚠️</span>
                  <span>{fieldErrors.phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address">{t('registration.address')} *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows="3"
                autoComplete="street-address"
                placeholder={t('registration.addressPlaceholder')}
                className={fieldErrors.address ? 'field-error' : formData.address && !fieldErrors.address ? 'field-success' : ''}
                style={{
                  borderColor: fieldErrors.address ? '#ef4444' : formData.address && !fieldErrors.address ? '#10b981' : undefined,
                  borderWidth: fieldErrors.address || (formData.address && !fieldErrors.address) ? '2px' : '1px'
                }}
              />
              {fieldErrors.address && (
                <div className="field-error-message" style={{ 
                  color: '#ef4444', 
                  fontSize: '0.875rem', 
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>⚠️</span>
                  <span>{fieldErrors.address}</span>
                </div>
              )}
            </div>

            <div className="form-group group-selection-container">
              <label htmlFor="groupId" id="groupId-label">{t('registration.group')} *</label>
              <input
                type="hidden"
                id="groupId"
                name="groupId"
                value={formData.groupId || ''}
                aria-labelledby="groupId-label"
              />
              <div role="group" aria-labelledby="groupId-label">
              {loadingGroups ? (
                <div className="loading-groups">{t('registration.loadingGroups')}</div>
              ) : groups.length === 0 ? (
                <div className="no-groups">{t('registration.noGroups')}</div>
              ) : formData.groupId ? (
                // If group is already selected (from pre-registration), show it as a card
                <div>
                  {(() => {
                    const selectedGroup = groups.find(g => g._id === formData.groupId);
                    if (!selectedGroup) return null;
                    
                    const registeredCount = selectedGroup.registeredCount || selectedGroup.companies?.length || 0;
                    const maxCompanies = selectedGroup.maxCompanies || 0;
                    const remaining = maxCompanies > 0 ? maxCompanies - registeredCount : '∞';
                    // Format date as DD/MM/YYYY using the helper function
                    console.log('🔵 Selected group date before formatDate:', selectedGroup.date, 'type:', typeof selectedGroup.date)
                    const dateStr = formatDate(selectedGroup.date) || ''
                    console.log('🔵 Selected group date after formatDate:', dateStr)
                    const translatedDay = selectedGroup.day ? translateDay(selectedGroup.day) : '';
                    const dayStr = translatedDay ? ` - ${translatedDay}` : '';
                    const dateDisplay = dateStr ? `${dateStr}${dayStr}` : '';
                    
                    return (
                      <div className="group-selection-card selected readonly-card">
                        <div className="group-card-header">
                          <h4 className="group-card-name">{selectedGroup.name}</h4>
                          <span className="selected-badge">✓ {t('registration.selected')}</span>
                        </div>
                        <div className="group-card-details">
                          {selectedGroup.timeRange && (
                            <div className="group-detail-item">
                              <span className="detail-icon">🕐</span>
                              <span className="detail-label">{t('registration.time')}:</span>
                              <span className="detail-value">{selectedGroup.timeRange}</span>
                            </div>
                          )}
                          {dateDisplay && (
                            <div className="group-detail-item">
                              <span className="detail-icon">📅</span>
                              <span className="detail-label">{t('registration.date')}:</span>
                              <span className="detail-value" data-test-date={dateDisplay}>{dateDisplay}</span>
                            </div>
                          )}
                          <div className="group-detail-item">
                            <span className="detail-icon">👥</span>
                            <span className="detail-label">{t('registration.availability')}:</span>
                            <span className="detail-value available-text">
                              {t('registration.remainingSlots', { count: remaining })}
                            </span>
                          </div>
                        </div>
                        <small className="form-hint">{t('registration.groupSelectedHint')}</small>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="groups-card-container">
                  {groups.map(group => {
                    const registeredCount = group.registeredCount || group.companies?.length || 0;
                    const maxCompanies = group.maxCompanies || 0;
                    const remaining = maxCompanies > 0 ? maxCompanies - registeredCount : '∞';
                    const isFull = maxCompanies > 0 && registeredCount >= maxCompanies;
                    
                    // Format date as DD/MM/YYYY using the helper function
                    console.log('🟢 Group date before formatDate:', group.date, 'type:', typeof group.date, 'group:', group.name)
                    const dateStr = formatDate(group.date) || ''
                    console.log('🟢 Group date after formatDate:', dateStr, 'for group:', group.name)
                    const translatedDay = group.day ? translateDay(group.day) : '';
                    const dayStr = translatedDay ? ` - ${translatedDay}` : '';
                    const dateDisplay = dateStr ? `${dateStr}${dayStr}` : '';
                    
                    return (
                      <div
                        key={group._id}
                        className={`group-selection-card ${formData.groupId === group._id ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                        onClick={() => !isFull && handleInputChange({ target: { name: 'groupId', value: group._id } })}
                        role="button"
                        tabIndex={isFull ? -1 : 0}
                        onKeyDown={(e) => {
                          if (!isFull && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleInputChange({ target: { name: 'groupId', value: group._id } });
                          }
                        }}
                      >
                        <div className="group-card-header">
                          <h4 className="group-card-name">{group.name}</h4>
                          {formData.groupId === group._id && (
                            <span className="selected-badge">✓ {t('registration.selected')}</span>
                          )}
                          {isFull && (
                            <span className="full-badge">{t('registration.groupFull')}</span>
                          )}
                        </div>
                        
                        <div className="group-card-details">
                          {group.timeRange && (
                            <div className="group-detail-item">
                              <span className="detail-icon">🕐</span>
                              <span className="detail-label">{t('registration.time')}:</span>
                              <span className="detail-value">{group.timeRange}</span>
                            </div>
                          )}
                          {dateDisplay && (
                            <div className="group-detail-item">
                              <span className="detail-icon">📅</span>
                              <span className="detail-label">{t('registration.date')}:</span>
                              <span className="detail-value">{dateDisplay}</span>
                            </div>
                          )}
                          <div className="group-detail-item">
                            <span className="detail-icon">👥</span>
                            <span className="detail-label">{t('registration.availability')}:</span>
                            <span className={`detail-value ${isFull ? 'full-text' : 'available-text'}`}>
                              {isFull ? t('registration.groupFull') : t('registration.remainingSlots', { count: remaining })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!formData.groupId && groups.length > 0 && (
                <small className="form-hint">{t('registration.selectGroupHint')}</small>
              )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>{t('registration.additionalInfo')}</h3>

            <div className="form-group">
              <label htmlFor="logo">{t('registration.logo')}</label>
              <input
                type="url"
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                autoComplete="url"
                placeholder={t('registration.logoPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">{t('registration.description')}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                autoComplete="off"
                placeholder={t('registration.descriptionPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="businessType">{t('registration.businessType')}</label>
              <input
                type="text"
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                autoComplete="organization"
                placeholder={t('registration.businessTypePlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">{t('registration.website')}</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                autoComplete="url"
                placeholder={t('registration.websitePlaceholder')}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>{t('registration.legalInfo')}</h3>

            <div className="form-group">
              <label htmlFor="registrationNumber">{t('registration.registrationNumber')}</label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                autoComplete="off"
                placeholder={t('registration.registrationNumberPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="taxId">{t('registration.taxId')}</label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                autoComplete="off"
                placeholder={t('registration.taxIdPlaceholder')}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitDisabled}
            >
              {t('nav.register') || 'Register'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">
              {t('registration.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterCompany
