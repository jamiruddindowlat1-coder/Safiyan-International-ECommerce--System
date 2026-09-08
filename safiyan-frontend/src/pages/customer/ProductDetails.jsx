import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';

export default function ProductDetails() {
	const { id } = useParams();
	const { addToCart } = useCart();
	const [product, setProduct] = useState(null);
	const [error, setError] = useState('');
	useEffect(() => { productService.getProduct(id).then(setProduct).catch((requestError) => setError(requestError.message)); }, [id]);
	if (error) return <p style={{ color: '#b42318' }}>{error}</p>;
	if (!product) return <p>Loading product...</p>;
	const price = product.discountPrice > 0 ? product.discountPrice : product.price;
	return <article style={cardStyle}><img src={product.imageUrl || '/sies_logo.svg'} alt={product.name} style={imageStyle} /><div><h1 style={{ color: '#0f4c81' }}>{product.name}</h1><p>{product.description}</p><h2>৳{Number(price).toLocaleString()}</h2><button onClick={() => addToCart(product.id).catch((requestError) => setError(requestError.message))} style={buttonStyle}>Add to cart</button></div></article>;
}

const cardStyle = { display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 1fr', gap: 24, background: '#fff', padding: 24, borderRadius: 12 };
const imageStyle = { width: '100%', maxHeight: 360, objectFit: 'contain', background: '#f8fafc' };
const buttonStyle = { border: 0, padding: '11px 16px', borderRadius: 7, background: '#0f4c81', color: '#fff', fontWeight: 700 };
