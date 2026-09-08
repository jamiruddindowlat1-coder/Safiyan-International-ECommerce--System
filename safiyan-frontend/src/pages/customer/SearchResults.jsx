import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { useCart } from '../../context/CartContext';
import { productService } from '../../services/productService';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [error, setError] = useState('');

  useEffect(() => {
    productService.getProducts()
      .then(setProducts)
      .catch((requestError) => setError(requestError.message));
  }, []);

  const query = searchParams.get('q') || '';
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return products;

    return products.filter((product) => [
      product.name,
      product.description,
      product.categoryName,
      product.vendorName,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  }, [products, query]);

  function submitSearch(event) {
    event.preventDefault();
    const value = search.trim();
    setSearchParams(value ? { q: value } : {});
  }

  function addProduct(productId) {
    addToCart(productId).catch((requestError) => setError(requestError.message));
  }

  return (
    <section>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Search Results</h1>
          <p style={mutedStyle}>{query ? `${results.length} result(s) for "${query}"` : 'Browse all available products.'}</p>
        </div>
        <form onSubmit={submitSearch} style={searchFormStyle}>
          <input aria-label="Search products" placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} style={inputStyle} />
          <button type="submit" style={buttonStyle}>Search</button>
        </form>
      </div>

      {error && <div role="alert" style={errorStyle}>{error}</div>}
      {!error && !results.length && <div style={emptyStyle}>No products matched your search.</div>}
      <div style={gridStyle}>
        {results.map((product) => <ProductCard key={product.id} product={product} onAdd={addProduct} />)}
      </div>
    </section>
  );
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 };
const titleStyle = { margin: 0, color: '#0f4c81' };
const mutedStyle = { color: '#64748b' };
const searchFormStyle = { display: 'flex', gap: 8, minWidth: 280 };
const inputStyle = { flex: 1, padding: 11, border: '1px solid #dbe2ea', borderRadius: 8 };
const buttonStyle = { border: 0, padding: '10px 14px', borderRadius: 8, background: '#0f4c81', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 };
const emptyStyle = { padding: 24, background: '#fff', borderRadius: 10, color: '#64748b' };
const errorStyle = { color: '#b42318', background: '#fef3f2', padding: 12, borderRadius: 8, marginBottom: 16 };
