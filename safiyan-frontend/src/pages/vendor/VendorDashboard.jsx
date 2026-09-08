import { Link } from 'react-router-dom';

export default function VendorDashboard() {
	return <section><h1 style={{ color: '#0f4c81' }}>Vendor Dashboard</h1><p>Manage your products and review incoming orders.</p><div style={gridStyle}><Link to="/vendor/products" style={cardStyle}>Products</Link><Link to="/vendor/orders" style={cardStyle}>Orders</Link></div></section>;
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const cardStyle = { background: '#fff', padding: 24, borderRadius: 10, color: '#0f4c81', fontWeight: 800 };
