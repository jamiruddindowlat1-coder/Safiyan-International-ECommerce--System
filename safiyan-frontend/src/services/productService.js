import { apiRequest } from '../config/api';

import { API_BASE_URL } from '../config/api';  
const API_BASE = API_BASE_URL.replace('/api', '');
const getToken = () => localStorage.getItem('sies-auth-token') || sessionStorage.getItem('sies-auth-token') || '';

async function uploadFile(url, file, extraFields = {}) {
  const fd = new FormData();
  fd.append('image', file);
  Object.entries(extraFields).forEach(([key, value]) => fd.append(key, value));
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) {
    let message = 'Upload failed.';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // response wasn't JSON, keep default message
    }
    throw new Error(message);
  }
  return res.json();
}

export const productService = {
  // ---------------- core CRUD ----------------
  getProducts() {
    return apiRequest('/Product');
  },
  getProduct(id) {
    return apiRequest(`/Product/${id}`);
  },
  createProduct(payload) {
    return apiRequest('/Product', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateProduct(id, payload) {
    return apiRequest(`/Product/${id}`, { method: 'PUT', body: JSON.stringify({ id, ...payload }) });
  },
  deleteProduct(id) {
    return apiRequest(`/Product/${id}`, { method: 'DELETE' });
  },
  forceDeleteProduct(id) {
    return apiRequest(`/Product/${id}/force`, { method: 'DELETE' });
  },
  toggleProduct(id) {
    return apiRequest(`/Product/${id}/toggle`, { method: 'PATCH' });
  },

  // ---------------- single legacy image (Product.ImageUrl) ----------------
  uploadImage(id, file) {
    return uploadFile(`${API_BASE}/api/Product/${id}/upload-image`, file);
  },

  // ---------------- gallery images (ProductImage, multi-image) ----------------
  getImages(id) {
    return apiRequest(`/Product/${id}/images`);
  },
  addImage(id, { imageUrl, isPrimary = false, displayOrder = 0 }) {
    return apiRequest(`/Product/${id}/images`, {
      method: 'POST',
      body: JSON.stringify({ imageUrl, isPrimary, displayOrder }),
    });
  },
  uploadImageToGallery(id, file, isPrimary = false) {
    return uploadFile(`${API_BASE}/api/Product/${id}/images/upload?isPrimary=${isPrimary}`, file);
  },
  setPrimaryImage(id, imageId) {
    return apiRequest(`/Product/${id}/images/${imageId}/set-primary`, { method: 'PATCH' });
  },
  deleteImage(id, imageId) {
    return apiRequest(`/Product/${id}/images/${imageId}`, { method: 'DELETE' });
  },

  // ---------------- variants ----------------
  getVariants(id) {
    return apiRequest(`/Product/${id}/variants`);
  },
  createVariant(id, payload) {
    return apiRequest(`/Product/${id}/variants`, { method: 'POST', body: JSON.stringify(payload) });
  },
  updateVariant(id, variantId, payload) {
    return apiRequest(`/Product/${id}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify({ id: variantId, ...payload }),
    });
  },
  deleteVariant(id, variantId) {
    return apiRequest(`/Product/${id}/variants/${variantId}`, { method: 'DELETE' });
  },
};

export default productService;