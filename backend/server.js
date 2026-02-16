const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { checkWebsiteStatus } = require('./middleware/websiteStatus');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Vite default port is 5173, but also support 3000
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-user-role', 
    'x-user-email',
    'x-user-username',
    'X-User-Role',  // Support both lowercase and capitalized versions
    'X-User-Email',
    'X-User-Username'
  ]
}));
app.use(express.json());

// Check website status (except for settings, auth, and health check)
app.use('/api', (req, res, next) => {
  // Skip website status check for auth, settings, and health endpoints
  if (req.path.startsWith('/auth') || req.path.startsWith('/settings') || req.path === '/health') {
    return next();
  }
  checkWebsiteStatus(req, res, next);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/company-names', require('./routes/companyNames'));
app.use('/api/pre-register', require('./routes/preRegister'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/groups', require('./routes/groups'));

// Root route - welcome message
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the API Server',
    status: 'Server is running',
    apiBaseUrl: '/api',
    documentation: 'Visit /api to see available endpoints',
    healthCheck: '/api/health'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API root - list available endpoints
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is running',
    availableEndpoints: [
      'GET /api/health - Health check',
      'GET /api/settings/website - Get website settings',
      'PUT /api/settings/website - Update website settings',
      'GET /api/users - Get all users (admin)',
      'GET /api/company-names - Get all company names (admin)',
      'GET /api/company-names/public - Get public company names',
      'POST /api/pre-register - Submit pre-registration',
      'GET /api/companies - Get companies',
      'GET /api/groups/public - Get public groups',
      'GET /api/groups - Get all groups (admin)'
    ]
  });
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    message: `The API endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/health',
      '/api/settings',
      '/api/users',
      '/api/company-names',
      '/api/pre-register',
      '/api/companies',
      '/api/groups'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
