import { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const AUTH_STORAGE_KEY = 'sies-auth-user';
const AUTH_TOKEN_KEY = 'sies-auth-token';
const AuthContext = createContext(null);

function readStoredUser() {
	try {
		const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
		return storedUser ? JSON.parse(storedUser) : null;
	} catch {
		return null;
	}
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(readStoredUser);

	function persistUser(nextUser, token = null) {
		setUser(nextUser);
		if (nextUser) {
			localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
			if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
		} else {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			localStorage.removeItem(AUTH_TOKEN_KEY);
		}
	}

	async function login(credentials) {
		const response = await authService.login(credentials);
		persistUser(response.user, response.token);
		return response.user;
	}

	async function register(details) {
		const response = await authService.register(details);
		persistUser(response.user, response.token);
		return response.user;
	}

	function logout() {
		persistUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error('useAuth must be used inside an AuthProvider.');
	}

	return context;
}
