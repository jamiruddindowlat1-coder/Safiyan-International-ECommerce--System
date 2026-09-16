import { useEffect, useState } from 'react';
import { productService } from '../../services/productService';

import { API_BASE_URL } from '../config/api';  
const API_BASE = API_BASE_URL.replace('/api', '');
const resolveUrl = (url) => (url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : '/sies_logo.svg');

export default function ProductGallery({ productId, imageUrl, name, variantImageUrl }) {
  const [images, setImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(!!productId);

  useEffect(() => {
    if (!productId) { setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    productService.getImages(productId)
      .then((data) => { if (!cancelled) setImages(data || []); })
      .catch(() => { if (!cancelled) setImages([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const gallery = images.length > 0
    ? images
    : imageUrl
      ? [{ id: 'fallback', imageUrl, isPrimary: true }]
      : [];

  useEffect(() => {
    const primaryIdx = gallery.findIndex((img) => img.isPrimary);
    setActiveIndex(primaryIdx >= 0 ? primaryIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, imageUrl]);

  // A selected variant's image (if it has one) always takes priority over the gallery.
  const activeUrl = variantImageUrl || gallery[activeIndex]?.imageUrl || imageUrl;

  return (
    <div style={wrapStyle}>
      <div style={mainImageStyle}>
        {loading
          ? <div style={loadingStyle}>Loading...</div>
          : <img src={resolveUrl(activeUrl)} alt={name} style={imgStyle} />}
      </div>

      {gallery.length > 1 && (
        <div style={thumbRowStyle}>
          {gallery.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              style={{ ...thumbStyle, borderColor: idx === activeIndex ? '#0f4c81' : '#e2e8f0' }}
              aria-label={`${name} image ${idx + 1}`}
            >
              <img src={resolveUrl(img.imageUrl)} alt="" style={thumbImgStyle} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const wrapStyle = { display: 'flex', flexDirection: 'column', gap: 10 };
const mainImageStyle = { width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'contain' };
const loadingStyle = { color: '#94a3b8', fontSize: 13 };
const thumbRowStyle = { display: 'flex', gap: 8, overflowX: 'auto' };
const thumbStyle = { width: 60, height: 60, borderRadius: 8, border: '2px solid #e2e8f0', overflow: 'hidden', padding: 0, cursor: 'pointer', background: '#fff', flexShrink: 0 };
const thumbImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };