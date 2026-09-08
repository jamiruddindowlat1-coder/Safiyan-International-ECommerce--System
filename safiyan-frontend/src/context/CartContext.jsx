import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../config/api';

const CartContext = createContext(null);

export function CartProvider({ children, userId }) {
	const [cart, setCart] = useState({ items: [], itemCount: 0, subTotal: 0 });
	const [loading, setLoading] = useState(Boolean(userId));
	const [error, setError] = useState('');

	async function refreshCart() {
		if (!userId) {
			setCart({ items: [], itemCount: 0, subTotal: 0 });
			return;
		}
		setLoading(true);
		try {
			setCart(await apiRequest(`/Cart/user/${userId}`));
			setError('');
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		refreshCart();
	}, [userId]);

	async function addToCart(productId, quantity = 1) {
		if (!userId) throw new Error('A signed-in user is required.');
		await apiRequest('/Cart/add', { method: 'POST', body: JSON.stringify({ userId, productId, quantity }) });
		await refreshCart();
	}

	async function updateQuantity(itemId, quantity) {
		await apiRequest(`/Cart/item/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
		await refreshCart();
	}

	async function removeItem(itemId) {
		await apiRequest(`/Cart/item/${itemId}`, { method: 'DELETE' });
		await refreshCart();
	}

	return <CartContext.Provider value={{ cart, loading, error, refreshCart, addToCart, updateQuantity, removeItem }}>{children}</CartContext.Provider>;
}

export function useCart() {
	const context = useContext(CartContext);
	if (!context) throw new Error('useCart must be used inside a CartProvider.');
	return context;
}
