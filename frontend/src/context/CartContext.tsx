'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { endpoints } from '@/lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  product_variant_id: string;
  quantity: number;
  product_name: string;
  variant_size: string;
  variant_color: string;
  product_base_price: number;
  product_discount_price?: number;
  subtotal: number;
  product_image?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  loading: boolean;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setItemCount(0);
      setSubtotal(0);
      setTotal(0);
      return;
    }

    try {
      const response = await api.get(endpoints.cart.get);
      const cart = response.data.data;
      
      setItems(cart.items);
      setItemCount(cart.item_count);
      setSubtotal(cart.subtotal);
      setTotal(cart.total);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const addToCart = async (variantId: string, quantity: number = 1) => {
    setLoading(true);
    try {
      await api.post(endpoints.cart.add, {
        product_variant_id: variantId,
        quantity,
      });
      await refreshCart();
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to add to cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      await api.put(endpoints.cart.update(itemId), { quantity });
      await refreshCart();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      await api.delete(endpoints.cart.remove(itemId));
      await refreshCart();
      toast.success('Item removed');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to remove item');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await api.delete(endpoints.cart.clear);
      await refreshCart();
      toast.success('Cart cleared');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to clear cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    items,
    itemCount,
    subtotal,
    total,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
