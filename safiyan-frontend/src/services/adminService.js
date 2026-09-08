import { apiRequest } from './api';

export const adminService = {
  getDashboard() {
    return apiRequest('/Admin/dashboard');
  },
};

export default adminService;
