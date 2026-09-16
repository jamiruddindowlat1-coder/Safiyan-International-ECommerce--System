import { apiRequest } from './api';

export const shippingService = {
  getQuote(country, weightKg) {
    return apiRequest('/Shipping/quote', { method: 'POST', body: JSON.stringify({ country, weightKg }) });
  },
  trackOrder(orderId) {
    return apiRequest(`/Shipping/track/${orderId}`);
  },
};