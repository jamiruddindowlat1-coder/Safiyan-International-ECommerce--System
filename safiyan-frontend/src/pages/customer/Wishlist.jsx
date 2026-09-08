import { useWishlist } from '../../context/WishlistContext';

export default function Wishlist() {
	const { items, loading, error, removeFromWishlist } = useWishlist();
	return <section><h1 style={{ color: '#0f4c81' }}>Wishlist</h1>{loading && <p>Loading wishlist...</p>}{error && <p style={{ color: '#b42318' }}>{error}</p>}<div style={{ display: 'grid', gap: 10 }}>{items.map((item) => <div key={item.id} style={rowStyle}><span>{item.productName || `Product #${item.productId}`}</span><button onClick={() => removeFromWishlist(item.id)} style={buttonStyle}>Remove</button></div>)}</div>{!loading && !items.length && <p>No saved products yet.</p>}</section>;
}

const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: 14, borderRadius: 8 };
const buttonStyle = { border: 'none', background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' };
