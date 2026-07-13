import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart as getCart, addItemToCart, updateItemQuantity, removeItemFromCart, clearCart } from '../services/cartService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { cartId } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!cartId) return;
    try {
      setLoading(true);
      const data = await getCart(cartId);
      setCart(data);
    } catch (error) {
      
      console.error('Failed to fetch cart:', error);
      // If 404, it might be a new cart, which is fine
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    try {
      console.log("Cart ID:", cartId);
      const itemData = {
        productId: product._id || product.productId,
        name: product.name,
        price: product.price,
        quantity
      };
      const updatedCart = await addItemToCart(cartId, itemData);
      setCart(updatedCart);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
  
    try {
      const updatedCart = await updateItemQuantity(cartId, productId, quantity);
      setCart(updatedCart);
    } catch (error) {
      toast.error("Failed to update quantity");
      console.error(error);
    }
  };
  const removeFromCart = async (productId) => {
    try {
      const updatedCart = await removeItemFromCart(cartId, productId);
      setCart(updatedCart);
      toast.info("Item removed");
    } catch (error) {
      toast.error("Failed to remove item");
      console.error(error);
    }
  };

  const emptyCart = async () => {
    try {
      const updatedCart = await clearCart(cartId);
      setCart(updatedCart);
    } catch (error) {
      console.error(error);
    }
  };

  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, emptyCart, cartItemCount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};
