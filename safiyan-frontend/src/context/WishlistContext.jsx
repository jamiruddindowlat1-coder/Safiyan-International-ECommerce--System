import { createContext, useContext, useEffect, useState } from 'react';
import { wishlistService } from '../services/wishlistService';

const WishlistContext = createContext(null);

export function WishlistProvider({ children, userId }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(Boolean(userId));
	const [error, setError] = useState('');

	useEffect(() => {
		let active = true;

		if (!userId) {
			setItems([]);
			setLoading(false);
			return () => {
				active = false;
			};
		}

		setLoading(true);
		setError('');

		wishlistService.getWishlist(userId)
			.then((wishlist) => {
				if (active) {
					setItems(wishlist?.items || wishlist || []);
				}
			})
			.catch((requestError) => {
				if (active) {
					setError(requestError.message);
				}
			})
			.finally(() => {
				if (active) {
					setLoading(false);
				}
			});

		return () => {
			active = false;
		};
	}, [userId]);

	async function addToWishlist(productId) {
		if (!userId) throw new Error('A signed-in user is required.');
		const item = await wishlistService.addProduct(userId, productId);
		setItems((currentItems) => [...currentItems, item]);
		return item;
	}

	async function removeFromWishlist(itemId) {
		await wishlistService.removeProduct(itemId);
		setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
	}

	async function clearWishlist() {
		if (!userId) return;
		await wishlistService.clearWishlist(userId);
		setItems([]);
	}

	const value = {
		items,
		loading,
		error,
		isInWishlist: (productId) => items.some((item) => item.productId === productId),
		addToWishlist,
		removeFromWishlist,
		clearWishlist,
	};

	return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
	const context = useContext(WishlistContext);

	if (!context) {
		throw new Error('useWishlist must be used inside a WishlistProvider.');
	}

	return context;
}
