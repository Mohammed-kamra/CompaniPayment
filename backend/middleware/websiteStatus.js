const { getDB } = require('../config/database');

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
    
    // Default: website is closed
    let isOpen = false;
    
    // If manually set to open, respect that (but check if we need to auto-close)
    if (settings && settings.isOpen === true) {
      isOpen = true;
    }
    
    // If autoSchedule is enabled, check if open/close times have been reached
    // Auto-open when open time arrives (only if system was manually closed)
    // Auto-close when close time expires
    // After auto-closing, do NOT auto-open again (stay closed until manually opened)
    if (settings && settings.autoSchedule && settings.openTime && settings.closeTime) {
      const now = new Date();
      
      // Parse times
      const [openHour, openMin] = settings.openTime.split(':').map(Number);
      const [closeHour, closeMin] = settings.closeTime.split(':').map(Number);
      const openTimeSeconds = openHour * 3600 + openMin * 60;
      const closeTimeSeconds = closeHour * 3600 + closeMin * 60;
      const currentTimeSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      let shouldBeOpen = false;
      let shouldBeClosed = false;
      
      if (openTimeSeconds <= closeTimeSeconds) {
        // Same day schedule (e.g., 6:00 to 18:00)
        // Open if current time >= open time AND current time < close time
        shouldBeOpen = currentTimeSeconds >= openTimeSeconds && currentTimeSeconds < closeTimeSeconds;
        // Close if current time >= close time
        shouldBeClosed = currentTimeSeconds >= closeTimeSeconds;
      } else {
        // Overnight schedule (e.g., 18:00 to 6:00 next day)
        // Open if current time >= open time OR current time < close time
        shouldBeOpen = currentTimeSeconds >= openTimeSeconds || currentTimeSeconds < closeTimeSeconds;
        // Close if current time >= close time AND current time < open time
        shouldBeClosed = currentTimeSeconds >= closeTimeSeconds && currentTimeSeconds < openTimeSeconds;
      }
      
      // Check if system was manually closed (not auto-closed)
      // autoClosed defaults to false if it doesn't exist (for backward compatibility)
      const autoClosed = settings.autoClosed === true;
      const isCurrentlyClosed = settings.isOpen === false;
      const wasManuallyClosed = isCurrentlyClosed && !autoClosed;
      
      // Priority 1: Auto-close if close time has been reached and system is still marked as open
      if (shouldBeClosed && settings.isOpen === true) {
        // Update database to close the system and mark as auto-closed
        await db.collection('settings').updateOne(
          { type: 'website' },
          { $set: { isOpen: false, autoClosed: true, updatedAt: new Date() } }
        );
        isOpen = false;
      }
      // Priority 2: Auto-open if open time has been reached and system was manually closed (not auto-closed)
      else if (shouldBeOpen && wasManuallyClosed) {
        // Update database to open the system
        await db.collection('settings').updateOne(
          { type: 'website' },
          { $set: { isOpen: true, autoClosed: false, updatedAt: new Date() } }
        );
        isOpen = true;
      }
      // Priority 3: Respect current state if within valid time range
      else if (shouldBeOpen && settings.isOpen === true) {
        isOpen = true;
      } else {
        // System should be closed
        isOpen = false;
      }
    } else {
      // No autoSchedule - only respect manual setting
      isOpen = settings && settings.isOpen === true;
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
