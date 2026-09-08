import { apiRequest } from '../config/api';

export const vendorRepository = {
  getAll() {
    return apiRequest('/Vendor');
  },

  getById(vendorId) {
    return apiRequest(`/Vendor/${vendorId}`);
  },

  create(vendor) {
    return apiRequest('/Vendor', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
  },

  update(vendorId, vendor) {
    return apiRequest(`/Vendor/${vendorId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...vendor, id: vendorId }),
    });
  },

  remove(vendorId) {
    return apiRequest(`/Vendor/${vendorId}`, {
      method: 'DELETE',
    });
  },

  approve(vendorId) {
    return apiRequest(`/Vendor/${vendorId}/approve`, { method: 'PATCH' });
  },

  reject(vendorId) {
    return apiRequest(`/Vendor/${vendorId}/reject`, { method: 'PATCH' });
  },
};
