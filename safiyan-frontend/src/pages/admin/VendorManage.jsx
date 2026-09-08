import { useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';

const initialVendors = [
  { id: 1, name: 'Greenline Supply', products: 42, status: 'Verified' },
  { id: 2, name: 'Urban Nest', products: 18, status: 'Pending' },
  { id: 3, name: 'Prime Goods', products: 31, status: 'Verified' },
];

export default function VendorManage() {
  const [vendors, setVendors] = useState(initialVendors);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', products: '', status: 'Pending' });

  const saveVendor = () => {
    if (!form.name.trim()) return;
    const vendor = { id: editingId || Date.now(), name: form.name.trim(), products: Number(form.products || 0), status: form.status };
    setVendors((current) => editingId ? current.map((item) => item.id === editingId ? vendor : item) : [vendor, ...current]);
    setForm({ name: '', products: '', status: 'Pending' });
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81' }}>Vendor Management</div>
          <div style={{ color: '#64748b' }}>Manage supplier approvals and performance.</div>
        </div>
        <AdminExportActions filename="vendors" title="Vendor Report" rows={vendors.map((vendor) => ({ ID: vendor.id, Vendor: vendor.name, Products: vendor.products, Status: vendor.status }))} />
      </div>

      <div style={formStyle}><input placeholder="Vendor name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={inputStyle} /><input placeholder="Products" type="number" value={form.products} onChange={(event) => setForm({ ...form, products: event.target.value })} style={inputStyle} /><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} style={inputStyle}><option>Verified</option><option>Pending</option></select><button onClick={saveVendor} style={buttonStyle}>{editingId ? 'Update Vendor' : 'Add Vendor'}</button></div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Vendor</th>
              <th style={thStyle}>Products</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{vendor.id}</td>
                <td style={tdStyle}>{vendor.name}</td>
                <td style={tdStyle}>{vendor.products}</td>
                <td style={tdStyle}><span style={{ ...statusPill, background: vendor.status === 'Verified' ? '#dcfce7' : '#fef3c7' }}>{vendor.status}</span></td>
                <td style={tdStyle}><button onClick={() => setViewing(vendor)} style={miniButton}>View</button> <button onClick={() => { setEditingId(vendor.id); setForm({ name: vendor.name, products: vendor.products, status: vendor.status }); }} style={miniButton}>Edit</button> <button onClick={() => setVendors((current) => current.filter((item) => item.id !== vendor.id))} style={{ ...miniButton, background: '#fee2e2', color: '#991b1b' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && <div style={modalBackdrop}><div style={modalStyle}><h2>{viewing.name}</h2><p>Products: {viewing.products}</p><p>Status: {viewing.status}</p><button onClick={() => setViewing(null)} style={buttonStyle}>Close</button></div></div>}
    </div>
  );
}

const buttonStyle = { border: 'none', background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' };
const thStyle = { padding: '12px 10px', fontSize: 13, fontWeight: 700 };
const tdStyle = { padding: '12px 10px', fontSize: 14 };
const statusPill = { borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700 };
const miniButton = { border: '1px solid #dbe2ea', background: '#fff', color: '#0f172a', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' };
const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, background: '#fff', borderRadius: 12, padding: 16, marginBottom: 18 };
const inputStyle = { padding: 10, border: '1px solid #dbe2ea', borderRadius: 8 };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'grid', placeItems: 'center', zIndex: 20 };
const modalStyle = { background: '#fff', borderRadius: 12, padding: 24, minWidth: 280 };
