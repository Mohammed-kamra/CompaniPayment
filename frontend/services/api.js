const API_BASE_URL = 'https://companipayment-production-87d9.up.railway.app';

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }
};

// Groups API
export const groupsAPI = {
  // Public: Get all active groups (for registration)
  getAllPublic: async () => {
    const response = await fetch(`${API_BASE_URL}/groups/public`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch groups' }));
      throw new Error(error.error || 'Failed to fetch groups');
    }
    return response.json();
  },

  // Public: Get all groups including closed ones (for display purposes)
  getAllForDisplay: async () => {
    const response = await fetch(`${API_BASE_URL}/groups/public/all`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch groups' }));
      throw new Error(error.error || 'Failed to fetch groups');
    }
    return response.json();
  },

  getAll: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/groups`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch groups' }));
      throw new Error(error.error || 'Failed to fetch groups');
    }
    return response.json();
  },

  getById: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch group' }));
      throw new Error(error.error || 'Failed to fetch group');
    }
    return response.json();
  },

  create: async (groupData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify(groupData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create group' }));
      throw new Error(error.error || 'Failed to create group');
    }
    return response.json();
  },

  update: async (id, groupData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(groupData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update group' }));
      throw new Error(error.error || 'Failed to update group');
    }
    return response.json();
  },

  delete: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete group' }));
      throw new Error(error.error || 'Failed to delete group');
    }
    return response.json();
  },
};

// Company Names API
export const companyNamesAPI = {
  getAll: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/company-names`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch company names' }));
      throw new Error(error.error || 'Failed to fetch company names');
    }
    return response.json();
  },

  create: async (companyNameData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/company-names`, {
      method: 'POST',
      headers,
      body: JSON.stringify(companyNameData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create company name' }));
      throw new Error(error.error || 'Failed to create company name');
    }
    return response.json();
  },

  update: async (id, companyNameData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/company-names/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(companyNameData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update company name' }));
      throw new Error(error.error || 'Failed to update company name');
    }
    return response.json();
  },

  delete: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/company-names/${id}`, {
      method: 'DELETE',
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete company name' }));
      throw new Error(error.error || 'Failed to delete company name');
    }
    return response.json();
  },

  deleteAll: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/company-names/all`, {
      method: 'DELETE',
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete all company names' }));
      throw new Error(error.error || 'Failed to delete all company names');
    }
    return response.json();
  },

  import: async (companies) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/company-names/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ companies }),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to import company names' }));
      throw new Error(error.error || 'Failed to import company names');
    }
    return response.json();
  },

  // Get all company names with codes (public) - for registration form
  getCompanyNamesForRegistration: async () => {
    const response = await fetch(`${API_BASE_URL}/company-names/public`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch company names' }));
      throw new Error(error.error || 'Failed to fetch company names');
    }
    return response.json();
  },

  // Get company name by code (public) - for auto-fill in registration
  getByCode: async (code) => {
    const response = await fetch(`${API_BASE_URL}/company-names/code/${encodeURIComponent(code)}`);
    
    if (response.status === 404) {
      return null; // Company not found
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch company by code' }));
      throw new Error(error.error || 'Failed to fetch company by code');
    }
    return response.json();
  },

  // Get unregistered companies - Admin only
  getUnregistered: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/company-names/unregistered`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch unregistered companies' }));
      throw new Error(error.error || 'Failed to fetch unregistered companies');
    }
    return response.json();
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
      throw new Error(error.error || 'Failed to fetch users');
    }
    return response.json();
  },

  getById: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch user' }));
      throw new Error(error.error || 'Failed to fetch user');
    }
    return response.json();
  },

  create: async (userData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create user' }));
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  update: async (id, userData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update user' }));
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  delete: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete user' }));
      throw new Error(error.error || 'Failed to delete user');
    }
    return response.json();
  }
};

