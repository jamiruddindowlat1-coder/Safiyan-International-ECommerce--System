import { apiRequest } from './api';

export const paymentService = {
    getOrderPayment(orderId) {
        return apiRequest(`/Payment/${orderId}`);
    },

    getOrderPayments(orderId) {
        return apiRequest(`/Payment/${orderId}`);
    },
};

export default paymentService;

