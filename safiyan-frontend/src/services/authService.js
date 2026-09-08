import { apiRequest } from '../config/api';

export const authService = {
	login(credentials) {
		return apiRequest('/Auth/login', {
			method: 'POST',
			body: JSON.stringify(credentials),
		});
	},

	register(user) {
		return apiRequest('/Auth/register', {
			method: 'POST',
			body: JSON.stringify(user),
		});
	},

	getUser(userId) {
		return apiRequest(`/Auth/user/${userId}`);
	},
};
