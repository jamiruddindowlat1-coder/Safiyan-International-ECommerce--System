import { apiRequest } from './api';

export const accountingService = {
  getAccounts(from, to) {
    const query = new URLSearchParams({ from, to });
    return apiRequest(`/Report/accounts?${query.toString()}`);
  },

  addEntry(entry) {
    return apiRequest('/Report/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
};

export default accountingService;
