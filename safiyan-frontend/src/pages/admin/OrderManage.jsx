import { useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';

const initialOrders = [
  { id: 'SO-1024', customer: 'Nadia', total: 320, status: 'Paid', date: '2026-09-07' },
  { id: 'SO-1025', customer: 'Rafi', total: 180, status: 'Packing', date: '2026-09-07' },
  { id: 'SO-1026', customer: 'Shila', total: 540, status: 'Shipped', date: '2026-09-06' },
  { id: 'SO-1027', customer: 'Imran', total: 90, status: 'Refund', date: '2026-09-05' },
];

export default function OrderManage() {
  const [orders, setOrders] = useState(initialOrders);
  const [viewing, setViewing] = useState(null);

  const exportRows = orders.map((order) => ({ ID: order.id, Customer: order.customer, Total: order.total, Status: order.status, Date: order.date }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81' }}>Order Management</div>
          <div style={{ color: '#64748b' }}>Track orders, print records, and export sales data.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <AdminExportActions filename="orders" title="Orders Report" rows={exportRows} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{order.id}</td>
                <td style={tdStyle}>{order.customer}</td>
                <td style={tdStyle}>${order.total}</td>
                <td style={tdStyle}><span style={{ ...statusPill, background: order.status === 'Paid' ? '#dcfce7' : order.status === 'Packing' ? '#dbeafe' : order.status === 'Shipped' ? '#fef3c7' : '#fee2e2' }}>{order.status}</span></td>
                <td style={tdStyle}>{order.date}</td>
                <td style={tdStyle}><button onClick={() => setViewing(order)} style={miniButton}>View</button> <button onClick={() => setOrders((current) => current.filter((item) => item.id !== order.id))} style={{ ...miniButton, background: '#fee2e2', color: '#991b1b' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && <div style={modalBackdrop}><div style={modalStyle}><h2>{viewing.id}</h2><p>Customer: {viewing.customer}</p><p>Total: ৳{viewing.total}</p><p>Status: {viewing.status}</p><button onClick={() => setViewing(null)} style={buttonStyle}>Close</button></div></div>}
    </div>
  );
}

const buttonStyle = { border: 'none', background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' };
const secondaryButton = { ...buttonStyle, background: '#e2e8f0', color: '#0f172a' };
const thStyle = { padding: '12px 10px', fontSize: 13, fontWeight: 700 };
const tdStyle = { padding: '12px 10px', fontSize: 14 };
const statusPill = { borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700 };
const miniButton = { border: '1px solid #dbe2ea', background: '#fff', color: '#0f172a', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'grid', placeItems: 'center', zIndex: 20 };
const modalStyle = { background: '#fff', borderRadius: 12, padding: 24, minWidth: 280 };
