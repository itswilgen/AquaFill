import axios from 'axios';

export default class ApiClient {
  constructor({ baseURL, authStore }) {
    this.authStore = authStore;
    this.client = axios.create({ baseURL });

    this.client.interceptors.request.use((config) => {
      const token = this.authStore.getToken();
      if (token) {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  get(path, config) {
    return this.client.get(path, config);
  }

  post(path, data, config) {
    return this.client.post(path, data, config);
  }

  put(path, data, config) {
    return this.client.put(path, data, config);
  }

  delete(path, config) {
    return this.client.delete(path, config);
  }
}
