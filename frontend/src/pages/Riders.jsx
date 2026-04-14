import { useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useWindowSize } from '../hooks/useWindowSize';
import { register } from '../services/api';

const initialForm = {
  name: '',
  username: '',
  phone: '',
  password: '',
  confirm: '',
};

export default function Riders() {
  const { isMobile, isTablet } = useWindowSize();
  const { toast, showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const passwordColumns = isMobile ? '1fr' : '1fr 1fr';

  async function handleCreate(e) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirm: form.confirm,
    };

    if (!payload.name || !payload.username || !payload.password || !payload.confirm) {
      showToast('Name, username, password, and confirm password are required.', 'error');
      return;
    }

    if (payload.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (payload.password !== payload.confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setSaving(true);
      await register({
        username: payload.username,
        password: payload.password,
        role: 'rider',
        name: payload.name,
        phone: payload.phone || null,
      });
      showToast('Rider account created successfully.');
      setForm(initialForm);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to create rider account.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <PageHeader title="Delivery Riders" subtitle="Create rider login accounts for your delivery team" />

      <div style={{ ...styles.content, padding: isMobile ? 16 : isTablet ? 20 : 28 }}>
        <form onSubmit={handleCreate} style={styles.form}>
          <label style={styles.label}>Rider name *</label>
          <input
            style={styles.input}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Juan Dela Cruz"
          />

          <label style={styles.label}>Username *</label>
          <input
            style={styles.input}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="rider_juan"
          />

          <label style={styles.label}>Phone</label>
          <input
            style={styles.input}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="09xxxxxxxxx"
          />

          <div style={{ ...styles.row, gridTemplateColumns: passwordColumns }}>
            <div style={styles.col}>
              <label style={styles.label}>Password *</label>
              <input
                type="password"
                style={styles.input}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div style={styles.col}>
              <label style={styles.label}>Confirm password *</label>
              <input
                type="password"
                style={styles.input}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Repeat password"
              />
            </div>
          </div>

          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? 'Creating rider account...' : 'Create rider account'}
          </button>
        </form>
      </div>

      <Toast toast={toast} />
    </Layout>
  );
}

const styles = {
  content: { padding: 28 },
  form: {
    width: '100%',
    maxWidth: 620,
    margin: '0 auto',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 18,
    boxSizing: 'border-box',
  },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 7,
    marginBottom: 14,
    fontSize: 13,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  col: { minWidth: 0 },
  saveBtn: {
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    borderRadius: 7,
    background: 'var(--theme-accent)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
};
