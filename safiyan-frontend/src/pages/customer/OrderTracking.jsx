import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';

export default function OrderTracking() {
	const { id } = useParams();
	const [order, setOrder] = useState(null);
	useEffect(() => { orderService.getOrder(id).then(setOrder).catch(() => setOrder(null)); }, [id]);
	if (!order) return <p>Loading order...</p>;
	return <section><h1 style={{ color: '#0f4c81' }}>Order Tracking</h1><p>{order.orderNumber}</p><strong>Status: {order.status}</strong><p>Payment: {order.paymentStatus}</p></section>;
}
