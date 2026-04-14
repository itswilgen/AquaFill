import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import { createCustomer, searchCustomers, updateCustomer } from '../../services/api';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [profilePhoto, setProfilePhoto] = useState(getStoredProfilePhoto(getStoredUser()));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ phone: '' });
  const [customerId, setCustomerId] = useState(null);
  const [customerAddress, setCustomerAddress] = useState('');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  useEffect(() => {
    async function loadCustomerProfile() {
      try {
        const query = user.name || user.username || '';
        if (!query) return;

        const res = await searchCustomers(query);
        const customers = res.data.data || [];

        if (customers.length > 0) {
          const exact = customers.find(c => String(c.name || '').toLowerCase() === String(query).toLowerCase()) || customers[0];
          setCustomerId(exact.id);
          setCustomerAddress(exact.address || '');
          setForm({ phone: exact.phone || '' });
        }
      } catch {
        setForm({ phone: '' });
      }
    }

    void loadCustomerProfile();
  }, [user.name, user.username]);

  function handleCancelEdit() {
    setEditing(false);
    setError('');
    setSuccess('');
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('Please upload an image smaller than 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const photoData = String(reader.result || '');
      setProfilePhoto(photoData);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile() {
    const fullName = (user.name || user.username || '').trim();
    if (!fullName) {
      setError('Unable to update profile without a valid account name.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        name: fullName,
        address: customerAddress || '',
        phone: form.phone.trim(),
      };

      if (customerId) {
        await updateCustomer(customerId, payload);
      } else {
        const created = await createCustomer(payload);
        if (created?.data?.id) {
          setCustomerId(created.data.id);
        }
      }

      const userKey = user.username || user.name || 'customer';
      if (profilePhoto) {
        localStorage.setItem(`customer_profile_photo_${userKey}`, profilePhoto);
      } else {
        localStorage.removeItem(`customer_profile_photo_${userKey}`);
      }

      const updatedUser = { ...user, profile_photo: profilePhoto, phone: form.phone.trim() };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const avatarInitial = (user.name || user.username || 'U').charAt(0).toUpperCase();

  return (
    <CustomerLayout>
      <h2 style={s.title}>My profile</h2>
      <p style={s.sub}>Your account information</p>

      {success && <div style={s.successBox}>{success}</div>}
      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.card}>
        <div style={s.avatarWrap}>
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" style={s.avatarImg} />
          ) : (
            <div style={s.avatar}>{avatarInitial}</div>
          )}
          <div>
            <div style={s.name}>{user.name || user.username}</div>
            <div style={s.role}>Customer account</div>
            {editing && (
              <label style={s.photoLabel}>
                Change photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </label>
            )}
          </div>
        </div>

        <div style={s.divider} />

        <div style={s.infoGrid}>
          <InfoRow label="Username"  value={user.username || '—'} />
          <InfoRow label="Full name" value={user.name     || '—'} />
          {editing ? (
            <div style={s.fieldRow}>
              <span style={s.fieldLabel}>Phone</span>
              <input
                style={s.phoneInput}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="09xxxxxxxxx"
              />
            </div>
          ) : (
            <InfoRow label="Phone" value={form.phone || user.phone || '—'} />
          )}
          <InfoRow label="Role"      value={user.role     || 'customer'} />
          <InfoRow label="Login method" value={user.google_uid ? 'Google account' : 'Email & password'} />
        </div>

        <div style={s.divider} />

        {!editing ? (
          <button onClick={() => setEditing(true)} style={s.updateBtn}>
            Update profile
          </button>
        ) : (
          <div style={s.editActions}>
            <button onClick={handleCancelEdit} style={s.cancelBtn} disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSaveProfile} style={s.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

        <div style={s.divider} />

        <button onClick={handleLogout} style={s.logoutBtn}>
          Sign out
        </button>
      </div>
    </CustomerLayout>
  );
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function getStoredProfilePhoto(user) {
  const key = user?.username || user?.name || '';
  if (!key) return '';
  return localStorage.getItem(`customer_profile_photo_${key}`) || user?.profile_photo || '';
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
      <span style={{ color: '#94a3b8', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#0c1a2e', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const s = {
  title:     { fontSize: 20, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' },
  sub:       { fontSize: 13, color: '#94a3b8', margin: '0 0 20px' },
  successBox:{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12, maxWidth: 480 },
  errorBox:  { background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12, maxWidth: 480 },
  card:      { background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e0f2fe', maxWidth: 480 },
  avatarWrap:{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar:    { width: 56, height: 56, background: '#0ea5e9', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 },
  avatarImg: { width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #bae6fd', flexShrink: 0 },
  photoLabel:{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 },
  name:      { fontSize: 16, fontWeight: 700, color: '#0c1a2e', marginBottom: 2 },
  role:      { fontSize: 12, color: '#94a3b8' },
  divider:   { height: 1, background: '#f1f5f9', margin: '16px 0' },
  infoGrid:  { },
  fieldRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  fieldLabel:{ color: '#94a3b8', fontWeight: 500, fontSize: 13 },
  phoneInput:{ width: 190, padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0c1a2e' },
  updateBtn: { width: '100%', padding: '11px 0', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  editActions:{ display: 'flex', gap: 10 },
  cancelBtn: { flex: 1, padding: '11px 0', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  saveBtn:   { flex: 1, padding: '11px 0', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  logoutBtn: { width: '100%', padding: '11px 0', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
};
