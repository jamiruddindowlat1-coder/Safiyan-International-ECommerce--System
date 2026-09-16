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
			body: JSON.stringify({
				status,
			}),
		});
	},

	updatePaymentStatus(orderId, paymentStatus) {
		return apiRequest(`/Order/${orderId}/payment-status`, {
			method: 'PATCH',
			body: JSON.stringify({
				paymentStatus,
			}),
		});
	},

	validateCoupon({ couponCode, subTotal }) {
		return apiRequest('/Coupon/validate', {
			method: 'POST',
			body: JSON.stringify({
				couponCode,
				subTotal,
			}),
		});
	},
};

export default orderService;
