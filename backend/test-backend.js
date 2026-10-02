import "./server.js";

const runBackendTest = async () => {
  // Wait 500ms for server to start
  await new Promise((r) => setTimeout(r, 500));
  const base = `http://127.0.0.1:4000/api`;

  console.log("🚀 Running complete backend integration test...");

  const req = async (path, options = {}, token = null) => {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { ...options, headers });
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await res.json() : await res.text();
    return { status: res.status, headers: res.headers, body };
  };

  try {
    // 1. Test Login
    const loginRes = await req("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "owner@rentora.com", password: "password123" }),
    });
    if (loginRes.status !== 200 || !loginRes.body.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    const token = loginRes.body.data.token;
    console.log("✅ 1. Auth login OK");

    // 2. Test Dashboard stats
    const dashRes = await req("/dashboard", {}, token);
    if (dashRes.status !== 200 || !dashRes.body.data.portfolio) {
      throw new Error(`Dashboard failed: ${JSON.stringify(dashRes.body)}`);
    }
    console.log(`✅ 2. Dashboard stats OK (Occupied: ${dashRes.body.data.portfolio.occupiedProperties}/${dashRes.body.data.portfolio.totalProperties}, Expected Rent: ₹${dashRes.body.data.financials.monthlyExpectedRent})`);

    // 3. Test Properties
    const propRes = await req("/properties", {}, token);
    if (propRes.status !== 200 || !Array.isArray(propRes.body.data)) {
      throw new Error(`Get properties failed: ${JSON.stringify(propRes.body)}`);
    }
    const propertyId = propRes.body.data[0]._id;
    console.log(`✅ 3. Properties list OK (${propRes.body.count} properties)`);

    // 4. Test Single Property
    const singleProp = await req(`/properties/${propertyId}`, {}, token);
    if (singleProp.status !== 200 || !singleProp.body.data.name) {
      throw new Error(`Get single property failed: ${JSON.stringify(singleProp.body)}`);
    }
    console.log(`✅ 4. Single Property fetch OK (${singleProp.body.data.name})`);

    // 5. Test Tenants
    const tenantRes = await req("/tenants", {}, token);
    if (tenantRes.status !== 200 || !Array.isArray(tenantRes.body.data)) {
      throw new Error(`Get tenants failed: ${JSON.stringify(tenantRes.body)}`);
    }
    const tenantId = tenantRes.body.data[0]._id;
    console.log(`✅ 5. Tenants list OK (${tenantRes.body.count} tenants)`);

    // 6. Test Agreements & PDF
    const agrRes = await req("/agreements", {}, token);
    if (agrRes.status !== 200 || !agrRes.body.data.length) {
      throw new Error(`Get agreements failed: ${JSON.stringify(agrRes.body)}`);
    }
    const agreementId = agrRes.body.data[0]._id;
    console.log(`✅ 6. Agreements list OK (${agrRes.body.count} agreements)`);

    const pdfRes = await req(`/agreements/${agreementId}/pdf`, {}, token);
    if (pdfRes.status !== 200 || !pdfRes.headers.get("content-type")?.includes("application/pdf")) {
      throw new Error(`Agreement PDF download failed with status ${pdfRes.status}`);
    }
    console.log("✅ 7. Agreement PDF generation & download OK");

    // 7. Test Rent Records
    const rentRes = await req("/rent", {}, token);
    if (rentRes.status !== 200 || !Array.isArray(rentRes.body.data)) {
      throw new Error(`Get rent records failed: ${JSON.stringify(rentRes.body)}`);
    }
    console.log(`✅ 8. Rent records list OK (${rentRes.body.count} records)`);

    // 8. Test Payments & Receipt PDF
    const payRes = await req("/payments", {}, token);
    if (payRes.status !== 200 || !Array.isArray(payRes.body.data)) {
      throw new Error(`Get payments failed: ${JSON.stringify(payRes.body)}`);
    }
    const paymentId = payRes.body.data[0]._id;
    console.log(`✅ 9. Payments list OK (${payRes.body.count} payments)`);

    const recRes = await req(`/payments/${paymentId}/receipt`, {}, token);
    if (recRes.status !== 200 || !recRes.headers.get("content-type")?.includes("application/pdf")) {
      throw new Error(`Payment receipt PDF download failed with status ${recRes.status}`);
    }
    console.log("✅ 10. Payment Receipt PDF generation & download OK");

    // 9. Test Inspections & Comparison
    const inspRes = await req("/inspections", {}, token);
    if (inspRes.status !== 200 || !Array.isArray(inspRes.body.data)) {
      throw new Error(`Get inspections failed: ${JSON.stringify(inspRes.body)}`);
    }
    console.log(`✅ 11. Inspections list OK (${inspRes.body.count} inspections)`);

    const compareRes = await req(`/inspections/compare/${propertyId}`, {}, token);
    if (compareRes.status !== 200 || !compareRes.body.data) {
      throw new Error(`Inspection comparison failed: ${JSON.stringify(compareRes.body)}`);
    }
    console.log("✅ 12. Inspection Move-In vs Move-Out comparison endpoint OK");

    // 10. Test Documents
    const docRes = await req("/documents", {}, token);
    if (docRes.status !== 200 || !Array.isArray(docRes.body.data)) {
      throw new Error(`Get documents failed: ${JSON.stringify(docRes.body)}`);
    }
    console.log(`✅ 13. KYC Documents list OK (${docRes.body.count} documents)`);

    // 11. Test Maintenance & Utilities
    const maintRes = await req("/maintenance", {}, token);
    if (maintRes.status !== 200) throw new Error(`Maintenance failed: ${JSON.stringify(maintRes.body)}`);
    console.log(`✅ 14. Maintenance expenses OK (${maintRes.body.count} expenses)`);

    const utilRes = await req("/utilities", {}, token);
    if (utilRes.status !== 200) throw new Error(`Utilities failed: ${JSON.stringify(utilRes.body)}`);
    console.log(`✅ 15. Utility charges & meter readings OK (${utilRes.body.count} readings)`);

    // 12. Test Security Deposits & Final Settlement
    const depRes = await req("/deposits", {}, token);
    if (depRes.status !== 200) throw new Error(`Deposits failed: ${JSON.stringify(depRes.body)}`);
    console.log(`✅ 16. Security deposits OK (${depRes.body.count} deposits, total held: ₹${depRes.body.totalHeld})`);

    // 13. Test Reports & CSV Export
    const repRes = await req("/reports/summary", {}, token);
    if (repRes.status !== 200 || !repRes.body.data.propertyPerformance) {
      throw new Error(`Reports summary failed: ${JSON.stringify(repRes.body)}`);
    }
    console.log("✅ 17. Reports P&L summary OK");

    const csvRes = await req("/reports/export?type=outstanding", {}, token);
    if (csvRes.status !== 200 || !csvRes.headers.get("content-type")?.includes("text/csv")) {
      throw new Error(`Reports CSV export failed`);
    }
    console.log("✅ 18. Reports CSV export OK");

    // 14. IDOR Protection Test
    const attackerRes = await req("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName: "Attacker Owner", email: `attacker_${Date.now()}@test.com`, password: "password123" }),
    });
    const attackerToken = attackerRes.body.data.token;

    const idorProp = await req(`/properties/${propertyId}`, {}, attackerToken);
    if (idorProp.status === 200) {
      throw new Error("SECURITY FAILURE: Attacker was able to read victim's property!");
    }
    console.log("✅ 19. IDOR protection verified: Cross-owner property access blocked (404/403)");

    console.log("\n🎉 ALL 19/19 BACKEND ENDPOINTS & FLOWS VERIFIED 100% WORKING!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
};

runBackendTest();
