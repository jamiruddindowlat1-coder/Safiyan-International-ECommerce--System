import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { SIES_BRANDING } from '../../config/branding';

export default function PaymentResult() {
    const [searchParams] = useSearchParams();

    const status = (
        searchParams.get('status') || 'pending'
    ).toLowerCase();

    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const isSuccess =
        status === 'success' ||
        status === 'paid';

    const isFailed =
        status === 'failed' ||
        status === 'cancelled' ||
        status === 'canceled';

    const isPending = !isSuccess && !isFailed;

    let icon;
    let title;
    let message;

    if (isSuccess) {
        icon = (
            <CheckCircle
                size={72}
                strokeWidth={1.8}
            />
        );

        title = 'Payment Successful';

        message =
            'Your payment has been received and your order has been placed successfully.';
    } else if (isFailed) {
        icon = (
            <XCircle
                size={72}
                strokeWidth={1.8}
            />
        );

        title =
            status === 'cancelled' ||
            status === 'canceled'
                ? 'Payment Cancelled'
                : 'Payment Failed';

        message =
            status === 'cancelled' ||
            status === 'canceled'
                ? 'The payment process was cancelled. Your order was not completed.'
                : 'We could not complete your payment. Please try again.';
    } else {
        icon = (
            <Clock
                size={72}
                strokeWidth={1.8}
            />
        );

        title = 'Payment Processing';

        message =
            'Your order has been received and the payment is currently being processed.';
    }

    const iconColor = isSuccess
        ? '#16a34a'
        : isFailed
            ? '#dc2626'
            : SIES_BRANDING.colors.accentGold;

    return (
        <section style={pageStyle}>
            <div style={cardStyle}>
                <img
                    src={SIES_BRANDING.logo}
                    alt={SIES_BRANDING.shortName}
                    style={logoStyle}
                />

                <div
                    style={{
                        color: iconColor,
                        marginBottom: 15,
                    }}
                >
                    {icon}
                </div>

                <h1
                    style={{
                        ...titleStyle,
                        color: SIES_BRANDING.colors.primary,
                    }}
                >
                    {title}
                </h1>

                <p style={messageStyle}>
                    {message}
                </p>

                {orderNumber && (
                    <div style={orderBoxStyle}>
                        <span style={labelStyle}>
                            Order Number
                        </span>

                        <strong>
                            {orderNumber}
                        </strong>

                        {orderId && (
                            <small style={smallStyle}>
                                Order ID: {orderId}
                            </small>
                        )}
                    </div>
                )}

                <div style={actionsStyle}>
                    {isSuccess && (
                        <Link
                            to="/orders"
                            style={{
                                ...primaryButtonStyle,
                                background:
                                    SIES_BRANDING.colors.primary,
                            }}
                        >
                            View My Orders
                        </Link>
                    )}

                    {isFailed && (
                        <Link
                            to="/checkout"
                            style={{
                                ...primaryButtonStyle,
                                background:
                                    SIES_BRANDING.colors.primary,
                            }}
                        >
                            Try Payment Again
                        </Link>
                    )}

                    {isPending && (
                        <Link
                            to="/orders"
                            style={{
                                ...primaryButtonStyle,
                                background:
                                    SIES_BRANDING.colors.primary,
                            }}
                        >
                            View Order
                        </Link>
                    )}

                    <Link
                        to="/home"
                        style={secondaryButtonStyle}
                    >
                        <ArrowLeft size={17} />
                        Continue Shopping
                    </Link>
                </div>

                <p style={brandTextStyle}>
                    {SIES_BRANDING.name}
                </p>
            </div>
        </section>
    );
}

const pageStyle = {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
};

const cardStyle = {
    width: '100%',
    maxWidth: 620,
    background: '#fff',
    borderRadius: 16,
    padding: '40px 30px',
    textAlign: 'center',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
};

const logoStyle = {
    width: 90,
    height: 90,
    objectFit: 'contain',
    marginBottom: 20,
};

const titleStyle = {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
};

const messageStyle = {
    maxWidth: 500,
    margin: '15px auto 25px',
    color: '#667085',
    lineHeight: 1.7,
};

const orderBoxStyle = {
    background: '#f5f8fb',
    border: '1px solid #e1e8ef',
    borderRadius: 10,
    padding: 16,
    marginBottom: 25,
};

const labelStyle = {
    display: 'block',
    color: '#667085',
    fontSize: 13,
    marginBottom: 5,
};

const smallStyle = {
    display: 'block',
    color: '#98a2b3',
    marginTop: 5,
};

const actionsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
};

const primaryButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    borderRadius: 8,
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
};

const secondaryButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '12px 20px',
    borderRadius: 8,
    border: '1px solid #d0d5dd',
    color: '#344054',
    background: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
};

const brandTextStyle = {
    marginTop: 30,
    color: '#98a2b3',
    fontSize: 12,
};

