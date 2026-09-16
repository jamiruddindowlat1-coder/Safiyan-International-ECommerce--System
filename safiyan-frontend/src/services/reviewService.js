import { apiRequest } from './api';

export const reviewService = {
  getProductReviews(productId) {
    return apiRequest(`/Review/product/${productId}`);
  },
  createReview(review) {
    return apiRequest('/Review', { method: 'POST', body: JSON.stringify(review) });
  },
  deleteReview(reviewId) {
    return apiRequest(`/Review/${reviewId}`, { method: 'DELETE' });
  },
};