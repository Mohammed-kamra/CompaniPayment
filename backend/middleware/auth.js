// Authentication and Authorization Middleware

// Check if user is authenticated (any logged in user)
const requireAuth = (req, res, next) => {
  // Get user info from request headers (Express lowercases headers)
  const userEmail = req.headers['x-user-email'];
  const username = req.headers['x-user-username'];
  const userRole = req.headers['x-user-role'];

  if (!userEmail && !username) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  // Attach user info to request
  req.user = {
    email: userEmail || '',
    username: username || userEmail || '',
    role: userRole || 'user'
  };

  next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  // First check authentication (Express lowercases headers)
  const userEmail = req.headers['x-user-email'];
  const username = req.headers['x-user-username'];
  const userRole = req.headers['x-user-role'];

  if (!userEmail && !username) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  // Check if user is admin (accept either email or username)
  const userIdentifier = username || userEmail;
  if ((userIdentifier !== 'admin' && userIdentifier !== 'admin@example.com') || userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  // Attach admin info to request
  req.user = {
    email: userEmail || '',
    username: username || userIdentifier || '',
    role: userRole
  };

  next();
};

module.exports = {
  requireAuth,
  requireAdmin
};
