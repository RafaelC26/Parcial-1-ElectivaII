const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();

// Ambas rutas comparten controlador: /reports muestra el formulario vacio y
// /reports/vehicle agrega los resultados de la consulta.
router.get("/", reportController.vehicleReport);
router.get("/vehicle", reportController.vehicleReport);

module.exports = router;
