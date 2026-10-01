import KycDocument from "../models/KycDocument.model.js";
import PoliceVerification from "../models/PoliceVerification.model.js";
import ErrorResponse from "../utils/error.util.js";

export const getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }

    if (req.query.type) {
      filter.documentType = req.query.type;
    }

    if (req.query.status) {
      filter.verificationStatus = req.query.status;
    }

    const documents = await KycDocument.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await KycDocument.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching documents",
    });
  }
};

export const getDocument = async (req, res) => {
  try {
    const document = await KycDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Security: Only the tenant, property owner, or super-admin can view KYC
    // For now, we return the masked document number
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Get document error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching document",
    });
  }
};

export const createDocument = async (req, res) => {
  try {
    const {
      tenant,
      documentType,
      documentNumber,
      fileUrl,
      publicId,
      expiryDate,
    } = req.body;

    if (!tenant || !documentType || !documentNumber || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Tenant, document type, document number, and file URL are required",
      });
    }

    const document = await KycDocument.create({
      tenant,
      documentType,
      documentNumber,
      documentNumberMasked: maskDocumentNumber(documentNumber),
      fileUrl,
      publicId,
      expiryDate,
      verificationStatus: "pending",
    });

    // Log action
    if (req.logAction) {
      req.logAction("document-created", "kyc-document", document._id);
    }

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      data: document,
    });
  } catch (error) {
    console.error("Create document error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating document",
    });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const {
      verificationStatus,
      verifiedBy,
      verifiedAt,
      notes,
    } = req.body;

    const document = await KycDocument.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Log action
    if (req.logAction) {
      req.logAction("document-updated", "kyc-document", document._id);
    }

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  } catch (error) {
    console.error("Update document error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating document",
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await KycDocument.findByIdAndDelete(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Log action
    if (req.logAction) {
      req.logAction("document-deleted", "kyc-document", document._id);
    }

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while deleting document",
    });
  }
};

// Helper function to mask document numbers
function maskDocumentNumber(documentNumber) {
  if (!documentNumber) return "";

  const num = documentNumber.replace(/\s+/g, "");
  if (num.length >= 4) {
    const last4 = num.slice(-4);
    if (num.length >= 12) {
      // Aadhaar: XXXX XXXX 1234
      return `XXXX XXXX ${last4}`;
    } else if (num.length >= 10) {
      // PAN or similar
      return `*****${last4}`;
    } else {
      return `XXXX${last4}`;
    }
  }
  return num;
}

export const getPoliceVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }

    if (req.query.property) {
      filter.property = req.query.property;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const verifications = await PoliceVerification.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ applicationDate: -1 });

    const total = await PoliceVerification.countDocuments(filter);

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
    res.status(500).json({
      success: false,
      message: "Server error while fetching police verifications",
    });
  }
};

export const createPoliceVerification = async (req, res) => {
  try {
    const {
      tenant,
      property,
      referenceNumber,
    } = req.body;

    if (!tenant || !referenceNumber) {
      return res.status(400).json({
        success: false,
        message: "Tenant and reference number are required",
      });
    }

    // Check if reference number already exists
    const existingVerification = await PoliceVerification.findOne({
      referenceNumber,
    });

    if (existingVerification) {
      return res.status(409).json({
        success: false,
        message: "A verification already exists with this reference number",
      });
    }

    const verification = await PoliceVerification.create({
      tenant,
      property,
      referenceNumber,
      status: "pending",
      applicationDate: new Date(),
    });

    // Log action
    if (req.logAction) {
      req.logAction("police-verification-created", "police-verification", verification._id);
    }

    res.status(201).json({
      success: true,
      message: "Police verification created successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Create police verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating police verification",
    });
  }
};