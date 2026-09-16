import { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { SIES_BRANDING } from '../../config/branding';

export default function StripeCheckoutForm({ onSuccess, onError }) {
    const stripe = useStripe();
    const elements = useElements();

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setSubmitting(true);
        setMessage('');

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
            confirmParams: {
                return_url: `${window.location.origin}/payment-result`,
            },
        });

        if (error) {
            setMessage(
                error.message || 'Payment failed. Please try again.'
            );
            setSubmitting(false);
            onError?.(error.message);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            onSuccess?.(paymentIntent);
            return;
        }

        setMessage('Your payment is processing.');
        setSubmitting(false);
    }

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <PaymentElement />

            {message && (
                <div
                    style={{
                        marginTop: 12,
                        color: '#b42318',
                        fontSize: 14,
                    }}
                >
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || submitting}
                style={{
                    marginTop: 16,
                    width: '100%',
                    border: 0,
                    padding: 14,
                    borderRadius: 8,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: submitting ? 'default' : 'pointer',
                    backgroundColor: submitting
                        ? '#9aa7b4'
                        : SIES_BRANDING.colors.primary,
                }}
            >
                {submitting ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
}