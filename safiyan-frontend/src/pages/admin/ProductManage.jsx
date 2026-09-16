import { useEffect, useState, useRef } from "react";
import { productService } from "../../services/productService";
import { API_BASE_URL } from "../../config/api";

const API = API_BASE_URL.replace("/api", "");

function getToken() {
  return (
    localStorage.getItem("sies-auth-token") ||
    sessionStorage.getItem("sies-auth-token") ||
    ""
  );
}

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [form, setForm] = useState({
    categoryId: "",
    vendorId: "",
    name: "",
    sku: "",
    price: "",
    discountPrice: "",
    stockQuantity: "",
    isActive: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [adding, setAdding] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [msg, setMsg] = useState("");

  const fileRef = useRef(null);

  // =========================
  // Load Products
  // =========================
  const load = async () => {
    try {
      const data = await productService.getProducts();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setProducts(list);
    } catch (error) {
      console.error("Product loading error:", error);
      setProducts([]);
    }
  };

  // =========================
  // Load Categories & Vendors
  // =========================
  useEffect(() => {
    load();

    const token = getToken();

    // Categories
    fetch(`${API}/api/Category`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Category API error: ${res.status}`);
        }

        return res.json();
      })
      .then((data) => {
        console.log("Categories:", data);

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        setCategories(list);
      })
      .catch((error) => {
        console.error("Category loading error:", error);
        setCategories([]);
      });

    // Vendors
    fetch(`${API}/api/Vendor`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Vendor API error: ${res.status}`);
        }

        return res.json();
      })
      .then((data) => {
        console.log("Vendors:", data);

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        setVendors(list);
      })
      .catch((error) => {
        console.error("Vendor loading error:", error);
        setVendors([]);
      });
  }, []);

  // =========================
  // Image Select
  // =========================
  const handleImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Image size must be less than 5MB.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMsg("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMsg("");
  };

  // =========================
  // Add Product
  // =========================
  const handleAdd = async () => {
    if (
      !form.categoryId ||
      !form.vendorId ||
      !form.name ||
      !form.sku ||
      !form.price
    ) {
      setMsg("Please fill in all required fields.");
      return;
    }

    setAdding(true);
    setMsg("");

    try {
      const token = getToken();

      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        vendorId: Number(form.vendorId),
        price: Number(form.price),
        discountPrice: Number(form.discountPrice) || 0,
        stockQuantity: Number(form.stockQuantity) || 0,
      };

      const res = await fetch(`${API}/api/Product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.message || "Failed to add product.");
        setAdding(false);
        return;
      }

      // Upload image after product creation
      if (imageFile && data?.id) {
        const fd = new FormData();
        fd.append("image", imageFile);

        const imageRes = await fetch(
          `${API}/api/Product/${data.id}/upload-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: fd,
          }
        );

        if (!imageRes.ok) {
          console.error("Product created but image upload failed.");
        }
      }

      setMsg("Product added successfully.");

      setForm({
        categoryId: "",
        vendorId: "",
        name: "",
        sku: "",
        price: "",
        discountPrice: "",
        stockQuantity: "",
        isActive: true,
      });

      setImageFile(null);
      setImagePreview(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      await load();
    } catch (error) {
      console.error("Add product error:", error);
      setMsg("An error occurred while adding the product.");
    }

    setAdding(false);
  };

  // =========================
  // Upload Existing Product Image
  // =========================
  const handleUploadExisting = async (productId) => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";

    input.onchange = async (e) => {
      const file = e.target.files?.[0];

      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setMsg("Image size must be less than 5MB.");
        return;
      }

      setUploadingId(productId);
      setMsg("");

      try {
        const fd = new FormData();
        fd.append("image", file);

        const res = await fetch(
          `${API}/api/Product/${productId}/upload-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
            body: fd,
          }
        );

        if (res.ok) {
          setMsg("Product image updated successfully.");
          await load();
        } else {
          const data = await res.json().catch(() => null);
          setMsg(data?.message || "Image upload failed.");
        }
      } catch (error) {
        console.error("Image upload error:", error);
        setMsg("Image upload failed.");
      }

      setUploadingId(null);
    };

    input.click();
  };

  return (
    <section
      style={{
        padding: 24,
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          color: "#0f4c81",
          marginBottom: 20,
        }}
      >
        Product Management
      </h1>

      {/* =========================
          Add Product Form
      ========================= */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          boxShadow: "0 2px 8px #0001",
        }}
      >
        <h2
          style={{
            marginBottom: 16,
            fontSize: 16,
            color: "#333",
          }}
        >
          Add New Product
        </h2>

        {/* Image Upload */}
        <div style={{ marginBottom: 16 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 160,
              height: 160,
              border: "2px dashed #0f4c81",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              background: "#f0f7ff",
            }}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <>
                <span style={{ fontSize: 36 }}>📷</span>

                <span
                  style={{
                    fontSize: 12,
                    color: "#0f4c81",
                    marginTop: 6,
                  }}
                >
                  Upload Product Image
                </span>

                <span
                  style={{
                    fontSize: 10,
                    color: "#999",
                  }}
                >
                  JPG, PNG, WEBP (max 5MB)
                </span>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleImage}
          />
        </div>

        {/* =========================
            Form Fields
        ========================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          {/* Category */}
          <select
            value={form.categoryId}
            onChange={(e) =>
              setForm({
                ...form,
                categoryId: e.target.value,
              })
            }
            style={inputStyle}
          >
            <option value="">Select Category</option>

            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Vendor */}
          <select
            value={form.vendorId}
            onChange={(e) =>
              setForm({
                ...form,
                vendorId: e.target.value,
              })
            }
            style={inputStyle}
          >
            <option value="">Select Vendor</option>

            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.storeName || v.name}
              </option>
            ))}
          </select>

          {/* Product Name */}
          <input
            placeholder="Product Name *"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            style={inputStyle}
          />

          {/* SKU */}
          <input
            placeholder="SKU *"
            value={form.sku}
            onChange={(e) =>
              setForm({
                ...form,
                sku: e.target.value,
              })
            }
            style={inputStyle}
          />

          {/* Price */}
          <input
            placeholder="Price (BDT) *"
            type="number"
            min="0"
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: e.target.value,
              })
            }
            style={inputStyle}
          />

          {/* Discount Price */}
          <input
            placeholder="Discount Price (BDT)"
            type="number"
            min="0"
            value={form.discountPrice}
            onChange={(e) =>
              setForm({
                ...form,
                discountPrice: e.target.value,
              })
            }
            style={inputStyle}
          />

          {/* Stock */}
          <input
            placeholder="Stock Quantity"
            type="number"
            min="0"
            value={form.stockQuantity}
            onChange={(e) =>
              setForm({
                ...form,
                stockQuantity: e.target.value,
              })
            }
            style={inputStyle}
          />

          {/* Active */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive: e.target.checked,
                })
              }
            />

            Active
          </label>
        </div>

        {/* Message */}
        {msg && (
          <p
            style={{
              color: msg
                .toLowerCase()
                .includes("successfully")
                ? "green"
                : "red",
              marginTop: 10,
            }}
          >
            {msg}
          </p>
        )}

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={adding}
          style={{
            ...btnStyle,
            opacity: adding ? 0.7 : 1,
            cursor: adding ? "not-allowed" : "pointer",
          }}
        >
          {adding ? "Adding..." : "Add Product"}
        </button>
      </div>

      {/* =========================
          Product List
      ========================= */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 2px 8px #0001",
        }}
      >
        <h2
          style={{
            marginBottom: 16,
            fontSize: 16,
            color: "#333",
          }}
        >
          Product List ({products.length})
        </h2>

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {products.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "#888",
              }}
            >
              No products found.
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} style={rowStyle}>
                {/* Image */}
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#f0f0f0",
                    flexShrink: 0,
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() =>
                    handleUploadExisting(p.id)
                  }
                  title="Click to change image"
                >
                  {p.imageUrl ? (
                    <img
                      src={
                        p.imageUrl.startsWith("http")
                          ? p.imageUrl
                          : `${API}${p.imageUrl}`
                      }
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      📷
                    </div>
                  )}

                  {uploadingId === p.id && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "#0008",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      Uploading...
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#333",
                    }}
                  >
                    {p.name}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#999",
                    }}
                  >
                    SKU: {p.sku} |{" "}
                    {p.categoryName ||
                      p.category?.name ||
                      "Category"}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#0f4c81",
                      marginTop: 4,
                    }}
                  >
                    BDT{" "}
                    {Number(p.price || 0).toLocaleString(
                      "en-BD"
                    )}
                  </div>
                </div>

                {/* Stock / Status */}
                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                    }}
                  >
                    Stock: {p.stockQuantity}
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      background: p.isActive
                        ? "#e6f4ea"
                        : "#fce8e6",
                      color: p.isActive
                        ? "green"
                        : "red",
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    {p.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// =========================
// Styles
// =========================

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  background: "#fff",
};

const btnStyle = {
  marginTop: 16,
  padding: "12px 28px",
  background: "#0f4c81",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 15,
  cursor: "pointer",
  fontWeight: 600,
};

const rowStyle = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  padding: 14,
  border: "1px solid #eee",
  borderRadius: 10,
  position: "relative",
};