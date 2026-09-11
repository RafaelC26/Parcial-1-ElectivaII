const express = require("express");
const driverController = require("../controllers/driverController");

const router = express.Router();

router.get("/", driverController.index);
router.get("/new", driverController.nuevo);
router.post("/", driverController.crear);

router.get("/:id", driverController.detalle);
router.get("/:id/edit", driverController.editar);
router.post("/:id/update", driverController.actualizar);
router.post("/:id/delete", driverController.eliminar);

module.exports = router;
