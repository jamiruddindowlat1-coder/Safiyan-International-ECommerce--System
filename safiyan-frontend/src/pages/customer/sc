import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { SIES_BRANDING } from '../../config/branding';

/**
 * Drop this on the product detail page:
 *
 *   <ProductReviews productId={product.id} />
 *
 * Shows average rating + review count, the list of approved
 * reviews, and (if the logged-in user hasn't reviewed this
 * product yet) a form to submit one. The backend only allows
 * submitting a review for a product from a Delivered order,
 * so the form may come back with that error — it's shown
 * inline rather than hidden, since the customer likely does
 * not know that rule in advance.
 */
export default function ProductReviews({ productId }) {
    const { user } = useAuth();

    const [summary, setSummary] = useState({
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    async function load() {
        setLoading(true);
        setError('');

        try {
            const result = await apiRequest(`/Review/product/${productId}`);
            setSummary({
                averageRating: result?.averageRating || 0,
                totalReviews: result?.totalReviews || 0,
                reviews: result?.reviews || [],
            });
        } catch (requestError) {
            setError(requestError?.message || 'Unable to load reviews.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    async function submitReview(event) {
        event.preventDefault();

        if (!user?.id) {
            setSubmitError('Please sign in to leave a review.');
            return;
        }

        setSubmitError('');
        setSubmitting(true);

        try {
            await apiRequest('/Review', {
                method: 'POST',
                body: JSON.stringify({
                    productId,
                    userId: user.id,
                    rating,
                    comment,
                }),
            });

            setSubmitted(true);
            setComment('');
            await load();
        } catch (requestError) {
            setSubmitError(
                requestError?.message || 'Unable to submit your review.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section style={wrapStyle}>
            <h2 style={titleStyle}>Customer Reviews</h2>

            {loading ? (
                <p style={mutedStyle}>Loading reviews...</p>
            ) : (
                <>
                    <div style={summaryRowStyle}>
                        <div
                            style={{
                                ...bigRatingStyle,
                                color: SIES_BRANDING.colors.primary,
                            }}
                        >
                            {summary.averageRating || '—'}
                        </div>

                        <div>
                            <Stars value={Math.round(summary.averageRating)} />
                            <div style={mutedStyle}>
                                Based on {summary.totalReviews} review
                                {summary.totalReviews === 1 ? '' : 's'}
                            </div>
                        </div>
                    </div>

                    {error && <div style={errorStyle}>{error}</div>}

                    <div style={listStyle}>
                        {summary.reviews.length === 0 ? (
                            <p style={mutedStyle}>
                                No reviews yet — be the first to review this
                                product.
                            </p>
                        ) : (
                            summary.reviews.map((review) => (
                                <div key={review.id} style={reviewCardStyle}>
                                    <div style={reviewHeaderStyle}>
                                        <strong>{review.customerName}</strong>
                                        <Stars value={review.rating} />
                                    </div>

                                    {review.comment && (
                                        <p style={commentStyle}>
                                            {review.comment}
                                        </p>
                                    )}

                                    <div style={mutedStyle}>
                                        {new Date(
                                            review.createdAt
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={formWrapStyle}>
                        <h3 style={formTitleStyle}>Write a Review</h3>

                        {submitted ? (
                            <p style={successStyle}>
                                Thanks for your review!
                            </p>
                        ) : (
                            <form onSubmit={submitReview} style={formStyle}>
                                <label style={labelStyle}>
                                    Rating
                                    <select
                                        value={rating}
                                        onChange={(event) =>
                                            setRating(
                                                Number(event.target.value)
                                            )
                                        }
                                        style={selectStyle}
                                    >
                                        {[5, 4, 3, 2, 1].map((value) => (
                                            <option key={value} value={value}>
                                                {value} Star
                                                {value === 1 ? '' : 's'}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <textarea
                                    value={comment}
                                    onChange={(event) =>
                                        setComment(event.target.value)
                                    }
                                    placeholder="Share your experience with this product..."
                                    rows={3}
                                    style={textareaStyle}
                                />

                                {submitError && (
                                    <div style={errorStyle}>
                                        {submitError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        ...submitButtonStyle,
                                        backgroundColor:
                                            SIES_BRANDING.colors.primary,
                                        opacity: submitting ? 0.7 : 1,
                                    }}
                                >
                                    {submitting
                                        ? 'Submitting...'
                                        : 'Submit Review'}
                                </button>

                                <div style={mutedStyle}>
                                    Note: you can only review products from
                                    an order marked as Delivered.
                                </div>
                            </form>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

function Stars({ value }) {
    return (
        <span style={starsStyle} aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span
                    key={n}
                    style={{
                        color: n <= value ? '#f79009' : '#e4e7ec',
                    }}
                >
                    ★
                </span>
            ))}
        </span>
    );
}

const wrapStyle = {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
};

const titleStyle = {
    margin: '0 0 18px',
    fontSize: 20,
    color: '#1d2939',
};

const mutedStyle = {
    color: '#667085',
    fontSize: 13,
};

const summaryRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
};

const bigRatingStyle = {
    fontSize: 40,
    fontWeight: 800,
};

const starsStyle = {
    fontSize: 16,
    letterSpacing: 2,
};

const errorStyle = {
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    background: '#fef3f2',
    color: '#b42318',
    fontSize: 13,
};

const listStyle = {
    display: 'grid',
    gap: 14,
    marginBottom: 24,
};

const reviewCardStyle = {
    borderBottom: '1px solid #eef2f6',
    paddingBottom: 14,
};

const reviewHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
};

const commentStyle = {
    margin: '6px 0',
    color: '#344054',
    fontSize: 14,
};

const formWrapStyle = {
    borderTop: '1px solid #eef2f6',
    paddingTop: 20,
};

const formTitleStyle = {
    margin: '0 0 12px',
    fontSize: 16,
};

const formStyle = {
    display: 'grid',
    gap: 12,
};

const labelStyle = {
    display: 'grid',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#344054',
};

const selectStyle = {
    padding: 10,
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
};

const submitButtonStyle = {
    border: 0,
    padding: '10px 18px',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    justifySelf: 'start',
};

const successStyle = {
    color: '#12b76a',
    fontWeight: 600,
};
