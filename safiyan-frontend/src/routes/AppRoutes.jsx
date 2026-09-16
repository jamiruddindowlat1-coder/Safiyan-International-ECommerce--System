import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { SIES_BRANDING } from '../config/branding';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Sidebar from '../components/layout/Sidebar';
import BrandedPageHeader from '../components/common/BrandedPageHeader';
import Dashboard from '../pages/admin/Dashboard';
import ProductManage from '../pages/admin/ProductManage';
import CategoryManage from '../pages/admin/CategoryManage';
import OrderManage from '../pages/admin/OrderManage';
import CustomerManage from '../pages/admin/CustomerManage';
import VendorManage from '../pages/admin/VendorManage';
import CouponManage from '../pages/admin/CouponManage';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';
import Home from '../pages/customer/Home';
import Login from '../pages/customer/Login';
import Register from '../pages/customer/Register';
import ProductListing from '../pages/customer/ProductListing';
import ProductDetails from '../pages/customer/ProductDetails';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import PaymentResult from '../pages/customer/PaymentResult';
import OrderHistory from '../pages/customer/OrderHistory';
import Wishlist from '../pages/customer/Wishlist';
import VendorDashboard from '../pages/vendor/VendorDashboard';
import VendorProducts from '../pages/vendor/VendorProducts';
import VendorOrders from '../pages/vendor/VendorOrders';
import OrderTracking from '../pages/customer/OrderTracking';
import Profile from '../pages/customer/Profile';
import SearchResults from '../pages/customer/SearchResults';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleManagement from '../pages/admin/RoleManagement';
import { useAuth } from '../context/AuthContext';

const shellStyle = {
  minHeight: '100vh',
  background: 'transparent',
  color: '#e5eef8',
};

const contentStyle = {
  flex: 1,
  minWidth: 0,
  padding: '18px 22px 34px',
};

function AppShell() {
  return (
    <div className="dark-theme" style={shellStyle}>
      <Navbar brand={SIES_BRANDING} />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
        <Sidebar brand={SIES_BRANDING} />
        <main className="shell-main" style={contentStyle}>
          <BrandedPageHeader section="Safiyan International ECommerce System" />
          <Outlet />
        </main>
      </div>
      <Footer brand={SIES_BRANDING} />
    </div>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin') return <Navigate to="/admin" replace />;
  if (user.role === 'Vendor') return <Navigate to="/vendor" replace />;
  return <Navigate to="/home" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* এই দুইটা পেজ শেল ছাড়া, একদম আলাদা */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* বাকি সব পেজ Navbar/Sidebar/Footer শেলের ভেতরে */}
      <Route element={<AppShell />}>
        <Route index element={<HomeRedirect />} />
        <Route path="home" element={<Home />} />
        <Route path="products" element={<ProductListing />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="cart" element={<ProtectedRoute roles={['Customer', 'Vendor', 'Admin']}><Cart /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute roles={['Customer', 'Vendor', 'Admin']}><Checkout /></ProtectedRoute>} />
        <Route path="payment-result" element={<PaymentResult />} />
        <Route path="orders" element={<ProtectedRoute roles={['Customer', 'Vendor', 'Admin']}><OrderHistory /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute roles={['Customer', 'Vendor', 'Admin']}><OrderTracking /></ProtectedRoute>} />
        <Route path="wishlist" element={<ProtectedRoute roles={['Customer', 'Vendor', 'Admin']}><Wishlist /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute roles={['Customer', 'Vendor', 'Admin']}><Profile /></ProtectedRoute>} />
        <Route path="search" element={<SearchResults />} />
        <Route path="vendor" element={<ProtectedRoute roles={['Vendor', 'Admin']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="vendor/products" element={<ProtectedRoute roles={['Vendor', 'Admin']}><VendorProducts /></ProtectedRoute>} />
        <Route path="vendor/orders" element={<ProtectedRoute roles={['Vendor', 'Admin']}><VendorOrders /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute roles={['Admin']}><Dashboard /></ProtectedRoute>} />
        <Route path="admin/products" element={<ProtectedRoute roles={['Admin']}><ProductManage /></ProtectedRoute>} />
        <Route path="admin/categories" element={<ProtectedRoute roles={['Admin']}><CategoryManage /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute roles={['Admin']}><OrderManage /></ProtectedRoute>} />
        <Route path="admin/customers" element={<ProtectedRoute roles={['Admin']}><CustomerManage /></ProtectedRoute>} />
        <Route path="admin/vendors" element={<ProtectedRoute roles={['Admin']}><VendorManage /></ProtectedRoute>} />
        <Route path="admin/coupons" element={<ProtectedRoute roles={['Admin']}><CouponManage /></ProtectedRoute>} />
        <Route path="admin/reports" element={<ProtectedRoute roles={['Admin']}><Reports /></ProtectedRoute>} />
        <Route path="admin/accounts" element={<ProtectedRoute roles={['Admin']}><Reports /></ProtectedRoute>} />
        <Route path="admin/settings" element={<ProtectedRoute roles={['Admin']}><Settings /></ProtectedRoute>} />
        <Route path="admin/roles" element={<ProtectedRoute roles={['Admin']}><RoleManagement /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}