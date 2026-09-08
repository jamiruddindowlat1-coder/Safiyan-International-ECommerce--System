import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';

export default function OrderHistory() {
	const { user } = useAuth();
	const [orders, setOrders] = useState([]);
	const [error, setError] = useState('');
	useEffect(() => { if (user?.id) orderService.getUserOrders(user.id).then(setOrders).catch((requestError) => setError(requestError.message)); }, [user?.id]);
	return <section><h1 style={{ color: '#0f4c81' }}>Order History</h1>{error && <p style={{ color: '#b42318' }}>{error}</p>}{orders.map((order) => <div key={order.id} style={rowStyle}><strong>{order.orderNumber}</strong><span>৳{Number(order.totalAmount).toLocaleString()}</span><span>{order.status}</span><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>)}{!orders.length && <p>No orders found.</p>}</section>;
}

const rowStyle = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 12, background: '#fff', padding: 14, marginBottom: 8, borderRadius: 8 };
