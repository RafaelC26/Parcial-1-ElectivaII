const Service = require("../models/Service");
const Vehicle = require("../models/Vehicle");
const { asyncHandler } = require("../middleware/errorHandler");
const { parseDateInput, inicioDelDia, finDelDia } = require("../utils/dateUtils");

/**
 * GET /reports  y  GET /reports/vehicle
 *
 * Ambas rutas usan la misma vista: sin filtros muestra solo el formulario, y
 * con filtros validos agrega los resultados y los indicadores.
 */
const vehicleReport = asyncHandler(async (req, res) => {
  const { vehicleId = "", startDate = "", endDate = "" } = req.query;

  const vehiculos = await Vehicle.find().sort({ placa: 1 });

  const base = {
    titulo: "Informes",
    vehiculos,
    filtros: { vehicleId, startDate, endDate },
    errores: [],
    consultaRealizada: false,
    services: [],
    vehiculo: null,
    indicadores: null,
  };

  // Sin parametros: primera visita a /reports, solo se muestra el formulario.
  if (!vehicleId && !startDate && !endDate) {
    return res.render("reports/vehicle", base);
  }

  /* ----------------------- Validacion del informe (48) ---------------------- */

  const errores = [];

  if (!vehicleId) errores.push("Debes seleccionar un vehículo.");
  if (!startDate) errores.push("Debes ingresar la fecha inicial.");
  if (!endDate) errores.push("Debes ingresar la fecha final.");

  const desde = parseDateInput(startDate);
  const hasta = parseDateInput(endDate);

  if (startDate && !desde) errores.push("La fecha inicial no es válida.");
  if (endDate && !hasta) errores.push("La fecha final no es válida.");

  if (desde && hasta && desde.getTime() > hasta.getTime()) {
    errores.push("La fecha inicial debe ser anterior o igual a la fecha final.");
  }

  if (errores.length) {
    return res.status(400).render("reports/vehicle", { ...base, errores });
  }

  const vehiculo = await Vehicle.findById(vehicleId);
  if (!vehiculo) {
    return res.status(404).render("reports/vehicle", {
      ...base,
      errores: ["El vehículo seleccionado no existe."],
    });
  }

  /* ------------------------------- Consulta -------------------------------- */

  // finDelDia hace que el rango incluya el ultimo dia completo y no solo su
  // medianoche, que es el error clasico al filtrar por fechas.
  const services = await Service.find({
    vehiculo: vehiculo._id,
    fecha: {
      $gte: inicioDelDia(desde),
      $lte: finDelDia(hasta),
    },
  })
    .populate("vehiculo")
    .populate("conductor")
    .sort({ fecha: 1 });

  /* ------------------------------ Indicadores ------------------------------ */

  const serviciosContables = services.filter((servicio) => servicio.estado !== "Cancelado");

  const indicadores = {
    totalServicios: serviciosContables.length,
    totalPasajeros: serviciosContables.reduce((suma, servicio) => suma + (servicio.pasajeros || 0), 0),
    destinosVisitados: new Set(serviciosContables.map((servicio) => servicio.destino)).size,
    cancelados: services.length - serviciosContables.length,
  };

  res.render("reports/vehicle", {
    ...base,
    consultaRealizada: true,
    services,
    vehiculo,
    indicadores,
    periodo: { desde, hasta },
  });
});

module.exports = { vehicleReport };
