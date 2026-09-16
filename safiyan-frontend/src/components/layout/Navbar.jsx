import { Link } from 'react-router-dom';
import { SIES_BRANDING } from '../../config/branding';
import { useAuth } from '../../context/AuthContext';

const navStyle = {
  background: 'linear-gradient(100deg, #081827 0%, #0e314d 58%, #123e52 100%)',
  color: '#fff',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 2px 12px rgba(15, 76, 129, 0.18)',
};

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={SIES_BRANDING.logo} alt={SIES_BRANDING.shortName} style={{ height: 34, width: 'auto' }} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{SIES_BRANDING.shortName}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{SIES_BRANDING.name}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <a href={`tel:${SIES_BRANDING.contact.phoneHref}`} style={contactStyle}>{SIES_BRANDING.contact.phoneDisplay}</a>
        {user?.role === 'Admin' && <Link to="/admin" style={{ color: '#fff' }}>Dashboard</Link>}
        {user?.role === 'Vendor' && <Link to="/vendor" style={{ color: '#fff' }}>Dashboard</Link>}
        {(!user || user.role === 'Customer') && <Link to="/home" style={{ color: '#fff' }}>Store</Link>}
        {user ? <><span style={{ fontSize: 12 }}>{user.fullName} · {user.role}</span><button onClick={logout} style={logoutStyle}>Logout</button></> : <Link to="/login" style={{ color: '#fff' }}>Login</Link>}
      </div>
    </nav>
  );
}

const logoutStyle = { border: '1px solid rgba(255,255,255,.6)', background: 'transparent', color: '#fff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' };
const contactStyle = { color: '#d7f9ff', fontSize: 12, borderRight: '1px solid rgba(255,255,255,.35)', paddingRight: 14 };
