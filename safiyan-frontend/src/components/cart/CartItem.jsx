export default function CartItem({ item, onQuantityChange, onRemove }) {
	return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, background: '#fff', borderRadius: 8 }}><span>{item.productName}</span><input type="number" min="1" value={item.quantity} onChange={(event) => onQuantityChange(Number(event.target.value))} /><button onClick={onRemove}>Remove</button></div>;
}
