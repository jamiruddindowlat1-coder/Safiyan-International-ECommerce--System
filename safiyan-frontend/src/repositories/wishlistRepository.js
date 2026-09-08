import { apiRequest } from '../config/api';

export const wishlistRepository = {
  getByUser(userId) {
    return apiRequest(`/Wishlist/user/${userId}`);
  },

  addItem(userId, productId) {
    return apiRequest('/Wishlist/items', {
      method: 'POST',
      body: JSON.stringify({ userId, productId }),
    });
  },

  removeItem(itemId) {
    return apiRequest(`/Wishlist/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  clear(userId) {
    return apiRequest(`/Wishlist/user/${userId}`, {
      method: 'DELETE',
    });
  },
};
