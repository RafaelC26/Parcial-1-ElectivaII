const express = require("express");
const maintenanceController = require("../controllers/maintenanceController");

const router = express.Router();

// Historial general de la flota.
router.get("/maintenance", maintenanceController.index);

// Un mantenimiento siempre nace desde el vehiculo al que pertenece.
router.get("/vehicles/:vehicleId/maintenance/new", maintenanceController.nuevo);
router.post("/vehicles/:vehicleId/maintenance", maintenanceController.crear);

router.get("/maintenance/:id/edit", maintenanceController.editar);
router.post("/maintenance/:id/update", maintenanceController.actualizar);
router.post("/maintenance/:id/delete", maintenanceController.eliminar);

module.exports = router;
