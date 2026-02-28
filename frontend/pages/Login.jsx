import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import './Login.css'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // If already logged in, redirect based on role
  if (isAuthenticated) {
    const redirectTo = user?.role === 'admin' ? '/admin/dashboard' : '/companies-list'
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic username validation
    if (!username || username.trim() === '') {
      setError(t('login.usernameInvalid'))
      return
    }

    try {
      const result = await login(username, password)
      
      if (result.success) {
        const redirectTo = result.user?.role === 'admin' ? '/admin/dashboard' : '/companies-list'
        navigate(redirectTo)
      } else {
        setError(result.error || t('login.error'))
      }
    } catch (err) {
      setError(err.message || t('login.error'))
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{t('login.title')}</h2>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">{t('login.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder={t('login.usernamePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
