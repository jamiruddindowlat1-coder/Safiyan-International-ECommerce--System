import { apiRequest } from './api';

export const commissionService = {
  getAdminSummary(from, to) {
    const query = new URLSearchParams({ from, to });
    return apiRequest(`/Commission/admin/summary?${query.toString()}`);
  },

  getVendorSummary(vendorId, from, to) {
    const query = new URLSearchParams({ from, to });
    return apiRequest(`/Commission/vendor/${vendorId}/summary?${query.toString()}`);
  },

  getPayouts(vendorId) {
    const query = vendorId ? `?vendorId=${vendorId}` : '';
    return apiRequest(`/Commission/payouts${query}`);
  },

  createPayout(payout) {
    return apiRequest('/Commission/payouts', {
      method: 'POST',
      body: JSON.stringify(payout),
    });
  },

  setVendorCommissionRate(vendorId, commissionRateOverride) {
    return apiRequest(`/Vendor/${vendorId}/commission-rate`, {
      method: 'PATCH',
      body: JSON.stringify({ commissionRateOverride }),
    });
  },
};

export default commissionService;
