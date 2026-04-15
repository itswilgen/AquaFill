export default class AuthRepository {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  login(payload) {
    return this.apiClient.post('/auth/login', payload);
  }

  register(payload) {
    return this.apiClient.post('/auth/register', payload);
  }

  googleLogin(payload) {
    return this.apiClient.post('/auth/google', payload);
  }
}
