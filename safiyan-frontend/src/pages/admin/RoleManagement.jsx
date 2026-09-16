import { useEffect, useState } from 'react';
import { roleService } from '../../services/roleService';

const roles = ['Customer', 'Vendor', 'Admin'];

export default function RoleManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  async function loadUsers() {
    try {
      setUsers(await roleService.getUsers());
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function changeRole(userId, role) {
    try {
      await roleService.updateRole(userId, role);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return <section><h1 style={{ color: '#0f4c81' }}>Role Management</h1><p>Assign Customer, Vendor, or Admin access.</p>{error && <div style={errorStyle}>{error}</div>}<div style={panelStyle}>{users.map((user) => <div key={user.id} style={rowStyle}><div><strong>{user.fullName}</strong><div style={{ color: '#64748b', fontSize: 13 }}>{user.email}</div></div><select value={user.role} onChange={(event) => changeRole(user.id, event.target.value)} style={selectStyle}>{roles.map((role) => <option key={role}>{role}</option>)}</select><span style={{ color: user.isActive ? '#087443' : '#b42318' }}>{user.isActive ? 'Active' : 'Inactive'}</span></div>)}</div></section>;
}

const panelStyle = { background: '#fff', borderRadius: 12, padding: 18 };
const rowStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, alignItems: 'center', padding: 12, borderBottom: '1px solid #eef2f7' };
const selectStyle = { padding: 9, border: '1px solid #dbe2ea', borderRadius: 7 };
const errorStyle = { color: '#b42318', background: '#fef3f2', padding: 12, borderRadius: 8, marginBottom: 16 };