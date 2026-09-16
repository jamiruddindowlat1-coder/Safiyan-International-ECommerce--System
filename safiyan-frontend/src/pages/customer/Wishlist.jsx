import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { SIES_BRANDING } from '../../config/branding';

export default function Wishlist() {
	const { user } = useAuth();

	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [removingId, setRemovingId] = useState(null);

	async function load() {
		if (!user?.id) return;

		setLoading(true);
		setError('');

		try {
			const result = await apiRequest(`/Wishlist/user/${user.id}`);
			setItems(result?.items || []);
		} catch (requestError) {
			setError(
				requestError?.message || 'Unable to load your wishlist.'
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	async function removeItem(productId) {
		if (!user?.id) return;

		setRemovingId(productId);

		try {
			await apiRequest('/Wishlist/remove', {
				method: 'DELETE',
				body: JSON.stringify({
					userId: user.id,
					productId,
				}),
			});

			setItems((current) =>
				current.filter((item) => item.productId !== productId)
			);
		} catch (requestError) {
			setError(
				requestError?.message || 'Unable to remove this item.'
			);
		} finally {
			setRemovingId(null);
		}
	}

	return (
		<section style={pageStyle}>
			<div style={containerStyle}>
				<h1
					style={{
						...titleStyle,
						color: SIES_BRANDING.colors.primary,
					}}
				>
					My Wishlist
				</h1>

				{error && <div style={errorStyle}>{error}</div>}

				{loading ? (
					<p style={mutedStyle}>Loading...</p>
				) : items.length === 0 ? (
					<div style={emptyStyle}>
						<p>Your wishlist is empty.</p>
						<Link
							to="/home"
							style={{
								color: SIES_BRANDING.colors.primary,
								fontWeight: 600,
							}}
						>
							Browse products
						</Link>
					</div>
				) : (
					<div style={gridStyle}>
						{items.map((item) => (
							<div key={item.id} style={cardStyle}>
								<div style={imageWrapStyle}>
									{item.productImageUrl ? (
										<img
											src={item.productImageUrl}
											alt={item.productName}
											style={imageStyle}
										/>
									) : (
										<div style={imagePlaceholderStyle}>
											No Image
										</div>
									)}
								</div>

								<div style={cardBodyStyle}>
									<strong>{item.productName}</strong>

									<div style={priceRowStyle}>
										<span
											style={{
												color: SIES_BRANDING.colors
													.primary,
												fontWeight: 700,
											}}
										>
											৳{Number(item.price).toLocaleString()}
										</span>

										{item.originalPrice > item.price && (
											<span style={strikeStyle}>
												৳
												{Number(
													item.originalPrice
												).toLocaleString()}
											</span>
										)}
									</div>

									<div style={mutedStyle}>
										{item.inStock
											? 'In stock'
											: 'Out of stock'}
									</div>

									<button
										type="button"
										onClick={() =>
											removeItem(item.productId)
										}
										disabled={
											removingId === item.productId
										}
										style={removeButtonStyle}
									>
										{removingId === item.productId
											? 'Removing...'
											: 'Remove'}
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

const pageStyle = {
	minHeight: '100vh',
	background: '#f5f7fa',
	padding: '30px 20px',
};

const containerStyle = {
	maxWidth: 1180,
	margin: '0 auto',
};

const titleStyle = {
	fontSize: 28,
	marginBottom: 22,
};

const mutedStyle = {
	color: '#667085',
	fontSize: 13,
};

const errorStyle = {
	padding: 12,
	marginBottom: 15,
	borderRadius: 8,
	background: '#fef3f2',
	color: '#b42318',
};

const emptyStyle = {
	background: '#fff',
	borderRadius: 12,
	padding: 40,
	textAlign: 'center',
	display: 'grid',
	gap: 10,
};

const gridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
	gap: 18,
};

const cardStyle = {
	background: '#fff',
	borderRadius: 12,
	overflow: 'hidden',
	boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
};

const imageWrapStyle = {
	width: '100%',
	height: 160,
	background: '#f0f2f5',
};

const imageStyle = {
	width: '100%',
	height: '100%',
	objectFit: 'cover',
};

const imagePlaceholderStyle = {
	width: '100%',
	height: '100%',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: '#98a2b3',
	fontSize: 13,
};

const cardBodyStyle = {
	padding: 14,
	display: 'grid',
	gap: 6,
};

const priceRowStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: 8,
};

const strikeStyle = {
	textDecoration: 'line-through',
	color: '#98a2b3',
	fontSize: 13,
};

const removeButtonStyle = {
	marginTop: 8,
	border: '1px solid #fda29b',
	background: '#fff',
	color: '#b42318',
	borderRadius: 8,
	padding: '8px 12px',
	fontWeight: 600,
	fontSize: 13,
	cursor: 'pointer',
};
