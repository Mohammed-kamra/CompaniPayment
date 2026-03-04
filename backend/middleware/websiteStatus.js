const { getDB } = require('../config/database');
const WEBSITE_TIMEZONE = process.env.WEBSITE_TIMEZONE || 'Asia/Baghdad';

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'off' || v === '') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
};

const parseTimeToSeconds = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2) return null;
  const [hour, minute] = parts;
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 3600 + minute * 60;
};

const isWithinScheduleWindow = (openTime, closeTime, now = new Date()) => {
  const openSeconds = parseTimeToSeconds(openTime);
  const closeSeconds = parseTimeToSeconds(closeTime);
  if (openSeconds === null || closeSeconds === null) return false;

  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (openSeconds <= closeSeconds) {
    return currentSeconds >= openSeconds && currentSeconds < closeSeconds;
  }

  return currentSeconds >= openSeconds || currentSeconds < closeSeconds;
};

const getCurrentTimeInTimezone = (timeZone) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const mm = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const ss = Number(parts.find((p) => p.type === 'second')?.value || 0);
  return { hh, mm, ss };
};

const isWithinScheduleWindowByTimezone = (openTime, closeTime, timeZone) => {
  const openSeconds = parseTimeToSeconds(openTime);
  const closeSeconds = parseTimeToSeconds(closeTime);
  if (openSeconds === null || closeSeconds === null) return false;

  const { hh, mm, ss } = getCurrentTimeInTimezone(timeZone);
  const currentSeconds = hh * 3600 + mm * 60 + ss;

  if (openSeconds <= closeSeconds) {
    return currentSeconds >= openSeconds && currentSeconds < closeSeconds;
  }

  return currentSeconds >= openSeconds || currentSeconds < closeSeconds;
};

// Middleware to check if website is open
const checkWebsiteStatus = async (req, res, next) => {
  try {
    // Skip check for settings (to allow checking status), admin routes, auth, health check
    // Settings and auth routes need to work even when website is closed
    if (req.path === '/settings/website' || 
        req.path.startsWith('/auth') ||
        req.path.startsWith('/login') ||
        req.path.startsWith('/health')) {
      return next();
    }
    
    // Allow admin and accounting users to access all routes even when website is closed
    const userRole = req.headers['x-user-role'];
    if (userRole === 'admin' || userRole === 'accounting') {
      return next();
    }

    // Check website status
    const db = getDB();
    const settings = await db.collection('settings').findOne({ type: 'website' });
    
    const isOpenManual = toBoolean(settings?.isOpen, false);
    const autoScheduleEnabled = toBoolean(settings?.autoSchedule, false);
    let isOpen = isOpenManual;
    if (settings && autoScheduleEnabled && settings.openTime && settings.closeTime) {
      // Automatic mode should depend ONLY on current time window.
      isOpen = isWithinScheduleWindowByTimezone(settings.openTime, settings.closeTime, WEBSITE_TIMEZONE);
    }
    
    // Block registration routes when website is closed
    // All other routes (companies, groups, company-names) remain accessible
    if (!isOpen && (req.path.startsWith('/pre-register') || req.path.startsWith('/register'))) {
      return res.status(503).json({
        error: 'Registration is currently closed',
        message: settings?.message || 'Registration is temporarily unavailable. Please try again later.'
      });
    }
    
    // All other routes are accessible even when website is closed
    next();
  } catch (error) {
    // If error checking status, allow access (fail open)
    next();
  }
};

module.exports = { checkWebsiteStatus };
