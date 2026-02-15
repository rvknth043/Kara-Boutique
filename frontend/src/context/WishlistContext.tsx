'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { endpoints } from '@/lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_base_price: number;
  product_discount_price?: number;
  product_image?: string;
  is_in_stock: boolean;
}

interface WishlistContextType {
  items: WishlistItem[];
  itemCount: number;
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setItemCount(0);
      return;
    }

    try {
      const response = await api.get(endpoints.wishlist.get);
      const wishlistItems = response.data.data;
      
      setItems(wishlistItems);
      setItemCount(wishlistItems.length);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  const addToWishlist = async (productId: string) => {
    setLoading(true);
    try {
      await api.post(endpoints.wishlist.add, { product_id: productId });
      await refreshWishlist();
      toast.success('Added to wishlist!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to add to wishlist');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setLoading(true);
    try {
      await api.delete(endpoints.wishlist.remove(productId));
      await refreshWishlist();
      toast.success('Removed from wishlist');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to remove from wishlist');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    setLoading(true);
    try {
      const response = await api.post(endpoints.wishlist.toggle, { product_id: productId });
      await refreshWishlist();
      
      if (response.data.data.in_wishlist) {
        toast.success('Added to wishlist!');
      } else {
        toast.success('Removed from wishlist');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update wishlist');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return items.some(item => item.product_id === productId);
  };

  const value = {
    items,
    itemCount,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    refreshWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
