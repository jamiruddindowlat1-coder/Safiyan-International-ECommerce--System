import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';


export default function ProductCard({ product, onAdd }) {
	const price =
		product.discountPrice > 0 &&
		product.discountPrice < product.price
			? product.discountPrice
			: product.price;

	const [status, setStatus] = useState('idle');

useEffect(() => {
	console.log('PRODUCT CARD MOUNTED:', product.id, product.name);

	return () => {
		console.log('PRODUCT CARD UNMOUNTED:', product.id, product.name);
	};
}, [product.id]);


	async function handleAdd() {
		if (status !== 'idle') return;

		setStatus('adding');

		try {
			await onAdd(product.id);

			// Keep the button permanently in Added state.
			setStatus('added');
		} catch (error) {
			console.error('Add to cart failed:', error);
			setStatus('idle');
		}
	}

	const isAdding = status === 'adding';
	const isAdded = status === 'added';

	const label = isAdding
		? 'Adding...'
		: isAdded
			? 'Added ✓'
			: 'Add to cart';

	return (
		<article style={cardStyle}>
			<img
				src={product.imageUrl || '/sies_logo.svg'}
				alt={product.name}
				style={imageStyle}
			/>

			<div style={{ padding: 14 }}>
				<div style={categoryStyle}>
					{product.categoryName || 'Product'}
				</div>

				<Link
					to={`/products/${product.id}`}
					style={nameStyle}
				>
					{product.name}
				</Link>

				<div style={priceStyle}>
					৳{Number(price).toLocaleString()}
				</div>

				<button
					type="button"
					onClick={handleAdd}
					disabled={isAdding || isAdded}
					style={{
						...buttonStyle,
						background: isAdded
							? '#0f9d58'
							: '#0f4c81',
						opacity: isAdding ? 0.7 : 1,
						cursor:
							isAdding || isAdded
								? 'default'
								: 'pointer',
					}}
				>
					{label}
				</button>
			</div>
		</article>
	);
}

const cardStyle = {
	background: '#fff',
	borderRadius: 12,
	overflow: 'hidden',
	border: '1px solid #e2e8f0',
};

const imageStyle = {
	width: '100%',
	height: 180,
	objectFit: 'contain',
	background: '#f8fafc',
};

const categoryStyle = {
	color: '#64748b',
	fontSize: 12,
};

const nameStyle = {
	display: 'block',
	marginTop: 6,
	color: '#0f172a',
	fontWeight: 700,
};

const priceStyle = {
	fontWeight: 800,
	color: '#0f4c81',
	margin: '8px 0 12px',
};

const buttonStyle = {
	border: 'none',
	borderRadius: 8,
	padding: '9px 12px',
	color: '#fff',
	fontWeight: 700,
};