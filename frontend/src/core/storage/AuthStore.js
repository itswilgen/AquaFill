const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export default class AuthStore {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    } catch {
      localStorage.removeItem(USER_KEY);
      return {};
    }
  }

  saveSession({ token, user }) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isAuthenticated() {
    return Boolean(this.getToken());
  }

  getHomeRouteByRole(role) {
    if (role === 'admin' || role === 'staff') return '/dashboard';
    if (role === 'rider') return '/rider/dashboard';
    return '/customer/dashboard';
  }
}
