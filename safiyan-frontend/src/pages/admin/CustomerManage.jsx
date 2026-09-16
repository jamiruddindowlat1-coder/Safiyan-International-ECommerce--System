import { useEffect, useMemo, useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';
import { apiRequest } from '../../config/api';

const emptyForm = { fullName: '', email: '', phone: '', password: '', isActive: true };

export default function CustomerManage() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setCustomers(await apiRequest('/Admin/customers')); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => customers.filter(c =>
    `${c.fullName} ${c.email} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [customers, search]);

  const save = async (e) => {
    e?.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || (!editingId && !form.password)) {
      setError('Name, email, and password are required for a new customer.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = { ...form, fullName: form.fullName.trim(), email: form.email.trim() };
      if (editingId) await apiRequest(`/Admin/customers/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiRequest('/Admin/customers', { method: 'POST', body: JSON.stringify(payload) });
      setForm(emptyForm); setEditingId(null); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const edit = (c) => {
    setEditingId(c.id);
    setForm({ fullName: c.fullName, email: c.email, phone: c.phone || '', password: '', isActive: c.isActive });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    setError('');
    try { await apiRequest(`/Admin/customers/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e.message); }
  };

  const toggle = async (c) => {
    try {
      await apiRequest(`/Admin/customers/${c.id}/status`, {
        method: 'PATCH', body: JSON.stringify({ isActive: !c.isActive })
      });
      await load();
    } catch (e) { setError(e.message); }
  };

  const rows = filtered.map(c => ({ ID: c.id, Name: c.fullName, Email: c.email, Phone: c.phone || '', Status: c.isActive ? 'Active' : 'Inactive' }));

  return <div>
    <header style={headerStyle}><div><h1 style={titleStyle}>Customer Management</h1><p style={mutedStyle}>Manage real customer accounts from the database.</p></div><AdminExportActions filename="customers" title="Customer Report" rows={rows} /></header>
    {error && <div role="alert" style={errorStyle}>{error}</div>}
    <form onSubmit={save} style={formStyle}>
      <input placeholder="Full name" value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} style={inputStyle} />
      <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={inputStyle} />
      <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} style={inputStyle} />
      <input type="password" placeholder={editingId ? 'New password (optional)' : 'Password'} value={form.password} onChange={e => setForm({...form, password:e.target.value})} style={inputStyle} />
      <label style={checkStyle}><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive:e.target.checked})} /> Active</label>
      <button disabled={saving} style={buttonStyle}>{saving ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}</button>
      {editingId && <button type="button" onClick={() => {setEditingId(null);setForm(emptyForm);}} style={secondaryButton}>Cancel</button>}
    </form>
    <section style={panelStyle}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:14}}>
        <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} style={{...inputStyle,maxWidth:340}} />
        <span style={mutedStyle}>{filtered.length} customer(s)</span>
      </div>
      <div style={{overflowX:'auto'}}><table style={tableStyle}><thead><tr><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Phone</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan="6" style={tdStyle}>Loading...</td></tr> : filtered.map(c => <tr key={c.id}><td style={tdStyle}>{c.id}</td><td style={tdStyle}>{c.fullName}</td><td style={tdStyle}>{c.email}</td><td style={tdStyle}>{c.phone || '-'}</td><td style={tdStyle}><button onClick={() => toggle(c)} style={{...miniButton,background:c.isActive?'#dcfce7':'#fee2e2'}}>{c.isActive?'Active':'Inactive'}</button></td><td style={tdStyle}><button onClick={()=>setViewing(c)} style={miniButton}>View</button>{' '}<button onClick={()=>edit(c)} style={miniButton}>Edit</button>{' '}<button onClick={()=>remove(c.id)} style={{...miniButton,background:'#fee2e2',color:'#991b1b'}}>Delete</button></td></tr>)}</tbody></table></div>
    </section>
    {viewing && <div style={modalBackdrop}><div style={modalStyle}><h2>{viewing.fullName}</h2><p>Email: {viewing.email}</p><p>Phone: {viewing.phone || '-'}</p><p>Status: {viewing.isActive?'Active':'Inactive'}</p><button onClick={()=>setViewing(null)} style={buttonStyle}>Close</button></div></div>}
  </div>;
}
const titleStyle={fontSize:28,fontWeight:800,color:'#62b7f5',margin:0}; const mutedStyle={color:'#9fb6cc',fontSize:14}; const headerStyle={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:18};
const panelStyle={background:'#0d1b2e',borderRadius:18,padding:18,boxShadow:'0 8px 22px rgba(0,0,0,.2)'}; const formStyle={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,background:'#0d1b2e',borderRadius:12,padding:16,marginBottom:18};
const inputStyle={width:'100%',boxSizing:'border-box',padding:10,border:'1px solid #345',borderRadius:8,background:'#132840',color:'#e5eef8'}; const checkStyle={display:'flex',alignItems:'center',gap:8,color:'#e5eef8'};
const buttonStyle={border:'none',background:'linear-gradient(90deg,#0f4c81,#14919b)',color:'#fff',borderRadius:8,padding:'10px 16px',fontWeight:700,cursor:'pointer'}; const secondaryButton={...buttonStyle,background:'#334155'};
const miniButton={border:'1px solid #345',background:'#132840',color:'#e5eef8',borderRadius:8,padding:'6px 10px',fontSize:12,cursor:'pointer'}; const tableStyle={width:'100%',borderCollapse:'collapse'}; const thStyle={padding:'12px 10px',textAlign:'left',color:'#9fb6cc'}; const tdStyle={padding:'12px 10px',color:'#e5eef8',borderBottom:'1px solid #203852'};
const errorStyle={background:'#fef3f2',color:'#b42318',padding:12,borderRadius:8,marginBottom:18}; const modalBackdrop={position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'grid',placeItems:'center',zIndex:20}; const modalStyle={background:'#0d1b2e',color:'#e5eef8',borderRadius:12,padding:24,minWidth:300};
