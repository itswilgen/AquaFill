const https = require('https');
const jwt = require('jsonwebtoken');
const AppError = require('../core/AppError');

const DEFAULT_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

function parseMaxAgeMillis(cacheControlValue) {
  const cacheControl = String(cacheControlValue || '');
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  if (!maxAgeMatch) return 60 * 60 * 1000;

  const seconds = Number.parseInt(maxAgeMatch[1], 10);
  if (!Number.isInteger(seconds) || seconds <= 0) return 60 * 60 * 1000;
  return seconds * 1000;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Certificate endpoint responded with status ${response.statusCode}`));
          return;
        }

        try {
          const parsed = JSON.parse(body);
          resolve({
            data: parsed,
            headers: response.headers,
          });
        } catch {
          reject(new Error('Certificate endpoint returned invalid JSON'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

class FirebaseTokenVerifier {
  constructor({ projectId, certsUrl = DEFAULT_CERTS_URL } = {}) {
    this.projectId = String(projectId || '').trim();
    this.certsUrl = certsUrl;
    this.cachedCerts = null;
    this.certsExpiry = 0;
  }

  ensureConfig() {
    if (!this.projectId) {
      throw new AppError(
        'Google login is not configured. Missing FIREBASE_PROJECT_ID.',
        500,
        'CONFIG_ERROR'
      );
    }
  }

  async getCertificates() {
    const now = Date.now();
    if (this.cachedCerts && this.certsExpiry > now) {
      return this.cachedCerts;
    }

    const { data, headers } = await fetchJson(this.certsUrl);

    if (!data || typeof data !== 'object') {
      throw new AppError('Unable to validate Google token certificates.', 500, 'GOOGLE_CERTS_INVALID');
    }

    const maxAgeMs = parseMaxAgeMillis(headers['cache-control']);
    this.cachedCerts = data;
    this.certsExpiry = now + maxAgeMs;

    return this.cachedCerts;
  }

  async verifyIdToken(idTokenValue) {
    this.ensureConfig();

    const idToken = String(idTokenValue || '').trim();
    if (!idToken) {
      throw new AppError('Google authentication token is required', 400, 'VALIDATION_ERROR');
    }

    const decodedHeader = jwt.decode(idToken, { complete: true });
    const kid = decodedHeader?.header?.kid;
    const alg = decodedHeader?.header?.alg;

    if (!kid || alg !== 'RS256') {
      throw new AppError('Invalid Google token format', 401, 'AUTH_INVALID_GOOGLE_TOKEN');
    }

    const certs = await this.getCertificates();
    const cert = certs[kid];

    if (!cert) {
      // Certificates can rotate. Refresh once and retry.
      this.cachedCerts = null;
      this.certsExpiry = 0;
      const refreshed = await this.getCertificates();
      if (!refreshed[kid]) {
        throw new AppError('Google token certificate is no longer valid', 401, 'AUTH_INVALID_GOOGLE_TOKEN');
      }
    }

    let verified;
    try {
      verified = jwt.verify(idToken, certs[kid] || this.cachedCerts[kid], {
        algorithms: ['RS256'],
        audience: this.projectId,
        issuer: `https://securetoken.google.com/${this.projectId}`,
      });
    } catch {
      throw new AppError('Invalid or expired Google authentication token', 401, 'AUTH_INVALID_GOOGLE_TOKEN');
    }

    const uid = String(verified?.user_id || verified?.sub || '').trim();
    const email = String(verified?.email || '').trim().toLowerCase();

    if (!uid) {
      throw new AppError('Google token is missing user identity', 401, 'AUTH_INVALID_GOOGLE_TOKEN');
    }

    if (!email) {
      throw new AppError('Google token is missing email', 401, 'AUTH_INVALID_GOOGLE_TOKEN');
    }

    if (verified?.email_verified === false) {
      throw new AppError('Google email is not verified', 401, 'AUTH_INVALID_GOOGLE_TOKEN');
    }

    return {
      uid,
      email,
      name: String(verified?.name || '').trim(),
    };
  }
}

module.exports = FirebaseTokenVerifier;
