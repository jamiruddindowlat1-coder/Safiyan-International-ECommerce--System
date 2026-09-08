export default function Modal({ open, title, children, onClose }) {
	if (!open) return null;
	return <div role="dialog" style={backdropStyle}><div style={modalStyle}><div style={headerStyle}><strong>{title}</strong><button onClick={onClose} aria-label="Close">×</button></div>{children}</div></div>;
}

const backdropStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'grid', placeItems: 'center', zIndex: 10 };
const modalStyle = { width: 'min(520px, calc(100% - 32px))', background: '#fff', borderRadius: 10, padding: 20 };
const headerStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 16 };
