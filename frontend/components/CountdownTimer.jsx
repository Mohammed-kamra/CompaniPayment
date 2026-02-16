import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './CountdownTimer.css'

const CountdownTimer = ({ openTime, closeTime, isOpen, onTimeExpired }) => {
  const { t } = useTranslation()
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [targetType, setTargetType] = useState(null) // 'open' or 'close'
  const [hasExpired, setHasExpired] = useState(false)

  useEffect(() => {
    if (!openTime) return

    // Reset expired flag when isOpen changes to ensure proper recalculation
    setHasExpired(false)

    const calculateTimeRemaining = () => {
      const now = new Date()
      
      let targetTime = null
      let type = null
      
      if (isOpen && closeTime) {
        // System is open: show time until close
        const [closeHours, closeMinutes] = closeTime.split(':').map(Number)
        const todayClose = new Date()
        todayClose.setHours(closeHours, closeMinutes, 0, 0)
        
        // If today's close time has passed, use tomorrow's
        let nextClose = todayClose
        if (now >= todayClose) {
          nextClose = new Date(todayClose)
          nextClose.setDate(nextClose.getDate() + 1)
        }
        
        targetTime = nextClose
        type = 'close'
      } else {
        // System is closed: show time until open
        const [openHours, openMinutes] = openTime.split(':').map(Number)
        const todayOpen = new Date()
        todayOpen.setHours(openHours, openMinutes, 0, 0)
        
        let nextOpen = todayOpen
        
        // Handle overnight schedules (e.g., close at 18:00, open at 6:00)
        if (closeTime) {
          const [closeHours, closeMinutes] = closeTime.split(':').map(Number)
          const todayClose = new Date()
          todayClose.setHours(closeHours, closeMinutes, 0, 0)
          
          const openTimeMinutes = openHours * 60 + openMinutes
          const closeTimeMinutes = closeHours * 60 + closeMinutes
          
          // Overnight schedule: close time is after open time (e.g., 18:00 close, 6:00 open)
          if (closeTimeMinutes > openTimeMinutes) {
            // If we're after close time today, next open is tomorrow
            if (now >= todayClose) {
              nextOpen = new Date(todayOpen)
              nextOpen.setDate(nextOpen.getDate() + 1)
            }
            // If we're before open time today, next open is today
            else if (now < todayOpen) {
              nextOpen = todayOpen
            }
            // If we're between open and close (system should be open, but we're here because it's closed)
            // This means we're in a closed period, so next open is tomorrow
            else {
              nextOpen = new Date(todayOpen)
              nextOpen.setDate(nextOpen.getDate() + 1)
            }
          } else {
            // Same-day schedule: close time is before open time (e.g., 6:00 open, 18:00 close)
            // If today's open time has passed, use tomorrow's
            if (now >= todayOpen) {
              nextOpen = new Date(todayOpen)
              nextOpen.setDate(nextOpen.getDate() + 1)
            } else {
              // Today's open time hasn't passed yet
              nextOpen = todayOpen
            }
          }
        } else {
          // No close time set, just check if today's open time has passed
          if (now >= todayOpen) {
            nextOpen = new Date(todayOpen)
            nextOpen.setDate(nextOpen.getDate() + 1)
          }
        }
        
        targetTime = nextOpen
        type = 'open'
      }
      
      let diff = targetTime - now
      
      // If time has expired, hide the timer
      if (diff <= 0) {
        // Trigger callback when time expires
        if (!hasExpired && onTimeExpired) {
          setHasExpired(true)
          onTimeExpired()
        }
        
        // When time expires, hide the timer (don't show next period)
        setTimeRemaining(null)
        setTargetType(null)
        return
      }
      
      // Trigger callback when time is very close (within 2 seconds) - before expiration
      if (diff <= 2000 && diff > 0 && !hasExpired && onTimeExpired) {
        setHasExpired(true)
        onTimeExpired()
      }
      
      // Reset expired flag if time is still remaining (more than 5 seconds away)
      if (hasExpired && diff > 5000) {
        setHasExpired(false)
      }
      
      const totalMinutes = Math.floor(diff / (1000 * 60))
      const hoursRemaining = Math.floor(diff / (1000 * 60 * 60))
      const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secondsRemaining = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeRemaining({
        hours: hoursRemaining,
        minutes: minutesRemaining,
        seconds: secondsRemaining,
        totalMinutes: totalMinutes,
        totalSeconds: Math.floor(diff / 1000)
      })
      setTargetType(type)
    }

    // Calculate immediately when dependencies change (especially isOpen)
    calculateTimeRemaining()
    
    // Then set up interval for continuous updates
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [openTime, closeTime, isOpen, onTimeExpired])

  if (!openTime) return null
  if (!timeRemaining || !targetType) return null

  const formatTime = (time) => {
    return String(time).padStart(2, '0')
  }

  const isCountingToClose = targetType === 'close'
  const displayTime = isCountingToClose ? closeTime : openTime
  const titleKey = isCountingToClose ? 'countdown.closesAt' : 'countdown.opensAt'
  const titleText = isCountingToClose 
    ? (t('countdown.closesAt') || 'Website Closes At')
    : (t('countdown.opensAt') || 'Website Opens At')
  const remainingLabel = isCountingToClose
    ? (t('countdown.minutesUntilClose') || 'Minutes Until Close')
    : (t('countdown.minutesUntilOpen') || 'Minutes Until Open')

  return (
    <div className="countdown-timer">
      <div className="countdown-header">
        <h3>{titleText}</h3>
        <div className="open-time-display">{displayTime}</div>
      </div>
      
      <div className="countdown-content">
        <div className="countdown-label">
          {remainingLabel}
        </div>
        <div className="countdown-display">
          <div className="countdown-unit">
            <span className="countdown-value">{formatTime(timeRemaining.hours)}</span>
            <span className="countdown-label-unit">{t('countdown.hours') || 'Hours'}</span>
          </div>
          <span className="countdown-separator">:</span>
          <div className="countdown-unit">
            <span className="countdown-value">{formatTime(timeRemaining.minutes)}</span>
            <span className="countdown-label-unit">{t('countdown.minutes') || 'Minutes'}</span>
          </div>
          <span className="countdown-separator">:</span>
          <div className="countdown-unit">
            <span className="countdown-value">{formatTime(timeRemaining.seconds)}</span>
            <span className="countdown-label-unit">{t('countdown.seconds') || 'Seconds'}</span>
          </div>
        </div>
        <div className="countdown-minutes-summary" style={{ 
          marginTop: '1rem', 
          fontSize: '1.1rem', 
          fontWeight: 'bold',
          color: 'var(--primary-color, #d4af37)'
        }}>
          {timeRemaining.totalMinutes} {t('countdown.minutes') || 'Minutes'}
        </div>
      </div>
      
      {closeTime && !isCountingToClose && (
        <div className="countdown-footer">
          {t('countdown.closesAt') || 'Closes At'}: {closeTime}
        </div>
      )}
      {isCountingToClose && openTime && (
        <div className="countdown-footer">
          {t('countdown.opensAt') || 'Opens At'}: {openTime}
        </div>
      )}
    </div>
  )
}

export default CountdownTimer
