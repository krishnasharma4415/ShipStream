import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5501';
const UPLOAD_SERVICE_URL = import.meta.env.VITE_UPLOAD_SERVICE_URL || 'http://localhost:5500';

export const authApi = axios.create({
  baseURL: AUTH_SERVICE_URL,
  withCredentials: true,
  timeout: 10000
});

export const uploadApi = axios.create({
  baseURL: UPLOAD_SERVICE_URL,
  withCredentials: true,
  timeout: 30000
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Auth API Error:', handleApiError(error));
    return Promise.reject(error);
  }
);

uploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Upload API Error:', handleApiError(error));
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete authApi.defaults.headers.common['Authorization'];
    delete uploadApi.defaults.headers.common['Authorization'];
  }
};

export const authService = {
  initiateGitHubLogin: () => authApi.post('/auth/github/login'),
  getCurrentUser: () => authApi.get('/auth/me'),
  refreshToken: (token: string) => authApi.post('/auth/refresh', { token }),
  logout: (sessionId: string) => authApi.post('/auth/logout', { sessionId })
};

export const deploymentService = {
  createDeployment: (repoUrl: string, branch?: string) => 
    uploadApi.post('/send-url', { repoUrl, branch }),
  getDeployments: () => uploadApi.get('/deployments'),
  getDeployment: (id: string) => uploadApi.get(`/deployments/${id}`),
  deleteDeployment: (id: string) => uploadApi.delete(`/deployments/${id}`),
  redeployDeployment: (id: string) => uploadApi.post(`/deployments/${id}/redeploy`),
  getStatus: (id: string) => uploadApi.get(`/status?id=${id}`)
};