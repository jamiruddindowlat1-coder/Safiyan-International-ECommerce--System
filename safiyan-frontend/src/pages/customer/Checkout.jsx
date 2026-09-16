import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { SIES_BRANDING } from '../../config/branding';
import stripePromise from '../../config/stripe';
import StripeCheckoutForm from '../../components/Payments/Payments';

export default function Checkout() {
    const { user } = useAuth();
    const { cart } = useCart();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        shippingName: user?.fullName || user?.name || '',
        shippingPhone: user?.phone || '',
        shippingAddress: '',
        shippingCity: '',
        shippingPostalCode: '',
        shippingCountry: 'Bangladesh',
    });

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // --------------------------------------------------------
    // Stripe state
    // --------------------------------------------------------
    const [stripeClientSecret, setStripeClientSecret] = useState(null);
    const [pendingOrder, setPendingOrder] = useState(null);
    // pendingOrder shape: { id, orderNumber }

    // --------------------------------------------------------
    // Coupon state
    // --------------------------------------------------------
    const [couponInput, setCouponInput] = useState('');
    const [couponApplying, setCouponApplying] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    // appliedCoupon shape: { code, discountAmount, description }

    const subTotal = Number(cart?.subTotal || 0);
    const discountAmount = Number(appliedCoupon?.discountAmount || 0);
    const total = Math.max(subTotal - discountAmount, 0);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function applyCoupon() {
        const code = couponInput.trim();

        if (!code) {
            setCouponError('Please enter a coupon code.');
            return;
        }

        setCouponError('');
        setCouponApplying(true);

        try {
            const result = await orderService.validateCoupon({
                couponCode: code,
                subTotal,
            });

            if (!result?.valid) {
                setAppliedCoupon(null);
                setCouponError(
                    result?.message || 'This coupon code is not valid.'
                );
                return;
            }

            setAppliedCoupon({
                code: result.code || code,
                discountAmount: Number(result.discountAmount || 0),
                description: result.description || '',
            });
            setCouponError('');
        } catch (requestError) {
            setAppliedCoupon(null);
            setCouponError(
                requestError?.message ||
                    'Unable to apply coupon. Please try again.'
            );
        } finally {
            setCouponApplying(false);
        }
    }

    function removeCoupon() {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponError('');
    }

    async function submit(event) {
        event.preventDefault();

        if (!user?.id) {
            setError('Please sign in before placing an order.');
            return;
        }

        if (!cart?.items?.length) {
            setError('Your cart is empty.');
            return;
        }

        setError('');
        setSaving(true);

        try {
            const orderPayload = {
                userId: user.id,

                ...form,

                paymentMethod,

                ...(appliedCoupon?.code
                    ? { couponCode: appliedCoupon.code }
                    : {}),

                items: cart.items.map((item) => ({
                    productId: item.productId ?? item.product?.id,
                    quantity: item.quantity,
                })),
            };

            const result = await orderService.createOrder(orderPayload);

            const orderId =
                result?.order?.id ??
                result?.id ??
                result?.orderId;

            const orderNumber =
                result?.order?.orderNumber ??
                result?.orderNumber;

            /*
             * For gateway payments the backend returns a gateway URL,
             * nested inside `payment` (not top-level).
             * Redirect the customer directly to the payment gateway.
             */
            const gatewayUrl =
                result?.payment?.gatewayPageUrl ??
                result?.payment?.gatewayPageURL ??
                result?.payment?.paymentUrl ??
                result?.payment?.redirectUrl;

            if (gatewayUrl) {
                window.location.href = gatewayUrl;
                return;
            }

            /*
             * Stripe returns a client secret, nested inside `payment`
             * (not top-level). Show the embedded card form
             * (Stripe Elements) instead of navigating away.
             */
            const clientSecret = result?.payment?.clientSecret;

            if (clientSecret) {
                setPendingOrder({ id: orderId, orderNumber });
                setStripeClientSecret(clientSecret);
                return;
            }

            /*
             * COD or any order that does not require an external gateway.
             */
            navigate(
                `/payment-result?status=success&orderId=${encodeURIComponent(
                    orderId || ''
                )}&orderNumber=${encodeURIComponent(
                    orderNumber || ''
                )}`
            );
        } catch (requestError) {
            setError(
                requestError?.message ||
                    'Unable to place the order. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    }

    function handleStripeSuccess() {
        navigate(
            `/payment-result?status=success&orderId=${encodeURIComponent(
                pendingOrder?.id || ''
            )}&orderNumber=${encodeURIComponent(
                pendingOrder?.orderNumber || ''
            )}`
        );
    }

    function handleStripeError(message) {
        setError(message || 'Payment failed. Please try again.');
    }

    return (
        <section style={pageStyle}>
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <img
                        src={SIES_BRANDING.logo}
                        alt={SIES_BRANDING.shortName}
                        style={logoStyle}
                    />

                    <div>
                        <h1
                            style={{
                                ...titleStyle,
                                color: SIES_BRANDING.colors.primary,
                            }}
                        >
                            Checkout
                        </h1>

                        <p style={subtitleStyle}>
                            {SIES_BRANDING.name}
                        </p>
                    </div>
                </div>

                <div style={gridStyle}>
                    {stripeClientSecret ? (
                        <div style={formStyle}>
                            <h2 style={sectionTitleStyle}>
                                Complete Your Payment
                            </h2>

                            <p style={mutedStyle}>
                                Order {pendingOrder?.orderNumber} — enter
                                your card details below to finish paying.
                            </p>

                            <Elements
                                stripe={stripePromise}
                                options={{ clientSecret: stripeClientSecret }}
                            >
                                <StripeCheckoutForm
                                    onSuccess={handleStripeSuccess}
                                    onError={handleStripeError}
                                />
                            </Elements>

                            {error && (
                                <div style={{ ...errorStyle, marginTop: 15 }}>
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={submit} style={formStyle}>
                            <h2 style={sectionTitleStyle}>
                                Shipping Information
                            </h2>

                            <div style={fieldGridStyle}>
                                <Input
                                    name="shippingName"
                                    label="Full Name"
                                    value={form.shippingName}
                                    onChange={handleChange}
                                    required
                                />

                                <Input
                                    name="shippingPhone"
                                    label="Phone"
                                    value={form.shippingPhone}
                                    onChange={handleChange}
                                    required
                                />

                                <Input
                                    name="shippingCity"
                                    label="City"
                                    value={form.shippingCity}
                                    onChange={handleChange}
                                    required
                                />

                                <Input
                                    name="shippingPostalCode"
                                    label="Postal Code"
                                    value={form.shippingPostalCode}
                                    onChange={handleChange}
                                />
                            </div>

                            <label style={labelStyle}>
                                Address
                            </label>

                            <textarea
                                name="shippingAddress"
                                value={form.shippingAddress}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Enter your complete shipping address"
                                style={textareaStyle}
                            />

                            <Input
                                name="shippingCountry"
                                label="Country"
                                value={form.shippingCountry}
                                onChange={handleChange}
                                required
                            />

                            <h2 style={sectionTitleStyle}>
                                Payment Method
                            </h2>

                            <div style={paymentListStyle}>
                                <PaymentOption
                                    value="COD"
                                    title="Cash on Delivery"
                                    description="Pay when your order is delivered."
                                    selected={paymentMethod === 'COD'}
                                    onChange={setPaymentMethod}
                                />

                                <PaymentOption
                                    value="SSLCOMMERZ"
                                    title="SSLCommerz"
                                    description="Pay securely using cards, mobile banking and other supported methods."
                                    selected={paymentMethod === 'SSLCOMMERZ'}
                                    onChange={setPaymentMethod}
                                />

                                <PaymentOption
                                    value="STRIPE"
                                    title="Stripe"
                                    description="Pay securely using Stripe."
                                    selected={paymentMethod === 'STRIPE'}
                                    onChange={setPaymentMethod}
                                />
                            </div>

                            {error && (
                                <div style={errorStyle}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving || !cart?.items?.length}
                                style={{
                                    ...buttonStyle,
                                    backgroundColor:
                                        saving || !cart?.items?.length
                                            ? '#9aa7b4'
                                            : SIES_BRANDING.colors.primary,
                                }}
                            >
                                {saving
                                    ? 'Processing...'
                                    : paymentMethod === 'COD'
                                        ? 'Place Order'
                                        : 'Continue to Payment'}
                            </button>
                        </form>
                    )}

                    <aside style={summaryStyle}>
                        <h2 style={sectionTitleStyle}>
                            Order Summary
                        </h2>

                        <div style={itemsStyle}>
                            {(cart?.items || []).map((item) => (
                                <div
                                    key={item.id ?? item.productId}
                                    style={itemStyle}
                                >
                                    <div>
                                        <strong>
                                            {item.product?.name ||
                                                item.productName ||
                                                'Product'}
                                        </strong>

                                        <div style={mutedStyle}>
                                            Qty: {item.quantity}
                                        </div>
                                    </div>

                                    <strong>
                                        ৳
                                        {(
                                            Number(
                                                item.total ??
                                                    item.lineTotal ??
                                                    (item.unitPrice || 0) *
                                                        item.quantity
                                            ) || 0
                                        ).toLocaleString()}
                                    </strong>
                                </div>
                            ))}
                        </div>

                        <div style={dividerStyle} />

                        <div style={couponSectionStyle}>
                            {appliedCoupon ? (
                                <div style={couponAppliedStyle}>
                                    <div>
                                        <strong style={{ color: '#12b76a' }}>
                                            {appliedCoupon.code}
                                        </strong>{' '}
                                        applied
                                        {appliedCoupon.description ? (
                                            <div style={mutedStyle}>
                                                {appliedCoupon.description}
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={removeCoupon}
                                        style={removeCouponButtonStyle}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div style={couponRowStyle}>
                                    <input
                                        value={couponInput}
                                        onChange={(event) =>
                                            setCouponInput(
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder="Enter coupon code"
                                        style={couponInputStyle}
                                    />

                                    <button
                                        type="button"
                                        onClick={applyCoupon}
                                        disabled={couponApplying}
                                        style={{
                                            ...applyButtonStyle,
                                            backgroundColor:
                                                SIES_BRANDING.colors.primary,
                                            opacity: couponApplying ? 0.7 : 1,
                                        }}
                                    >
                                        {couponApplying ? 'Applying...' : 'Apply'}
                                    </button>
                                </div>
                            )}

                            {couponError && (
                                <div style={couponErrorStyle}>
                                    {couponError}
                                </div>
                            )}
                        </div>

                        <div style={dividerStyle} />

                        <div style={breakdownRowStyle}>
                            <span>Subtotal</span>
                            <span>৳{subTotal.toLocaleString()}</span>
                        </div>

                        {appliedCoupon && (
                            <div
                                style={{
                                    ...breakdownRowStyle,
                                    color: '#12b76a',
                                }}
                            >
                                <span>Coupon Discount</span>
                                <span>
                                    -৳{discountAmount.toLocaleString()}
                                </span>
                            </div>
                        )}

                        <div style={dividerStyle} />

                        <div style={totalRowStyle}>
                            <span>Total</span>

                            <strong
                                style={{
                                    color: SIES_BRANDING.colors.primary,
                                    fontSize: 22,
                                }}
                            >
                                ৳{total.toLocaleString()}
                            </strong>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}

function Input({
    name,
    label,
    value,
    onChange,
    required = false,
}) {
    return (
        <div>
            <label style={labelStyle}>
                {label}
            </label>

            <input
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                style={inputStyle}
            />
        </div>
    );
}

function PaymentOption({
    value,
    title,
    description,
    selected,
    onChange,
}) {
    return (
        <label
            style={{
                ...paymentOptionStyle,
                borderColor: selected
                    ? SIES_BRANDING.colors.primary
                    : '#dbe2ea',
                background: selected
                    ? '#f4f8fb'
                    : '#fff',
            }}
        >
            <input
                type="radio"
                name="paymentMethod"
                value={value}
                checked={selected}
                onChange={() => onChange(value)}
            />

            <div>
                <strong>{title}</strong>

                <div style={mutedStyle}>
                    {description}
                </div>
            </div>
        </label>
    );
}

const pageStyle = {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '30px 20px',
};

const containerStyle = {
    maxWidth: 1180,
    margin: '0 auto',
};

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 25,
};

const logoStyle = {
    width: 64,
    height: 64,
    objectFit: 'contain',
};

const titleStyle = {
    margin: 0,
    fontSize: 30,
};

const subtitleStyle = {
    margin: '4px 0 0',
    color: '#667085',
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
    gap: 22,
    alignItems: 'start',
};

const formStyle = {
    background: '#fff',
    padding: 24,
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
};

const summaryStyle = {
    background: '#fff',
    padding: 24,
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 20,
};

const sectionTitleStyle = {
    margin: '0 0 18px',
    fontSize: 20,
    color: '#1d2939',
};

const fieldGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 15,
};

const labelStyle = {
    display: 'block',
    marginBottom: 7,
    fontWeight: 600,
    color: '#344054',
};

const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    border: '1px solid #dbe2ea',
    borderRadius: 8,
    outline: 'none',
};

const textareaStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: 12,
    border: '1px solid #dbe2ea',
    borderRadius: 8,
    resize: 'vertical',
    marginBottom: 15,
};

const paymentListStyle = {
    display: 'grid',
    gap: 10,
    marginBottom: 20,
};

const paymentOptionStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    border: '1px solid',
    borderRadius: 9,
    cursor: 'pointer',
};

const mutedStyle = {
    marginTop: 4,
    color: '#667085',
    fontSize: 13,
};

const errorStyle = {
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    background: '#fef3f2',
    color: '#b42318',
};

const buttonStyle = {
    width: '100%',
    border: 0,
    padding: 14,
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
};

const itemsStyle = {
    display: 'grid',
    gap: 14,
};

const itemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 15,
    paddingBottom: 12,
    borderBottom: '1px solid #eef2f6',
};

const dividerStyle = {
    height: 1,
    background: '#dbe2ea',
    margin: '16px 0',
};

const totalRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 17,
};

const breakdownRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
    color: '#344054',
    marginBottom: 8,
};

const couponSectionStyle = {
    marginBottom: 4,
};

const couponRowStyle = {
    display: 'flex',
    gap: 8,
};

const couponInputStyle = {
    flex: 1,
    boxSizing: 'border-box',
    padding: '10px 12px',
    border: '1px solid #dbe2ea',
    borderRadius: 8,
    outline: 'none',
    textTransform: 'uppercase',
};

const applyButtonStyle = {
    border: 0,
    padding: '10px 18px',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
};

const couponAppliedStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f0fdf6',
    border: '1px solid #b7ecd0',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
};

const removeCouponButtonStyle = {
    border: 0,
    background: 'transparent',
    color: '#b42318',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
};

const couponErrorStyle = {
    marginTop: 8,
    fontSize: 13,
    color: '#b42318',
};
