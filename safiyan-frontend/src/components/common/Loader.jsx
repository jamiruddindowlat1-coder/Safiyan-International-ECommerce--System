export default function Loader({ label = 'Loading...' }) {
	return <div role="status" style={{ padding: 20, color: '#64748b' }}>{label}</div>;
}
