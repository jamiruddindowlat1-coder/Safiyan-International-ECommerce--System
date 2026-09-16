import { useEffect, useState } from 'react';
import AdminExportActions from '../../components/common/AdminExportActions';
import { apiRequest } from '../../config/api';

const statuses = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned'
];

const paymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

const statusValue = (s) => {
  if (typeof s === 'number') {
    return statuses[s] || 'Pending';
  }

  if (typeof s === 'string') {
    const match = statuses.find(
      (st) => st.toLowerCase() === s.toLowerCase()
    );

    return match || 'Pending';
  }

  return 'Pending';
};

const paymentStatusValue = (s) => {
  if (typeof s === 'number') {
    return paymentStatuses[s] || 'Pending';
  }

  if (typeof s === 'string') {
    const match = paymentStatuses.find(
      (st) => st.toLowerCase() === s.toLowerCase()
    );

    return match || 'Pending';
  }

  return 'Pending';
};

/*
 * Must exactly match OrderController.AllowedTransitions
 *
 * Pending    -> Confirmed / Cancelled
 * Confirmed  -> Processing / Cancelled
 * Processing -> Shipped / Cancelled
 * Shipped    -> Delivered / Returned
 * Delivered  -> Returned
 * Cancelled  -> final
 * Returned   -> final
 */
const allowedTransitions = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Returned'],
  Delivered: ['Returned'],
  Cancelled: [],
  Returned: []
};

const statusIndex = (status) => {
  const normalized = statusValue(status);
  return statuses.indexOf(normalized);
};

