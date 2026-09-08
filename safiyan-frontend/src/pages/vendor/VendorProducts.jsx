import { useEffect, useState } from 'react';
import { productService } from '../../services/productService';

export default function VendorProducts() {
	const [products, setProducts] = useState([]);
	useEffect(() => { productService.getProducts().then(setProducts).catch(() => setProducts([])); }, []);
	return <section><h1 style={{ color: '#0f4c81' }}>Vendor Products</h1><div style={{ display: 'grid', gap: 8 }}>{products.map((product) => <div key={product.id} style={rowStyle}><span>{product.name}</span><span>Stock: {product.stockQuantity}</span><span>৳{Number(product.price).toLocaleString()}</span></div>)}</div></section>;
}

const rowStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#fff', padding: 14, borderRadius: 8 };
