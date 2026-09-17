import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const demoAccounts = {
  Admin: { email: 'admin@sies.local', password: 'Admin@12345', destination: '/admin' },
  Vendor: { email: 'vendor@sies.local', password: 'Vendor@12345', destination: '/vendor' },
  Customer: { email: 'customer@sies.local', password: 'Customer@12345', destination: '/home' },
};
const isDevelopment = import.meta.env.DEV;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('Customer');

  function selectRole(nextRole) {
    setRole(nextRole);
    const account = demoAccounts[nextRole];
    setForm({ email: account.email, password: account.password });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form);
      navigate(user.role === 'Admin' ? '/admin' : user.role === 'Vendor' ? '/vendor' : '/home');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={brandStyle}><div style={logoBubbleStyle}><img src={`${import.meta.env.BASE_URL}sies_logo.svg`} alt="SIES" style={{ height: 48 }} /></div><div><div style={titleStyle}>Welcome back</div><div style={subtitleStyle}>Safiyan International ECommerce System</div></div></div>
        {isDevelopment && <div style={roleGridStyle}>{Object.keys(demoAccounts).map((accountRole) => <button type="button" key={accountRole} onClick={() => selectRole(accountRole)} style={{ ...roleButtonStyle, ...roleColors[accountRole], ...(role === accountRole ? selectedRoleStyle : {}) }}>{accountRole}<small>{accountRole === 'Admin' ? 'Full management' : accountRole === 'Vendor' ? 'Store management' : 'Shopping access'}</small></button>)}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <input placeholder="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} style={inputStyle} />
        <input placeholder="Password" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} style={inputStyle} />
        {error && <div role="alert" style={errorStyle}>{error}</div>}
        <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Signing In...' : `Sign in as ${role}`}</button>
      </form>
      {isDevelopment && <div style={hintStyle}>Development demo credentials are filled automatically by role selection.</div>}
      </div>
    </div>
  );
}

const pageStyle = { minHeight: 'calc(100vh - 180px)', display: 'grid', placeItems: 'center', padding: '24px 12px', background: 'radial-gradient(circle at 80% 10%, rgba(20, 145, 155, 0.3), transparent 35%), linear-gradient(135deg, #07111f 0%, #0c2035 58%, #102d3c 100%)' };
const cardStyle = { width: 'min(520px, 100%)', boxSizing: 'border-box', background: 'rgba(17, 31, 50, 0.94)', border: '1px solid #29415d', borderRadius: 22, padding: 30, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)' };
const brandStyle = { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 };
const logoBubbleStyle = { display: 'grid', placeItems: 'center', width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #0f4c81, #14919b)', boxShadow: '0 10px 20px rgba(15, 76, 129, 0.22)' };
const titleStyle = { fontSize: 27, fontWeight: 800, color: '#0f4c81' };
const subtitleStyle = { color: '#a9bed4', fontSize: 12, marginTop: 3 };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 10, border: '1px solid #bae6fd', background: '#f0fdfa', color: '#0f172a', outline: 'none' };
const buttonStyle = { border: 'none', background: 'linear-gradient(100deg, #0f4c81 0%, #14919b 52%, #f5a623 140%)', color: '#fff', borderRadius: 10, padding: '13px 16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(15, 76, 129, 0.2)' };
const roleGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9, marginBottom: 18 };
const roleButtonStyle = { border: '1px solid transparent', borderRadius: 10, padding: '11px 6px', fontWeight: 800, cursor: 'pointer', display: 'grid', gap: 4 };
const roleColors = { Admin: { background: '#fee2e2', color: '#991b1b' }, Vendor: { background: '#fef3c7', color: '#92400e' }, Customer: { background: '#ccfbf1', color: '#115e59' } };
const selectedRoleStyle = { borderColor: '#0f172a', boxShadow: '0 0 0 2px rgba(15, 23, 42, 0.12)' };
const hintStyle = { color: '#a9bed4', fontSize: 12, marginTop: 14, textAlign: 'center' };
const errorStyle = { color: '#991b1b', background: '#fee2e2', border: '1px solid #fecaca', padding: 10, borderRadius: 8, fontSize: 13 };
