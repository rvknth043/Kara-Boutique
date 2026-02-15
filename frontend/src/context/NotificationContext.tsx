'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Socket.io connection
  useEffect(() => {
    if (token && user) {
      const socketInstance = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
        auth: {
          token,
        },
      });

      socketInstance.on('connect', () => {
        console.log('Socket.io connected');
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket.io disconnected');
      });

      // Listen for different notification types
      socketInstance.on('order-update', (data) => {
        handleNotification(data);
      });

      socketInstance.on('payment-update', (data) => {
        handleNotification(data);
      });

      socketInstance.on('stock-alert', (data) => {
        handleNotification(data);
      });

      socketInstance.on('coupon-notification', (data) => {
        handleNotification(data);
      });

      socketInstance.on('exchange-update', (data) => {
        handleNotification(data);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [token, user]);

  // Handle incoming notifications
  const handleNotification = (data: any) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      timestamp: new Date(data.timestamp),
      read: false,
    };

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show toast notification
    toast.success(
      <div>
        <strong>{data.title}</strong>
        <p className="mb-0 small">{data.message}</p>
      </div>,
      {
        duration: 5000,
        icon: '🔔',
      }
    );
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear single notification
  const clearNotification = (id: string) => {
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === id);
      if (notif && !notif.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
