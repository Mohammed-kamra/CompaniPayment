import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { settingsAPI } from '../services/api'
import LanguageSwitcher from './LanguageSwitcher'
import './Navbar.css'

const MOBILE_BREAKPOINT = 968

const Navbar = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)
  const [guestNote, setGuestNote] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      settingsAPI.getWebsiteSettings()
        .then(data => setGuestNote(data.notePaymentRegistration || ''))
        .catch(() => setGuestNote(''))
    }
  }, [isAuthenticated])


  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const publicLinks = [
    { path: '/pre-register', label: t('nav.register'), icon: '📝' }
  ]

  const accountingLinks = [
    { path: '/companies-list', label: t('nav.registeredCompanies') || t('nav.list'), icon: '📋' }
  ]

  const adminPublicLinks = [
    { path: '/companies-list', label: t('nav.registeredCompanies') || t('nav.list'), icon: '🏢' }
  ]

  // Grouped Admin Links
  const companyManagementLinks = [
    { path: '/companies-list', label: t('nav.registeredCompanies') || t('nav.list'), icon: '📋', category: 'company' },
    { path: '/admin/unregistered-companies', label: t('nav.unregisteredCompanies') || 'Unregistered Companies', icon: '📝', category: 'company' },
    { path: '/admin/company-names', label: t('nav.manageCompanies'), icon: '🏢', category: 'company' }
  ]

  const systemManagementLinks = [
    { path: '/admin/dashboard', label: t('nav.dashboard') || 'Dashboard', icon: '📊', category: 'system' },
    { path: '/groups', label: t('nav.manageGroups'), icon: '👥', category: 'system' },
    { path: '/admin/users', label: t('nav.userManagement'), icon: '👤', category: 'system' },
    { path: '/admin/settings', label: t('nav.settings') || 'Settings', icon: '⚙️', category: 'system' },
    { path: '/admin/translations', label: t('nav.translations') || 'Translations', icon: '🌐', category: 'system' }
  ]

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false)
  const companyDropdownRef = useRef(null)
  const systemDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setCompanyDropdownOpen(false)
      }
      if (systemDropdownRef.current && !systemDropdownRef.current.contains(event.target)) {
        setSystemDropdownOpen(false)
      }
    }

    if (companyDropdownOpen || systemDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [companyDropdownOpen, systemDropdownOpen])

  const hasActiveCompanyLink = companyManagementLinks.some(link => isActive(link.path))
  const hasActiveSystemLink = systemManagementLinks.some(link => isActive(link.path))


  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            <span className="logo-icon">💼</span>
            <span className="logo-text">{t('nav.logo')}</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-menu">
          {/* Public Links - Hidden for accountants */}
          {user?.role !== 'accounting' && (
          <div className="nav-section">
            {publicLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            ))}
          </div>
          )}

          {/* Companies List - Admin Only */}
          {isAuthenticated && user?.role === 'admin' && (
            <div className="nav-section">
              {adminPublicLinks.map(link => (
                <Link 
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-label">{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Accounting User Links */}
          {isAuthenticated && user?.role === 'accounting' && (
            <div className="nav-section">
              {accountingLinks.map(link => (
                <Link 
                  key={link.path}
                  to={link.path}
                  className={`nav-link accounting-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-label">{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Company Management Dropdown */}
          {isAuthenticated && user?.role === 'admin' && (
            <div className="nav-section dropdown-section" ref={companyDropdownRef}>
              <button
                className={`nav-dropdown-toggle ${hasActiveCompanyLink ? 'active' : ''} ${companyDropdownOpen ? 'open' : ''}`}
                onClick={() => {
                  setCompanyDropdownOpen(!companyDropdownOpen)
                  setSystemDropdownOpen(false)
                }}
                aria-expanded={companyDropdownOpen}
              >
                <span className="nav-icon">🏢</span>
                <span className="nav-label">{t('nav.companyManagement') || 'Company Management'}</span>
                <span className={`dropdown-arrow ${companyDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {companyDropdownOpen && (
                <div className="nav-dropdown-menu">
                  <div className="dropdown-header">
                    <span className="dropdown-header-icon">🏢</span>
                    <span className="dropdown-header-text">{t('nav.companyManagement') || 'Company Management'}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  {companyManagementLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`dropdown-item ${isActive(link.path) ? 'active' : ''}`}
                      onClick={() => {
                        setCompanyDropdownOpen(false)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <span className="item-icon">{link.icon}</span>
                      <span className="item-label">{link.label}</span>
                      {isActive(link.path) && <span className="item-active-badge">●</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* System Management Dropdown */}
          {isAuthenticated && user?.role === 'admin' && (
            <div className="nav-section dropdown-section" ref={systemDropdownRef}>
              <button
                className={`nav-dropdown-toggle ${hasActiveSystemLink ? 'active' : ''} ${systemDropdownOpen ? 'open' : ''}`}
                onClick={() => {
                  setSystemDropdownOpen(!systemDropdownOpen)
                  setCompanyDropdownOpen(false)
                }}
                aria-expanded={systemDropdownOpen}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-label">{t('nav.systemManagement') || 'System Management'}</span>
                <span className={`dropdown-arrow ${systemDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {systemDropdownOpen && (
                <div className="nav-dropdown-menu">
                  <div className="dropdown-header">
                    <span className="dropdown-header-icon">⚙️</span>
                    <span className="dropdown-header-text">{t('nav.systemManagement') || 'System Management'}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  {systemManagementLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`dropdown-item ${isActive(link.path) ? 'active' : ''}`}
                      onClick={() => {
                        setSystemDropdownOpen(false)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <span className="item-icon">{link.icon}</span>
                      <span className="item-label">{link.label}</span>
                      {isActive(link.path) && <span className="item-active-badge">●</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          <div className="action-group">
            <LanguageSwitcher />
          </div>
          
          {!isAuthenticated && (
            <div className="action-group">
              <Link to="/login" className="btn-login" onClick={() => setMobileMenuOpen(false)}>
                <span className="login-icon">🔐</span>
                <span className="login-text">{t('nav.login')}</span>
              </Link>
            </div>
          )}
          
          {isAuthenticated ? (
            <div className="action-group user-group">
              {/* Accounting: Logout only (no user profile, no register/pre-register links) */}
              {user?.role === 'accounting' && (
                <button 
                  onClick={handleLogout} 
                  className="btn-logout accounting-logout"
                  title={t('nav.logout')}
                >
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">{t('nav.logout')}</span>
                </button>
              )}
              {/* User Profile Section - for regular users (not admin, not accounting) */}
              {user?.role !== 'admin' && user?.role !== 'accounting' && (
                <div className="user-profile-section">
                  <div className="user-profile-link">
                    <div className="user-info">
                      <div className="user-name">{user?.name || user?.username || 'User'}</div>
                      <div className="user-role">{t('nav.user') || 'User'}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="btn-logout"
                    title={t('nav.logout')}
                  >
                    <span className="logout-icon">🚪</span>
                    <span className="logout-text">{t('nav.logout')}</span>
                  </button>
                </div>
              )}
              {/* Logout Button Only for Admin */}
              {user?.role === 'admin' && (
                <button 
                  onClick={handleLogout} 
                  className="btn-logout admin-logout"
                  title={t('nav.logout')}
                >
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">{t('nav.logout')}</span>
                </button>
              )}
            </div>
          ) : null}

          {/* Mobile: Notes button for guests (when note exists), Hamburger for logged-in users */}
          {isMobile && !isAuthenticated && guestNote.trim() ? (
            <button
              className="mobile-notes-toggle"
              onClick={() => setNotesPanelOpen(true)}
              aria-label={t('nav.notes') || 'Notes'}
            >
              <span className="notes-icon">📋</span>
              {/* <span className="notes-label">{t('nav.notes') || 'Notes'}</span> */}
            </button>
          ) : isAuthenticated ? (
            <button 
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
                setCompanyDropdownOpen(false)
                setSystemDropdownOpen(false)
              }}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Notes Panel - Mobile, Guest users only (ported to body for proper centering) */}
      {notesPanelOpen && !isAuthenticated && typeof document !== 'undefined' && createPortal(
        <div className="mobile-notes-overlay" onClick={() => setNotesPanelOpen(false)}>
          <div className="mobile-notes-panel" onClick={e => e.stopPropagation()}>
            <div className="mobile-notes-header">
              <h3 className="mobile-notes-title">{t('nav.notes') || 'Notes'}</h3>
              <button
                className="mobile-notes-close"
                onClick={() => setNotesPanelOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mobile-notes-content">
              {guestNote ? (
                <div className="mobile-notes-text" style={{ whiteSpace: 'pre-wrap' }}>{guestNote}</div>
              ) : (
                <p className="mobile-notes-empty">{t('nav.noNotes') || 'No notes available.'}</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="mobile-menu">
          <div className="mobile-menu-header">
            <h3 className="mobile-menu-title">{t('nav.menu') || 'Menu'}</h3>
            <button 
              className="mobile-menu-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          
          <div className="mobile-menu-content">
            {/* Public Links - Hidden for accountants */}
            {user?.role !== 'accounting' && (
            <div className="mobile-menu-section">
              <h4 className="mobile-section-title">{t('nav.public') || 'Public'}</h4>
              {publicLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-item-icon">{link.icon}</span>
                  <span>{link.label}</span>
                  {isActive(link.path) && <span className="active-indicator">●</span>}
                </Link>
              ))}
            </div>
            )}

            {/* Companies List - Admin Only */}
            {isAuthenticated && user?.role === 'admin' && (
              <div className="mobile-menu-section">
                <h4 className="mobile-section-title">{t('nav.admin') || 'Admin'}</h4>
                {adminPublicLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mobile-item-icon">{link.icon}</span>
                    <span>{link.label}</span>
                    {isActive(link.path) && <span className="active-indicator">●</span>}
                  </Link>
                ))}
              </div>
            )}

            {/* Accounting User Links - Companies list only */}
            {isAuthenticated && user?.role === 'accounting' && (
              <div className="mobile-menu-section">
                <h4 className="mobile-section-title">{t('nav.registeredCompanies') || t('nav.list') || 'Companies'}</h4>
                {accountingLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mobile-item-icon">{link.icon}</span>
                    <span>{link.label}</span>
                    {isActive(link.path) && <span className="active-indicator">●</span>}
                  </Link>
                ))}
              </div>
            )}

            {/* Company Management Links */}
            {isAuthenticated && user?.role === 'admin' && (
              <div className="mobile-menu-section">
                <h4 className="mobile-section-title">{t('nav.companyManagement') || 'Company Management'}</h4>
                {companyManagementLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mobile-item-icon">{link.icon}</span>
                    <span>{link.label}</span>
                    {isActive(link.path) && <span className="active-indicator">●</span>}
                  </Link>
                ))}
              </div>
            )}

            {/* System Management Links */}
            {isAuthenticated && user?.role === 'admin' && (
              <div className="mobile-menu-section">
                <h4 className="mobile-section-title">{t('nav.systemManagement') || 'System Management'}</h4>
                {systemManagementLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mobile-item-icon">{link.icon}</span>
                    <span>{link.label}</span>
                    {isActive(link.path) && <span className="active-indicator">●</span>}
                  </Link>
                ))}
              </div>
            )}

            {/* User Info - Mobile - Hidden for Admin and Accounting */}
            {isAuthenticated && user?.role !== 'admin' && user?.role !== 'accounting' && (
              <div className="mobile-menu-section mobile-user-section">
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">👤</div>
                  <div>
                    <div className="mobile-user-name">{user?.name || user?.username || 'User'}</div>
                    <div className="mobile-user-role">{t('nav.user') || 'User'}</div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="mobile-menu-item mobile-logout"
                >
                  <span className="mobile-item-icon">🚪</span>
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
            {/* Logout only for Accounting - Mobile */}
            {isAuthenticated && user?.role === 'accounting' && (
              <div className="mobile-menu-section">
                <button 
                  onClick={handleLogout} 
                  className="mobile-menu-item mobile-logout"
                >
                  <span className="mobile-item-icon">🚪</span>
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
            {/* Logout Button Only for Admin - Mobile */}
            {isAuthenticated && user?.role === 'admin' && (
              <div className="mobile-menu-section">
                <button 
                  onClick={handleLogout} 
                  className="mobile-menu-item mobile-logout"
                >
                  <span className="mobile-item-icon">🚪</span>
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
