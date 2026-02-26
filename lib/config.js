// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// For client-side absolute URLs (when needed)
export const getApiUrl = () => {
  // In browser, check if we're in production
  if (typeof window !== 'undefined') {
    // Use same origin for API calls to avoid CORS
    return window.location.origin + '/api';
  }
  return API_URL;
};
