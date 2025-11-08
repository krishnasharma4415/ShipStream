import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';
import { authService, setAuthToken } from '../services/api';

interface AuthContextType extends AuthState {
  login: (token: string, sessionId: string) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; sessionId: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { token: string } }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: null,
  sessionId: null,
  isAuthenticated: false,
  isLoading: true
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        sessionId: action.payload.sessionId,
        isAuthenticated: true,
        isLoading: false
      };
    case 'LOGIN_FAILURE':
      return { ...initialState, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'REFRESH_TOKEN':
      return { ...state, token: action.payload.token };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (token: string, sessionId: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      setAuthToken(token);
      
      const response = await authService.getCurrentUser();
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.data, token, sessionId }
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      setAuthToken(null);
    }
  };

  const logout = async () => {
    try {
      if (state.sessionId) {
        await authService.logout(state.sessionId);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      setAuthToken(null);
    }
  };

  const refreshToken = async () => {
    try {
      if (!state.token) return;
      
      const response = await authService.refreshToken(state.token);
      const newToken = response.data.token;
      
      dispatch({ type: 'REFRESH_TOKEN', payload: { token: newToken } });
      setAuthToken(newToken);
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      setAuthToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem('auth_token');
      const storedSessionId = sessionStorage.getItem('session_id');
      
      if (storedToken && storedSessionId) {
        await login(storedToken, storedSessionId);
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (state.token && state.sessionId) {
      sessionStorage.setItem('auth_token', state.token);
      sessionStorage.setItem('session_id', state.sessionId);
    } else {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('session_id');
    }
  }, [state.token, state.sessionId]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}