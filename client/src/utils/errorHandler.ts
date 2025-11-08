import axios from 'axios';

export interface ApiError {
  error: string;
  message: string;
  code: number;
  timestamp: string;
}

export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please sign in.';
      case 403:
        return 'Access denied. You do not have permission.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
};

export const isNetworkError = (error: any): boolean => {
  return axios.isAxiosError(error) && !error.response;
};

export const shouldRetry = (error: any): boolean => {
  if (isNetworkError(error)) return true;
  
  const status = error.response?.status;
  return status === 500 || status === 502 || status === 503 || status === 504;
};