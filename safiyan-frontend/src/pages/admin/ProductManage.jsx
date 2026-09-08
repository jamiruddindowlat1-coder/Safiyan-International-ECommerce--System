import { useMemo, useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';

const initialProducts = [
  { id: 1, name: 'Smart Watch Pro', category: 'Electronics', stock: 25, price: 189, status: 'Active' },
  { id: 2, name: 'Classic Chair', category: 'Furniture', stock: 8, price: 95, status: 'Low Stock' },
  { id: 3, name: 'Travel Backpack', category: 'Accessories', stock: 40, price: 76, status: 'Active' },
  { id: 4, name: 'Wireless Speaker', category: 'Electronics', stock: 12, price: 130, status: 'Draft' },
];

export default function ProductManage() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', status: 'Active' });
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword)
    );
  }, [products, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveProduct = () => {
    if (!form.name.trim() || !form.category.trim()) return;

    const product = { id: editingId || Date.now(), name: form.name.trim(), category: form.category.trim(), price: Number(form.price || 0), stock: Number(form.stock || 0), status: form.status };
    setProducts((current) => editingId ? current.map((item) => item.id === editingId ? product : item) : [product, ...current]);

    setForm({ name: '', category: '', price: '', stock: '', status: 'Active' });
    setEditingId(null);
  };

  const deleteProduct = (id) => {
    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, price: product.price, stock: product.stock, status: product.status });
  };

  const exportRows = products.map((product) => ({ ID: product.id, Name: product.name, Category: product.category, Price: product.price, Stock: product.stock, Status: product.status }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f4c81' }}>Product Management</div>
          <div style={{ color: '#64748b' }}>Add, edit, view, export, and manage product records.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <AdminExportActions filename="products" title="Product Report" rows={exportRows} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, marginBottom: 20, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Product name" style={inputStyle} />
          <input name="category" value={form.category} onChange={handleChange} placeholder="Category" style={inputStyle} />
          <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" style={inputStyle} />
          <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Stock" style={inputStyle} />
          <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Low Stock">Low Stock</option>
          </select>
          <button onClick={saveProduct} style={{ ...buttonStyle, minHeight: 44 }}>{editingId ? 'Update Product' : 'Add Product'}</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ display: 'flex', marginBottom: 14, justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            style={{ ...inputStyle, minWidth: 220, maxWidth: 320 }}
          />
          <div style={{ color: '#64748b', fontSize: 14 }}>Showing {filteredProducts.length} results</div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{product.id}</td>
                  <td style={tdStyle}>{product.name}</td>
                  <td style={tdStyle}>{product.category}</td>
                  <td style={tdStyle}>${product.price}</td>
                  <td style={tdStyle}>{product.stock}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: product.status === 'Active' ? '#dcfce7' : product.status === 'Low Stock' ? '#fef3c7' : '#e2e8f0',
                      color: '#1f2937',
                      borderRadius: 999,
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>{product.status}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setViewing(product)} style={miniButton}>View</button>
                      <button onClick={() => editProduct(product)} style={miniButton}>Edit</button>
                      <button onClick={() => deleteProduct(product.id)} style={{ ...miniButton, background: '#fee2e2', color: '#991b1b' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {viewing && <div style={modalBackdrop}><div style={modalStyle}><h2>{viewing.name}</h2><p>Category: {viewing.category}</p><p>Price: ৳{viewing.price}</p><p>Stock: {viewing.stock}</p><button onClick={() => setViewing(null)} style={buttonStyle}>Close</button></div></div>}
    </div>
  );
}

const buttonStyle = {
  border: 'none',
  background: 'linear-gradient(90deg, #0f4c81 0%, #14919b 100%)',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const buttonStyleSecondary = {
  ...buttonStyle,
  background: '#e2e8f0',
  color: '#0f172a',
};

const inputStyle = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 10,
  border: '1px solid #dbe2ea',
  background: '#f8fafc',
  outline: 'none',
};

const thStyle = { padding: '12px 10px', fontSize: 13, fontWeight: 700 };
const tdStyle = { padding: '12px 10px', fontSize: 14 };
const miniButton = {
  border: '1px solid #dbe2ea',
  background: '#fff',
  color: '#0f172a',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  cursor: 'pointer',
};
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'grid', placeItems: 'center', zIndex: 20 };
const modalStyle = { background: '#fff', borderRadius: 12, padding: 24, minWidth: 280, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.2)' };
