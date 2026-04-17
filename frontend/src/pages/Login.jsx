import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWindowSize } from '../hooks/useWindowSize';
import { signInWithGoogle } from '../config/firebase';
import { useAuthController } from '../features/auth/controllers/useAuthController';

export default function Login() {
  const { isMobile } = useWindowSize();
  const { loading, error, clearError, loginWithPassword, loginWithGoogleProfile } = useAuthController();
  const [form,     setForm]    = useState({ username: '', password: '' });
  const [mounted,  setMounted] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await loginWithPassword(form);
    } catch {
      // error is managed by controller state
    }
  }


  async function handleGoogleLogin() {
    try {
      const googleUser = await signInWithGoogle();
      const idToken = await googleUser.getIdToken();
      await loginWithGoogleProfile({
        id_token: idToken,
        email: googleUser.email,
        name: googleUser.displayName,
      });
    } catch {
      // error is managed by controller state
    }
  }

  return (
    <div style={{
      ...s.page,
      flexDirection: isMobile ? 'column' : 'row',
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .inp:focus {
          outline: none !important;
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12) !important;
        }
        .inp:hover { border-color: #7dd3fc !important; }
        .submit-btn:hover:not(:disabled) {
          background: #0284c7 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(14,165,233,0.35) !important;
        }
        .google-btn:hover {
          border-color: #bae6fd !important;
          background: #f0f9ff !important;
          transform: translateY(-1px) !important;
        }
        .back-link:hover { color: #0ea5e9 !important; }
        .toggle-pass:hover { color: #0ea5e9 !important; }
      `}</style>

      {/* ── Left panel — hidden on mobile ── */}
      {!isMobile && (
        <div style={s.leftPanel}>
          <div style={s.leftContent}>
            <div style={{ animation: 'float 4s ease-in-out infinite', marginBottom: 32 }}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 4 10 4 15a8 8 0 0016 0C20 10 12 2 12 2z" fill="rgba(255,255,255,0.9)"/>
                <path d="M12 18a3 3 0 01-3-3c0-2 3-5 3-5s3 3 3 5a3 3 0 01-3 3z" fill="rgba(14,165,233,0.6)"/>
              </svg>
            </div>
            <h2 style={s.leftTitle}>Pure Water,<br />Pure Life.</h2>
            <p style={s.leftSub}>Delivering fresh purified water to your doorstep in Tanjay City.</p>
            <div style={s.featureList}>
              {['Same-day delivery available','100% purified & safe water','Affordable prices from ₱15','Easy online ordering'].map((f, i) => (
                <div key={i} style={s.featureItem}>
                  <div style={s.featureCheck}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>
            {[
              { size: 60, top: '15%', left: '10%',  delay: '0s',   opacity: 0.15 },
              { size: 40, top: '60%', left: '80%',  delay: '1s',   opacity: 0.1  },
              { size: 80, top: '75%', left: '5%',   delay: '2s',   opacity: 0.08 },
              { size: 30, top: '30%', left: '85%',  delay: '0.5s', opacity: 0.12 },
            ].map((b, i) => (
              <div key={i} style={{
                position: 'absolute', width: b.size, height: b.size,
                borderRadius: '50%', background: `rgba(255,255,255,${b.opacity})`,
                top: b.top, left: b.left,
                animation: `float 4s ease-in-out ${b.delay} infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Right panel — form ── */}
      <div style={{
        ...s.rightPanel,
        padding: isMobile ? '0' : '40px 24px',
        alignItems: isMobile ? 'stretch' : 'center',
      }}>

        {/* Mobile top banner */}
        {isMobile && (
          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
            padding: '28px 24px 24px',
            textAlign: 'center',
            marginBottom: 0,
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              AquaFill
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 16px' }}>
              Pure water, delivered fresh.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#fff',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}>
                1
              </div>
              <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>Sign in</span>
            </div>
          </div>
        )}

        <div style={{
          ...s.formWrap,
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          padding: isMobile ? '24px 20px' : '0 4px',
          maxWidth: isMobile ? '100%' : 420,
        }}>

          {/* Back to home */}
          <Link to="/" style={s.backLink} className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to home
          </Link>

          {/* Header */}
          <div style={s.formHeader}>
            {!isMobile && (
              <div style={s.formLogo}>Aqua<span style={{ color: '#0369a1' }}>Fill</span></div>
            )}
            <h1 style={{
              ...s.formTitle,
              fontSize: isMobile ? 24 : 26,
              textAlign: isMobile ? 'center' : 'left',
            }}>
              Welcome back
            </h1>
            <p style={{
              ...s.formSub,
              textAlign: isMobile ? 'center' : 'left',
            }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <path strokeLinecap="round" d="M12 8v4M12 16h.01"/>
              </svg>
              {error}
            </div>
          )}

          {/* Google button */}
          <button
            style={s.googleBtn}
            className="google-btn"
            onClick={handleGoogleLogin}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or sign in with username</span>
            <div style={s.dividerLine} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Username</label>
              <div style={s.inputWrap}>
                <svg style={s.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  style={s.input} className="inp"
                  value={form.username}
                  onChange={e => {
                    clearError();
                    setForm({ ...form, username: e.target.value });
                  }}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <svg style={s.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  style={s.input} className="inp"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => {
                    clearError();
                    setForm({ ...form, password: e.target.value });
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={s.togglePass} className="toggle-pass">
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={s.submitBtn} className="submit-btn">
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={s.spinner} />
                  Signing in...
                </div>
              ) : 'Sign in'}
            </button>
          </form>

          <p style={{ ...s.signupLink, textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={s.link}>Create one for free</Link>
          </p>

          <p style={{ ...s.adminHint, textAlign: 'center' }}>
            Admin access? Use your admin credentials above.
          </p>

        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  leftPanel:   { flex: 1, background: 'linear-gradient(145deg, #0ea5e9 0%, #0369a1 60%, #0c4a6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  leftContent: { position: 'relative', zIndex: 1, padding: 48, maxWidth: 420 },
  leftTitle:   { fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 16 },
  leftSub:     { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36 },
  featureList: { display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 10 },
  featureCheck:{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  rightPanel:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', overflowY: 'auto' },
  formWrap:    { width: '100%', maxWidth: 420, padding: '0 4px' },
  backLink:    { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none', marginBottom: 24, fontWeight: 500 },
  formHeader:  { marginBottom: 24 },
  formLogo:    { fontSize: 24, fontWeight: 800, color: '#0ea5e9', marginBottom: 12 },
  formTitle:   { fontWeight: 800, color: '#0c1a2e', letterSpacing: '-0.5px', marginBottom: 4 },
  formSub:     { fontSize: 14, color: '#64748b' },
  errorBox:    { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 },
  googleBtn:   { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 0', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer', marginBottom: 20 },
  divider:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, background: '#e2e8f0' },
  dividerText: { fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' },
  fieldGroup:  { marginBottom: 16 },
  label:       { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  inputWrap:   { position: 'relative' },
  inputIcon:   { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  input:       { width: '100%', padding: '11px 40px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0c1a2e', background: '#fff', boxSizing: 'border-box' },
  togglePass:  { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' },
  submitBtn:   { width: '100%', padding: '13px 0', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, marginBottom: 20 },
  spinner:     { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  signupLink:  { fontSize: 14, color: '#64748b', marginBottom: 8 },
  link:        { color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' },
  adminHint:   { fontSize: 12, color: '#94a3b8' },
};
