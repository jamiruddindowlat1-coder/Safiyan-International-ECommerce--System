import { apiRequest } from './api';

export const orderService = {
	getOrders() {
		return apiRequest('/Order');
	},

	getOrder(orderId) {
		return apiRequest(`/Order/${orderId}`);
	},

	getUserOrders(userId) {
		return apiRequest(`/Order/user/${userId}`);
	},

	createOrder(order) {
		return apiRequest('/Order', {
			method: 'POST',
			body: JSON.stringify(order),
		});
	},

	updateStatus(orderId, status) {
		return apiRequest(`/Order/${orderId}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		});
	},
};

export default orderService;
