import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export class SocketService {
  private io: Server;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      console.log(`User connected: ${userId}`);

      // Store user's socket ID
      this.userSockets.set(userId, socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        this.userSockets.delete(userId);
      });

      // Handle typing indicators (for chat features)
      socket.on('typing', (data) => {
        socket.broadcast.emit('user-typing', {
          userId,
          ...data,
        });
      });
    });
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send notification to all users
   */
  sendToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Send order update notification
   */
  sendOrderUpdate(userId: string, orderData: any) {
    this.sendToUser(userId, 'order-update', {
      type: 'order_status_changed',
      title: 'Order Update',
      message: `Your order #${orderData.order_number} status has been updated to ${orderData.order_status}`,
      data: orderData,
      timestamp: new Date(),
    });
  }

  /**
   * Send payment notification
   */
  sendPaymentNotification(userId: string, paymentData: any) {
    this.sendToUser(userId, 'payment-update', {
      type: 'payment_received',
      title: 'Payment Confirmed',
      message: `Payment of ₹${paymentData.amount} has been confirmed`,
      data: paymentData,
      timestamp: new Date(),
    });
  }

  /**
   * Send stock alert
   */
  sendStockAlert(userId: string, productData: any) {
    this.sendToUser(userId, 'stock-alert', {
      type: 'stock_available',
      title: 'Back in Stock',
      message: `${productData.name} is now available!`,
      data: productData,
      timestamp: new Date(),
    });
  }

  /**
   * Send coupon notification
   */
  sendCouponNotification(userId: string, couponData: any) {
    this.sendToUser(userId, 'coupon-notification', {
      type: 'new_coupon',
      title: 'New Coupon Available',
      message: `Use code ${couponData.code} to get ${couponData.value}% off!`,
      data: couponData,
      timestamp: new Date(),
    });
  }

  /**
   * Send exchange status update
   */
  sendExchangeUpdate(userId: string, exchangeData: any) {
    this.sendToUser(userId, 'exchange-update', {
      type: 'exchange_status_changed',
      title: 'Exchange Request Update',
      message: `Your exchange request has been ${exchangeData.status}`,
      data: exchangeData,
      timestamp: new Date(),
    });
  }

  /**
   * Admin: Send new order notification
   */
  sendNewOrderToAdmin(orderData: any) {
    this.io.to('admin-room').emit('new-order', {
      type: 'new_order',
      title: 'New Order Received',
      message: `Order #${orderData.order_number} placed by ${orderData.user_name}`,
      data: orderData,
      timestamp: new Date(),
    });
  }

  /**
   * Get IO instance for external use
   */
  getIO() {
    return this.io;
  }
}

let socketService: SocketService | null = null;

export const initializeSocket = (httpServer: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(httpServer);
  }
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized');
  }
  return socketService;
};

export default SocketService;