export default function OrderManage() {
  const [orders, setOrders] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [payUpdating, setPayUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/Order');
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
   * Returns only the statuses that the backend allows
   * from the current order status.
   */
  const getAllowedStatuses = (orderStatus) => {
    const current = statusValue(orderStatus);
    return allowedTransitions[current] || [];
  };

  const update = async (order, nextStatus) => {
    const currentStatus = statusValue(order.status);
    const allowed = getAllowedStatuses(currentStatus);

    // Do not send invalid transitions to backend.
    if (!allowed.includes(nextStatus)) {
      setError(
        `Cannot move an order from ${currentStatus} to ${nextStatus}.`
      );
      return;
    }

    setUpdatingOrderId(order.id);
    setError('');

    try {
      await apiRequest(`/Order/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusIndex(nextStatus)
        })
      });

      await load();

      if (viewing?.id === order.id) {
        setViewing((current) => ({
          ...current,
          status: nextStatus
        }));

        setConfirmCancel(false);
      }
    } catch (e) {
      setError(
        e?.message ||
          `Failed to change order status from ${currentStatus} to ${nextStatus}.`
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const markAsPaid = async () => {
    if (!viewing) return;

    setPayUpdating(true);
    setError('');

    try {
      await apiRequest(`/Order/${viewing.id}/payment-status`, {
        method: 'PATCH',
        body: JSON.stringify({
          paymentStatus: 1
        })
      });

      setViewing((current) => ({
        ...current,
        paymentStatus: 1
      }));

      await load();
    } catch (e) {
      setError(e?.message || 'Failed to update payment status.');
    } finally {
      setPayUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!viewing) return;

    const currentStatus = statusValue(viewing.status);

    // Backend allows cancellation only from these statuses.
    const canCancel = ['Pending', 'Confirmed', 'Processing'].includes(
      currentStatus
    );

    if (!canCancel) {
      setError(
        `Order cannot be cancelled from ${currentStatus} status.`
      );
      setConfirmCancel(false);
      return;
    }

    setCancelling(true);
    setError('');

    try {
      await apiRequest(`/Order/${viewing.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusIndex('Cancelled')
        })
      });

      /*
       * Backend automatically restores product stock
       * when status becomes Cancelled.
       */
      setViewing((current) => ({
        ...current,
        status: 'Cancelled'
      }));

      setConfirmCancel(false);

      await load();
    } catch (e) {
      setError(e?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const rows = orders.map((o) => ({
    ID: o.orderNumber || o.id,
    Customer: o.customerName,
    Total: o.totalAmount,
    Status: statusValue(o.status),
    Payment: paymentStatusValue(o.paymentStatus),
    Date: new Date(o.createdAt).toLocaleString()
  }));

  const currentViewingStatus = viewing
    ? statusValue(viewing.status)
    : '';

  const isPaid =
    viewing &&
    paymentStatusValue(viewing.paymentStatus) === 'Paid';

  const isCancelled =
    viewing &&
    currentViewingStatus === 'Cancelled';

  const isReturned =
    viewing &&
    currentViewingStatus === 'Returned';

  const isDelivered =
    viewing &&
    currentViewingStatus === 'Delivered';

  const canCancel =
    viewing &&
    ['Pending', 'Confirmed', 'Processing'].includes(
      currentViewingStatus
    );

  const canChangeStatus =
    viewing &&
    getAllowedStatuses(currentViewingStatus).length > 0;

  return (
    <div>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Order Management</h1>

          <p style={mutedStyle}>
            Real order data with complete details and status updates.
          </p>
        </div>

        <AdminExportActions
          filename="orders"
          title="Orders Report"
          rows={rows}
        />
      </header>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <section style={panelStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={tdStyle}>
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      ...tdStyle,
                      textAlign: 'center',
                      padding: 30
                    }}
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const currentStatus = statusValue(o.status);
                  const nextStatuses =
                    getAllowedStatuses(currentStatus);

                  const isUpdating =
                    updatingOrderId === o.id;

                  return (
                    <tr key={o.id}>
                      <td style={tdStyle}>
                        {o.orderNumber}
                      </td>

                      <td style={tdStyle}>
                        {o.customerName}
                      </td>

                      <td style={tdStyle}>
                        ৳
                        {Number(
                          o.totalAmount || 0
                        ).toLocaleString()}
                      </td>

                      <td style={tdStyle}>
                        {nextStatuses.length > 0 ? (
                          <select
                            value={currentStatus}
                            disabled={isUpdating}
                            onChange={(e) =>
                              update(
                                o,
                                e.target.value
                              )
                            }
                            style={selectStyle}
                          >
                            <option value={currentStatus}>
                              {currentStatus}
                            </option>

                            {nextStatuses.map(
                              (nextStatus) => (
                                <option
                                  key={nextStatus}
                                  value={nextStatus}
                                >
                                  {nextStatus}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <span
                            style={statusBadgeStyle(
                              currentStatus
                            )}
                          >
                            {currentStatus}
                          </span>
                        )}

                        {isUpdating && (
                          <span
                            style={{
                              marginLeft: 8,
                              color: '#9fb6cc',
                              fontSize: 12
                            }}
                          >
                            Updating...
                          </span>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={payBadgeStyle(
                            paymentStatusValue(
                              o.paymentStatus
                            )
                          )}
                        >
                          {paymentStatusValue(
                            o.paymentStatus
                          )}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {new Date(
                          o.createdAt
                        ).toLocaleString()}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display: 'flex',
                            gap: 6
                          }}
                        >
                          <button
                            onClick={async () => {
                              setConfirmCancel(false);
                              setError('');

                              try {
                                const detail =
                                  await apiRequest(
                                    `/Order/${o.id}`
                                  );

                                setViewing(detail);
                              } catch (e) {
                                setError(
                                  e?.message ||
                                    'Failed to load order details.'
                                );
                              }
                            }}
                            style={miniButton}
                          >
                            View
                          </button>

                          {['Pending', 'Confirmed', 'Processing'].includes(
                            currentStatus
                          ) && (
                            <button
                              onClick={async () => {
                                setConfirmCancel(false);
                                setError('');

                                try {
                                  const detail =
                                    await apiRequest(
                                      `/Order/${o.id}`
                                    );

                                  setViewing(detail);
                                  setConfirmCancel(true);
                                } catch (e) {
                                  setError(
                                    e?.message ||
                                      'Failed to load order details.'
                                  );
                                }
                              }}
                              style={cancelMiniButton}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewing && (
        <div style={modalBackdrop}>
          <div style={modalStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                gap: 12
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: '#62b7f5'
                }}
              >
                {viewing.orderNumber}
              </h2>

              <span
                style={statusBadgeStyle(
                  currentViewingStatus
                )}
              >
                {currentViewingStatus}
              </span>
            </div>

            <div style={infoGrid}>
              <div style={infoBlock}>
                <span style={infoLabel}>
                  Customer
                </span>

                <span>
                  {viewing.customerName || '-'}
                </span>
              </div>

              <div style={infoBlock}>
                <span style={infoLabel}>
                  Total
                </span>

                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 18
                  }}
                >
                  ৳
                  {Number(
                    viewing.totalAmount || 0
                  ).toLocaleString()}
                </span>
              </div>

              <div style={infoBlock}>
                <span style={infoLabel}>
                  Payment Status
                </span>

                <span
                  style={payBadgeStyle(
                    paymentStatusValue(
                      viewing.paymentStatus
                    )
                  )}
                >
                  {paymentStatusValue(
                    viewing.paymentStatus
                  )}
                </span>
              </div>

              <div style={infoBlock}>
                <span style={infoLabel}>
                  Shipping To
                </span>

                <span>
                  {viewing.shippingName || '-'}
                  {' — '}
                  {viewing.shippingPhone || '-'}
                </span>
              </div>

              <div
                style={{
                  ...infoBlock,
                  gridColumn: 'span 2'
                }}
              >
                <span style={infoLabel}>
                  Address
                </span>

                <span>
                  {[
                    viewing.shippingAddress,
                    viewing.shippingCity,
                    viewing.shippingPostalCode,
                    viewing.shippingCountry
                  ]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </span>
              </div>
            </div>

            <h3
              style={{
                margin: '18px 0 8px',
                color: '#9fb6cc'
              }}
            >
              Items
            </h3>

            <ul
              style={{
                margin: 0,
                paddingLeft: 18
              }}
            >
              {(viewing.items || []).map((item) => (
                <li
                  key={item.id}
                  style={{
                    marginBottom: 6
                  }}
                >
                  {item.productName} ×{' '}
                  {item.quantity} —{' '}
                  <strong>
                    ৳
                    {Number(
                      item.totalPrice || 0
                    ).toLocaleString()}
                  </strong>
                </li>
              ))}
            </ul>

            {/* Status Transition Information */}
            {canChangeStatus && (
              <div style={transitionBox}>
                <div
                  style={{
                    color: '#9fb6cc',
                    fontSize: 12,
                    marginBottom: 7,
                    fontWeight: 600
                  }}
                >
                  NEXT ALLOWED STATUS
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap'
                  }}
                >
                  {getAllowedStatuses(
                    currentViewingStatus
                  ).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      disabled={
                        updatingOrderId === viewing.id
                      }
                      onClick={() =>
                        update(
                          viewing,
                          nextStatus
                        )
                      }
                      style={
                        nextStatus === 'Cancelled'
                          ? cancelTransitionButton
                          : transitionButton
                      }
                    >
                      {updatingOrderId === viewing.id
                        ? 'Updating...'
                        : `Move to ${nextStatus}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel Confirmation */}
            {confirmCancel &&
              canCancel &&
              !isCancelled && (
                <div style={confirmBox}>
                  <p
                    style={{
                      margin: '0 0 12px',
                      fontWeight: 600,
                      color: '#fbbf24'
                    }}
                  >
                    ⚠️ এই order টি cancel করবেন?
                    এটি পূর্বাবস্থায় ফেরানো যাবে না।
                  </p>

                  <p
                    style={{
                      margin: '0 0 12px',
                      color: '#d1d5db',
                      fontSize: 13
                    }}
                  >
                    Order cancel হলে backend
                    automatically এই order-এর
                    product quantity stock-এ ফেরত
                    দেবে।
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 10
                    }}
                  >
                    <button
                      onClick={cancelOrder}
                      disabled={cancelling}
                      style={confirmCancelBtn}
                    >
                      {cancelling
                        ? 'Cancelling...'
                        : 'হ্যাঁ, Cancel করুন'}
                    </button>

                    <button
                      onClick={() =>
                        setConfirmCancel(false)
                      }
                      style={abortBtn}
                    >
                      না, ফিরে যান
                    </button>
                  </div>
                </div>
              )}

            {isCancelled && (
              <div style={cancelledBanner}>
                🚫 এই order টি cancel করা হয়েছে
                <br />
                <small>
                  Product stock backend থেকে
                  automatically restored হয়েছে।
                </small>
              </div>
            )}

            {isReturned && (
              <div style={returnedBanner}>
                ↩️ এই order টি returned হয়েছে
                <br />
                <small>
                  Product stock backend থেকে
                  automatically restored হয়েছে।
                </small>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 22,
                flexWrap: 'wrap'
              }}
            >
              {!isPaid &&
                !isCancelled &&
                !isReturned && (
                  <button
                    onClick={markAsPaid}
                    disabled={payUpdating}
                    style={paidButtonStyle}
                  >
                    {payUpdating
                      ? 'Updating...'
                      : '✅ Mark as Paid'}
                  </button>
                )}

              {isPaid && (
                <span style={paidBadge}>
                  ✔ Payment Confirmed
                </span>
              )}

              {canCancel &&
                !confirmCancel && (
                  <button
                    onClick={() =>
                      setConfirmCancel(true)
                    }
                    style={cancelButtonStyle}
                  >
                    🚫 Cancel Order
                  </button>
                )}

              <button
                onClick={() => {
                  setViewing(null);
                  setConfirmCancel(false);
                  setError('');
                }}
                style={closeButtonStyle}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const statusBadgeStyle = (status) => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 700,

  background:
    status === 'Delivered'
      ? '#166534'
      : status === 'Cancelled'
        ? '#7f1d1d'
        : status === 'Returned'
          ? '#78350f'
          : status === 'Shipped'
            ? '#1e3a5f'
            : status === 'Confirmed'
              ? '#164e63'
              : '#1e3a2f',

  color:
    status === 'Delivered'
      ? '#86efac'
      : status === 'Cancelled'
        ? '#fca5a5'
        : status === 'Returned'
          ? '#fed7aa'
          : status === 'Shipped'
            ? '#93c5fd'
            : status === 'Confirmed'
              ? '#a5f3fc'
              : '#6ee7b7'
});

const payBadgeStyle = (status) => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,

  background:
    status === 'Paid'
      ? '#dcfce7'
      : status === 'Failed'
        ? '#fee2e2'
        : status === 'Refunded'
          ? '#fef9c3'
          : '#e0f2fe',

  color:
    status === 'Paid'
      ? '#16a34a'
      : status === 'Failed'
        ? '#dc2626'
        : status === 'Refunded'
          ? '#ca8a04'
          : '#0369a1'
});

const titleStyle = {
  fontSize: 28,
  fontWeight: 800,
  color: '#62b7f5',
  margin: 0
};

const mutedStyle = {
  color: '#9fb6cc',
  fontSize: 14
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 18
};

const panelStyle = {
  background: '#0d1b2e',
  borderRadius: 18,
  padding: 18
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const thStyle = {
  padding: '12px 10px',
  textAlign: 'left',
  color: '#9fb6cc'
};

const tdStyle = {
  padding: '12px 10px',
  color: '#e5eef8',
  borderBottom: '1px solid #203852',
  whiteSpace: 'nowrap'
};

const selectStyle = {
  padding: 7,
  border: '1px solid #345',
  borderRadius: 7,
  background: '#132840',
  color: '#e5eef8',
  cursor: 'pointer'
};

const miniButton = {
  border: '1px solid #345',
  background: '#132840',
  color: '#e5eef8',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 13
};

const cancelMiniButton = {
  border: '1px solid #7f1d1d',
  background: '#450a0a',
  color: '#fca5a5',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 13
};

const errorStyle = {
  background: '#fef3f2',
  color: '#b42318',
  padding: 12,
  borderRadius: 8,
  marginBottom: 18
};

const modalBackdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.6)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 20
};

const modalStyle = {
  background: '#0d1b2e',
  color: '#e5eef8',
  borderRadius: 12,
  padding: 24,
  width: 'min(680px,90vw)',
  maxHeight: '85vh',
  overflow: 'auto'
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px 24px'
};

const infoBlock = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2
};

const infoLabel = {
  color: '#9fb6cc',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const transitionBox = {
  marginTop: 18,
  background: '#10243a',
  border: '1px solid #294764',
  borderRadius: 10,
  padding: 14
};

const transitionButton = {
  border: 'none',
  background: 'linear-gradient(90deg,#0f4c81,#14919b)',
  color: '#fff',
  borderRadius: 8,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer'
};

const cancelTransitionButton = {
  border: 'none',
  background: '#7f1d1d',
  color: '#fca5a5',
  borderRadius: 8,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer'
};

const paidButtonStyle = {
  border: 'none',
  background: 'linear-gradient(90deg,#16a34a,#14919b)',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 18px',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 14
};

const paidBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  background: '#dcfce7',
  color: '#16a34a',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
  fontSize: 14
};

const cancelButtonStyle = {
  border: 'none',
  background: '#7f1d1d',
  color: '#fca5a5',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer'
};

const closeButtonStyle = {
  border: 'none',
  background: 'linear-gradient(90deg,#0f4c81,#14919b)',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer'
};

const confirmBox = {
  marginTop: 18,
  background: '#1c2e1c',
  border: '1px solid #365436',
  borderRadius: 10,
  padding: 16
};

const confirmCancelBtn = {
  border: 'none',
  background: '#7f1d1d',
  color: '#fca5a5',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 700,
  cursor: 'pointer'
};

const abortBtn = {
  border: '1px solid #345',
  background: '#132840',
  color: '#e5eef8',
  borderRadius: 8,
  padding: '8px 16px',
  cursor: 'pointer'
};

const cancelledBanner = {
  marginTop: 16,
  background: '#450a0a',
  border: '1px solid #7f1d1d',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#fca5a5',
  fontWeight: 600,
  textAlign: 'center'
};

const returnedBanner = {
  marginTop: 16,
  background: '#451a03',
  border: '1px solid #92400e',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#fed7aa',
  fontWeight: 600,
  textAlign: 'center'
};

