import { useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';

const initialCoupons = [
  { id: 1, code: 'SAVE10', type: 'Percent', value: 10, status: 'Active' },
  { id: 2, code: 'FREESHIP', type: 'Shipping', value: 15, status: 'Active' },
  { id: 3, code: 'VIP20', type: 'Percent', value: 20, status: 'Draft' },
];

export default function CouponManage() {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', type: 'Percent', value: '', status: 'Active' });

  const saveCoupon = () => {
    if (!form.code.trim() || Number(form.value) < 0) return;
    const coupon = { id: editingId || Date.now(), code: form.code.trim().toUpperCase(), type: form.type, value: Number(form.value), status: form.status };
    setCoupons((current) => editingId ? current.map((item) => item.id === editingId ? coupon : item) : [...current, coupon]);
    setForm({ code: '', type: 'Percent', value: '', status: 'Active' });
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81' }}>Coupon Management</div>
          <div style={{ color: '#64748b' }}>Create and manage discount campaigns.</div>
        </div>
        <AdminExportActions filename="coupons" title="Coupon Report" rows={coupons.map((coupon) => ({ ID: coupon.id, Code: coupon.code, Type: coupon.type, Value: coupon.value, Status: coupon.status }))} />
      </div>

      <div style={formStyle}><input placeholder="Coupon code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} style={inputStyle} /><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} style={inputStyle}><option>Percent</option><option>Shipping</option><option>Fixed</option></select><input type="number" min="0" placeholder="Value" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} style={inputStyle} /><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} style={inputStyle}><option>Active</option><option>Draft</option></select><button onClick={saveCoupon} style={buttonStyle}>{editingId ? 'Update Coupon' : 'Add Coupon'}</button></div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Value</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{coupon.id}</td>
                <td style={tdStyle}>{coupon.code}</td>
                <td style={tdStyle}>{coupon.type}</td>
                <td style={tdStyle}>{coupon.value}%</td>
                <td style={tdStyle}><span style={{ ...statusPill, background: coupon.status === 'Active' ? '#dcfce7' : '#fef3c7' }}>{coupon.status}</span></td>
                <td style={tdStyle}><button onClick={() => setViewing(coupon)} style={miniButton}>View</button> <button onClick={() => { setEditingId(coupon.id); setForm({ code: coupon.code, type: coupon.type, value: coupon.value, status: coupon.status }); }} style={miniButton}>Edit</button> <button onClick={() => setCoupons((current) => current.filter((item) => item.id !== coupon.id))} style={{ ...miniButton, background: '#fee2e2', color: '#991b1b' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && <div style={modalBackdrop}><div style={modalStyle}><h2>{viewing.code}</h2><p>{viewing.type}: {viewing.value}%</p><p>Status: {viewing.status}</p><button onClick={() => setViewing(null)} style={buttonStyle}>Close</button></div></div>}
    </div>
  );
}

const buttonStyle = { border: 'none', background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' };
const thStyle = { padding: '12px 10px', fontSize: 13, fontWeight: 700 };
const tdStyle = { padding: '12px 10px', fontSize: 14 };
const statusPill = { borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700 };
const miniButton = { border: '1px solid #dbe2ea', background: '#fff', color: '#0f172a', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' };
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, background: '#fff', borderRadius: 12, padding: 16, marginBottom: 18 };
const inputStyle = { padding: 10, border: '1px solid #dbe2ea', borderRadius: 8 };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'grid', placeItems: 'center', zIndex: 20 };
const modalStyle = { background: '#fff', borderRadius: 12, padding: 24, minWidth: 280 };
