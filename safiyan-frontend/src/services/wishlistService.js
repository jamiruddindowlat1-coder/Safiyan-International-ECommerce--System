import { wishlistRepository } from '../repositories/wishlistRepository';

export const wishlistService = {
  getWishlist(userId) {
    return wishlistRepository.getByUser(userId);
  },

  addProduct(userId, productId) {
    return wishlistRepository.addItem(userId, productId);
  },

  removeProduct(itemId) {
    return wishlistRepository.removeItem(itemId);
  },

  clearWishlist(userId) {
    return wishlistRepository.clear(userId);
  },
};
