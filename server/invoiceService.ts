import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { logger } from "./monitoring";
import path from "path";
import fs from "fs/promises";

interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  date: Date;
  dueDate?: Date;
  business: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    email: string;
    phone?: string;
    logo?: string;
  };
  customer: {
    name: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate?: number;
    taxAmount?: number;
  }>;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  currency: string;
  notes?: string;
  paymentMethod?: string;
  paymentStatus: "paid" | "pending" | "overdue";
}

// Generate PDF invoice
export async function generateInvoice(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).text(data.business.name, 50, 50);
      doc.fontSize(10).fillColor("#666");
      doc.text(data.business.address, 50, 80);
      doc.text(`${data.business.city}, ${data.business.state} ${data.business.zip}`, 50, 95);
      doc.text(data.business.email, 50, 110);
      if (data.business.phone) {
        doc.text(data.business.phone, 50, 125);
      }

      // Invoice title and number
      doc.fillColor("#000");
      doc.fontSize(24).text("INVOICE", 400, 50, { align: "right" });
      doc.fontSize(10).text(`#${data.invoiceNumber}`, 400, 80, { align: "right" });
      doc.text(`Date: ${formatDate(data.date)}`, 400, 95, { align: "right" });
      if (data.dueDate) {
        doc.text(`Due: ${formatDate(data.dueDate)}`, 400, 110, { align: "right" });
      }

      // Bill To section
      doc.fontSize(12).text("Bill To:", 50, 180);
      doc.fontSize(10);
      doc.text(data.customer.name, 50, 200);
      doc.text(data.customer.email, 50, 215);
      if (data.customer.address) {
        doc.text(data.customer.address, 50, 230);
        doc.text(`${data.customer.city}, ${data.customer.state} ${data.customer.zip}`, 50, 245);
      }

      // Items table
      const tableTop = 300;
      const tableHeaders = ["Description", "Qty", "Unit Price", "Tax", "Total"];
      const columnWidths = [250, 50, 80, 60, 80];
      const columnPositions = [50, 300, 350, 430, 490];

      // Table header
      doc.fontSize(10).fillColor("#666");
      tableHeaders.forEach((header, i) => {
        doc.text(header, columnPositions[i], tableTop, {
          width: columnWidths[i],
          align: i === 0 ? "left" : "right",
        });
      });

      // Draw line under header
      doc.moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table rows
      let yPosition = tableTop + 30;
      doc.fillColor("#000");

      data.items.forEach((item) => {
        const rowHeight = 20;

        doc.text(item.description, columnPositions[0], yPosition, {
          width: columnWidths[0],
        });
        doc.text(item.quantity.toString(), columnPositions[1], yPosition, {
          width: columnWidths[1],
          align: "right",
        });
        doc.text(formatCurrency(item.unitPrice, data.currency), columnPositions[2], yPosition, {
          width: columnWidths[2],
          align: "right",
        });
        doc.text(
          item.taxAmount ? formatCurrency(item.taxAmount, data.currency) : "-",
          columnPositions[3],
          yPosition,
          {
            width: columnWidths[3],
            align: "right",
          }
        );
        doc.text(formatCurrency(item.total, data.currency), columnPositions[4], yPosition, {
          width: columnWidths[4],
          align: "right",
        });

        yPosition += rowHeight;
      });

      // Draw line above totals
      doc.moveTo(350, yPosition + 10)
        .lineTo(550, yPosition + 10)
        .stroke();

      // Totals
      yPosition += 25;
      const totalsX = 400;

      doc.text("Subtotal:", totalsX, yPosition);
      doc.text(formatCurrency(data.subtotal, data.currency), 490, yPosition, {
        width: 80,
        align: "right",
      });

      if (data.taxAmount > 0) {
        yPosition += 15;
        doc.text("Tax:", totalsX, yPosition);
        doc.text(formatCurrency(data.taxAmount, data.currency), 490, yPosition, {
          width: 80,
          align: "right",
        });
      }

      if (data.shippingAmount > 0) {
        yPosition += 15;
        doc.text("Shipping:", totalsX, yPosition);
        doc.text(formatCurrency(data.shippingAmount, data.currency), 490, yPosition, {
          width: 80,
          align: "right",
        });
      }

      // Total
      yPosition += 20;
      doc.fontSize(12).fillColor("#000");
      doc.text("Total:", totalsX, yPosition);
      doc.text(formatCurrency(data.total, data.currency), 490, yPosition, {
        width: 80,
        align: "right",
      });

      // Payment status
      yPosition += 30;
      doc.fontSize(10);
      const statusColors = {
        paid: "#22c55e",
        pending: "#f59e0b",
        overdue: "#ef4444",
      };
      doc.fillColor(statusColors[data.paymentStatus]);
      doc.text(
        `Payment Status: ${data.paymentStatus.toUpperCase()}`,
        totalsX,
        yPosition
      );

      // Notes
      if (data.notes) {
        doc.fillColor("#666").fontSize(10);
        doc.text("Notes:", 50, yPosition + 50);
        doc.fillColor("#000");
        doc.text(data.notes, 50, yPosition + 70, {
          width: 500,
          align: "left",
        });
      }

      // Footer
      doc.fillColor("#666").fontSize(8);
      doc.text(
        "Thank you for your business!",
        50,
        doc.page.height - 50,
        {
          align: "center",
          width: 500,
        }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Save invoice to storage
export async function saveInvoice(
  invoiceBuffer: Buffer,
  invoiceNumber: string,
  orderId: string
): Promise<string> {
  try {
    const fileName = `invoice_${invoiceNumber}.pdf`;
    const filePath = path.join(
      process.env.PRIVATE_OBJECT_DIR || ".data/private/objects",
      "invoices",
      fileName
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Save file
    await fs.writeFile(filePath, invoiceBuffer);

    logger.info("Invoice saved", { invoiceNumber, orderId, filePath });

    return filePath;
  } catch (error) {
    logger.error("Failed to save invoice", { error, invoiceNumber, orderId });
    throw error;
  }
}

// Generate and save invoice for an order
export async function generateOrderInvoice(orderId: string): Promise<{
  invoiceNumber: string;
  filePath: string;
  buffer: Buffer;
}> {
  try {
    // Get order details
    const order = await storage.getOrderById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Get order items with product details
    const orderItems = await storage.getOrderItemsWithProducts(orderId);
    
    // Get business details (assuming first product's business)
    const businessId = orderItems[0]?.product?.businessId;
    if (!businessId) {
      throw new Error("No business found for order");
    }

    const business = await storage.getBusinessById(businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(order);

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      invoiceNumber,
      orderId,
      date: new Date(order.createdAt),
      business: {
        name: business.name,
        address: business.address || "123 Main St",
        city: business.location?.split(",")[0] || "Miami",
        state: business.location?.split(",")[1]?.trim() || "FL",
        zip: "33101",
        email: business.email || "info@business.com",
        phone: business.phone,
      },
      customer: {
        name: order.shippingAddress?.fullName || "Customer",
        email: order.customerEmail,
        address: order.shippingAddress?.addressLine1,
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
        zip: order.shippingAddress?.zipCode,
        phone: order.customerPhone,
      },
      items: orderItems.map((item) => ({
        description: item.productName,
        quantity: item.quantity,
        unitPrice: parseFloat(item.productPrice),
        total: parseFloat(item.totalPrice),
        taxAmount: 0, // Calculate if needed
      })),
      subtotal: parseFloat(order.subtotal),
      taxAmount: parseFloat(order.taxAmount),
      shippingAmount: parseFloat(order.shippingAmount),
      total: parseFloat(order.total),
      currency: order.currency,
      paymentStatus: order.status === "completed" ? "paid" : "pending",
      notes: order.notes,
    };

    // Generate PDF
    const buffer = await generateInvoice(invoiceData);

    // Save to storage
    const filePath = await saveInvoice(buffer, invoiceNumber, orderId);

    // Update order with invoice number
    await storage.updateOrderInvoiceNumber(orderId, invoiceNumber);

    return { invoiceNumber, filePath, buffer };
  } catch (error) {
    logger.error("Failed to generate order invoice", { error, orderId });
    throw error;
  }
}

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function generateInvoiceNumber(order: any): string {
  const date = new Date(order.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const orderNum = order.id.slice(-6).toUpperCase();
  return `INV-${year}${month}-${orderNum}`;
}