// Settings API
export const settingsAPI = {
  getWebsiteSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/settings/website`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch settings' }));
      throw new Error(error.error || 'Failed to fetch settings');
    }
    return response.json();
  },

  updateWebsiteSettings: async (settings) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    console.log('Updating website settings:', settings);
    
    const response = await fetch(`${API_BASE_URL}/settings/website`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(settings),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      let errorMessage = 'Failed to update settings';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        console.error('Settings update error:', error);
      } catch (e) {
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
        } catch (textError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }
    return response.json();
  },

  importCompanies: async (companies) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/settings/import-companies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ companies }),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to import companies' }));
      throw new Error(error.error || 'Failed to import companies');
    }
    return response.json();
  }
};

// Pre-Registration API
export const preRegisterAPI = {
  submit: async (preRegistrationData) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    console.log('Submitting pre-registration to:', `${API_BASE_URL}/pre-register`)
    console.log('Data being sent:', preRegistrationData)
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Pre-register API call timeout - aborting request');
      controller.abort();
    }, 45000); // 45 second timeout (increased for slow connections and database operations)
    
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/pre-register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(preRegistrationData),
        signal: controller.signal
    });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond. Please check your connection and try again.');
      }
      // Enhanced error handling for network failures
      if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
        console.error('❌ Network error - Backend server may not be running');
        console.error('💡 Check if backend is running on http://localhost:5000');
        console.error('💡 Test with: curl http://localhost:5000/api/health');
        throw new Error('Failed to connect to server. Please ensure the backend server is running on http://localhost:5000');
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      let errorMessage = 'Failed to submit pre-registration';
      let errorDetails = null;
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        errorDetails = error;
        console.error('❌ Pre-register backend error response (status ' + response.status + '):', error)
        console.error('❌ Full error object:', JSON.stringify(error, null, 2))
        console.error('❌ Error keys:', Object.keys(error))
        console.error('❌ Error.error:', error.error)
        console.error('❌ Error.message:', error.message)
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
          console.error('❌ Pre-register backend error text (status ' + response.status + '):', text)
        } catch (textError) {
          console.error('❌ Could not parse pre-register error response:', textError)
          errorMessage = `Server returned ${response.status} ${response.statusText}`;
        }
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = errorDetails;
      // Also attach the error property directly for easier access
      if (errorDetails && errorDetails.error) {
        error.error = errorDetails.error;
      }
      throw error;
    }
    return response.json();
  },

  verify: async (mobileNumber, code) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(`${API_BASE_URL}/pre-register/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mobileNumber, code }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to verify pre-registration' }));
      throw new Error(error.error || 'Failed to verify pre-registration');
    }
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/pre-register/${id}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch pre-registration' }));
      throw new Error(error.error || 'Failed to fetch pre-registration');
    }
    return response.json();
  },

  // Get all pre-registered company names for selection
  getCompanyNames: async () => {
    const response = await fetch(`${API_BASE_URL}/pre-register/public/companies`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch company names' }));
      throw new Error(error.error || 'Failed to fetch company names');
    }
    return response.json();
  },

  // Get pre-registration by code - Public (for auto-fill)
  getByCode: async (code) => {
    const response = await fetch(`${API_BASE_URL}/pre-register/by-code/${encodeURIComponent(code)}`);
    
    if (response.status === 404) {
      return null; // Company not found
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch company by code' }));
      throw new Error(error.error || 'Failed to fetch company by code');
    }
    return response.json();
  }
};

// Helper function to get current user info
const getAuthHeaders = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return {};
  
  try {
    const user = JSON.parse(userStr);
    return {
      'X-User-Email': user.email || '',
      'X-User-Username': user.username || user.name || '',
      'X-User-Role': user.role || 'user'
    };
  } catch (e) {
    return {};
  }
};

// Companies API
export const companiesAPI = {
  // Public: Get all approved companies (or all companies for accounting/admin users)
  getAll: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies`, {
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch companies' }));
      throw new Error(error.error || 'Failed to fetch companies');
    }
    return response.json();
  },

  // Public: Get public queue (only name, userName, paid status)
  getPublicQueue: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/public-queue`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch public queue' }));
      throw new Error(error.error || 'Failed to fetch public queue');
    }
    return response.json();
  },

  // Admin: Get all companies (including pending/rejected)
  getAllAdmin: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/admin`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch companies' }));
      throw new Error(error.error || 'Failed to fetch companies');
    }
    return response.json();
  },

  // Public: Register new company
  register: async (companyData) => {
    console.log('📤 API.register called with data:', companyData)
    console.log('📤 API endpoint:', `${API_BASE_URL}/companies`)
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    try {
      console.log('📡 Starting fetch request...')
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers,
      body: JSON.stringify(companyData),
    });
      
      console.log('📥 Received response:', response.status, response.statusText)
    
    if (!response.ok) {
      let errorMessage = 'Failed to register company';
        let errorDetails = null;
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
          errorDetails = error;
          console.error('❌ Backend error response (status ' + response.status + '):', error)
          console.error('❌ Full error object:', JSON.stringify(error, null, 2))
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
            console.error('❌ Backend error text (status ' + response.status + '):', text)
        } catch (textError) {
            console.error('❌ Could not parse error response:', textError)
            errorMessage = `Server returned ${response.status} ${response.statusText}`;
          // Keep default error message
        }
      }
      const error = new Error(errorMessage);
      error.status = response.status;
        error.details = errorDetails;
      throw error;
    }
      
      const result = await response.json()
      console.log('✅ API.register success:', result)
      return result
    } catch (err) {
      console.error('❌ API.register error:', err)
      // Re-throw to let the caller handle it
      throw err
    }
  },

  // Admin: Approve company
  approve: async (id) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${id}/approve`, {
      method: 'POST',
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to approve company' }));
      throw new Error(error.error || 'Failed to approve company');
    }
    return response.json();
  },

  // Admin: Reject company
  reject: async (id, reason) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${id}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason })
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to reject company' }));
      throw new Error(error.error || 'Failed to reject company');
    }
    return response.json();
  },

  getById: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch company' }));
      throw new Error(error.error || 'Failed to fetch company');
    }
    return response.json();
  },

  // Admin: Create company directly (bypass registration)
  create: async (companyData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers,
      body: JSON.stringify(companyData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create company' }));
      throw new Error(error.error || 'Failed to create company');
    }
    return response.json();
  },

  update: async (id, companyData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(companyData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update company' }));
      throw new Error(error.error || 'Failed to update company');
    }
    return response.json();
  },

  // Update spent/paid status - Public
  updateStatus: async (id, updateData) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only include fields that are being updated (not undefined)
    const body = {};
    if (updateData.spent !== undefined) {
      body.spent = updateData.spent;
    }
    if (updateData.paid !== undefined) {
      body.paid = updateData.paid;
    }
    
    // Validate that at least one field is being updated
    if (Object.keys(body).length === 0) {
      throw new Error('No fields to update. At least one field (spent or paid) must be provided.');
    }
    
    console.log('Updating company status:', {
      url: `${API_BASE_URL}/companies/${id}/status`,
      method: 'PATCH',
      body
    });
    
    try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}/status`, {
      method: 'PATCH',
      headers,
        body: JSON.stringify(body),
    });
    
    if (!response.ok) {
        let errorMessage = 'Failed to update status';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
          console.error('Status update error response:', error);
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            errorMessage = `Server returned ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Status update successful:', result);
      return result;
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error('Network error - Backend server may not be running:', {
          url: `${API_BASE_URL}/companies/${id}/status`,
          error: error.message
        });
        throw new Error('Network error: Could not connect to server. Please ensure the backend server is running on http://localhost:5000');
      }
      // Re-throw other errors
      throw error;
    }
  },

  delete: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete company' }));
      throw new Error(error.error || 'Failed to delete company');
    }
    return response.json();
  },
};

