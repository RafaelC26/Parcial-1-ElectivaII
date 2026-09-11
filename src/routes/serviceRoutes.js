const express = require("express");
const serviceController = require("../controllers/serviceController");

const router = express.Router();

router.get("/", serviceController.index);
router.get("/new", serviceController.nuevo);
router.post("/", serviceController.crear);

router.get("/:id", serviceController.detalle);
router.get("/:id/edit", serviceController.editar);
router.post("/:id/update", serviceController.actualizar);
router.post("/:id/cancel", serviceController.cancelar);
router.post("/:id/delete", serviceController.eliminar);

module.exports = router;
