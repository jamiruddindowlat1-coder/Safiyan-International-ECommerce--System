import { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';

export default function VendorOrders() {
	const [orders, setOrders] = useState([]);
	useEffect(() => { orderService.getOrders().then(setOrders).catch(() => setOrders([])); }, []);
	return <section><h1 style={{ color: '#0f4c81' }}>Vendor Orders</h1><div style={{ display: 'grid', gap: 8 }}>{orders.map((order) => <div key={order.id} style={rowStyle}><strong>{order.orderNumber}</strong><span>{order.customerName}</span><span>৳{Number(order.totalAmount).toLocaleString()}</span><span>{order.status}</span></div>)}</div></section>;
}

const rowStyle = { display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', background: '#fff', padding: 14, borderRadius: 8 };
