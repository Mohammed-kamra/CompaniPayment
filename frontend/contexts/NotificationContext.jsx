import React, { createContext, useState, useContext, useCallback } from 'react'
import NotificationCard from '../components/NotificationCard'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev, { id, type, message }])
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(n => n.filter(item => item.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notify = useCallback((type, message, duration) => {
    return addNotification({ type, message, duration })
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, notify }}>
      {children}
      <NotificationCard
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  )
}
