import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthService } from '../../../app/container';

export function useAuthController() {
  const navigate = useNavigate();
  const authService = useMemo(() => getAuthService(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function clearError() {
    setError('');
  }

  function navigateByRole(role) {
    navigate(authService.getHomeRouteByRole(role));
  }

  async function loginWithPassword(credentials) {
    setLoading(true);
    setError('');
    try {
      const session = await authService.login(credentials);
      navigateByRole(session.user?.role);
      return session;
    } catch (err) {
      setError(err.message || 'Invalid username or password');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogleProfile(profile) {
    setLoading(true);
    setError('');
    try {
      const session = await authService.googleLogin(profile);
      navigateByRole(session.user?.role);
      return session;
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function registerCustomer(payload, { redirectTo = '/login' } = {}) {
    setLoading(true);
    setError('');
    try {
      const res = await authService.register(payload);
      navigate(redirectTo);
      return res;
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout({ redirectTo = '/login' } = {}) {
    authService.logout();
    navigate(redirectTo);
  }

  return {
    loading,
    error,
    clearError,
    loginWithPassword,
    loginWithGoogleProfile,
    registerCustomer,
    logout,
    getCurrentUser: authService.getCurrentUser.bind(authService),
    isAuthenticated: authService.isAuthenticated.bind(authService),
    getHomeRouteByRole: authService.getHomeRouteByRole.bind(authService),
  };
}

export function getRouteForRole(role) {
  return getAuthService().getHomeRouteByRole(role);
}
