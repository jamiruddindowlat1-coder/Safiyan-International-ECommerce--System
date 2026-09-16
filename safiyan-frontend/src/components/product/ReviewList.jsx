export default function ReviewList({ reviews = [] }) {
	return <div>{reviews.map((review) => <article key={review.id} style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}><strong>{review.userName || 'Customer'}</strong><div>{review.comment}</div></article>)}</div>;
}
