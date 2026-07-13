import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import NavigationBar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import Orders from './pages/Orders';
import Notifications from './pages/Notifications';
import AdminAddProduct from './pages/AdminAddProduct';
import PaymentsList from './pages/PaymentsList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ConfirmSignup from './pages/ConfirmSignup';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <Router>
            <div className="d-flex flex-column min-vh-100">
              <NavigationBar />
              <main className="flex-grow-1 container pb-5 pt-3">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/confirm" element={<ConfirmSignup />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/payment/:orderId" element={<Payment />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/payments" element={<PaymentsList />} />
                  <Route 
                    path="/admin/add-product" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminAddProduct />
                      </ProtectedAdminRoute>
                    } 
                  />
                </Routes>
              </main>
              <Footer />
            </div>
            <ToastContainer position="bottom-right" />
          </Router>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
