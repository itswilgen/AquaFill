import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { useWindowSize } from '../hooks/useWindowSize';
import { signInWithGoogle } from '../config/firebase';
import { googleAuth } from '../services/api';

export default function Signup() {
  const navigate  = useNavigate();
  const { isMobile } = useWindowSize();
  const [step,        setStep]       = useState(1);
  const [form,        setForm]       = useState({ name: '', username: '', phone: '', address: '', password: '', confirm: '' });
  const [error,       setError]      = useState('');
  const [loading,     setLoading]    = useState(false);
  const [mounted,     setMounted]    = useState(false);
  const [showPass,    setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm]= useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  function nextStep(e) {
    e.preventDefault();
    const name = form.name.trim();
    const username = form.username.trim();
    const address = form.address.trim();

    if (!name) return setError('Full name is required');
    if (!username) return setError('Username is required');
    if (!address) return setError('House address is required');
    if (address.length < 10) {
      return setError('Please enter a complete house address (house no., street, barangay).');
    }

    setError('');
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      role: 'customer',
      name: form.name.trim(),
      username: form.username.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    if (!payload.address) return setError('House address is required');
    if (payload.address.length < 10) {
      return setError('Please enter a complete house address (house no., street, barangay).');
    }
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6)       return setError('Password must be at least 6 characters');
    setLoading(true);
    setError('');
    try {
      await register(payload);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const progress = step === 1 ? '50%' : '100%';


  async function handleGoogleLogin() {
    try {
      const googleUser = await signInWithGoogle();
      const res = await googleAuth({
        uid:      googleUser.uid,
        email:    googleUser.email,
        name:     googleUser.displayName,
        photoURL: googleUser.photoURL,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));
      if (res.data.user.role === 'admin' || res.data.user.role === 'staff') {
        navigate('/dashboard');
      } else if (res.data.user.role === 'rider') {
        navigate('/rider/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
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
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
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
        .back-btn:hover { background: #f1f5f9 !important; }
        .google-btn:hover {
          border-color: #bae6fd !important;
          background: #f0f9ff !important;
          transform: translateY(-1px) !important;
        }
        .toggle-pass:hover { color: #0ea5e9 !important; }
        .signin-link:hover { color: #0284c7 !important; }
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
            <h2 style={s.leftTitle}>Join AquaFill<br />Today.</h2>
            <p style={s.leftSub}>Create your free account and start ordering fresh purified water delivered right to your door.</p>

            {/* Steps indicator */}
            <div style={s.stepsIndicator}>
              {[{ num: 1, label: 'Your info' }, { num: 2, label: 'Set password' }].map((st, i) => (
                <div key={i} style={s.stepIndicatorItem}>
                  <div style={{
                    ...s.stepIndicatorNum,
                    background: step >= st.num ? '#fff' : 'rgba(255,255,255,0.2)',
                    color:      step >= st.num ? '#0ea5e9' : 'rgba(255,255,255,0.6)',
                  }}>
                    {step > st.num ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : st.num}
                  </div>
                  <span style={{ fontSize: 13, color: step >= st.num ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: step >= st.num ? 600 : 400 }}>
                    {st.label}
                  </span>
                  {i < 1 && <div style={s.stepConnector} />}
                </div>
              ))}
            </div>

            {/* Floating bubbles */}
            {[
              { size: 50, top: '10%', left: '5%',  delay: '0s'   },
              { size: 30, top: '50%', left: '85%', delay: '1.5s' },
              { size: 70, top: '80%', left: '10%', delay: '0.8s' },
              { size: 25, top: '25%', left: '88%', delay: '2s'   },
            ].map((b, i) => (
              <div key={i} style={{
                position: 'absolute', width: b.size, height: b.size,
                borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                top: b.top, left: b.left,
                animation: `float 5s ease-in-out ${b.delay} infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Right panel ── */}
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
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>AquaFill</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 16px' }}>
              Create your free account
            </p>
            {/* Mobile step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {[{ num: 1, label: 'Your info' }, { num: 2, label: 'Password' }].map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: step >= st.num ? '#fff' : 'rgba(255,255,255,0.2)',
                    color: step >= st.num ? '#0ea5e9' : 'rgba(255,255,255,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {step > st.num ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : st.num}
                  </div>
                  <span style={{ fontSize: 12, color: step >= st.num ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: step >= st.num ? 600 : 400 }}>
                    {st.label}
                  </span>
                  {i < 1 && <div style={{ width: 24, height: 2, background: 'rgba(255,255,255,0.3)' }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form container */}
        <div style={{
          ...s.formWrap,
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          padding: isMobile ? '24px 20px' : '0',
          maxWidth: isMobile ? '100%' : 440,
        }}>

          {/* Back to home */}
          <Link to="/" style={s.backLink}>
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
              fontSize: isMobile ? 20 : 24,
              textAlign: isMobile ? 'center' : 'left',
            }}>
              {step === 1 ? 'Tell us about yourself' : 'Almost done!'}
            </h1>
            <p style={{
              ...s.formSub,
              textAlign: isMobile ? 'center' : 'left',
            }}>
              {step === 1 ? 'Fill in your details to get started' : 'Set your password to finish'}
            </p>
          </div>

          {/* Progress bar */}
          <div style={s.progressWrap}>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: progress, transition: 'width 0.4s ease' }} />
            </div>
            <span style={s.progressLabel}>Step {step} of 2</span>
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

          {/* ── Step 1 ── */}
          {step === 1 && (
            <form onSubmit={nextStep} style={{ animation: 'slideIn 0.3s ease' }}>
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
                Sign up with Google
              </button>

              <div style={s.divider}>
                <div style={s.dividerLine} />
                <span style={s.dividerText}>or fill in your details</span>
                <div style={s.dividerLine} />
              </div>

              <Field label="Full name *" icon="user" value={form.name}
                onChange={v => setForm({ ...form, name: v })} placeholder="Juan dela Cruz" />

              <Field label="Username *" icon="at" value={form.username}
                onChange={v => setForm({ ...form, username: v })} placeholder="juandelacruz" />

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
              }}>
                <Field label="Phone" icon="phone" value={form.phone}
                  onChange={v => setForm({ ...form, phone: v })} placeholder="09xxxxxxxxx" />
                <Field
                  label="House address *"
                  icon="map"
                  value={form.address}
                  onChange={v => setForm({ ...form, address: v })}
                  placeholder="House no., Street, Barangay, City"
                  required
                  note="Required for rider delivery location"
                />
              </div>

              <button type="submit" style={s.submitBtn} className="submit-btn">
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 6 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </form>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ animation: 'slideIn 0.3s ease' }}>
              <div style={s.summaryCard}>
                <div style={s.summaryAvatar}>{form.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0c1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>@{form.username}</div>
                </div>
                <button type="button" onClick={() => setStep(1)} style={s.editBtn}>Edit</button>
              </div>

              <PasswordField
                label="Password *"
                value={form.password}
                show={showPass}
                onToggle={() => setShowPass(!showPass)}
                onChange={v => setForm({ ...form, password: v })}
                placeholder="Create a strong password"
              />

              {form.password && <PasswordStrength password={form.password} />}

              <PasswordField
                label="Confirm password *"
                value={form.confirm}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                onChange={v => setForm({ ...form, confirm: v })}
                placeholder="Repeat your password"
              />

              {form.confirm && (
                <div style={{ fontSize: 12, marginTop: -10, marginBottom: 14, color: form.password === form.confirm ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: form.password === form.confirm ? '#16a34a' : '#dc2626' }} />
                  {form.password === form.confirm ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => { setStep(1); setError(''); }} style={s.backBtn} className="back-btn">
                  Back
                </button>
                <button type="submit" disabled={loading} style={{ ...s.submitBtn, flex: 1 }} className="submit-btn">
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={s.spinner} />
                      Creating account...
                    </div>
                  ) : 'Create account'}
                </button>
              </div>

              <p style={s.termsText}>
                By creating an account you agree to our{' '}
                <a href="#" style={{ color: '#0ea5e9' }}>Terms of Service</a> and{' '}
                <a href="#" style={{ color: '#0ea5e9' }}>Privacy Policy</a>.
              </p>
            </form>
          )}

          <p style={{ ...s.signinText, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={s.link} className="signin-link">Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

// ── Field component ───────────────────────────────────────────
function Field({ label, icon, value, onChange, placeholder, required = false, note = '' }) {
  const icons = {
    user:  <path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/>,
    at:    <><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></>,
    phone: <path strokeLinecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>,
    map:   <path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          {icons[icon]}
        </svg>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={s.input}
          className="inp"
          required={required}
        />
      </div>
      {note ? <p style={s.fieldNote}>{note}</p> : null}
    </div>
  );
}

// ── Password field ────────────────────────────────────────────
function PasswordField({ label, value, show, onToggle, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={s.input}
          className="inp"
        />
        <button type="button" onClick={onToggle} style={s.togglePass} className="toggle-pass">
          {show ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 6 characters', pass: password.length >= 6 },
    { label: 'Contains a number',     pass: /\d/.test(password) },
    { label: 'Contains uppercase',    pass: /[A-Z]/.test(password) },
  ];
  const score  = checks.filter(c => c.pass).length;
  const colors = ['#ef4444', '#f97316', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Strong'];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? colors[score - 1] : '#e2e8f0', transition: 'background 0.3s ease' }} />
        ))}
      </div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : '#94a3b8', fontWeight: 600 }}>
          {score > 0 ? labels[score - 1] : 'Enter password'}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: c.pass ? '#16a34a' : '#94a3b8' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.pass ? '#16a34a' : '#e2e8f0' }} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  page:             { display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  leftPanel:        { flex: '0 0 420px', background: 'linear-gradient(145deg, #0ea5e9 0%, #0369a1 60%, #0c4a6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  leftContent:      { position: 'relative', zIndex: 1, padding: 48, width: '100%' },
  leftTitle:        { fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 16 },
  leftSub:          { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 40 },
  stepsIndicator:   { display: 'flex', alignItems: 'center', gap: 0 },
  stepIndicatorItem:{ display: 'flex', alignItems: 'center', gap: 8 },
  stepIndicatorNum: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  stepConnector:    { width: 40, height: 2, background: 'rgba(255,255,255,0.3)', margin: '0 8px' },
  rightPanel:       { flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto' },
  formWrap:         { width: '100%' },
  backLink:         { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', textDecoration: 'none', marginBottom: 20, fontWeight: 500 },
  formHeader:       { marginBottom: 16 },
  formLogo:         { fontSize: 22, fontWeight: 800, color: '#0ea5e9', marginBottom: 10 },
  formTitle:        { fontWeight: 800, color: '#0c1a2e', letterSpacing: '-0.5px', marginBottom: 4 },
  formSub:          { fontSize: 13, color: '#64748b' },
  progressWrap:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressTrack:    { flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill:     { height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #0369a1)', borderRadius: 3 },
  progressLabel:    { fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 500 },
  errorBox:         { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16 },
  googleBtn:        { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 0', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer', marginBottom: 14 },
  divider:          { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine:      { flex: 1, height: 1, background: '#e2e8f0' },
  dividerText:      { fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' },
  label:            { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 },
  fieldNote:        { fontSize: 11, color: '#64748b', margin: '6px 0 0' },
  inputIcon:        { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  input:            { width: '100%', padding: '10px 40px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0c1a2e', background: '#fff', boxSizing: 'border-box' },
  togglePass:       { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' },
  summaryCard:      { display: 'flex', alignItems: 'center', gap: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '12px 16px', marginBottom: 16 },
  summaryAvatar:    { width: 40, height: 40, background: '#0ea5e9', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  editBtn:          { marginLeft: 'auto', padding: '4px 12px', fontSize: 12, fontWeight: 500, color: '#0ea5e9', background: '#fff', border: '1px solid #bae6fd', borderRadius: 8, cursor: 'pointer', flexShrink: 0 },
  submitBtn:        { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px 0', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, marginBottom: 14 },
  backBtn:          { padding: '13px 20px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  spinner:          { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  termsText:        { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6, marginTop: 4 },
  signinText:       { fontSize: 14, color: '#64748b', marginTop: 8 },
  link:             { color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' },
};
