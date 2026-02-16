import React from 'react'
import { useTranslation } from 'react-i18next'
import './User.css'

const User = () => {
  const { t } = useTranslation()

  return (
    <div className="user-page">
      <div className="container">
        <div className="user-header">
          <h1 className="page-title">{t('user.title')}</h1>
        </div>

        <div className="user-content">
          <div className="user-card">
            <div className="user-avatar">
              <div className="avatar-circle">👤</div>
            </div>
            
            <div className="user-info">
              <h2 className="user-name">John Doe</h2>
              <p className="user-email">john.doe@example.com</p>
              <p className="user-role">Company Representative</p>
            </div>

            <div className="user-actions">
              <button className="btn btn-primary">{t('user.profile')}</button>
              <button className="btn btn-secondary">{t('user.settings')}</button>
              <button className="btn btn-secondary">{t('user.logout')}</button>
            </div>
          </div>

          <div className="user-stats">
            <div className="stat-card">
              <div className="stat-number">12</div>
              <div className="stat-label">Connections</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">5</div>
              <div className="stat-label">Active Jobs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">8</div>
              <div className="stat-label">Applications</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default User
