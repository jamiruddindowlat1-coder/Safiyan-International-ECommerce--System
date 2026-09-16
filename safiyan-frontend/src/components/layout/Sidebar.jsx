import { NavLink } from 'react-router-dom';
import { SIES_BRANDING } from '../../config/branding';
import { useAuth } from '../../context/AuthContext';

const sidebarStyle = {
  width: 218,
  flexShrink: 0,
  minHeight: 'calc(100vh - 120px)',
  background: 'rgba(7, 17, 31, 0.86)',
  borderRight: '1px solid #203852',
  padding: '16px 12px',
};

const linkStyle = ({ isActive }) => ({
  display: 'block',
  padding: '10px 12px',
  borderRadius: 10,
  marginBottom: 8,
  background: isActive ? '#eaf5ff' : 'transparent',
  color: isActive ? '#0f4c81' : '#374151',
  fontWeight: isActive ? 700 : 600,
  border: isActive ? '1px solid #cfe3ff' : '1px solid transparent',
});

const adminMenu = [
  ['Dashboard', '/admin'], ['Products', '/admin/products'], ['Categories', '/admin/categories'],
  ['Orders', '/admin/orders'], ['Customers', '/admin/customers'], ['Vendors', '/admin/vendors'],
  ['Coupons', '/admin/coupons'], ['Reports', '/admin/reports'], ['Accounts', '/admin/accounts'],
  ['Roles', '/admin/roles'], ['Settings', '/admin/settings'],
];
const vendorMenu = [['Vendor Dashboard', '/vendor'], ['Vendor Products', '/vendor/products'], ['Vendor Orders', '/vendor/orders']];
const customerMenu = [['Store', '/home'], ['Products', '/products'], ['Cart', '/cart'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Profile', '/profile']];

export default function Sidebar() {
  const { user } = useAuth();
  const menu = user?.role === 'Admin' ? adminMenu : user?.role === 'Vendor' ? vendorMenu : customerMenu;
  return (
    <aside className="app-sidebar" style={sidebarStyle}>
      <div style={{ marginBottom: 18, padding: '10px 10px 16px', borderBottom: '1px solid #eef2f7' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, color: '#64748b' }}>Brand</div>
        <div style={{ marginTop: 8, fontWeight: 800, color: '#0f4c81' }}>{SIES_BRANDING.shortName}</div>
      </div>

      {menu.map(([label, path]) => (
        <NavLink key={path} to={path} style={linkStyle}>
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
