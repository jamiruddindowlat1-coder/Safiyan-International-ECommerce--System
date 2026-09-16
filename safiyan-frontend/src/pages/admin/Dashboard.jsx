import { useEffect, useState } from 'react';
import { SIES_BRANDING } from '../../config/branding';
import AdminExportActions from '../../components/common/AdminExportActions';
import { adminService } from '../../services/adminService';

const formatMoney = (value = 0) => `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const formatStatus = (status) => (typeof status === 'number' ? ORDER_STATUSES[status] || 'Pending' : status);

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getDashboard().then(setDashboard).catch((requestError) => setError(requestError.message));
  }, []);

  if (error) return <div role="alert" style={errorStyle}>{error}</div>;
  if (!dashboard) return <div style={loadingStyle}>Loading {SIES_BRANDING.shortName} dashboard...</div>;

  const stats = [
    { label: 'Total Revenue', value: formatMoney(dashboard.totalRevenue), tone: '#0f4c81' },
    { label: 'Orders', value: dashboard.totalOrders, tone: '#14919b' },
    { label: 'Customers', value: dashboard.totalCustomers, tone: '#f5a623' },
    { label: 'Vendors', value: dashboard.totalVendors, tone: '#e8604c' },
  ];
  const exportRows = stats.map((stat) => ({ Metric: stat.label, Value: stat.value }));

  return (
    <div>
      <div style={headerStyle}>
        <div><div style={titleStyle}>Welcome to {SIES_BRANDING.shortName}</div><div style={mutedStyle}>Live e-commerce performance overview</div></div>
        <AdminExportActions filename="dashboard" title="SIES Dashboard Report" rows={exportRows} />
      </div>
      <div style={statsStyle}>{stats.map((stat) => <div key={stat.label} style={cardStyle}><div style={mutedStyle}>{stat.label}</div><div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, color: stat.tone }}>{stat.value}</div></div>)}</div>
      <section style={panelStyle}><h2 style={sectionTitleStyle}>Recent Sales</h2><div style={{ overflowX: 'auto' }}><table style={tableStyle}><thead><tr><th style={cellStyle}>Order</th><th style={cellStyle}>Customer</th><th style={cellStyle}>Total</th><th style={cellStyle}>Status</th></tr></thead><tbody>{dashboard.recentOrders.map((order) => <tr key={order.id}><td style={cellStyle}><a href={`/admin/orders`} style={linkStyle}>{order.orderNumber}</a></td><td style={cellStyle}>{order.customerName}</td><td style={cellStyle}>{formatMoney(order.totalAmount)}</td><td style={cellStyle}>{formatStatus(order.status)}</td></tr>)}</tbody></table></div>{!dashboard.recentOrders.length && <p style={mutedStyle}>No sales recorded yet.</p>}</section>
    </div>
  );
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 };
const titleStyle = { color: '#0f4c81', fontWeight: 800, fontSize: 28 };
const mutedStyle = { color: '#64748b', fontSize: 14 };
const statsStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 };
const cardStyle = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };
const panelStyle = { background: '#fff', borderRadius: 12, padding: 20 };
const sectionTitleStyle = { margin: '0 0 14px', fontSize: 20 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const cellStyle = { textAlign: 'left', padding: '11px 8px', borderBottom: '1px solid #eef2f7' };
const linkStyle = { color: '#0f4c81', fontWeight: 700, textDecoration: 'none' };
const loadingStyle = { padding: 24, color: '#64748b' };
const errorStyle = { padding: 14, color: '#b42318', background: '#fef3f2', borderRadius: 8 };