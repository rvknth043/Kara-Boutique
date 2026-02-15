import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - Clear token and redirect to login
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoint helpers
export const endpoints = {
  // Auth
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    otpRequest: '/auth/otp-request',
    otpVerify: '/auth/otp-verify',
    googleLogin: '/auth/google-login',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  
  // Products
  products: {
    getAll: '/products',
    getById: (id: string) => `/products/${id}`,
    getBySlug: (slug: string) => `/products/slug/${slug}`,
    search: '/products/search',
    featured: '/products/featured',
    byCategory: (slug: string) => `/products/category/${slug}`,
  },
  
  // Categories
  categories: {
    getAll: '/categories',
    getById: (id: string) => `/categories/${id}`,
    getBySlug: (slug: string) => `/categories/slug/${slug}`,
  },
  
  // Cart
  cart: {
    get: '/cart',
    add: '/cart/add',
    update: (itemId: string) => `/cart/update/${itemId}`,
    remove: (itemId: string) => `/cart/remove/${itemId}`,
    clear: '/cart/clear',
    count: '/cart/count',
    validate: '/cart/validate',
  },
  
  // Wishlist
  wishlist: {
    get: '/wishlist',
    add: '/wishlist/add',
    toggle: '/wishlist/toggle',
    remove: (productId: string) => `/wishlist/remove/${productId}`,
    check: (productId: string) => `/wishlist/check/${productId}`,
    count: '/wishlist/count',
  },
  
  // Checkout
  checkout: {
    initiate: '/checkout/initiate',
    complete: '/checkout/complete',
    validatePincode: (pincode: string) => `/checkout/validate-pincode/${pincode}`,
  },
  
  // Orders
  orders: {
    getAll: '/orders',
    getById: (id: string) => `/orders/${id}`,
    getByNumber: (orderNumber: string) => `/orders/number/${orderNumber}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    return: (id: string) => `/orders/${id}/return`,
  },
  
  // Payments
  payments: {
    initiate: '/payments/initiate',
    verify: '/payments/verify',
  },
  
  // Reviews
  reviews: {
    create: '/reviews',
    getProduct: (productId: string) => `/reviews/product/${productId}`,
    getMine: '/reviews/my-reviews',
    delete: (reviewId: string) => `/reviews/${reviewId}`,
  },
};
