import { apiRequest } from '../config/api';

export const customerRepository = {
  getById(customerId) {
    return apiRequest(`/Auth/user/${customerId}`);
  },

  update(customerId, customer) {
    return apiRequest(`/Auth/user/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },

  updateStatus(customerId, isActive) {
    return apiRequest(`/Auth/user/${customerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
};
