import Inspection from "../models/Inspection.model.js";
import Damage from "../models/Damage.model.js";
import InspectionMedia from "../models/InspectionMedia.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";

export const getInspections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    let propertyIds = null;
    if (req.user.role !== "super-admin") {
      const ownerProperties = await Property.find({ owner: req.user._id });
      propertyIds = ownerProperties.map((p) => p._id);
    }

    const filter = {};
    if (propertyIds !== null) {
      filter.property = { $in: propertyIds };
    }

    if (req.query.property) filter.property = req.query.property;
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const [inspections, total] = await Promise.all([
      Inspection.find(filter).skip(skip).limit(limit).sort({ inspectionDate: -1 }),
      Inspection.countDocuments(filter),
    ]);

    const populated = await Promise.all(
      inspections.map(async (insp) => {
        const iObj = insp.toObject ? insp.toObject() : { ...insp };
        const [propertyDetails, tenantDetails, media, damages] = await Promise.all([
          insp.property ? Property.findById(insp.property) : null,
          insp.tenant ? Tenant.findById(insp.tenant) : null,
          InspectionMedia.find({ inspection: insp._id }).sort({ order: 1 }),
          Damage.find({ inspection: insp._id }),
        ]);
        return {
          ...iObj,
          propertyDetails,
          tenantDetails,
          media,
          damages,
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
    next(error);
  }
};

export const getInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    const [propertyDetails, tenantDetails, media, damages] = await Promise.all([
      Property.findById(inspection.property),
      inspection.tenant ? Tenant.findById(inspection.tenant) : null,
      InspectionMedia.find({ inspection: inspection._id }).sort({ order: 1 }),
      Damage.find({ inspection: inspection._id }),
    ]);

    if (req.user.role !== "super-admin" && propertyDetails?.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...inspection.toObject(),
        propertyDetails,
        tenantDetails,
        media,
        damages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createInspection = async (req, res, next) => {
  try {
    const {
      property, tenant, inspectionDate, type,
      electricityMeter, waterMeter, gasMeter,
      generalCondition, walls, floors, doors, windows,
      kitchen, bathroom, furniture, appliances, otherRemarks,
      status, mediaUrls, damages,
    } = req.body;

    if (!property || !inspectionDate) {
      return res.status(400).json({ success: false, message: "Property and inspection date are required" });
    }

    const targetProperty = await Property.findById(property);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized for this property" });
    }

    const inspection = await Inspection.create({
      owner: req.user._id,
      property,
      tenant: tenant || targetProperty.tenant || null,
      inspector: req.user._id,
      inspectionDate: new Date(inspectionDate),
      type: type || "move-in",
      electricityMeter: electricityMeter !== undefined ? Number(electricityMeter) : null,
      waterMeter: waterMeter !== undefined ? Number(waterMeter) : null,
      gasMeter: gasMeter !== undefined ? Number(gasMeter) : null,
      generalCondition: generalCondition || "good",
      walls: walls || "good",
      floors: floors || "good",
      doors: doors || "good",
      windows: windows || "good",
      kitchen: kitchen || "good",
      bathroom: bathroom || "good",
      furniture: furniture || "good",
      appliances: appliances || "good",
      otherRemarks: otherRemarks ? String(otherRemarks).trim() : "",
      status: status || "completed",
    });

    // Handle media uploaded via multer files or passed as mediaUrls array
    const mediaItems = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        mediaItems.push({
          inspection: inspection._id,
          url: `/uploads/${file.filename}`,
          type: file.mimetype.startsWith("video/") ? "video" : "photo",
          caption: file.originalname,
          order: index,
          publicId: file.filename,
        });
      });
    }

    if (Array.isArray(mediaUrls)) {
      mediaUrls.forEach((urlItem, index) => {
        const u = typeof urlItem === "string" ? urlItem : urlItem.url;
        if (u) {
          mediaItems.push({
            inspection: inspection._id,
            url: u,
            type: u.match(/\.(mp4|mov|webm)$/i) ? "video" : "photo",
            caption: typeof urlItem === "object" ? urlItem.caption || "Inspection media" : "Inspection media",
            order: index + 10,
          });
        }
      });
    }

    if (mediaItems.length > 0) {
      await InspectionMedia.insertMany(mediaItems);
    }

    // Handle damages passed in creation payload
    if (Array.isArray(damages) && damages.length > 0) {
      const damageRecords = damages.map((d) => ({
        inspection: inspection._id,
        property,
        tenant: tenant || targetProperty.tenant || null,
        item: d.item || "Damage item",
        description: d.description || "",
        previousCondition: d.previousCondition || "good",
        currentCondition: d.currentCondition || "poor",
        repairRequired: d.repairRequired !== false,
        estimatedCost: Number(d.estimatedCost) || 0,
        deductionAmount: Number(d.deductionAmount) || 0,
        notes: d.notes || "",
        photoUrl: d.photoUrl || "",
      }));
      await Damage.insertMany(damageRecords);
    }

    if (req.logAction) req.logAction("inspection-created", "inspection", inspection._id);

    const [savedMedia, savedDamages] = await Promise.all([
      InspectionMedia.find({ inspection: inspection._id }),
      Damage.find({ inspection: inspection._id }),
    ]);

    res.status(201).json({
      success: true,
      message: "Inspection created successfully",
      data: {
        ...inspection.toObject(),
        media: savedMedia,
        damages: savedDamages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInspection = async (req, res, next) => {
  try {
    const existing = await Inspection.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    const targetProperty = await Property.findById(existing.property);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized for this inspection" });
    }

    const { mediaUrls, damages, ...updateFields } = req.body;

    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      const newMedia = mediaUrls.map((u, i) => ({
        inspection: inspection._id,
        url: typeof u === "string" ? u : u.url,
        type: (typeof u === "string" ? u : u.url).match(/\.(mp4|mov|webm)$/i) ? "video" : "photo",
        caption: typeof u === "object" ? u.caption : "Inspection media",
        order: i,
      }));
      await InspectionMedia.insertMany(newMedia);
    }

    if (Array.isArray(damages) && damages.length > 0) {
      for (const d of damages) {
        if (d._id) {
          await Damage.findByIdAndUpdate(d._id, d, { new: true });
        } else {
          await Damage.create({
            ...d,
            inspection: inspection._id,
            property: inspection.property,
            tenant: inspection.tenant,
          });
        }
      }
    }

    if (req.logAction) req.logAction("inspection-updated", "inspection", inspection._id);

    const [savedMedia, savedDamages] = await Promise.all([
      InspectionMedia.find({ inspection: inspection._id }),
      Damage.find({ inspection: inspection._id }),
    ]);

    res.status(200).json({
      success: true,
      message: "Inspection updated successfully",
      data: {
        ...inspection.toObject(),
        media: savedMedia,
        damages: savedDamages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addInspectionDamage = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    const { item, description, previousCondition, currentCondition, repairRequired, estimatedCost, deductionAmount, notes, photoUrl } = req.body;

    if (!item) {
      return res.status(400).json({ success: false, message: "Damage item name is required" });
    }

    const damage = await Damage.create({
      inspection: inspection._id,
      property: inspection.property,
      tenant: inspection.tenant,
      item: String(item).trim(),
      description: description ? String(description).trim() : "",
      previousCondition: previousCondition || "good",
      currentCondition: currentCondition || "poor",
      repairRequired: repairRequired !== false,
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
      deductionAmount: deductionAmount ? Number(deductionAmount) : 0,
      notes: notes ? String(notes).trim() : "",
      photoUrl: photoUrl || "",
    });

    res.status(201).json({ success: true, message: "Damage item recorded successfully", data: damage });
  } catch (error) {
    next(error);
  }
};

export const compareInspections = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (req.user.role !== "super-admin" && property.owner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized for this property" });
    }

    const allInspections = await Inspection.find({ property: propertyId }).sort({ inspectionDate: -1 });

    const moveIn = allInspections.find((i) => i.type === "move-in");
    const moveOut = allInspections.find((i) => i.type === "move-out");

    const [moveInMedia, moveOutMedia, moveInDamages, moveOutDamages] = await Promise.all([
      moveIn ? InspectionMedia.find({ inspection: moveIn._id }) : [],
      moveOut ? InspectionMedia.find({ inspection: moveOut._id }) : [],
      moveIn ? Damage.find({ inspection: moveIn._id }) : [],
      moveOut ? Damage.find({ inspection: moveOut._id }) : [],
    ]);

    const totalDamageEstimated = moveOutDamages.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);
    const totalDeductions = moveOutDamages.reduce((sum, d) => sum + (d.deductionAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        property,
        moveIn: moveIn ? { ...moveIn.toObject(), media: moveInMedia, damages: moveInDamages } : null,
        moveOut: moveOut ? { ...moveOut.toObject(), media: moveOutMedia, damages: moveOutDamages } : null,
        comparisonSummary: {
          totalDamageEstimated,
          totalDeductions,
          hasMoveIn: Boolean(moveIn),
          hasMoveOut: Boolean(moveOut),
          moveInDate: moveIn?.inspectionDate || null,
          moveOutDate: moveOut?.inspectionDate || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
