import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import WishlistButton from '../../components/product/WishlistButton';
import ProductReviews from '../../components/review/ProductReviews';

export default function ProductDetails() {
	const { id } = useParams();
	const { addToCart } = useCart();

	const [product, setProduct] = useState(null);
	const [error, setError] = useState('');
	const [adding, setAdding] = useState(false);
	const [added, setAdded] = useState(false);

	useEffect(() => {
		let active = true;

		setProduct(null);
		setError('');
		setAdded(false);

		productService
			.getProduct(id)
			.then((data) => {
				if (active) {
					setProduct(data);
				}
			})
			.catch((requestError) => {
				if (active) {
					setError(requestError.message || 'Failed to load product.');
				}
			});

		return () => {
			active = false;
		};
	}, [id]);

	async function handleAddToCart() {
		if (!product || adding || added) return;

		setAdding(true);
		setError('');

		try {
			await addToCart(product.id);
			setAdded(true);
		} catch (requestError) {
			setError(requestError.message || 'Failed to add product to cart.');
		} finally {
			setAdding(false);
		}
	}

	if (error) {
		return (
			<div style={pageStyle}>
				<div style={errorCardStyle}>
					<h2 style={{ marginTop: 0 }}>Unable to load product</h2>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	if (!product) {
		return (
			<div style={pageStyle}>
				<div style={loadingStyle}>Loading product...</div>
			</div>
		);
	}

	const price =
		Number(product.discountPrice) > 0 &&
		Number(product.discountPrice) < Number(product.price)
			? product.discountPrice
			: product.price;

	const hasImage =
		product.imageUrl && product.imageUrl.trim().length > 0;

	return (
		<div style={pageStyle}>
			<article style={cardStyle}>
				<div style={imageContainerStyle}>
					<img
						src={hasImage ? product.imageUrl : ''}
						alt={product.name}
						style={imageStyle}
					/>
				</div>

				<div style={detailsStyle}>
					<div style={categoryRowStyle}>
						<div style={categoryStyle}>
							{product.categoryName || 'Product'}
						</div>
						<WishlistButton productId={product.id} />
					</div>

					<h1 style={titleStyle}>
						{product.name}
					</h1>

					{product.description && (
						<p style={descriptionStyle}>
							{product.description}
						</p>
					)}

					<div style={priceStyle}>
						৳{Number(price).toLocaleString()}
					</div>

					<div style={infoGridStyle}>
						<div>
							<span style={labelStyle}>SKU</span>
							<strong>{product.sku || 'N/A'}</strong>
						</div>

						<div>
							<span style={labelStyle}>Stock</span>
							<strong>
								{Number(product.stockQuantity || 0)}
							</strong>
						</div>

						<div>
							<span style={labelStyle}>Vendor</span>
							<strong>
								{product.vendorName || 'SIES'}
							</strong>
						</div>
					</div>

					{error && (
						<div style={smallErrorStyle}>
							{error}
						</div>
					)}

					<button
						type="button"
						onClick={handleAddToCart}
						disabled={
							adding ||
							added ||
							Number(product.stockQuantity || 0) <= 0
						}
						style={{
							...buttonStyle,
							background: added
								? '#16803c'
								: Number(product.stockQuantity || 0) <= 0
									? '#64748b'
									: '#0f4c81',
							cursor:
								adding ||
								added ||
								Number(product.stockQuantity || 0) <= 0
									? 'default'
									: 'pointer',
						}}
					>
						{adding
							? 'Adding...'
							: added
								? 'Added ✓'
								: Number(product.stockQuantity || 0) <= 0
									? 'Out of stock'
									: 'Add to cart'}
					</button>
				</div>
			</article>

			<div style={reviewsWrapStyle}>
				<ProductReviews productId={product.id} />
			</div>
		</div>
	);
}

const pageStyle = {
	width: '100%',
	minHeight: '60vh',
	padding: '10px 0 30px',
	color: '#0f172a',
};

const cardStyle = {
	display: 'grid',
	gridTemplateColumns: 'minmax(280px, 1fr) minmax(300px, 1fr)',
	gap: 30,
	width: '100%',
	boxSizing: 'border-box',
	background: '#ffffff',
	padding: 28,
	borderRadius: 14,
	border: '1px solid #e2e8f0',
	boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

const imageContainerStyle = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: 380,
	borderRadius: 12,
	background: '#f8fafc',
	border: '1px solid #e2e8f0',
	overflow: 'hidden',
};

const imageStyle = {
	width: '100%',
	height: 380,
	objectFit: 'contain',
	padding: 20,
	boxSizing: 'border-box',
};

const detailsStyle = {
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	padding: '10px 8px',
};

const categoryRowStyle = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: 8,
};

const categoryStyle = {
	color: '#64748b',
	fontSize: 14,
	fontWeight: 700,
};

const titleStyle = {
	margin: '0 0 14px',
	color: '#0f4c81',
	fontSize: 32,
	lineHeight: 1.2,
};

const descriptionStyle = {
	color: '#475569',
	fontSize: 16,
	lineHeight: 1.7,
	margin: '0 0 20px',
};

const priceStyle = {
	color: '#0f4c81',
	fontSize: 30,
	fontWeight: 800,
	marginBottom: 24,
};

const infoGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: 12,
	marginBottom: 24,
};

const labelStyle = {
	display: 'block',
	color: '#64748b',
	fontSize: 12,
	marginBottom: 5,
};

const buttonStyle = {
	width: '100%',
	border: 0,
	borderRadius: 8,
	padding: '13px 18px',
	color: '#ffffff',
	fontWeight: 700,
	fontSize: 16,
};

const loadingStyle = {
	background: '#ffffff',
	color: '#0f172a',
	padding: 30,
	borderRadius: 12,
	border: '1px solid #e2e8f0',
};

const errorCardStyle = {
	background: '#ffffff',
	color: '#0f172a',
	padding: 30,
	borderRadius: 12,
	border: '1px solid #fecaca',
};

const smallErrorStyle = {
	background: '#fef2f2',
	color: '#b42318',
	padding: '10px 12px',
	borderRadius: 7,
	marginBottom: 12,
	fontSize: 14,
};

const reviewsWrapStyle = {
	marginTop: 30,
};