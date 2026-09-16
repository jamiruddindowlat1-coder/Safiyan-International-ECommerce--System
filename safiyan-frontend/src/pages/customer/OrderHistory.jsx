import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';

const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const paymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
const statusValue = s => typeof s === 'number' ? statuses[s] || 'Pending' : s;
const paymentStatusValue = s => typeof s === 'number' ? paymentStatuses[s] || 'Pending' : s;

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (user?.id) orderService.getUserOrders(user.id).then(setOrders).catch(e => setError(e.message));
  }, [user?.id]);

  const openDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const data = await orderService.getOrder(orderId);
      setViewing(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: '#0f4c81', marginBottom: 20 }}>Order History</h1>

      {error && <p style={{ color: '#b42318', background: '#fef3f2', padding: 12, borderRadius: 8 }}>{error}</p>}

      {/* Header Row */}
      {orders.length > 0 && (
        <div style={headerRowStyle}>
          <span>Order</span>
          <span>Total</span>
          <span>Status</span>
          <span>Date</span>
          <span></span>
        </div>
      )}

      {orders.map(order => (
        <div key={order.id} style={rowStyle}>
          <strong style={{ color: '#0f4c81' }}>{order.orderNumber}</strong>
          <span>৳{Number(order.totalAmount).toLocaleString()}</span>
          <span style={statusBadge(statusValue(order.status))}>{statusValue(order.status)}</span>
          <span style={{ color: '#64748b', fontSize: 13 }}>{new Date(order.createdAt).toLocaleDateString()}</span>
          <button onClick={() => openDetail(order.id)} style={detailBtnStyle}>
            বিস্তারিত দেখুন
          </button>
        </div>
      ))}

      {!orders.length && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <p style={{ fontSize: 18 }}>কোনো অর্ডার পাওয়া যায়নি।</p>
        </div>
      )}

      {/* Detail Modal */}
      {(viewing || detailLoading) && (
        <div style={modalBackdrop} onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div style={modalStyle}>
            {detailLoading ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>লোড হচ্ছে...</p>
            ) : viewing && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <h2 style={{ margin: 0, color: '#0f4c81' }}>{viewing.orderNumber}</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{new Date(viewing.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setViewing(null)} style={closeBtnStyle}>✕</button>
                </div>

                <div style={infoGrid}>
                  <div style={infoBlock}>
                    <span style={infoLabel}>মোট মূল্য</span>
                    <span style={{ fontWeight: 700, fontSize: 20, color: '#0f4c81' }}>৳{Number(viewing.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div style={infoBlock}>
                    <span style={infoLabel}>অর্ডার স্ট্যাটাস</span>
                    <span style={statusBadge(statusValue(viewing.status))}>{statusValue(viewing.status)}</span>
                  </div>
                  <div style={infoBlock}>
                    <span style={infoLabel}>পেমেন্ট স্ট্যাটাস</span>
                    <span style={payBadge(paymentStatusValue(viewing.paymentStatus))}>{paymentStatusValue(viewing.paymentStatus)}</span>
                  </div>
                  <div style={infoBlock}>
                    <span style={infoLabel}>শিপিং ঠিকানা</span>
                    <span style={{ fontSize: 13 }}>{[viewing.shippingAddress, viewing.shippingCity, viewing.shippingPostalCode, viewing.shippingCountry].filter(Boolean).join(', ') || '-'}</span>
                  </div>
                  <div style={infoBlock}>
                    <span style={infoLabel}>প্রাপক</span>
                    <span style={{ fontSize: 13 }}>{viewing.shippingName || '-'} — {viewing.shippingPhone || '-'}</span>
                  </div>
                </div>

                <h3 style={{ margin: '20px 0 10px', color: '#0f4c81', fontSize: 16 }}>অর্ডারের পণ্যসমূহ</h3>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {(viewing.items || []).map((item, idx) => (
                    <div key={item.id} style={{ ...itemRowStyle, background: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                      <span style={{ fontWeight: 600 }}>{item.productName}</span>
                      <span style={{ color: '#64748b' }}>× {item.quantity}</span>
                      <span style={{ fontWeight: 700, color: '#0f4c81' }}>৳{Number(item.totalPrice).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, padding: '12px 16px', background: '#f1f5f9', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>সর্বমোট</span>
                  <strong style={{ color: '#0f4c81', fontSize: 18 }}>৳{Number(viewing.totalAmount || 0).toLocaleString()}</strong>
                </div>

                <button onClick={() => setViewing(null)} style={closeBtnFullStyle}>বন্ধ করুন</button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const statusBadge = status => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
  background: status === 'Delivered' ? '#dcfce7' : status === 'Cancelled' ? '#fee2e2' : status === 'Shipped' ? '#dbeafe' : '#fef9c3',
  color: status === 'Delivered' ? '#16a34a' : status === 'Cancelled' ? '#dc2626' : status === 'Shipped' ? '#1d4ed8' : '#92400e',
});

const payBadge = status => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
  background: status === 'Paid' ? '#dcfce7' : status === 'Failed' ? '#fee2e2' : '#e0f2fe',
  color: status === 'Paid' ? '#16a34a' : status === 'Failed' ? '#dc2626' : '#0369a1',
});

const headerRowStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12, padding: '8px 14px', color: '#64748b', fontSize: 13, fontWeight: 600 };
const rowStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', background: '#fff', padding: 14, marginBottom: 8, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const detailBtnStyle = { border: '1px solid #0f4c81', background: '#fff', color: '#0f4c81', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 50 };
const modalStyle = { background: '#fff', borderRadius: 14, padding: 24, width: 'min(640px, 92vw)', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' };
const infoBlock = { display: 'flex', flexDirection: 'column', gap: 4 };
const infoLabel = { color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' };
const itemRowStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, padding: '10px 14px', alignItems: 'center' };
const closeBtnStyle = { border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const closeBtnFullStyle = { marginTop: 18, width: '100%', border: 'none', background: 'linear-gradient(90deg,#0f4c81,#14919b)', color: '#fff', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' };
