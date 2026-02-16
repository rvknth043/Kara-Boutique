import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import OrderModel from '../models/Order.model';
import { AppError } from '../middleware/errorHandler';

export class InvoiceService {
  /**
   * Generate invoice PDF
   */
  static async generateInvoice(orderId: string, userId?: string): Promise<string> {
    // Get order details
    const order = await OrderModel.findByIdWithDetails(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // Verify ownership (if user context provided)
    if (userId && order.user_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    const filename = `invoice-${order.order_number}.pdf`;
    const filepath = path.join('/tmp', filename);
    
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);
    
    // Company Header
    doc
      .fontSize(24)
      .fillColor('#D4A373')
      .text('KARA BOUTIQUE', 50, 45);
    
    doc
      .fontSize(10)
      .fillColor('#000')
      .text('Ethnic & Contemporary Fashion', 50, 75)
      .text('Email: support@karaboutique.com', 50, 88)
      .text('Phone: +91 9876543210', 50, 101);
    
    // Invoice Title
    doc
      .fontSize(20)
      .text('INVOICE', 400, 50);
    
    // Order Information
    doc
      .fontSize(10)
      .text(`Invoice Number: INV-${order.order_number}`, 400, 75)
      .text(`Order Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, 400, 88)
      .text(`Payment Status: ${order.payment_status.toUpperCase()}`, 400, 101);
    
    // Line separator
    doc
      .moveTo(50, 130)
      .lineTo(550, 130)
      .stroke();
    
    // Billing & Shipping Information
    let y = 150;
    
    doc.fontSize(12).text('Bill To:', 50, y);
    doc.fontSize(10);
    y += 15;
    doc.text(order.user_name, 50, y);
    y += 15;
    doc.text(order.user_email, 50, y);
    
    y = 150;
    doc.fontSize(12).text('Ship To:', 320, y);
    doc.fontSize(10);
    y += 15;
    
    if (order.shipping_address) {
      doc.text(order.shipping_address.address_line1, 320, y);
      y += 15;
      
      if (order.shipping_address.address_line2) {
        doc.text(order.shipping_address.address_line2, 320, y);
        y += 15;
      }
      
      doc.text(
        `${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.pincode}`,
        320,
        y
      );
      y += 15;
      
      if (order.shipping_address.country) {
        doc.text(order.shipping_address.country, 320, y);
      }
    }
    
    // Items Table
    y = 250;
    
    // Table Header
    doc
      .fontSize(10)
      .fillColor('#fff')
      .rect(50, y, 500, 25)
      .fill('#D4A373');
    
    doc
      .fillColor('#fff')
      .text('Item', 60, y + 7)
      .text('Size', 280, y + 7)
      .text('Color', 330, y + 7)
      .text('Qty', 400, y + 7)
      .text('Price', 450, y + 7)
      .text('Total', 510, y + 7, { align: 'right', width: 40 });
    
    y += 25;
    
    // Table Rows
    doc.fillColor('#000');
    
    order.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#f9f9f9' : '#fff';
      
      doc
        .rect(50, y, 500, 20)
        .fill(bgColor);
      
      doc
        .fillColor('#000')
        .fontSize(9)
        .text(item.product_name, 60, y + 5, { width: 200 })
        .text(item.variant_size || '-', 280, y + 5)
        .text(item.variant_color || '-', 330, y + 5)
        .text(item.quantity.toString(), 400, y + 5)
        .text(`₹${item.price.toFixed(2)}`, 450, y + 5)
        .text(`₹${item.subtotal.toFixed(2)}`, 510, y + 5, { align: 'right', width: 40 });
      
      y += 20;
    });
    
    // Totals Section
    y += 20;
    
    const totalsX = 380;
    const valuesX = 510;
    
    doc
      .fontSize(10)
      .text('Subtotal:', totalsX, y)
      .text(`₹${order.total_amount.toFixed(2)}`, valuesX, y, { align: 'right', width: 40 });
    y += 20;
    
    doc
      .text('Shipping:', totalsX, y)
      .text(
        order.shipping_charge > 0 ? `₹${order.shipping_charge.toFixed(2)}` : 'FREE',
        valuesX,
        y,
        { align: 'right', width: 40 }
      );
    y += 20;
    
    if (order.discount_amount > 0) {
      doc
        .text('Discount:', totalsX, y)
        .text(`-₹${order.discount_amount.toFixed(2)}`, valuesX, y, { align: 'right', width: 40 });
      y += 20;
    }
    
    // Grand Total
    doc
      .fontSize(12)
      .fillColor('#D4A373')
      .rect(380, y, 170, 25)
      .fill('#f5f5f5');
    
    doc
      .fillColor('#000')
      .text('Grand Total:', totalsX + 10, y + 7)
      .fontSize(14)
      .fillColor('#D4A373')
      .text(`₹${order.final_amount.toFixed(2)}`, valuesX, y + 5, { align: 'right', width: 40 });
    
    // Payment Information
    y += 50;
    
    doc
      .fontSize(10)
      .fillColor('#000')
      .text('Payment Information:', 50, y);
    y += 15;
    
    doc
      .fontSize(9)
      .text(`Payment Method: ${order.payment_method}`, 50, y);
    y += 15;
    
    if (order.transaction_id) {
      doc.text(`Transaction ID: ${order.transaction_id}`, 50, y);
    }
    
    // Footer
    const footerY = 720;
    
    doc
      .fontSize(8)
      .fillColor('#666')
      .text(
        'Thank you for shopping with Kara Boutique!',
        50,
        footerY,
        { align: 'center', width: 500 }
      );
    
    doc.text(
      'For any queries, contact us at support@karaboutique.com',
      50,
      footerY + 12,
      { align: 'center', width: 500 }
    );
    
    // Finalize PDF
    doc.end();
    
    // Wait for file to be written
    await new Promise<void>((resolve) => {
      writeStream.on('finish', () => resolve());
    });
    
    return filepath;
  }
  
  /**
   * Get invoice URL (if stored in cloud)
   */
  static async getInvoiceUrl(orderId: string): Promise<string | null> {
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    return order.invoice_url || null;
  }
  
  /**
   * Save invoice URL to order
   */
  static async saveInvoiceUrl(orderId: string, url: string): Promise<void> {
    await OrderModel.update(orderId, { invoice_url: url });
  }
}

export default InvoiceService;
