import { toAppError } from '../../../core/errors/AppError';

export default class AuthService {
  constructor({ authRepository, authStore }) {
    this.authRepository = authRepository;
    this.authStore = authStore;
  }

  async login(credentials) {
    try {
      const res = await this.authRepository.login(credentials);
      const session = { token: res.data.token, user: res.data.user };
      this.authStore.saveSession(session);
      return session;
    } catch (err) {
      throw toAppError(err, 'Invalid username or password');
    }
  }

  async register(payload) {
    try {
      return await this.authRepository.register(payload);
    } catch (err) {
      throw toAppError(err, 'Signup failed. Please try again.');
    }
  }

  async googleLogin(payload) {
    try {
      const res = await this.authRepository.googleLogin(payload);
      const session = { token: res.data.token, user: res.data.user };
      this.authStore.saveSession(session);
      return session;
    } catch (err) {
      throw toAppError(err, 'Google login failed. Please try again.');
    }
  }

  logout() {
    this.authStore.clearSession();
  }

  getCurrentUser() {
    return this.authStore.getUser();
  }

  getToken() {
    return this.authStore.getToken();
  }

  isAuthenticated() {
    return this.authStore.isAuthenticated();
  }

  getHomeRouteByRole(role) {
    return this.authStore.getHomeRouteByRole(role);
  }
}
