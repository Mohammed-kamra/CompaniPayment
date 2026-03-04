const { getDB } = require('../config/database');

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

// Middleware to check if website is open
const checkWebsiteStatus = async (req, res, next) => {
  try {
    // Skip check for settings (to allow checking status), admin routes, auth, health check
    // Settings and auth routes need to work even when website is closed
    if (req.path === '/api/settings/website' || 
        req.path.startsWith('/api/auth') ||
        req.path.startsWith('/api/login') ||
        req.path.startsWith('/api/health')) {
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
    
    let isOpen = settings && settings.isOpen === true;
    if (settings && settings.autoSchedule && settings.openTime && settings.closeTime) {
      // Automatic mode should depend ONLY on current time window.
      isOpen = isWithinScheduleWindow(settings.openTime, settings.closeTime, new Date());
    }
    
    // Block registration routes when website is closed
    // All other routes (companies, groups, company-names) remain accessible
    if (!isOpen && (req.path.startsWith('/api/pre-register') || req.path.startsWith('/api/register'))) {
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
