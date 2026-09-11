const express = require("express");
const vehicleController = require("../controllers/vehicleController");

const router = express.Router();

router.get("/", vehicleController.index);
router.get("/new", vehicleController.nuevo);
router.post("/", vehicleController.crear);

router.get("/:id", vehicleController.detalle);
router.get("/:id/edit", vehicleController.editar);
router.post("/:id/update", vehicleController.actualizar);
router.post("/:id/delete", vehicleController.eliminar);

module.exports = router;
