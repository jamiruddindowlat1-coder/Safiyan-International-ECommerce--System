export default function Pagination({ page, pageCount, onChange }) {
	return <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><button disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>{page} / {pageCount}</span><button disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Next</button></div>;
}
