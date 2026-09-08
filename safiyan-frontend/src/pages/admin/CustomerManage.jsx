import { useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';

const initialCustomers = [
  { id: 1, name: 'Nadia Rahman', email: 'nadia@gmail.com', plan: 'Premium', status: 'Active' },
  { id: 2, name: 'Rafi Karim', email: 'rafi@gmail.com', plan: 'Standard', status: 'Active' },
  { id: 3, name: 'Shila Akter', email: 'shila@gmail.com', plan: 'Premium', status: 'Pending' },
  { id: 4, name: 'Imran Hossain', email: 'imran@gmail.com', plan: 'Business', status: 'Blocked' },
];

export default function CustomerManage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [viewing, setViewing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', plan: 'Standard', status: 'Active' });

  const deleteCustomer = (id) => setCustomers((current) => current.filter((customer) => customer.id !== id));
  const saveCustomer = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const customer = { id: editingId || Date.now(), ...form, name: form.name.trim(), email: form.email.trim() };
    setCustomers((current) => editingId ? current.map((item) => item.id === editingId ? customer : item) : [customer, ...current]);
    setForm({ name: '', email: '', plan: 'Standard', status: 'Active' });
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81' }}>Customer Management</div>
          <div style={{ color: '#64748b' }}>View and manage customer records.</div>
        </div>
        <AdminExportActions filename="customers" title="Customer Report" rows={customers.map((customer) => ({ ID: customer.id, Name: customer.name, Email: customer.email, Plan: customer.plan, Status: customer.status }))} />
      </div>

      <div style={formStyle}><input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={inputStyle} /><input placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} style={inputStyle} /><select value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })} style={inputStyle}><option>Standard</option><option>Premium</option><option>Business</option></select><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} style={inputStyle}><option>Active</option><option>Pending</option><option>Blocked</option></select><button onClick={saveCustomer} style={buttonStyle}>{editingId ? 'Update Customer' : 'Add Customer'}</button></div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Plan</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{customer.id}</td>
                <td style={tdStyle}>{customer.name}</td>
                <td style={tdStyle}>{customer.email}</td>
                <td style={tdStyle}>{customer.plan}</td>
                <td style={tdStyle}><span style={{ ...statusPill, background: customer.status === 'Active' ? '#dcfce7' : customer.status === 'Pending' ? '#fef3c7' : '#fee2e2' }}>{customer.status}</span></td>
                <td style={tdStyle}><button onClick={() => setViewing(customer)} style={miniButton}>View</button> <button onClick={() => { setEditingId(customer.id); setForm(customer); }} style={miniButton}>Edit</button> <button onClick={() => deleteCustomer(customer.id)} style={{ ...miniButton, background: '#fee2e2', color: '#991b1b' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && <div style={modalBackdrop}><div style={modalStyle}><h2>{viewing.name}</h2><p>{viewing.email}</p><p>{viewing.plan} / {viewing.status}</p><button onClick={() => setViewing(null)} style={buttonStyle}>Close</button></div></div>}
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
