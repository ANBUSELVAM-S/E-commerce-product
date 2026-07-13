import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('user');
    let storedCartId = localStorage.getItem('cartId');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    if (!storedCartId) {
      storedCartId = `cart_${uuidv4().substring(0,8)}`;
      localStorage.setItem("cartId", storedCartId);
    }
    
    setCartId(storedCartId);
    setLoading(false);
  }, []);

  const login = (userData, tokens) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tokens', JSON.stringify(tokens));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
  };

  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userId: user?.userId || null, 
      cartId, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
