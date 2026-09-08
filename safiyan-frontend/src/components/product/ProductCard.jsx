import { Link } from 'react-router-dom';

export default function ProductCard({ product, onAdd }) {
	const price = product.discountPrice > 0 ? product.discountPrice : product.price;
	return (
		<article style={cardStyle}>
			<img src={product.imageUrl || '/sies_logo.svg'} alt={product.name} style={imageStyle} />
			<div style={{ padding: 14 }}>
				<div style={{ color: '#64748b', fontSize: 12 }}>{product.categoryName || 'Product'}</div>
				<Link to={`/products/${product.id}`} style={nameStyle}>{product.name}</Link>
				<div style={{ fontWeight: 800, color: '#0f4c81', margin: '8px 0 12px' }}>৳{Number(price).toLocaleString()}</div>
				<button onClick={() => onAdd(product.id)} style={buttonStyle}>Add to cart</button>
			</div>
		</article>
	);
}

const cardStyle = { background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' };
const imageStyle = { width: '100%', height: 180, objectFit: 'contain', background: '#f8fafc' };
const nameStyle = { display: 'block', marginTop: 6, color: '#0f172a', fontWeight: 700 };
const buttonStyle = { border: 'none', borderRadius: 8, padding: '9px 12px', background: '#0f4c81', color: '#fff', cursor: 'pointer', fontWeight: 700 };
