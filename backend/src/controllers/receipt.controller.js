import pdfkit from "pdfkit";
import Payment from "../models/Payment.model.js";
import RentRecord from "../models/RentRecord.model.js";
import fs from "fs";

export const generatePaymentReceipt = async (paymentId, res) => {
  try {
    const payment = await Payment.findById(paymentId)
      .populate("rentRecord", "rentAmount paidAmount remainingAmount billingMonth dueDate")
      .populate("tenant", "fullName email phone")
      .populate("property", "name address");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const rentRecord = payment.rentRecord;

    // Create PDF document
    const doc = new pdfkit({ margin: 50 });
    const chunks = [];

    await new Promise((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    await new Promise((resolve, reject) => {
      doc.pipe(fs.createWriteStream(`receipt_${payment._id}.pdf`));
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    // Header
    doc.fontSize(20).text("PAYMENT RECEIPT", { align: "center" });
    doc.space(30);

    // Payment details table
    doc.fontSize(12).text("Payment Details", { underline: true });
    doc.space(5);

    doc.table(
      {
        columns: [
          { label: "Field", width: 150 },
          { label: "Details", width: 400 },
        ],
        rows: [
          ["Transaction ID", payment.transactionId || "—"],
          ["Payment Date", new Date(payment.paymentDate).toLocaleString()],
          ["Amount Paid", `₹${payment.amount.toLocaleString()}`],
          ["Remaining Amount", `₹${rentRecord.remainingAmount.toLocaleString()}`],
          ["Rent Month", rentRecord.billingMonth ? new Date(rentRecord.billingMonth).toLocaleString("en-US", { month: "long", year: "numeric" }) : "—"],
          ["Due Date", rentRecord.dueDate ? new Date(rentRecord.dueDate).toLocaleDateString() : "—"],
          ["Payment Method", payment.paymentMethod || "—"],
          ["Tenant", payment.tenant ? payment.tenant.fullName : "—"],
          ["Property", payment.property ? payment.property.name : "—"],
        ],
      },
      { align: "center", margin: 50 }
    );

    doc.moveDown(30);

    // Rent record details
    doc.fontSize(12).text("Rent Record Details", { underline: true });
    doc.space(5);

    doc.table(
      {
        columns: [
          { label: "Field", width: 150 },
          { label: "Details", width: 400 },
        ],
        rows: [
          ["Billing Month", rentRecord.billingMonth ? new Date(rentRecord.billingMonth).toLocaleString("en-US", { month: "long", year: "numeric" }) : "—"],
          ["Due Date", rentRecord.dueDate ? new Date(rentRecord.dueDate).toLocaleDateString() : "—"],
          ["Rent Amount", `₹${rentRecord.rentAmount.toLocaleString()}`],
          ["Total Paid", `₹${rentRecord.paidAmount.toLocaleString()}`],
          ["Remaining Amount", `₹${rentRecord.remainingAmount.toLocaleString()}`],
          ["Status", rentRecord.status],
          ["Payment Method", rentRecord.paymentMethod || "—"],
        ],
      },
      { align: "center", margin: 50 }
    );

    doc.moveDown(30);

    // Signature area
    doc.fontSize(12).text("Received by:", { align: "right" });
    doc.space(20);
    doc.text("Tenant Signature: ________________________", { align: "right" });
    doc.space(20);
    doc.text("Date: ________________", { align: "right" });

    doc.end();

    // Send the file
    const pdfPath = `receipt_${payment._id}.pdf`;
    res.download(
      pdfPath,
      `Payment_Receipt_${payment.transactionId || payment._id}.pdf`,
      (err) => {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        if (err) {
          console.error("Error sending PDF:", err);
          res.status(500).json({ success: false, message: "Error generating receipt" });
        }
      }
    );
  } catch (error) {
    console.error("Receipt generation error:", error);
    res.status(500).json({ success: false, message: "Error generating receipt" });
  }
};