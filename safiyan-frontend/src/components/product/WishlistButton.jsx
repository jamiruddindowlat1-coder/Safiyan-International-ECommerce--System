import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';

/**
 * Drop this on any product card or product detail page:
 *
 *   <WishlistButton productId={product.id} />
 *
 * It fetches the current state on mount and toggles on click.
 * Renders nothing if there is no logged-in user.
 */
export default function WishlistButton({ productId }) {
    const { user } = useAuth();

    const [inWishlist, setInWishlist] = useState(false);
    const [busy, setBusy] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function checkStatus() {
            if (!user?.id || !productId) return;

            try {
                const result = await apiRequest(
                    `/Wishlist/check?userId=${user.id}&productId=${productId}`
                );

                if (!cancelled) {
                    setInWishlist(Boolean(result?.inWishlist));
                }
            } catch {
                // Silently ignore — button just starts unfilled.
            } finally {
                if (!cancelled) setLoaded(true);
            }
        }

        checkStatus();

        return () => {
            cancelled = true;
        };
    }, [user?.id, productId]);

    async function toggle(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!user?.id || busy) return;

        setBusy(true);

        // Optimistic update.
        setInWishlist((current) => !current);

        try {
            const result = await apiRequest('/Wishlist/toggle', {
                method: 'POST',
                body: JSON.stringify({
                    userId: user.id,
                    productId,
                }),
            });

            setInWishlist(Boolean(result?.inWishlist));
        } catch {
            // Revert on failure.
            setInWishlist((current) => !current);
        } finally {
            setBusy(false);
        }
    }

    if (!user?.id) return null;

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy || !loaded}
            aria-label={
                inWishlist ? 'Remove from wishlist' : 'Add to wishlist'
            }
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
                ...buttonStyle,
                opacity: busy ? 0.6 : 1,
            }}
        >
            <span
                style={{
                    ...heartStyle,
                    color: inWishlist ? '#e11d48' : '#98a2b3',
                }}
            >
                {inWishlist ? '♥' : '♡'}
            </span>
        </button>
    );
}

const buttonStyle = {
    border: '1px solid #dbe2ea',
    background: '#fff',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
};

const heartStyle = {
    fontSize: 18,
    lineHeight: 1,
};
