const express = require("express");
const router = express.Router();

router.post("/register", require("../controllers/auth.controller.js").register);
router.post("/login", require("../controllers/auth.controller.js").login);
router.get("/logout", require("../controllers/auth.controller.js").logout);
router.post("/forgot-password", require("../controllers/auth.controller.js").forgotPassword);
router.post("/reset-password", require("../controllers/auth.controller.js").resetPassword);
router.post("/change-password", require("../controllers/auth.controller.js").changePassword);
router.get("/me", require("../controllers/auth.controller.js").getMe);

module.exports = router;