// Markets API
export const marketsAPI = {
  getAll: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch markets' }));
      throw new Error(error.error || 'Failed to fetch markets');
    }
    return response.json();
  },

  getById: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets/${id}`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch market' }));
      throw new Error(error.error || 'Failed to fetch market');
    }
    return response.json();
  },

  create: async (marketData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(marketData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create market' }));
      throw new Error(error.error || 'Failed to create market');
    }
    return response.json();
  },

  update: async (id, marketData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(marketData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update market' }));
      throw new Error(error.error || 'Failed to update market');
    }
    return response.json();
  },

  delete: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete market' }));
      throw new Error(error.error || 'Failed to delete market');
    }
    return response.json();
  },
};

// Company Users API
export const companyUsersAPI = {
  getAll: async (companyId) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/users`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
      throw new Error(error.error || 'Failed to fetch users');
    }
    return response.json();
  },

  create: async (companyId, userData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create user' }));
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  update: async (companyId, userId, userData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update user' }));
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  delete: async (companyId, userId) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/users/${userId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete user' }));
      throw new Error(error.error || 'Failed to delete user');
    }
    return response.json();
  },
};

// Market Users API
export const marketUsersAPI = {
  getAll: async (marketId) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets/${marketId}/users`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
      throw new Error(error.error || 'Failed to fetch users');
    }
    return response.json();
  },

  create: async (marketId, userData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets/${marketId}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create user' }));
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  update: async (marketId, userId, userData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets/${marketId}/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update user' }));
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  delete: async (marketId, userId) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/markets/${marketId}/users/${userId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete user' }));
      throw new Error(error.error || 'Failed to delete user');
    }
    return response.json();
  },
};

// Advertisements API
export const advertisementsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/advertisements`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch advertisements' }));
      throw new Error(error.error || 'Failed to fetch advertisements');
    }
    return response.json();
  },

  getAllAdmin: async () => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/advertisements/admin`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch advertisements' }));
      throw new Error(error.error || 'Failed to fetch advertisements');
    }
    return response.json();
  },

  getById: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/advertisements/${id}`, {
      headers
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch advertisement' }));
      throw new Error(error.error || 'Failed to fetch advertisement');
    }
    return response.json();
  },

  create: async (adData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    console.log('Sending advertisement data:', {
      ...adData,
      image: adData.image ? (adData.image.substring(0, 50) + '... (length: ' + adData.image.length + ')') : 'none'
    });
    
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements`, {
        method: 'POST',
        headers,
        body: JSON.stringify(adData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Access denied: Admin privileges required');
      }
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unauthorized: Please login');
      }
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid data: Please check your input');
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create advertisement' }));
        const errorMessage = errorData.error || errorData.message || `Server error: ${response.status} ${response.statusText}`;
        console.error('Server error response:', errorData);
        throw new Error(errorMessage);
      }
      const result = await response.json();
      console.log('Advertisement created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in create advertisement:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to server. Please check if the backend is running on http://localhost:5000');
      }
      throw error;
    }
  },

  update: async (id, adData) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/advertisements/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(adData),
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update advertisement' }));
      throw new Error(error.error || 'Failed to update advertisement');
    }
    return response.json();
  },

  delete: async (id) => {
    const headers = {
      ...getAuthHeaders()
    };
    
    const response = await fetch(`${API_BASE_URL}/advertisements/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized: Please login');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete advertisement' }));
      throw new Error(error.error || 'Failed to delete advertisement');
    }
    return response.json();
  },
};
