import { useEffect, useState } from 'react';
import ProductCard from '../../components/product/ProductCard';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';

export default function ProductListing() {
	const { addToCart } = useCart();
	const [products, setProducts] = useState([]);
	const [query, setQuery] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		productService.getProducts().then(setProducts).catch((requestError) => setError(requestError.message));
	}, []);

	const visibleProducts = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
	return (
		<div>
			<div style={headerStyle}><div><h1 style={titleStyle}>Product Catalog</h1><p style={mutedStyle}>Browse available products.</p></div><input placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} style={searchStyle} /></div>
			{error && <div role="alert" style={errorStyle}>{error}</div>}
			<div style={gridStyle}>{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={(productId) => addToCart(productId).catch((requestError) => setError(requestError.message))} />)}</div>
		</div>
	);
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 };
const titleStyle = { margin: 0, color: '#0f4c81' };
const mutedStyle = { color: '#64748b' };
const searchStyle = { padding: 12, border: '1px solid #dbe2ea', borderRadius: 8, minWidth: 240 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 };
const errorStyle = { color: '#b42318', background: '#fef3f2', padding: 12, borderRadius: 8, marginBottom: 16 };
