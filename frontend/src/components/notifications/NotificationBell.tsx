'use client';

import { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status_changed':
        return '📦';
      case 'payment_received':
        return '💳';
      case 'stock_available':
        return '🛍️';
      case 'new_coupon':
        return '🎟️';
      case 'exchange_status_changed':
        return '🔄';
      default:
        return '🔔';
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        className="btn btn-link position-relative text-dark p-0"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="dropdown-menu dropdown-menu-end show"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '0.5rem',
            width: '380px',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1050,
          }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
            <h6 className="mb-0">Notifications</h6>
            <div className="d-flex gap-2">
              {unreadCount > 0 && (
                <button
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                  onClick={clearAll}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-5">
              <FiBell size={48} className="text-muted mb-3" />
              <p className="text-muted">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`dropdown-item border-bottom ${!notification.read ? 'bg-light' : ''}`}
                  style={{ whiteSpace: 'normal', cursor: 'pointer' }}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <span style={{ fontSize: '1.5rem' }}>
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <strong className="d-block mb-1">{notification.title}</strong>
                        <button
                          className="btn btn-link btn-sm p-0 text-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <p className="mb-1 small text-muted">{notification.message}</p>
                      <small className="text-muted">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
