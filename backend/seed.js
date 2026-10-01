import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.model.js";
import Property from "./src/models/Property.model.js";
import Tenant from "./src/models/Tenant.model.js";
import RentalAgreement from "./src/models/RentalAgreement.model.js";
import RentRecord from "./src/models/RentRecord.model.js";
import Payment from "./src/models/Payment.model.js";
import SecurityDeposit from "./src/models/SecurityDeposit.model.js";
import KycDocument from "./src/models/KycDocument.model.js";
import PoliceVerification from "./src/models/PoliceVerification.model.js";
import Inspection from "./src/models/Inspection.model.js";
import Damage from "./src/models/Damage.model.js";
import Notification from "./src/models/Notification.model.js";
import AuditLog from "./src/models/AuditLog.model.js";
import PropertyMedia from "./src/models/PropertyMedia.model.js";

dotenv.config();

const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rentora";

async function seedDatabase() {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected for seeding");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Property.deleteMany({}),
      Tenant.deleteMany({}),
      RentalAgreement.deleteMany({}),
      RentRecord.deleteMany({}),
      Payment.deleteMany({}),
      SecurityDeposit.deleteMany({}),
      KycDocument.deleteMany({}),
      PoliceVerification.deleteMany({}),
      Inspection.deleteMany({}),
      Damage.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      PropertyMedia.deleteMany({}),
    ]);

    // Create Super Admin
    const superAdmin = await User.create({
      fullName: "Super Admin",
      email: "superadmin@rentora.com",
      password: "password123",
      role: "super-admin",
    });

    // Create Property Manager
    const propertyManager = await User.create({
      fullName: "Property Manager",
      email: "manager@rentora.com",
      password: "password123",
      role: "property-manager",
    });

    // Create Property Owner
    const propertyOwner = await User.create({
      fullName: "Property Owner",
      email: "owner@rentora.com",
      password: "password123",
      role: "property-owner",
    });

    // Create Tenant
    const tenant = await User.create({
      fullName: "Test Tenant",
      email: "tenant@rentora.com",
      password: "password123",
      role: "tenant",
    });

    // Create sample properties
    const properties = await Property.insertMany([
      {
        name: "Sunrise Apartments",
        type: "apartment",
        description: "Modern apartment complex with amenities",
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400001",
        area: 1500,
        bedrooms: 2,
        bathrooms: 2,
        furnishingStatus: "fully-furnished",
        monthlyRent: 50000,
        securityDeposit: 100000,
        maintenanceCharge: 2000,
        electricityDetails: "Metered",
        waterDetails: "Included",
        owner: superAdmin._id,
        propertyManager: propertyManager._id,
        status: "occupied",
      },
      {
        name: "Ocean View Villa",
        type: "villa",
        description: "Luxury villa with sea view",
        address: "456 Beach Road",
        city: "Goa",
        state: "Goa",
        country: "India",
        pincode: "403001",
        area: 3000,
        bedrooms: 4,
        bathrooms: 3,
        furnishingStatus: "fully-furnished",
        monthlyRent: 200000,
        securityDeposit: 400000,
        maintenanceCharge: 5000,
        electricityDetails: "Solar power",
        waterDetails: "Rainwater harvesting",
        owner: propertyOwner._id,
        status: "available",
      },
      {
        name: "Greenfield Commercial",
        type: "commercial",
        description: "Prime commercial space for rent",
        address: "789 Business Avenue",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        pincode: "560001",
        area: 2000,
        bedrooms: 0,
        bathrooms: 2,
        furnishingStatus: "unfurnished",
        monthlyRent: 80000,
        securityDeposit: 160000,
        maintenanceCharge: 3000,
        electricityDetails: "3-phase power",
        waterDetails: "Municipal",
        owner: superAdmin._id,
        status: "reserved",
      },
    ]);

    // Create sample tenant
    const sampleTenant = await Tenant.create({
      fullName: "John Doe",
      email: "john.doe@rentora.com",
      phone: "+91-98765-12345",
      occupation: "Software Engineer",
      address: "456 MG Road, Bangalore",
      emergencyContact: {
        name: "Jane Doe",
        phone: "+91-98765-54321",
      },
      familyOccupantDetails: "Wife and child",
      moveInDate: new Date("2024-01-15"),
      currentProperty: properties[0]._id,
    });

    // Update property to have tenant
    await Property.findByIdAndUpdate(properties[0]._id, {
      $set: { status: "occupied", tenant: sampleTenant._id },
    });

    // Create rental agreement
    const agreement = await RentalAgreement.create({
      owner: propertyOwner._id,
      tenant: sampleTenant._id,
      property: properties[0]._id,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-01-15"),
      monthlyRent: 50000,
      securityDeposit: 100000,
      noticePeriod: 30,
      maintenanceResponsibility: "Owner",
      utilityResponsibility: "Tenant",
      termsAndConditions: "Standard residential lease terms apply",
      status: "active",
    });

    // Create rent records (last 3 months)
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const month = new Date(today);
      month.setMonth(today.getMonth() - i);
      month.setDate(1);

      await RentRecord.create({
        tenant: sampleTenant._id,
        property: properties[0]._id,
        agreement: agreement._id,
        billingMonth: month,
        dueDate: new Date(month.getFullYear(), month.getMonth() + 1, 0),
        rentAmount: 50000,
        paidAmount: i === 0 ? 50000 : 0, // First month paid
        remainingAmount: i === 0 ? 0 : 50000,
        status: i === 0 ? "paid" : "unpaid",
        paymentMethod: i === 0 ? "bank-transfer" : null,
      });
    }

    // Create payment record
    await Payment.create({
      rentRecord: (await RentRecord.findOne({ status: "paid" }))._id,
      tenant: sampleTenant._id,
      property: properties[0]._id,
      agreement: agreement._id,
      amount: 50000,
      paymentMethod: "bank-transfer",
      transactionId: "TXN-20240115-001",
    });

    // Create security deposit
    await SecurityDeposit.create({
      tenant: sampleTenant._id,
      property: properties[0]._id,
      agreement: agreement._id,
      depositAmount: 100000,
      receivedDate: new Date("2024-01-15"),
      refundAmount: 0,
      deductionAmount: 0,
      deductionReason: "",
      refundDate: null,
      status: "pending",
    });

    // Create KYC document
    await KycDocument.create({
      tenant: sampleTenant._id,
      documentType: "aadhaar",
      documentNumber: "1234 5678 9012",
      documentNumberMasked: "XXXX XXXX 9012",
      fileUrl: "/uploads/aadhaar-john-doe.pdf",
      publicId: "aadhaar_john_doe",
      expiryDate: new Date("2029-01-15"),
      verificationStatus: "verified",
    });

    // Create police verification
    await PoliceVerification.create({
      tenant: sampleTenant._id,
      property: properties[0]._id,
      referenceNumber: "PV-2024-001",
      applicationDate: new Date("2024-01-15"),
      status: "verified",
      notes: "Verification completed successfully",
    });

    // Create inspection
    await Inspection.create({
      property: properties[0]._id,
      tenant: sampleTenant._id,
      inspector: superAdmin._id,
      inspectionDate: new Date("2024-01-15"),
      type: "move-in",
      electricityMeter: 1500,
      waterMeter: 500,
      generalCondition: "good",
      walls: "good",
      floors: "good",
      doors: "good",
      windows: "good",
      kitchen: "good",
      bathroom: "good",
      furniture: "good",
      appliances: "good",
      status: "completed",
    });

    // Create damage record
    await Damage.create({
      inspection: (await Inspection.findOne({ type: "move-in" }))._id,
      item: "Wall paint",
      description: "Minor scratches on living room wall",
      previousCondition: "good",
      currentCondition: "fair",
      repairRequired: true,
      estimatedCost: 2000,
      deductionAmount: 2000,
      notes: "Touch-up painting required",
    });

    // Create notification
    await Notification.create({
      recipient: sampleTenant._id,
      type: "info",
      title: "Rent Due",
      message: "Monthly rent of ₹50,000 is due on the 5th of each month",
      relatedResource: "rent-record",
      relatedResourceId: (await RentRecord.findOne({ status: "unpaid" }))._id,
    });

    // Create audit log
    await AuditLog.create({
      user: superAdmin._id,
      action: "user-created",
      resource: "user",
      resourceId: superAdmin._id,
      previousData: null,
      newData: {
        fullName: "Super Admin",
        email: "superadmin@rentora.com",
        role: "super-admin",
      },
      ipAddress: "127.0.0.1",
      userAgent: "Rentora Seed Script",
    });

    console.log("🌱 Database seeded successfully!");
    console.log("\nDemo Accounts:");
    console.log("  Super Admin: superadmin@rentora.com / password123");
    console.log("  Property Manager: manager@rentora.com / password123");
    console.log("  Property Owner: owner@rentora.com / password123");
    console.log("  Tenant: tenant@rentora.com / password123");
    console.log("\n⚠️  These are development/demo accounts. Never use in production.");

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();