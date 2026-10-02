import pdfkit from "pdfkit";
import RentalAgreement from "../models/RentalAgreement.model.js";
import RentRecord from "../models/RentRecord.model.js";
import fs from "fs";
import path from "path";

export const generateAgreementPdf = async (agreementId, res) => {
  try {
    const agreement = await RentalAgreement.findById(agreementId)
      .populate("owner", "fullName email")
      .populate("tenant", "fullName email phone")
      .populate("property", "name address city");

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    const rentRecords = await RentRecord.find({ agreement: agreementId }).sort({
      billingMonth: 1,
    });

    // Create PDF document
    const doc = new pdfkit({ margin: 50 });
    const chunks = [];

    // Pipe to a buffer
    await new Promise((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    // Write PDF content
    doc.pipe(fs.createWriteStream(`agreement_${agreement._id}.pdf`));

    // Title
    doc.fontSize(20).text("RENTAL AGREEMENT", { align: "center" });
    doc.space(20);

    // Agreement details section
    doc.fontSize(12).text("Agreement Details", { underline: true });
    doc.space(10);

    doc.table({
      columns: [
        { label: "Field", width: 120 },
        { label: "Details", width: 400 },
      ],
      rows: [
        ["Agreement ID", agreement._id],
        ["Property", agreement.property ? agreement.property.name : "—"],
        ["Tenant", agreement.tenant ? agreement.tenant.fullName : "—"],
        ["Owner", agreement.owner ? agreement.owner.fullName : "—"],
        ["Start Date", new Date(agreement.startDate).toLocaleDateString()],
        ["End Date", new Date(agreement.endDate).toLocaleDateString()],
        ["Monthly Rent", `₹${agreement.monthlyRent.toLocaleString()}`],
        ["Security Deposit", `₹${agreement.securityDeposit.toLocaleString()}`],
        ["Status", agreement.status],
      ],
    }, { align: "center", margin: 50 });

    doc.moveDown(20);

    // Terms and conditions
    doc.fontSize(12).text("Terms and Conditions:", { underline: true });
    doc.space(5);
    doc.fontSize(10).text(agreement.termsAndConditions || "Not specified", { continuable: true });
    doc.space(20);

    // Rent payment schedule
    doc.fontSize(12).text("Rent Payment Schedule", { underline: true });
    doc.space(5);

    if (rentRecords.length > 0) {
      doc.table(
        {
          columns: [
            { label: "Billing Month", width: 150 },
            { label: "Due Date", width: 120 },
            { label: "Rent Amount", width: 120 },
            { label: "Paid Amount", width: 120 },
            { label: "Remaining", width: 120 },
            { label: "Status", width: 80 },
          ],
          rows: rentRecords.map((record) => [
            new Date(record.billingMonth).toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            }),
            new Date(record.dueDate).toLocaleDateString(),
            `₹${record.rentAmount.toLocaleString()}`,
            `₹${record.paidAmount.toLocaleString()}`,
            `₹${record.remainingAmount.toLocaleString()}`,
            record.status,
          ]),
        },
        { align: "center", margin: 50 }
      );
    } else {
      doc.text("No rent records found for this agreement.", { continued: true });
    }

    doc.moveDown(20);

    // Signatures section
    doc.fontSize(12).text("Signatures", { underline: true });
    doc.space(5);

    const signatures = await AgreementSignature.find({ agreement: agreementId });
    if (signatures.length > 0) {
      signatures.forEach((sig) => {
        doc.text(`Signed by: ${sig.signedBy}`);
        doc.text(`Signed at: ${new Date(sig.signedAt).toLocaleString()}`);
        doc.space(10);
      });
    } else {
      doc.text("No signatures captured yet.", { continued: true });
    }

    doc.end();

    // Send the file
    const pdfPath = `agreement_${agreement._id}.pdf`;
    res.download(pdfPath, `Rental_Agreement_${agreement.property?.name || "Property"}_${agreement.tenant?.fullName || "Tenant"}.pdf`, (err) => {
      // Clean up the temporary file
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
      if (err) {
        console.error("Error sending PDF:", err);
        res.status(500).json({ success: false, message: "Error generating PDF" });
      }
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
};