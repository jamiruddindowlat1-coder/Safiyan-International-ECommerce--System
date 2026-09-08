export function formatCurrency(value, currency = 'BDT') {
	return new Intl.NumberFormat('en-BD', { style: 'currency', currency }).format(Number(value) || 0);
}

export default formatCurrency;
