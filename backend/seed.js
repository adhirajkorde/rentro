import dotenv from "dotenv";
import { closeDatabase, getDatabase } from "./src/config/database.js";
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
import Maintenance from "./src/models/Maintenance.model.js";
import UtilityCharge from "./src/models/UtilityCharge.model.js";
import InspectionMedia from "./src/models/InspectionMedia.model.js";

dotenv.config();

async function seedDatabase() {
  try {
    getDatabase();
    console.log("SQLite connected for seeding");

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
      Maintenance.deleteMany({}),
      UtilityCharge.deleteMany({}),
      InspectionMedia.deleteMany({}),
    ]);

    // Create Property Owner (Primary user)
    const propertyOwner = await User.create({
      fullName: "Adhiraj Korde",
      email: "owner@rentora.com",
      password: "password123",
      role: "property-owner",
      phone: "+91 98230 45678",
      address: "Bandra West, Mumbai, Maharashtra 400050",
    });

    // Create secondary Super Admin
    const superAdmin = await User.create({
      fullName: "Super Admin",
      email: "superadmin@rentora.com",
      password: "password123",
      role: "super-admin",
    });

    // Create 4 Real Sample Properties for owner
    const prop1 = await Property.create({
      name: "Sunrise Apartments (Flat 402)",
      type: "apartment",
      description: "Sea-facing 2BHK with balcony, modular kitchen, and modern wooden flooring.",
      address: "Flat 402, 4th Floor, Sunrise Towers, Hill Road",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400050",
      area: 1250,
      bedrooms: 2,
      bathrooms: 2,
      furnishingStatus: "fully-furnished",
      monthlyRent: 65000,
      securityDeposit: 150000,
      maintenanceCharge: 3500,
      electricityDetails: "Meter #MSEB-40291 (Direct billing)",
      waterDetails: "24/7 Municipal & Borewell supply",
      owner: propertyOwner._id,
      status: "occupied",
      notes: "Tenant lease active through Dec 2026. Clean record.",
    });

    const prop2 = await Property.create({
      name: "Greenfield Commercial Hub (Shop 12)",
      type: "commercial",
      description: "Corner ground-floor retail shop in prime commercial market avenue.",
      address: "Shop 12, Ground Floor, Greenfield Avenue, Indiranagar",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560038",
      area: 1800,
      bedrooms: 0,
      bathrooms: 1,
      furnishingStatus: "unfurnished",
      monthlyRent: 95000,
      securityDeposit: 300000,
      maintenanceCharge: 5000,
      electricityDetails: "3-Phase commercial connection #BESCOM-9921",
      waterDetails: "Metered commercial connection",
      owner: propertyOwner._id,
      status: "occupied",
      notes: "Tenanted by artisan cafe bistro.",
    });

    const prop3 = await Property.create({
      name: "Ocean View Villa (Villa #8)",
      type: "villa",
      description: "Private 4BHK luxury villa with private lawn, plunge pool, and car parking.",
      address: "Villa 8, Beachfront Enclave, Candolim",
      city: "Goa",
      state: "Goa",
      country: "India",
      pincode: "403515",
      area: 3200,
      bedrooms: 4,
      bathrooms: 4,
      furnishingStatus: "fully-furnished",
      monthlyRent: 180000,
      securityDeposit: 400000,
      maintenanceCharge: 8000,
      electricityDetails: "Solar hybrid connection #GOA-ELEC-4421",
      waterDetails: "Private borewell & municipal connection",
      owner: propertyOwner._id,
      status: "available",
      notes: "Recently painted. Ready for immediate move-in.",
    });

    const prop4 = await Property.create({
      name: "Maple Residency Studio (Unit 108)",
      type: "flat",
      description: "Compact 1BHK cozy studio flat close to metro station and tech parks.",
      address: "Unit 108, Maple Residency, Hitec City",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500081",
      area: 650,
      bedrooms: 1,
      bathrooms: 1,
      furnishingStatus: "semi-furnished",
      monthlyRent: 28000,
      securityDeposit: 60000,
      maintenanceCharge: 1500,
      electricityDetails: "Smart meter #TSSPDCL-1088",
      waterDetails: "Included in society maintenance",
      owner: propertyOwner._id,
      status: "under-maintenance",
      notes: "Bathroom plumbing renovation underway.",
    });

    // Create Tenants
    const tenant1 = await Tenant.create({
      fullName: "Vikram Sharma",
      email: "vikram.sharma@example.com",
      phone: "+91 98765 43210",
      occupation: "Lead Software Architect at Infosys",
      address: "Permanent: 12 Civil Lines, Jaipur, Rajasthan",
      emergencyContact: {
        name: "Pooja Sharma",
        phone: "+91 98765 43219",
      },
      familyOccupantDetails: "Wife and 1 infant child",
      moveInDate: new Date("2025-01-01"),
      currentProperty: prop1._id,
      owner: propertyOwner._id,
      notes: "Prompt with payments via UPI.",
      status: "active",
      isActive: true,
    });

    const tenant2 = await Tenant.create({
      fullName: "Ananya Iyer",
      email: "ananya.iyer@example.com",
      phone: "+91 98450 11223",
      occupation: "Business Owner, Artisan Roast Cafe",
      address: "Permanent: 88 Richmond Road, Bangalore",
      emergencyContact: {
        name: "Ramesh Iyer",
        phone: "+91 98450 99887",
      },
      familyOccupantDetails: "Commercial business tenancy (4 staff members)",
      moveInDate: new Date("2024-06-01"),
      currentProperty: prop2._id,
      owner: propertyOwner._id,
      notes: "Commercial lease. Monthly rent transferred on 1st of month.",
      status: "active",
      isActive: true,
    });

    const pastTenant = await Tenant.create({
      fullName: "Rahul Deshmukh",
      email: "rahul.deshmukh@example.com",
      phone: "+91 91234 56789",
      occupation: "Consultant at Deloitte",
      address: "Permanent: Shivaji Nagar, Pune",
      moveInDate: new Date("2024-01-01"),
      moveOutDate: new Date("2025-01-01"),
      currentProperty: null,
      owner: propertyOwner._id,
      notes: "Moved out after 1-year lease. Final settlement completed.",
      status: "inactive",
      isActive: false,
    });

    // Link tenant to property
    await Property.findByIdAndUpdate(prop1._id, { tenant: tenant1._id });
    await Property.findByIdAndUpdate(prop2._id, { tenant: tenant2._id });

    // Create Agreements
    const agr1 = await RentalAgreement.create({
      owner: propertyOwner._id,
      tenant: tenant1._id,
      property: prop1._id,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      monthlyRent: 65000,
      securityDeposit: 150000,
      noticePeriod: 30,
      maintenanceResponsibility: "Owner pays society charges; Tenant handles internal repairs",
      utilityResponsibility: "Tenant pays electricity according to sub-meter",
      termsAndConditions: "1. No subletting allowed.\n2. Keep common premises clean.\n3. Rent due on 5th of every month.",
      status: "active",
      isActive: true,
    });

    const agr2 = await RentalAgreement.create({
      owner: propertyOwner._id,
      tenant: tenant2._id,
      property: prop2._id,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2026-11-15"),
      monthlyRent: 95000,
      securityDeposit: 300000,
      noticePeriod: 60,
      maintenanceResponsibility: "Commercial tenant responsible for all interior maintenance",
      utilityResponsibility: "Tenant pays 100% commercial electricity and water charges",
      termsAndConditions: "Standard commercial lease with 5% annual escalation.",
      status: "active",
      isActive: true,
    });

    // Create Security Deposits
    await SecurityDeposit.create({
      owner: propertyOwner._id,
      tenant: tenant1._id,
      property: prop1._id,
      agreement: agr1._id,
      depositAmount: 150000,
      receivedDate: new Date("2025-01-01"),
      refundAmount: 0,
      deductionAmount: 0,
      status: "held",
      notes: "Held securely in escrow bank account.",
    });

    await SecurityDeposit.create({
      owner: propertyOwner._id,
      tenant: tenant2._id,
      property: prop2._id,
      agreement: agr2._id,
      depositAmount: 300000,
      receivedDate: new Date("2024-06-01"),
      refundAmount: 0,
      deductionAmount: 0,
      status: "held",
      notes: "Commercial deposit received via NEFT.",
    });

    const settledDeposit = await SecurityDeposit.create({
      owner: propertyOwner._id,
      tenant: pastTenant._id,
      property: prop3._id,
      depositAmount: 100000,
      receivedDate: new Date("2024-01-01"),
      refundAmount: 88000,
      deductionAmount: 12000,
      deductionReason: "Deep cleaning & wall touch-up paint repairs after move-out inspection",
      refundDate: new Date("2025-01-05"),
      status: "partially_refunded",
      notes: "Settlement finalized and transferred via UPI on Jan 5th, 2025.",
    });

    // Create Rent Records for current and recent months
    const today = new Date();
    // Month 1 (Current Month - Paid)
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const r1 = await RentRecord.create({
      tenant: tenant1._id,
      property: prop1._id,
      agreement: agr1._id,
      billingMonth: currentMonth,
      dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      rentAmount: 65000,
      paidAmount: 65000,
      remainingAmount: 0,
      status: "paid",
      paymentDate: new Date(),
      paymentMethod: "upi",
    });

    const p1 = await Payment.create({
      rentRecord: r1._id,
      tenant: tenant1._id,
      property: prop1._id,
      agreement: agr1._id,
      amount: 65000,
      paymentMethod: "upi",
      paymentDate: new Date(),
      transactionId: `UPI-${Date.now()}-9912`,
      notes: "Paid on time via GPay UPI",
    });

    // Commercial Rent (Current Month - Partially Paid)
    const r2 = await RentRecord.create({
      tenant: tenant2._id,
      property: prop2._id,
      agreement: agr2._id,
      billingMonth: currentMonth,
      dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      rentAmount: 95000,
      paidAmount: 50000,
      remainingAmount: 45000,
      status: "partially-paid",
      paymentDate: new Date(),
      paymentMethod: "bank-transfer",
    });

    await Payment.create({
      rentRecord: r2._id,
      tenant: tenant2._id,
      property: prop2._id,
      agreement: agr2._id,
      amount: 50000,
      paymentMethod: "bank-transfer",
      paymentDate: new Date(),
      transactionId: `HDFC-NEFT-${Date.now()}-441`,
      notes: "First installment of rent paid. Balance scheduled for next week.",
    });

    // Create KYC Documents
    await KycDocument.create({
      owner: propertyOwner._id,
      tenant: tenant1._id,
      property: prop1._id,
      title: "Vikram Sharma - Aadhaar Card",
      fileName: "aadhaar_vikram_sharma.pdf",
      documentType: "aadhaar",
      documentNumber: "4421 8899 1234",
      documentNumberMasked: "XXXX XXXX 1234",
      fileUrl: "/uploads/aadhaar_sample.pdf",
      verificationStatus: "verified",
      expiryDate: new Date("2032-12-31"),
      notes: "Government UIDAI verified.",
    });

    await KycDocument.create({
      owner: propertyOwner._id,
      tenant: tenant1._id,
      property: prop1._id,
      title: "Vikram Sharma - PAN Card",
      fileName: "pan_vikram_sharma.jpg",
      documentType: "pan",
      documentNumber: "ABCPS1234F",
      documentNumberMasked: "*****1234F",
      fileUrl: "/uploads/pan_sample.jpg",
      verificationStatus: "verified",
      notes: "IT department verified.",
    });

    await KycDocument.create({
      owner: propertyOwner._id,
      tenant: tenant2._id,
      property: prop2._id,
      title: "Ananya Iyer - Commercial GST Registration",
      fileName: "gst_certificate_cafe.pdf",
      documentType: "other",
      documentNumber: "29AAAAA0000A1Z5",
      documentNumberMasked: "XXXXXXX0000A1Z5",
      fileUrl: "/uploads/gst_certificate.pdf",
      verificationStatus: "verified",
      notes: "Registered business entity.",
    });

    // Create Maintenance Records
    await Maintenance.create({
      owner: propertyOwner._id,
      property: prop1._id,
      tenant: tenant1._id,
      title: "Balcony Waterproofing & Grouting",
      category: "plumbing",
      amount: 4500,
      expenseDate: new Date("2025-08-15"),
      description: "Sealed tile joints on master balcony to prevent monsoon seepage.",
      vendorName: "AquaSeal Plumbing Services",
      status: "paid",
      paymentMethod: "upi",
      notes: "Comes with 1-year waterproofing warranty.",
    });

    await Maintenance.create({
      owner: propertyOwner._id,
      property: prop4._id,
      title: "Bathroom Fitting & Exhaust Replacement",
      category: "electrical",
      amount: 8200,
      expenseDate: new Date(),
      description: "Installed heavy-duty exhaust fan and LED panel lights.",
      vendorName: "City Electric Works",
      status: "paid",
      paymentMethod: "bank-transfer",
      notes: "Invoice received and filed.",
    });

    // Create Utility Charges
    await UtilityCharge.create({
      owner: propertyOwner._id,
      property: prop1._id,
      tenant: tenant1._id,
      utilityType: "electricity",
      billingPeriod: `${today.toLocaleString("en-US", { month: "short" })} ${today.getFullYear()}`,
      meterNumber: "MSEB-40291",
      previousReading: 1240,
      currentReading: 1590,
      unitsConsumed: 350,
      ratePerUnit: 9.5,
      amount: 3325,
      dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 10),
      status: "paid",
      paymentMethod: "upi",
      notes: "Paid by tenant Vikram Sharma directly.",
    });

    await UtilityCharge.create({
      owner: propertyOwner._id,
      property: prop2._id,
      tenant: tenant2._id,
      utilityType: "water",
      billingPeriod: `${today.toLocaleString("en-US", { month: "short" })} ${today.getFullYear()}`,
      meterNumber: "BWSSB-COMM-12",
      previousReading: 450,
      currentReading: 510,
      unitsConsumed: 60,
      ratePerUnit: 25,
      amount: 1500,
      dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
      status: "pending",
      notes: "Commercial water meter bill.",
    });

    // Create Inspections
    const insp1 = await Inspection.create({
      owner: propertyOwner._id,
      property: prop1._id,
      tenant: tenant1._id,
      inspector: propertyOwner._id,
      inspectionDate: new Date("2025-01-01"),
      type: "move-in",
      electricityMeter: 1240,
      waterMeter: 350,
      generalCondition: "excellent",
      walls: "good",
      floors: "excellent",
      doors: "good",
      windows: "good",
      kitchen: "excellent",
      bathroom: "good",
      furniture: "excellent",
      appliances: "good",
      status: "completed",
      otherRemarks: "Property handed over in pristine condition. All keys handed to Vikram.",
    });

    await InspectionMedia.create({
      inspection: insp1._id,
      url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      type: "photo",
      caption: "Living room at Move-in",
      order: 1,
    });

    await InspectionMedia.create({
      inspection: insp1._id,
      url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800",
      type: "photo",
      caption: "Kitchen appliances at Move-in",
      order: 2,
    });

    // Notifications
    await Notification.create({
      recipient: propertyOwner._id,
      type: "warning",
      title: "Upcoming Agreement Expiry",
      message: "Greenfield Commercial Hub lease agreement will expire in November.",
      relatedResource: "agreement",
      relatedResourceId: agr2._id,
      actionUrl: "/agreements",
    });

    await Notification.create({
      recipient: propertyOwner._id,
      type: "info",
      title: "Partial Payment Received",
      message: "Received INR 50,000 partial rent payment from Ananya Iyer.",
      relatedResource: "payment",
      relatedResourceId: r2._id,
      actionUrl: "/rent",
    });

    console.log("🌱 Database seeded successfully with real owner-centric lifecycle data!");
    console.log("\nOwner Login Credentials:");
    console.log("  Email:    owner@rentora.com");
    console.log("  Password: password123");
    console.log("\nSuper Admin Credentials:");
    console.log("  Email:    superadmin@rentora.com");
    console.log("  Password: password123");

    closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    closeDatabase();
    process.exit(1);
  }
}

seedDatabase();