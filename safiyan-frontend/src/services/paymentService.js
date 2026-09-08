import { apiRequest } from './api';

export const paymentService = {
	getOrderPayments(orderId) {
		return apiRequest(`/Payment/order/${orderId}`);
	},

	initiatePayment(payment) {
		return apiRequest('/Payment', {
			method: 'POST',
			body: JSON.stringify(payment),
		});
	},
};

export default paymentService;
