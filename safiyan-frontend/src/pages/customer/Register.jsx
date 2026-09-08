import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/home');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 620, margin: '40px auto', background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81', marginBottom: 18 }}>Register</div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <input placeholder="Full name" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} style={inputStyle} />
        <input placeholder="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} style={inputStyle} />
        <input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} style={inputStyle} />
        <input placeholder="Password" type="password" minLength="6" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} style={inputStyle} />
        {error && <div role="alert" style={{ color: '#b42318', gridColumn: '1 / -1' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ ...buttonStyle, gridColumn: '1 / -1' }}>{loading ? 'Creating Account...' : 'Create Account'}</button>
      </form>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #dbe2ea', background: '#f8fafc' };
const buttonStyle = { border: 'none', background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)', color: '#fff', borderRadius: 10, padding: '12px 16px', fontWeight: 700, cursor: 'pointer' };
