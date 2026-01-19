/**
 * Backend API Client
 * 
 * Centralized HTTP client for all frontend-to-backend communication.
 * Features:
 * - 3-second default timeout (configurable per-request)
 * - Graceful teardown (cancel all in-flight requests)
 * - Automatic auth token injection
 * - Consistent error handling
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Custom error classes for better error handling
export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RequestCancelledError extends Error {
  constructor(message = 'Request was cancelled') {
    super(message);
    this.name = 'RequestCancelledError';
  }
}

class BackendClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultTimeout = 3000; // 3 seconds
    this.activeRequests = new Map(); // Track active requests for graceful teardown
    this.requestIdCounter = 0;
  }

  /**
   * Get the auth token from localStorage
   * @returns {string|null}
   */
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Build headers for the request
   * @param {Object} customHeaders - Additional headers to include
   * @returns {Object}
   */
  buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Create an AbortController with timeout
   * @param {number} timeout - Timeout in milliseconds
   * @returns {{ controller: AbortController, timeoutId: number }}
   */
  createAbortController(timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('timeout');
    }, timeout);

    return { controller, timeoutId };
  }

  /**
   * Make an HTTP request
   * @param {string} endpoint - API endpoint (e.g., '/api/mealplan')
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
   * @param {Object} options.body - Request body (will be JSON stringified)
   * @param {Object} options.headers - Additional headers
   * @param {number} options.timeout - Request timeout in ms (default: 3000)
   * @param {boolean} options.includeCredentials - Include cookies (default: true)
   * @returns {Promise<Object>} - Response data
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      timeout = this.defaultTimeout,
      includeCredentials = true,
    } = options;

    const requestId = ++this.requestIdCounter;
    const { controller, timeoutId } = this.createAbortController(timeout);

    // Track this request
    this.activeRequests.set(requestId, { controller, timeoutId, endpoint });

    const url = `${this.baseUrl}${endpoint}`;
    const fetchOptions = {
      method,
      headers: this.buildHeaders(customHeaders),
      signal: controller.signal,
    };

    if (includeCredentials) {
      fetchOptions.credentials = 'include';
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Clear timeout since request completed
      clearTimeout(timeoutId);

      // Handle 401 - token expired or invalid
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Authentication failed');
        error.status = response.status;
        error.isAuthError = true;
        throw error;
      }

      // Handle 403 - forbidden (e.g., pending approval)
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Access forbidden');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Parse JSON response
      const data = await response.json();
      return data;

    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error.name === 'AbortError') {
        if (controller.signal.reason === 'timeout') {
          throw new TimeoutError(`Request to ${endpoint} timed out after ${timeout}ms`);
        }
        throw new RequestCancelledError(`Request to ${endpoint} was cancelled`);
      }

      // Handle network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new NetworkError(`Network error while requesting ${endpoint}`);
      }

      // Re-throw other errors
      throw error;

    } finally {
      // Remove from active requests
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options (timeout, headers)
   * @returns {Promise<Object>}
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options (timeout, headers)
   * @returns {Promise<Object>}
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options (timeout, headers)
   * @returns {Promise<Object>}
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options (timeout, headers)
   * @returns {Promise<Object>}
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Cancel all active requests (graceful teardown)
   * Call this on logout or app unmount
   */
  cancelAllRequests() {
    for (const [, { controller, timeoutId }] of this.activeRequests) {
      clearTimeout(timeoutId);
      controller.abort('cancelled');
    }
    this.activeRequests.clear();
    console.log('🔌 All pending requests cancelled');
  }

  /**
   * Get count of active requests
   * @returns {number}
   */
  getActiveRequestCount() {
    return this.activeRequests.size;
  }

  /**
   * Set the default timeout for all requests
   * @param {number} timeout - Timeout in milliseconds
   */
  setDefaultTimeout(timeout) {
    this.defaultTimeout = timeout;
  }
}

// Export singleton instance
const backendClient = new BackendClient();
export default backendClient;

// Export base URL for OAuth redirects (can't use fetch for OAuth)
export { API_BASE_URL };
