import { useEffect, useMemo, useRef, useState } from "react";
import AdminExportActions from "../../components/common/AdminExportActions";
import { apiRequest } from "../../config/api";

import { API_BASE_URL } from '../../config/api';
const API = API_BASE_URL.replace('/api', '');
const resolveImageUrl = (url) => (url && /^https?:\/\//i.test(url)) ? url : `${API}${url || ""}`;
const emptyForm = { name: "", description: "", imageUrl: "", isActive: true, parentCategoryId: "" };

export default function CategoryManage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true); setError("");
    try { setCategories(await apiRequest("/Category")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]);

  const handleImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const getToken = () => localStorage.getItem("sies-auth-token") || sessionStorage.getItem("sies-auth-token") || "";

  const save = async e => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Category name is required."); return; }
    setError("");
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        parentCategoryId: form.parentCategoryId ? Number(form.parentCategoryId) : null,
      };
      let savedId = editingId;
      if (editingId) {
        await apiRequest(`/Category/${editingId}`, { method: "PUT", body: JSON.stringify({ id: editingId, ...payload }) });
      } else {
        const res = await apiRequest("/Category", { method: "POST", body: JSON.stringify(payload) });
        savedId = res.id;
      }

      if (imageFile && savedId) {
        const fd = new FormData(); fd.append("image", imageFile);
        await fetch(`${API}/api/Category/${savedId}/upload-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd
        });
      }

      setForm(emptyForm); setEditingId(null);
      setImageFile(null); setImagePreview(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  const edit = c => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description || "",
      imageUrl: c.imageUrl || "",
      isActive: c.isActive,
      parentCategoryId: c.parentCategoryId || "",
    });
    setImagePreview(c.imageUrl ? resolveImageUrl(c.imageUrl) : null);
    setImageFile(null);
  };

  const remove = async id => {
    if (!window.confirm("Delete this category?")) return;
    try { await apiRequest(`/Category/${id}`, { method: "DELETE" }); await load(); }
    catch (e) { setError(e.message); }
  };

  const toggle = async c => {
    try { await apiRequest(`/Category/${c.id}/toggle`, { method: "PATCH" }); await load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Category Management</h1>
          <p style={mutedStyle}>Create and manage categories using the database.</p>
        </div>
        <AdminExportActions filename="categories" title="Category Report" rows={categories.map(c => ({ ID: c.id, Name: c.name, Products: c.productCount, Status: c.isActive ? "Active" : "Inactive" }))} />
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      <form onSubmit={save} style={formStyle}>
        {/* Image Upload - Daraz Style */}
        <div>
          <div onClick={() => fileRef.current.click()} style={imageBoxStyle}>
            {imagePreview
              ? <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <><span style={{ fontSize: 28 }}>+</span><span style={{ fontSize: 11, color: "#62b7f5", marginTop: 4 }}>Upload Image</span><span style={{ fontSize: 10, color: "#9fb6cc" }}>JPG, PNG (max 5MB)</span></>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
        </div>

        <input placeholder="Category name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />

        <select
          value={form.parentCategoryId || ""}
          onChange={e => setForm({ ...form, parentCategoryId: e.target.value })}
          style={inputStyle}
        >
          <option value="">No parent (top-level)</option>
          {categories
            .filter(c => c.id !== editingId)
            .map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>

        <label style={checkStyle}><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        <button style={buttonStyle}>{editingId ? "Update Category" : "Add Category"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setImagePreview(null); setImageFile(null); }} style={secondaryButton}>Cancel</button>}
      </form>

      <section style={panelStyle}>
        <input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 340, marginBottom: 14 }} />
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>ID</th><th style={thStyle}>Image</th><th style={thStyle}>Name</th><th style={thStyle}>Parent</th><th style={thStyle}>Products</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan="7" style={tdStyle}>Loading...</td></tr>
                : filtered.map(c => (
                  <tr key={c.id}>
                    <td style={tdStyle}>{c.id}</td>
                    <td style={tdStyle}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "#132840", cursor: "pointer" }} onClick={() => edit(c)}>
                        {c.imageUrl
                          ? <img src={resolveImageUrl(c.imageUrl)} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9fb6cc" }}>No Image</div>
                        }
                      </div>
                    </td>
                    <td style={tdStyle}>{c.name}</td>
                    <td style={tdStyle}>{c.parentCategoryName || "-"}</td>
                    <td style={tdStyle}>{c.productCount ?? 0}</td>
                    <td style={tdStyle}><button onClick={() => toggle(c)} style={miniButton}>{c.isActive ? "Active" : "Inactive"}</button></td>
                    <td style={tdStyle}>
                      <button onClick={() => setViewing(c)} style={miniButton}>View</button>{" "}
                      <button onClick={() => edit(c)} style={miniButton}>Edit</button>{" "}
                      <button onClick={() => remove(c.id)} style={{ ...miniButton, background: "#fee2e2", color: "#991b1b" }}>Delete</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {viewing && (
        <div style={modalBackdrop}>
          <div style={modalStyle}>
            {viewing.imageUrl && <img src={resolveImageUrl(viewing.imageUrl)} alt={viewing.name} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
            <h2>{viewing.name}</h2>
            <p>{viewing.description || "No description."}</p>
            <p>Parent: {viewing.parentCategoryName || "None (top-level)"}</p>
            <p>Products: {viewing.productCount ?? 0}</p>
            <p>Status: {viewing.isActive ? "Active" : "Inactive"}</p>
            <button onClick={() => setViewing(null)} style={buttonStyle}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const titleStyle = { fontSize: 28, fontWeight: 800, color: "#62b7f5", margin: 0 };
const mutedStyle = { color: "#9fb6cc", fontSize: 14 };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 };
const panelStyle = { background: "#0d1b2e", borderRadius: 18, padding: 18 };
const formStyle = { display: "grid", gridTemplateColumns: "120px repeat(auto-fit, minmax(170px, 1fr))", gap: 10, background: "#0d1b2e", borderRadius: 12, padding: 16, marginBottom: 18, alignItems: "center" };
const imageBoxStyle = { width: 100, height: 100, border: "2px dashed #345", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: "#132840" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #345", borderRadius: 8, background: "#132840", color: "#e5eef8" };
const checkStyle = { display: "flex", alignItems: "center", gap: 8, color: "#e5eef8" };
const buttonStyle = { border: "none", background: "linear-gradient(90deg,#0f4c81,#14919b)", color: "#fff", borderRadius: 8, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButton = { ...buttonStyle, background: "#334155" };
const miniButton = { border: "1px solid #345", background: "#132840", color: "#e5eef8", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "12px 10px", textAlign: "left", color: "#9fb6cc" };
const tdStyle = { padding: "12px 10px", color: "#e5eef8", borderBottom: "1px solid #203852" };
const errorStyle = { background: "#fef3f2", color: "#b42318", padding: 12, borderRadius: 8, marginBottom: 18 };
const modalBackdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 20 };
const modalStyle = { background: "#0d1b2e", color: "#e5eef8", borderRadius: 12, padding: 24, minWidth: 300, maxWidth: 500 };
