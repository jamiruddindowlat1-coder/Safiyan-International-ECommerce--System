import { Link } from 'react-router-dom';

export default function CartDrawer({ cart, open, onClose }) {
	if (!open) return null;
	return <aside style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 320, background: '#fff', padding: 20, zIndex: 5 }}><button onClick={onClose}>Close</button><h2>Cart</h2>{cart.items.map((item) => <div key={item.id}>{item.productName} × {item.quantity}</div>)}<Link to="/cart">View cart</Link></aside>;
}
