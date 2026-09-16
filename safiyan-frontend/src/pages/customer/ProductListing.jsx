import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { productService } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';

export default function ProductListing() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    productService
      .getProducts()
      .then((data) => {
        if (!active) return;

        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data?.data)) {
          setProducts(data.data);
        } else if (Array.isArray(data?.items)) {
          setProducts(data.items);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to load products.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
          color: '#e5eef8',
        }}
      >
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 30,
          color: '#fca5a5',
          background: '#3f1515',
          borderRadius: 12,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: '#e5eef8',
              fontSize: 28,
            }}
          >
            Products
          </h1>

          <p
            style={{
              margin: '6px 0 0',
              color: '#94a3b8',
            }}
          >
            Browse our available products
          </p>
        </div>

        <div
          style={{
            color: '#94a3b8',
            fontSize: 14,
          }}
        >
          {products.length} product{products.length !== 1 ? 's' : ''}
        </div>
      </div>

      {products.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            background: '#111827',
            borderRadius: 14,
            color: '#94a3b8',
          }}
        >
          No products found.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={addToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
}





