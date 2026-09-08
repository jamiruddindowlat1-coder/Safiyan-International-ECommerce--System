import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';

export default function Checkout() {
	const { user } = useAuth();
	const { cart } = useCart();
	const navigate = useNavigate();
	const [form, setForm] = useState({ shippingName: user?.fullName || '', shippingPhone: user?.phone || '', shippingAddress: '', shippingCity: '', shippingPostalCode: '', shippingCountry: 'Bangladesh' });
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	async function submit(event) {
		event.preventDefault();
		setSaving(true);
		try {
			await orderService.createOrder({ userId: user.id, ...form });
			navigate('/orders');
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	}

	return <section><h1 style={{ color: '#0f4c81' }}>Checkout</h1><p>Total: ৳{Number(cart.subTotal || 0).toLocaleString()}</p><form onSubmit={submit} style={formStyle}>{Object.entries(form).map(([key, value]) => <input key={key} required={key !== 'shippingPostalCode'} placeholder={key.replace('shipping', '')} value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} style={inputStyle} />)}{error && <div style={{ color: '#b42318' }}>{error}</div>}<button disabled={saving} style={buttonStyle}>{saving ? 'Placing order...' : 'Place order'}</button></form></section>;
}

const formStyle = { display: 'grid', gap: 12, maxWidth: 620, background: '#fff', padding: 20, borderRadius: 10 };
const inputStyle = { padding: 11, border: '1px solid #dbe2ea', borderRadius: 7 };
const buttonStyle = { border: 0, padding: 12, borderRadius: 7, background: '#0f4c81', color: '#fff', fontWeight: 700 };
