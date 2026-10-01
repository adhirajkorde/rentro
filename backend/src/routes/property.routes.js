const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/property.controller.js");

router.route("/")
  .get(propertyController.getProperties)
  .post(propertyController.createProperty);

router.route("/search")
  .get(propertyController.searchProperties);

router.route("/filters")
  .get(propertyController.filterProperties);

router.route("/:id")
  .get(propertyController.getProperty)
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

router.route("/:id/status")
  .put(propertyController.togglePropertyStatus);

module.exports = router;