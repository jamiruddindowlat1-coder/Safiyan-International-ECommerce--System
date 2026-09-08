import { apiRequest } from './api';

export const roleService = {
  getUsers() {
    return apiRequest('/Admin/users');
  },
  updateRole(userId, role) {
    return apiRequest(`/Admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};