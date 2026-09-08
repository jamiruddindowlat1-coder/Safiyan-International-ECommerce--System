import { apiRequest } from './api';

export const productService = {
	getProducts() {
		return apiRequest('/Product');
	},

	getProduct(productId) {
		return apiRequest(`/Product/${productId}`);
	},
};

export default productService;
