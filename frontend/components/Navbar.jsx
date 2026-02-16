import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import './Navbar.css'

const Navbar = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


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
    { path: '/companies-list', label: t('nav.registeredCompanies') || t('nav.list'), icon: '📋' },
    { path: '/pre-register', label: t('nav.register'), icon: '📝' },
    { path: '/register', label: t('nav.registerCompany') || 'Register Company', icon: '🏢' }
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
    { path: '/admin/settings', label: t('nav.settings') || 'Settings', icon: '⚙️', category: 'system' }
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
          {/* Public Links */}
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
          
          {isAuthenticated ? (
            <div className="action-group user-group">
              {/* User Profile Section - Hidden for Admin */}
              {user?.role !== 'admin' && (
                <div className="user-profile-section">
                  <div className={`user-profile-link ${user?.role === 'accounting' ? 'accounting-profile' : ''}`}>
                    <div className="user-info">
                      <div className="user-name">{user?.name || user?.username || 'User'}</div>
                      <div className={`user-role ${user?.role === 'accounting' ? 'accounting-role' : ''}`}>
                        {user?.role === 'accounting' ? t('nav.accounting') : t('nav.user') || 'User'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className={`btn-logout ${user?.role === 'accounting' ? 'accounting-logout' : ''}`}
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
          ) : (
            <div className="action-group">
              <Link to="/login" className="btn-login" onClick={() => setMobileMenuOpen(false)}>
                <span className="login-icon">🔐</span>
                <span>{t('nav.login')}</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
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
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
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
            {/* Public Links */}
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

            {/* Accounting User Links */}
            {isAuthenticated && user?.role === 'accounting' && (
              <div className="mobile-menu-section">
                <h4 className="mobile-section-title">{t('nav.accounting') || 'Accounting'}</h4>
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

            {/* User Info - Mobile - Hidden for Admin */}
            {isAuthenticated && user?.role !== 'admin' && (
              <div className="mobile-menu-section mobile-user-section">
                <div className="mobile-user-info">
                  <div className={`mobile-user-avatar ${user?.role === 'accounting' ? 'accounting-avatar' : ''}`}>
                    {user?.role === 'accounting' ? '📊' : '👤'}
                  </div>
                  <div>
                    <div className="mobile-user-name">{user?.name || user?.username || 'User'}</div>
                    <div className={`mobile-user-role ${user?.role === 'accounting' ? 'accounting-role' : ''}`}>
                      {user?.role === 'accounting' ? t('nav.accounting') : t('nav.user') || 'User'}
                    </div>
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

            {!isAuthenticated && (
              <div className="mobile-menu-section">
                <Link 
                  to="/login" 
                  className="btn-login-mobile"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="login-icon">🔐</span>
                  <span>{t('nav.login')}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
