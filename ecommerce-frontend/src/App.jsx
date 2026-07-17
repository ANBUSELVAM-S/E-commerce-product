import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
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

import AdminAddProduct from './pages/AdminAddProduct';
import AdminInventory from './pages/AdminInventory';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import PaymentsList from './pages/PaymentsList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ConfirmSignup from './pages/ConfirmSignup';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

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
                  
                  {/* Protected User Routes */}
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/payment/:orderId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                  <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  
                  <Route path="/payments" element={<ProtectedRoute><PaymentsList /></ProtectedRoute>} />
                  
                  {/* Protected Admin Route */}
                  <Route 
                    path="/admin/add-product" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminAddProduct />
                      </ProtectedAdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboard />
                      </ProtectedAdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/inventory" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminInventory />
                      </ProtectedAdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminUsers />
                      </ProtectedAdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/analytics" 
                    element={
                      <ProtectedAdminRoute>
                        <AdminAnalytics />
                      </ProtectedAdminRoute>
                    } 
                  />
                </Routes>
              </main>
              <Footer />
            </div>
            <ToastContainer position="bottom-right" />
          </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
