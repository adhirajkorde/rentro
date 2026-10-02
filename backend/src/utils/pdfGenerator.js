import PDFDocument from "pdfkit";

/**
 * Format Indian Rupee currency string
 */
const formatINR = (val) => {
  const num = Number(val) || 0;
  return `INR ${num.toLocaleString("en-IN")}`;
};

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
};

/**
 * Generates a clean, professional Rental Agreement PDF
 */
export const buildAgreementPdf = (agreement, rentRecords, res) => {
  const doc = new PDFDocument({ margin: 45, size: "A4" });

  const filename = `Rental_Agreement_${agreement._id.slice(0, 8)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  doc.pipe(res);

  // Header Banner
  doc.rect(45, 45, 505, 40).fill("#1e293b");
  doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold").text("RESIDENTIAL RENTAL AGREEMENT", 45, 58, { align: "center" });

  doc.moveDown(2);
  let y = 100;

  // Metadata Box
  doc.rect(45, y, 505, 30).fill("#f8fafc");
  doc.strokeColor("#e2e8f0").stroke();
  doc.fillColor("#475569").fontSize(9).font("Helvetica");
  doc.text(`Agreement Ref: ${agreement._id}`, 55, y + 10);
  doc.text(`Status: ${(agreement.status || "active").toUpperCase()}`, 380, y + 10, { align: "right", width: 160 });

  y += 45;

  // 2 Column details: Parties
  // Owner box
  doc.rect(45, y, 245, 90).fill("#f1f5f9");
  doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("PROPERTY OWNER (LESSOR)", 55, y + 10);
  doc.fillColor("#334155").fontSize(9).font("Helvetica");
  doc.text(`Name: ${agreement.ownerDetails?.fullName || agreement.owner?.fullName || "Property Owner"}`, 55, y + 28);
  doc.text(`Email: ${agreement.ownerDetails?.email || agreement.owner?.email || "owner@example.com"}`, 55, y + 42);
  doc.text(`Phone: ${agreement.ownerDetails?.phone || agreement.owner?.phone || "N/A"}`, 55, y + 56);
  doc.text(`Address: ${agreement.ownerDetails?.address || "Registered Address"}`, 55, y + 70);

  // Tenant box
  doc.rect(305, y, 245, 90).fill("#f1f5f9");
  doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("TENANT (LESSEE)", 315, y + 10);
  doc.fillColor("#334155").fontSize(9).font("Helvetica");
  doc.text(`Name: ${agreement.tenantDetails?.fullName || agreement.tenant?.fullName || "Tenant"}`, 315, y + 28);
  doc.text(`Email: ${agreement.tenantDetails?.email || agreement.tenant?.email || "N/A"}`, 315, y + 42);
  doc.text(`Phone: ${agreement.tenantDetails?.phone || agreement.tenant?.phone || "N/A"}`, 315, y + 56);
  doc.text(`Emergency: ${agreement.tenantDetails?.emergencyContact?.phone || "N/A"}`, 315, y + 70);

  y += 105;

  // Property Details Section
  doc.rect(45, y, 505, 20).fill("#3b82f6");
  doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("PROPERTY & TENANCY PARTICULARS", 55, y + 5);

  y += 25;
  doc.rect(45, y, 505, 80).fill("#ffffff").strokeColor("#cbd5e1").stroke();
  doc.fillColor("#1e293b").fontSize(9).font("Helvetica");
  
  const propName = agreement.propertyDetails?.name || agreement.property?.name || "Rental Property";
  const propAddr = agreement.propertyDetails?.address || agreement.property?.address || "Address";
  const propCity = agreement.propertyDetails?.city || agreement.property?.city || "";
  const propType = (agreement.propertyDetails?.type || agreement.property?.type || "Property").toUpperCase();

  doc.text(`Property Name: ${propName} (${propType})`, 55, y + 10);
  doc.text(`Full Address: ${propAddr}, ${propCity}`, 55, y + 24);
  doc.text(`Lease Period: ${formatDate(agreement.startDate)}  to  ${formatDate(agreement.endDate)}`, 55, y + 38);
  doc.text(`Notice Period: ${agreement.noticePeriod || 30} Days`, 55, y + 52);
  doc.text(`Maintenance: ${agreement.maintenanceResponsibility || "Tenant/Owner as per rules"}`, 55, y + 66);

  doc.text(`Monthly Rent: ${formatINR(agreement.monthlyRent)}`, 320, y + 10);
  doc.text(`Security Deposit: ${formatINR(agreement.securityDeposit)}`, 320, y + 24);
  doc.text(`Utility Responsibility: ${agreement.utilityResponsibility || "Tenant"}`, 320, y + 38);

  y += 95;

  // Terms & Conditions
  doc.rect(45, y, 505, 20).fill("#e2e8f0");
  doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("STANDARD LEASE TERMS & RULES", 55, y + 5);

  y += 25;
  const termsText = agreement.termsAndConditions || 
    "1. The Tenant agrees to pay the monthly rent on or before the due date each month.\n" +
    "2. The Security Deposit shall be refunded upon vacating the premises, subject to move-out inspection and damage deductions.\n" +
    "3. Either party may terminate this agreement by providing the stipulated notice in writing.\n" +
    "4. The Tenant shall maintain the property in a clean and tenantable condition.\n" +
    "5. Electricity, water, and utility bills shall be settled promptly by the responsible party.";

  doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(termsText, 55, y, { width: 485, lineGap: 3 });

  // Signatures Section at bottom
  y = 650;
  doc.rect(45, y, 505, 100).fill("#fafafa").strokeColor("#e2e8f0").stroke();

  doc.fillColor("#64748b").fontSize(8.5).font("Helvetica");
  doc.text("IN WITNESS WHEREOF, the Owner and Tenant have executed this Rental Agreement.", 55, y + 10);

  // Owner sign line
  doc.moveTo(65, y + 70).lineTo(220, y + 70).strokeColor("#94a3b8").stroke();
  doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text("Signature of Owner / Lessor", 65, y + 75);
  doc.fillColor("#64748b").fontSize(8).font("Helvetica").text(`Date: ${formatDate(new Date())}`, 65, y + 87);

  // Tenant sign line
  doc.moveTo(330, y + 70).lineTo(485, y + 70).strokeColor("#94a3b8").stroke();
  doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text("Signature of Tenant / Lessee", 330, y + 75);
  doc.fillColor("#64748b").fontSize(8).font("Helvetica").text(`Date: ${formatDate(agreement.startDate)}`, 330, y + 87);

  doc.end();
};

/**
 * Generates a clean Payment Receipt PDF
 */
export const buildReceiptPdf = (payment, rentRecord, res) => {
  const doc = new PDFDocument({ margin: 45, size: "A4" });

  const filename = `Receipt_${payment.transactionId || payment._id.slice(0, 8)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  doc.pipe(res);

  // Top Header Banner
  doc.rect(45, 45, 505, 45).fill("#059669");
  doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold").text("OFFICIAL RENT PAYMENT RECEIPT", 45, 58, { align: "center" });

  let y = 105;

  // Receipt Number & Date bar
  doc.rect(45, y, 505, 30).fill("#f0fdf4").strokeColor("#bbf7d0").stroke();
  doc.fillColor("#065f46").fontSize(9.5).font("Helvetica-Bold");
  doc.text(`Receipt No: ${payment.transactionId || `REC-${payment._id.slice(0, 8).toUpperCase()}`}`, 55, y + 9);
  doc.text(`Receipt Date: ${formatDate(payment.paymentDate || new Date())}`, 360, y + 9, { align: "right", width: 180 });

  y += 45;

  // Parties Box
  doc.rect(45, y, 245, 80).fill("#f8fafc").strokeColor("#e2e8f0").stroke();
  doc.fillColor("#0f172a").fontSize(9.5).font("Helvetica-Bold").text("RECEIVED FROM (TENANT)", 55, y + 8);
  doc.fillColor("#334155").fontSize(9).font("Helvetica");
  doc.text(`Name: ${payment.tenantDetails?.fullName || payment.tenant?.fullName || "Tenant"}`, 55, y + 24);
  doc.text(`Phone: ${payment.tenantDetails?.phone || payment.tenant?.phone || "N/A"}`, 55, y + 38);
  doc.text(`Email: ${payment.tenantDetails?.email || payment.tenant?.email || "N/A"}`, 55, y + 52);

  doc.rect(305, y, 245, 80).fill("#f8fafc").strokeColor("#e2e8f0").stroke();
  doc.fillColor("#0f172a").fontSize(9.5).font("Helvetica-Bold").text("PROPERTY & OWNER", 315, y + 8);
  doc.fillColor("#334155").fontSize(9).font("Helvetica");
  doc.text(`Property: ${payment.propertyDetails?.name || payment.property?.name || "Property"}`, 315, y + 24);
  doc.text(`Address: ${payment.propertyDetails?.address || payment.property?.address || "Address"}`, 315, y + 38);
  doc.text(`Owner: ${payment.ownerDetails?.fullName || "Property Owner"}`, 315, y + 52);

  y += 95;

  // Table of Payment Particulars
  doc.rect(45, y, 505, 24).fill("#0f172a");
  doc.fillColor("#ffffff").fontSize(9.5).font("Helvetica-Bold");
  doc.text("DESCRIPTION / ITEM", 55, y + 7);
  doc.text("RENT PERIOD", 240, y + 7);
  doc.text("PAYMENT METHOD", 350, y + 7);
  doc.text("AMOUNT PAID", 450, y + 7, { align: "right", width: 90 });

  y += 24;
  doc.rect(45, y, 505, 45).fill("#ffffff").strokeColor("#cbd5e1").stroke();
  doc.fillColor("#1e293b").fontSize(9).font("Helvetica");

  const monthLabel = rentRecord?.billingMonth ? formatDate(rentRecord.billingMonth) : "Monthly Rent";
  const methodLabel = (payment.paymentMethod || "UPI/Cash").toUpperCase();

  doc.text("Monthly House Rent Payment", 55, y + 15);
  doc.text(monthLabel, 240, y + 15);
  doc.text(methodLabel, 350, y + 15);
  doc.font("Helvetica-Bold").text(formatINR(payment.amount), 450, y + 15, { align: "right", width: 90 });

  y += 55;

  // Financial Breakdown Box
  doc.rect(305, y, 245, 95).fill("#f8fafc").strokeColor("#e2e8f0").stroke();
  doc.fillColor("#334155").fontSize(9).font("Helvetica");

  const totalDue = rentRecord?.rentAmount || payment.amount;
  const totalPaid = rentRecord?.paidAmount || payment.amount;
  const remaining = rentRecord?.remainingAmount !== undefined ? rentRecord.remainingAmount : 0;

  doc.text("Total Monthly Rent:", 315, y + 12);
  doc.text(formatINR(totalDue), 440, y + 12, { align: "right", width: 100 });

  doc.text("Amount Received:", 315, y + 28);
  doc.fillColor("#059669").font("Helvetica-Bold").text(formatINR(payment.amount), 440, y + 28, { align: "right", width: 100 });

  doc.fillColor("#334155").font("Helvetica").text("Total Paid so far:", 315, y + 44);
  doc.text(formatINR(totalPaid), 440, y + 44, { align: "right", width: 100 });

  doc.text("Balance Outstanding:", 315, y + 60);
  doc.fillColor(remaining > 0 ? "#dc2626" : "#059669").font("Helvetica-Bold").text(formatINR(remaining), 440, y + 60, { align: "right", width: 100 });

  doc.fillColor("#64748b").fontSize(8).font("Helvetica");
  doc.text(`Status: ${(rentRecord?.status || (remaining === 0 ? "paid" : "partially-paid")).toUpperCase()}`, 315, y + 78);

  // Notes on left
  if (payment.notes) {
    doc.rect(45, y, 245, 95).fill("#ffffff").strokeColor("#e2e8f0").stroke();
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text("PAYMENT NOTES", 55, y + 10);
    doc.fillColor("#475569").fontSize(8.5).font("Helvetica").text(payment.notes, 55, y + 25, { width: 225 });
  }

  y += 120;

  // Footer & Seal
  doc.rect(45, y, 505, 80).fill("#fafafa").strokeColor("#e2e8f0").stroke();
  doc.fillColor("#64748b").fontSize(8).font("Helvetica");
  doc.text("This is a computer-generated receipt issued by Rentora Property Management System.", 55, y + 10);
  doc.text("Thank you for your prompt payment!", 55, y + 22);

  // Authorized Signatory
  doc.moveTo(370, y + 55).lineTo(495, y + 55).strokeColor("#94a3b8").stroke();
  doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica-Bold").text("Authorized Signatory", 370, y + 60, { align: "center", width: 125 });

  doc.end();
};
