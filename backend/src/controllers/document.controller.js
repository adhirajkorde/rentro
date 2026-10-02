import KycDocument from "../models/KycDocument.model.js";
import PoliceVerification from "../models/PoliceVerification.model.js";
import Tenant from "../models/Tenant.model.js";
import Property from "../models/Property.model.js";

const maskDocumentNumber = (documentNumber) => {
  if (!documentNumber) return "";
  const num = documentNumber.replace(/\s+/g, "");
  if (num.length >= 4) {
    const last4 = num.slice(-4);
    if (num.length >= 12) return `XXXX XXXX ${last4}`;
    if (num.length >= 10) return `*****${last4}`;
    return `XXXX${last4}`;
  }
  return num;
};

export const getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.role !== "super-admin") {
      filter.owner = req.user._id;
    }

    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.property) filter.property = req.query.property;
    if (req.query.type) filter.documentType = req.query.type;
    if (req.query.status) filter.verificationStatus = req.query.status;

    const [documents, total] = await Promise.all([
      KycDocument.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      KycDocument.countDocuments(filter),
    ]);

    const populated = await Promise.all(
      documents.map(async (doc) => {
        const dObj = doc.toObject ? doc.toObject() : { ...doc };
        const [tenantDetails, propertyDetails] = await Promise.all([
          doc.tenant ? Tenant.findById(doc.tenant) : null,
          doc.property ? Property.findById(doc.property) : null,
        ]);
        return {
          ...dObj,
          tenantDetails,
          propertyDetails,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: populated.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: populated,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching documents" });
  }
};

export const getDocument = async (req, res) => {
  try {
    const document = await KycDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user.role !== "super-admin" && document.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const [tenantDetails, propertyDetails] = await Promise.all([
      document.tenant ? Tenant.findById(document.tenant) : null,
      document.property ? Property.findById(document.property) : null,
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...document.toObject(),
        tenantDetails,
        propertyDetails,
      },
    });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching document" });
  }
};

export const createDocument = async (req, res) => {
  try {
    let {
      tenant,
      property,
      documentType,
      title,
      fileName,
      documentNumber,
      fileUrl,
      publicId,
      expiryDate,
      verificationStatus,
      notes,
    } = req.body;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      publicId = req.file.filename;
    }

    if (!documentType || (!fileUrl && !req.file)) {
      return res.status(400).json({
        success: false,
        message: "Document type and file are required",
      });
    }

    // Auto-derive property from tenant if not passed
    if (!property && tenant) {
      const t = await Tenant.findById(tenant);
      if (t?.currentProperty) property = t.currentProperty;
    }

    const document = await KycDocument.create({
      owner: req.user._id,
      tenant: tenant || null,
      property: property || null,
      title: title ? String(title).trim() : `${documentType.toUpperCase()} Document`,
      fileName: fileName || "Document",
      documentType: String(documentType).toLowerCase(),
      documentNumber: documentNumber ? String(documentNumber).trim() : "",
      documentNumberMasked: maskDocumentNumber(documentNumber),
      fileUrl,
      publicId,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      verificationStatus: verificationStatus || "verified",
      notes: notes ? String(notes).trim() : "",
    });

    if (req.logAction) req.logAction("document-created", "kyc-document", document._id);

    const [tenantDetails, propertyDetails] = await Promise.all([
      document.tenant ? Tenant.findById(document.tenant) : null,
      document.property ? Property.findById(document.property) : null,
    ]);

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        ...document.toObject(),
        tenantDetails,
        propertyDetails,
      },
    });
  } catch (error) {
    console.error("Create document error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while creating document" });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const existing = await KycDocument.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const { owner: _owner, ...updateData } = req.body;
    if (updateData.documentNumber) {
      updateData.documentNumberMasked = maskDocumentNumber(updateData.documentNumber);
    }

    const document = await KycDocument.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (req.logAction) req.logAction("document-updated", "kyc-document", document._id);

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  } catch (error) {
    console.error("Update document error:", error);
    res.status(500).json({ success: false, message: "Server error while updating document" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const existing = await KycDocument.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    await KycDocument.findByIdAndDelete(req.params.id);

    if (req.logAction) req.logAction("document-deleted", "kyc-document", req.params.id);

    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ success: false, message: "Server error while deleting document" });
  }
};

export const getPoliceVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.property) filter.property = req.query.property;
    if (req.query.status) filter.status = req.query.status;

    const [verifications, total] = await Promise.all([
      PoliceVerification.find(filter).skip(skip).limit(limit).sort({ applicationDate: -1 }),
      PoliceVerification.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: verifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: verifications,
    });
  } catch (error) {
    console.error("Get police verifications error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching police verifications" });
  }
};

export const createPoliceVerification = async (req, res) => {
  try {
    const { tenant, property, referenceNumber, notes, status, applicationDate } = req.body;

    if (!tenant || !referenceNumber) {
      return res.status(400).json({ success: false, message: "Tenant and reference number are required" });
    }

    const verification = await PoliceVerification.create({
      tenant,
      property,
      referenceNumber,
      status: status || "verified",
      notes: notes || "Verification completed successfully",
      applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
    });

    if (req.logAction) req.logAction("police-verification-created", "police-verification", verification._id);

    res.status(201).json({
      success: true,
      message: "Police verification recorded successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Create police verification error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while creating police verification" });
  }
};