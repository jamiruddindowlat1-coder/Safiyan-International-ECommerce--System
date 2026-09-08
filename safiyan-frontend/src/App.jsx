import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();

  return (
    <WishlistProvider userId={user?.id}>
      <CartProvider userId={user?.id}>
        <AppRoutes />
      </CartProvider>
    </WishlistProvider>
  );
}
