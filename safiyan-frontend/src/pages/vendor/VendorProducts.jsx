import { useEffect, useState, useRef } from "react";
import { productService } from "../../services/productService";
import { exportCSV, exportExcel, exportPDF, printReport } from "../../utils/exportUtils";

import { API_BASE_URL } from '../../config/api';
const API = API_BASE_URL.replace('/api', '');

function getToken() {
  return localStorage.getItem("sies-auth-token") || sessionStorage.getItem("sies-auth-token") || "";
}

const EMPTY_FORM = {
  categoryId: "", vendorId: "", name: "", description: "",
  sku: "", price: "", discountPrice: "", stockQuantity: "", isActive: true
};

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const fileRef = useRef();

  const showMsg = (text, ok = false) => setMsg({ text, ok });

  const getExportRows = () =>
    products.map((p) => ({
      Name: p.name ?? "",
      SKU: p.sku ?? "",
      Category: p.categoryName ?? "",
      "Price (BDT)": Number(p.price || 0).toFixed(2),
      "Discount (BDT)": Number(p.discountPrice || 0).toFixed(2),
      Stock: p.stockQuantity ?? 0,
      Status: p.isActive ? "Active" : "Inactive",
    }));

  const load = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Product loading error:", err);
      setProducts([]);
    }
  };

  useEffect(() => {
    load();
    const token = getToken();
    fetch(`${API}/api/Category`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setCategories(Array.isArray(d) ? d : d?.data ?? []))
      .catch(err => { console.error("Category error:", err); setCategories([]); });
    fetch(`${API}/api/Vendor`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setVendors(Array.isArray(d) ? d : d?.data ?? []))
      .catch(err => { console.error("Vendor error:", err); setVendors([]); });
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── ADD ── */
  const handleAdd = async () => {
    if (!form.categoryId || !form.vendorId || !form.name || !form.sku || !form.price) {
      showMsg("Please fill in all required fields."); return;
    }
    setSaving(true); setMsg({ text: "", ok: false });
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/Product`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: String(form.name),
          description: String(form.description || ""),
          sku: String(form.sku),
          price: Number(form.price),
          discountPrice: Number(form.discountPrice) || 0,
          stockQuantity: Number(form.stockQuantity) || 0,
          isActive: Boolean(form.isActive),
          categoryId: Number(form.categoryId),
          vendorId: Number(form.vendorId),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(data.message || "Error adding product."); setSaving(false); return; }
      if (imageFile) {
        const fd = new FormData(); fd.append("image", imageFile);
        await fetch(`${API}/api/Product/${data.id}/upload-image`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd
        });
      }
      showMsg("Product added successfully.", true);
      setForm(EMPTY_FORM); setImageFile(null); setImagePreview(null);
      load();
    } catch (err) {
      console.error("Add error:", err);
      showMsg("An error occurred while adding the product.");
    }
    setSaving(false);
  };

  /* ── VIEW ── */
  const handleView = (p) => setViewProduct(p);

  /* ── EDIT OPEN ── */
  const handleEdit = (p) => {
    setEditProduct(p);
    setEditForm({
      categoryId: p.categoryId ?? "",
      vendorId: p.vendorId ?? "",
      name: p.name ?? "",
      description: p.description ?? "",
      sku: p.sku ?? "",
      price: p.price ?? "",
      discountPrice: p.discountPrice ?? "",
      stockQuantity: p.stockQuantity ?? "",
      isActive: p.isActive ?? true,
    });
  };

  /* ── UPDATE ── */
  const handleUpdate = async () => {
    if (!editForm.name || !editForm.sku || !editForm.price) {
      showMsg("Please fill in required fields."); return;
    }
    setUpdating(true);
    try {
      const token = getToken();
      const payload = {
        id: Number(editProduct.id),
        name: String(editForm.name),
        description: String(editForm.description || ""),
        sku: String(editForm.sku),
        price: Number(editForm.price),
        discountPrice: Number(editForm.discountPrice) || 0,
        stockQuantity: Number(editForm.stockQuantity) || 0,
        isActive: Boolean(editForm.isActive),
        categoryId: Number(editForm.categoryId),
        vendorId: Number(editForm.vendorId),
      };
      const res = await fetch(`${API}/api/Product/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errMsg = "Update failed.";
        try { const d = await res.json(); errMsg = d.message || d.title || errMsg; } catch { }
        showMsg(errMsg); setUpdating(false); return;
      }
      showMsg("Product updated successfully.", true);
      setEditProduct(null);
      load();
    } catch (err) {
      console.error("Update error:", err);
      showMsg("An error occurred while updating.");
    }
    setUpdating(false);
  };

  /* ── TOGGLE ACTIVE/INACTIVE ── */
  const handleToggle = async (p) => {
    setTogglingId(p.id);
    try {
      const res = await fetch(`${API}/api/Product/${p.id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok || res.status === 204) {
        // locally update করুন তারপর reload
        setProducts(prev => prev.map(item =>
          item.id === p.id ? { ...item, isActive: !item.isActive } : item
        ));
        load();
      } else {
        showMsg("Toggle failed.");
      }
    } catch (err) {
      console.error("Toggle error:", err);
      showMsg("An error occurred.");
    }
    setTogglingId(null);
  };

  /* ── DELETE ── */
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/Product/${deleteId}/force`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok || res.status === 204) {
        setProducts(prev => prev.filter(p => p.id !== deleteId));
        setDeleteId(null);
        showMsg("Product deleted.", true);
        load();
      } else {
        const errText = await res.text().catch(() => "");
        showMsg(errText || "Delete failed.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showMsg("An error occurred while deleting.");
    }
    setDeleting(false);
  };

  /* ── IMAGE UPLOAD on existing ── */
  const handleUploadExisting = (productId) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setUploadingId(productId);
      const fd = new FormData(); fd.append("image", file);
      const res = await fetch(`${API}/api/Product/${productId}/upload-image`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd
      });
      showMsg(res.ok ? "Image updated." : "Image upload failed.", res.ok);
      setUploadingId(null);
      if (res.ok) load();
    };
    input.click();
  };

  return (
    <section style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <h1 style={{ color: "#0f4c81", marginBottom: 20 }}>Product Management</h1>

      {/* ── Add Form ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Add New Product</h2>
        <div style={{ marginBottom: 16 }}>
          <div onClick={() => fileRef.current.click()} style={imgBox}>
            {imagePreview
              ? <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <>
                  <span style={{ fontSize: 36 }}>📷</span>
                  <span style={{ fontSize: 12, color: "#0f4c81", marginTop: 6 }}>Upload Product Image</span>
                  <span style={{ fontSize: 10, color: "#999" }}>JPG, PNG, WEBP</span>
                </>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
          <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} style={inputStyle}>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} style={inputStyle}>
            <option value="">Select Vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.storeName || v.name}</option>)}
          </select>
          <input placeholder="Product Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} />
          <input placeholder="SKU *" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} style={inputStyle} />
          <input placeholder="Price (BDT) *" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          <input placeholder="Discount Price" type="number" value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} style={inputStyle} />
          <input placeholder="Stock Quantity" type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} style={inputStyle} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active
          </label>
        </div>
        {msg.text && <p style={{ color: msg.ok ? "green" : "red", marginTop: 10, fontSize: 13 }}>{msg.text}</p>}
        <button onClick={handleAdd} disabled={saving} style={primaryBtn}>{saving ? "Adding…" : "Add Product"}</button>
      </div>

      {/* ── Product List ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <h2 style={{ ...sectionTitle, margin: 0 }}>Product List ({products.length})</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => printReport("Product List", getExportRows())} style={exportBtn("#6c757d")}>🖨️ Print</button>
            <button onClick={() => exportPDF("products", "Product List", getExportRows())} style={exportBtn("#dc3545")}>📄 PDF</button>
            <button onClick={() => exportExcel("products", getExportRows())} style={exportBtn("#217346")}>📊 Excel</button>
            <button onClick={() => {
              const rows = getExportRows();
              exportCSV("products", [Object.keys(rows[0] || {}), ...rows.map(Object.values)]);
            }} style={exportBtn("#0f4c81")}>🗂️ CSV</button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={rowStyle}>
              {/* Thumbnail */}
              <div style={{ width: 70, height: 70, borderRadius: 8, overflow: "hidden", background: "#f0f0f0", flexShrink: 0, cursor: "pointer", position: "relative" }}
                onClick={() => handleUploadExisting(p.id)} title="Click to change image">
                {p.imageUrl
                  ? <img src={p.imageUrl?.startsWith("http") ? p.imageUrl : `${API}${p.imageUrl}`} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📷</div>}
                {uploadingId === p.id && (
                  <div style={{ position: "absolute", inset: 0, background: "#0008", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>…</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#999" }}>SKU: {p.sku} | {p.categoryName}</div>
                <div style={{ fontSize: 13, color: "#0f4c81", marginTop: 4 }}>BDT {Number(p.price || 0).toLocaleString("en-BD")}</div>
              </div>

              {/* Stock + Status */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Stock: {p.stockQuantity}</div>
                {/* ✅ Active/Inactive toggle button */}
                <button
                  onClick={() => handleToggle(p)}
                  disabled={togglingId === p.id}
                  style={{
                    fontSize: 11,
                    background: p.isActive ? "#e6f4ea" : "#fce8e6",
                    color: p.isActive ? "green" : "red",
                    padding: "3px 10px",
                    borderRadius: 20,
                    border: `1px solid ${p.isActive ? "#a8d5b5" : "#f5b7b1"}`,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {togglingId === p.id ? "…" : p.isActive ? "✅ Active" : "❌ Inactive"}
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleView(p)} style={actionBtn("#0f4c81")}>👁 View</button>
                <button onClick={() => handleEdit(p)} style={actionBtn("#f5a623")}>✏️ Edit</button>
                <button onClick={() => setDeleteId(p.id)} style={actionBtn("#e8604c")}>🗑 Delete</button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p style={{ color: "#999", textAlign: "center", padding: 24 }}>No products found.</p>
          )}
        </div>
      </div>

      {/* ════ VIEW MODAL ════ */}
      {viewProduct && (
        <div style={overlay} onClick={() => setViewProduct(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Product Details</span>
              <button onClick={() => setViewProduct(null)} style={closeBtn}>✕</button>
            </div>
            {viewProduct.imageUrl && (
              <img
                src={viewProduct.imageUrl?.startsWith("http") ? viewProduct.imageUrl : `${API}${viewProduct.imageUrl}`}
                alt={viewProduct.name}
                style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginBottom: 16 }}
              />
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              {[
                ["Name", viewProduct.name],
                ["SKU", viewProduct.sku],
                ["Category", viewProduct.categoryName],
                ["Price", `BDT ${Number(viewProduct.price || 0).toLocaleString("en-BD")}`],
                ["Discount", `BDT ${Number(viewProduct.discountPrice || 0).toLocaleString("en-BD")}`],
                ["Stock", viewProduct.stockQuantity],
                ["Status", viewProduct.isActive ? "✅ Active" : "❌ Inactive"],
                ["Description", viewProduct.description || "—"],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 4px", color: "#888", width: 110 }}>{label}</td>
                  <td style={{ padding: "8px 4px", fontWeight: 500 }}>{value}</td>
                </tr>
              ))}
            </table>
          </div>
        </div>
      )}

      {/* ════ EDIT MODAL ════ */}
      {editProduct && (
        <div style={overlay} onClick={() => setEditProduct(null)}>
          <div style={{ ...modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Edit Product</span>
              <button onClick={() => setEditProduct(null)} style={closeBtn}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })} style={inputStyle}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={editForm.vendorId} onChange={e => setEditForm({ ...editForm, vendorId: e.target.value })} style={inputStyle}>
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.storeName || v.name}</option>)}
              </select>
              <input placeholder="Product Name *" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
              <input placeholder="SKU *" value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} style={inputStyle} />
              <input placeholder="Price (BDT) *" type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={inputStyle} />
              <input placeholder="Discount Price" type="number" value={editForm.discountPrice} onChange={e => setEditForm({ ...editForm, discountPrice: e.target.value })} style={inputStyle} />
              <input placeholder="Stock Quantity" type="number" value={editForm.stockQuantity} onChange={e => setEditForm({ ...editForm, stockQuantity: e.target.value })} style={inputStyle} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })} /> Active
              </label>
              <input placeholder="Description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1" }} />
            </div>
            {msg.text && <p style={{ color: msg.ok ? "green" : "red", marginTop: 10, fontSize: 13 }}>{msg.text}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={handleUpdate} disabled={updating} style={primaryBtn}>{updating ? "Saving…" : "Save Changes"}</button>
              <button onClick={() => setEditProduct(null)} style={{ ...primaryBtn, background: "#aaa" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ DELETE CONFIRM MODAL ════ */}
      {deleteId && (
        <div style={overlay} onClick={() => setDeleteId(null)}>
          <div style={{ ...modal, maxWidth: 360, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: "#333" }}>Delete Product?</h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>This action cannot be undone.</p>
            {msg.text && <p style={{ color: msg.ok ? "green" : "red", fontSize: 13 }}>{msg.text}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={handleDeleteConfirm} disabled={deleting} style={{ ...primaryBtn, background: "#e8604c", marginTop: 0 }}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteId(null)} style={{ ...primaryBtn, background: "#aaa", marginTop: 0 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Styles ── */
const card = { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px #0001" };
const sectionTitle = { fontSize: 16, color: "#333", marginBottom: 16 };
const imgBox = { width: 160, height: 160, border: "2px dashed #0f4c81", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: "#f0f7ff" };
const inputStyle = { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };
const primaryBtn = { marginTop: 16, padding: "11px 26px", background: "#0f4c81", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600 };
const exportBtn = (bg) => ({ padding: "8px 13px", background: bg, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 600 });
const actionBtn = (bg) => ({ padding: "6px 11px", background: bg, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer", fontWeight: 600 });
const rowStyle = { display: "flex", gap: 14, alignItems: "center", padding: 14, border: "1px solid #eee", borderRadius: 10, position: "relative", flexWrap: "wrap" };
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal = { background: "#fff", borderRadius: 14, padding: 24, width: "90%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 32px #0003" };
const modalHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const closeBtn = { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#666", lineHeight: 1 };
