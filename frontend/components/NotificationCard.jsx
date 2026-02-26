import React from 'react'
import { useTranslation } from 'react-i18next'
import './NotificationCard.css'

const typeConfig = {
  added: { icon: '➕', labelKey: 'notification.added', className: 'notification-added' },
  updated: { icon: '✏️', labelKey: 'notification.updated', className: 'notification-updated' },
  deleted: { icon: '🗑️', labelKey: 'notification.deleted', className: 'notification-deleted' },
  error: { icon: '❌', labelKey: 'notification.error', className: 'notification-error' },
  info: { icon: 'ℹ️', labelKey: 'notification.info', className: 'notification-info' }
}

const NotificationCard = ({ notifications, onRemove }) => {
  const { t } = useTranslation()

  if (!notifications || notifications.length === 0) return null

  return (
    <div className="notification-container" aria-live="polite">
      {notifications.map(({ id, type, message }) => {
        const config = typeConfig[type] || typeConfig.info
        return (
          <div
            key={id}
            className={`notification-card ${config.className}`}
            role="alert"
          >
            <span className="notification-icon" aria-hidden="true">{config.icon}</span>
            <div className="notification-content">
              <span className="notification-label">
                {t(config.labelKey) || type}
              </span>
              <span className="notification-message">{message}</span>
            </div>
            <button
              type="button"
              className="notification-close"
              onClick={() => onRemove(id)}
              aria-label={t('common.close') || 'Close'}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default NotificationCard
