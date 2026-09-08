import { useMemo, useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';

const initialCategories = [
  { id: 1, name: 'Electronics', products: 48, active: true },
  { id: 2, name: 'Furniture', products: 16, active: true },
  { id: 3, name: 'Accessories', products: 29, active: false },
  { id: 4, name: 'Fashion', products: 34, active: true },
];

export default function CategoryManage() {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', products: '', active: true });
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);

  const filtered = useMemo(() => {
    return categories.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveCategory = () => {
    if (!form.name.trim()) return;
    const category = { id: editingId || Date.now(), name: form.name.trim(), products: Number(form.products || 0), active: form.active };
    setCategories((current) => editingId ? current.map((item) => item.id === editingId ? category : item) : [category, ...current]);
    setForm({ name: '', products: '', active: true });
    setEditingId(null);
  };

  const deleteCategory = (id) => setCategories((current) => current.filter((item) => item.id !== id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81' }}>Category Management</div>
          <div style={{ color: '#64748b' }}>Add, view, and remove categories.</div>
        </div>
        <AdminExportActions filename="categories" title="Category Report" rows={categories.map((item) => ({ ID: item.id, Name: item.name, Products: item.products, Status: item.active ? 'Active' : 'Inactive' }))} />
      </div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, marginBottom: 20, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Category name" style={inputStyle} />
          <input name="products" type="number" value={form.products} onChange={handleChange} placeholder="Products count" style={inputStyle} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', background: '#f8fafc', border: '1px solid #dbe2ea', borderRadius: 10 }}>
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} /> Active
          </label>
          <button onClick={saveCategory} style={buttonStyle}>{editingId ? 'Update Category' : 'Add Category'}</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search category..." style={{ ...inputStyle, maxWidth: 320, marginBottom: 14 }} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Products</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{item.id}</td>
                  <td style={tdStyle}>{item.name}</td>
                  <td style={tdStyle}>{item.products}</td>
                  <td style={tdStyle}><span style={{ ...statusPill, background: item.active ? '#dcfce7' : '#fee2e2' }}>{item.active ? 'Active' : 'Inactive'}</span></td>
                  <td style={tdStyle}><button onClick={() => setViewing(item)} style={miniButton}>View</button> <button onClick={() => { setEditingId(item.id); setForm({ name: item.name, products: item.products, active: item.active }); }} style={miniButton}>Edit</button> <button onClick={() => deleteCategory(item.id)} style={{ ...miniButton, background: '#fee2e2', color: '#991b1b' }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {viewing && <div style={modalBackdrop}><div style={modalStyle}><h2>{viewing.name}</h2><p>Products: {viewing.products}</p><p>Status: {viewing.active ? 'Active' : 'Inactive'}</p><button onClick={() => setViewing(null)} style={buttonStyle}>Close</button></div></div>}
    </div>
  );
}

const buttonStyle = { border: 'none', background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)', color: '#fff', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #dbe2ea', background: '#f8fafc', outline: 'none' };
const thStyle = { padding: '12px 10px', fontSize: 13, fontWeight: 700 };
const tdStyle = { padding: '12px 10px', fontSize: 14 };
const statusPill = { borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700 };
const miniButton = { border: '1px solid #dbe2ea', background: '#fff', color: '#0f172a', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'grid', placeItems: 'center', zIndex: 20 };
const modalStyle = { background: '#fff', borderRadius: 12, padding: 24, minWidth: 280 };
