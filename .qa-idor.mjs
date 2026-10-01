import mongoose from "./backend/node_modules/mongoose/index.js";
import User from "./backend/src/models/User.model.js";
import Property from "./backend/src/models/Property.model.js";
import PropertyMedia from "./backend/src/models/PropertyMedia.model.js";

const base = "http://127.0.0.1:4000/api";
const stamp = Date.now();
const emails = [`idor-a-${stamp}@example.test`, `idor-b-${stamp}@example.test`];
const userIds = [];
let propertyId;
const call = async (path, token, options = {}) => {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  return { response, body: await response.json() };
};
await mongoose.connect("mongodb://localhost:27017/rentora");
try {
  const users = [];
  for (let index = 0; index < emails.length; index += 1) {
    const result = await call("/auth/register", null, {
      method: "POST",
      body: JSON.stringify({ fullName: `IDOR Test ${index}`, email: emails[index], password: "temporary-e2e-pass" }),
    });
    if (result.response.status !== 201) throw new Error(`Register test user failed: ${result.response.status}`);
    const id = result.body.data.user.id;
    await User.findByIdAndUpdate(id, { role: "property-owner" });
    users.push({ token: result.body.data.token, id });
    userIds.push(result.body.data.user.id);
  }
  const created = await call("/properties", users[0].token, {
    method: "POST",
    body: JSON.stringify({ name: `IDOR Test Property ${stamp}`, type: "apartment", address: "1 Test Road", monthlyRent: 1000 }),
  });
  if (created.response.status !== 201) throw new Error(`Create property failed: ${created.response.status}`);
  propertyId = created.body.data._id;
  for (const [name, path, options] of [
    ["cross-owner list", "/properties", {}],
    ["cross-owner read", `/properties/${propertyId}`, {}],
    ["cross-owner update", `/properties/${propertyId}`, { method: "PUT", body: JSON.stringify({ name: "Changed by attacker" }) }],
    ["cross-owner archive", `/properties/${propertyId}`, { method: "DELETE" }],
  ]) {
    const result = await call(path, users[1].token, options);
    const passed = name === "cross-owner list"
      ? result.response.status === 200 && !result.body.data.some((property) => property._id === propertyId)
      : result.response.status === 404;
    console.log(`${passed ? "PASS" : "FAIL"} ${name}: HTTP ${result.response.status}`);
    if (!passed) throw new Error(`Cross-owner access was not blocked for ${name}`);
  }
} finally {
  if (propertyId) {
    await PropertyMedia.deleteMany({ property: propertyId });
    await Property.deleteOne({ _id: propertyId });
  }
  await User.deleteMany({ email: { $in: emails } });
  await mongoose.disconnect();
  console.log("IDOR test fixtures cleaned");
}
