import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function Cart() {
	const { cart, loading, updateQuantity, removeItem } = useCart();
	return <section><h1 style={{ color: '#0f4c81' }}>Shopping Cart</h1>{loading && <p>Loading cart...</p>}{cart.items.map((item) => <div key={item.id} style={rowStyle}><span>{item.productName}</span><input type="number" min="1" max={item.availableStock} value={item.quantity} onChange={(event) => updateQuantity(item.id, Number(event.target.value))} style={inputStyle} /><strong>৳{Number(item.lineTotal).toLocaleString()}</strong><button onClick={() => removeItem(item.id)} style={buttonStyle}>Remove</button></div>)}<h2>Total: ৳{Number(cart.subTotal || 0).toLocaleString()}</h2><Link to="/checkout" style={checkoutStyle}>Proceed to checkout</Link></section>;
}

const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 80px 120px 90px', gap: 12, alignItems: 'center', background: '#fff', padding: 14, marginBottom: 8, borderRadius: 8 };
const inputStyle = { width: 60, padding: 8, border: '1px solid #dbe2ea', borderRadius: 6 };
const buttonStyle = { border: 'none', background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 6, cursor: 'pointer' };
const checkoutStyle = { display: 'inline-block', background: '#0f4c81', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 700 };
