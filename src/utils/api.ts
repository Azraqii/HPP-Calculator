/**
 * API Client with automatic token refresh and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Store access token in memory (not localStorage for security)
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Refresh access token using refresh token in httpOnly cookie
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Important: send httpOnly cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Refresh token invalid or expired');
    }

    const data = await response.json();
    const newAccessToken = data.accessToken;
    
    setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    setAccessToken(null);
    // Trigger logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));
    return null;
  }
};

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  retry?: boolean;
}

// Core API request function with auto-retry on 401
const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { skipAuth = false, retry = true, ...fetchOptions } = options;
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Attach access token if not skipped and token exists
  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include', // Always include cookies for refresh token
  };

  try {
    const response = await fetch(url, config);

    // Handle token expiration (401 with TOKEN_EXPIRED)
    if (response.status === 401 && retry) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.code === 'TOKEN_EXPIRED') {
        // If already refreshing, wait for new token
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh(async () => {
              try {
                // Retry original request with new token
                const result = await apiRequest<T>(endpoint, {
                  ...options,
                  retry: false, // Don't retry again
                });
                resolve(result);
              } catch (err) {
                reject(err);
              }
            });
          });
        }

        // Start token refresh
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          // Retry original request with new token
          return apiRequest<T>(endpoint, {
            ...options,
            retry: false,
          });
        } else {
          throw new Error('Session expired. Please login again.');
        }
      }
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      
      throw new ApiError(
        errorData.message || 'Request failed',
        response.status,
        errorData.code || 'UNKNOWN_ERROR',
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
};

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isPremiumRequired(): boolean {
    return this.code === 'PREMIUM_REQUIRED' || this.status === 403;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }
}

// Convenience methods
export const apiGet = <T>(endpoint: string, options?: ApiRequestOptions) => {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
};

export const apiPost = <T>(
  endpoint: string,
  data?: any,
  options?: ApiRequestOptions
) => {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiPut = <T>(
  endpoint: string,
  data?: any,
  options?: ApiRequestOptions
) => {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const apiDelete = <T>(endpoint: string, options?: ApiRequestOptions) => {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
};

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  setAccessToken,
  getAccessToken,
};
