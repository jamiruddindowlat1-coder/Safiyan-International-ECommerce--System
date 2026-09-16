import { SIES_BRANDING } from '../../config/branding';

/**
 * Visual status timeline for an order.
 *
 * Usage:
 *   <OrderTrackingTimeline status={order.status} />
 *
 * `status` should be one of the OrderStatus enum string values
 * as returned by the backend: Pending, Confirmed, Processing,
 * Shipped, Delivered, Cancelled, Returned.
 */

const HAPPY_PATH = [
    { key: 'Pending', label: 'Order Placed' },
    { key: 'Confirmed', label: 'Confirmed' },
    { key: 'Processing', label: 'Processing' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Delivered', label: 'Delivered' },
];

export default function OrderTrackingTimeline({ status }) {
    const isTerminalNegative =
        status === 'Cancelled' || status === 'Returned';

    if (isTerminalNegative) {
        return (
            <div style={negativeWrapStyle}>
                <span style={negativeDotStyle}>✕</span>
                <div>
                    <strong style={{ color: '#b42318' }}>
                        {status === 'Cancelled'
                            ? 'Order Cancelled'
                            : 'Order Returned'}
                    </strong>
                    <div style={mutedStyle}>
                        This order did not complete the normal delivery flow.
                    </div>
                </div>
            </div>
        );
    }

    const currentIndex = HAPPY_PATH.findIndex((step) => step.key === status);

    return (
        <div style={timelineStyle}>
            {HAPPY_PATH.map((step, index) => {
                const isDone = index <= currentIndex;
                const isCurrent = index === currentIndex;

                return (
                    <div key={step.key} style={stepStyle}>
                        <div style={stepIndicatorColumnStyle}>
                            <div
                                style={{
                                    ...dotStyle,
                                    background: isDone
                                        ? SIES_BRANDING.colors.primary
                                        : '#e4e7ec',
                                    borderColor: isCurrent
                                        ? SIES_BRANDING.colors.primary
                                        : 'transparent',
                                }}
                            >
                                {isDone ? '✓' : ''}
                            </div>

                            {index < HAPPY_PATH.length - 1 && (
                                <div
                                    style={{
                                        ...lineStyle,
                                        background: isDone
                                            ? SIES_BRANDING.colors.primary
                                            : '#e4e7ec',
                                    }}
                                />
                            )}
                        </div>

                        <div style={labelWrapStyle}>
                            <strong
                                style={{
                                    color: isDone ? '#1d2939' : '#98a2b3',
                                }}
                            >
                                {step.label}
                            </strong>

                            {isCurrent && (
                                <div
                                    style={{
                                        ...mutedStyle,
                                        color: SIES_BRANDING.colors.primary,
                                    }}
                                >
                                    Current status
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const timelineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
};

const stepStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
};

const stepIndicatorColumnStyle = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
};

const dotStyle = {
    width: 28,
    height: 28,
    minWidth: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    border: '2px solid',
    margin: '0 auto',
};

const lineStyle = {
    height: 3,
    flex: 1,
    marginLeft: -4,
    marginRight: -4,
};

const labelWrapStyle = {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
};

const mutedStyle = {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
};

const negativeWrapStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: '#fef3f2',
    borderRadius: 10,
};

const negativeDotStyle = {
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: '50%',
    background: '#b42318',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
};
