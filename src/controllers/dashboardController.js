const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Service = require("../models/Service");
const Maintenance = require("../models/Maintenance");
const { ESTADOS_VEHICULO } = require("../models/Vehicle");
const { asyncHandler } = require("../middleware/errorHandler");
const { inicioDelDia, finDelDia, formatFullDate } = require("../utils/dateUtils");

/**
 * GET /
 *
 * Todas las cifras salen de MongoDB mediante countDocuments y aggregate;
 * no hay ningun valor fijo en la vista (seccion 27 del enunciado).
 */
const index = asyncHandler(async (req, res) => {
  const ahora = new Date();
  const desdeHoy = inicioDelDia(ahora);
  const hastaHoy = finDelDia(ahora);

  const [
    totalVehiculos,
    vehiculosDisponibles,
    serviciosHoy,
    conductoresActivos,
    flota,
    proximosServicios,
    serviciosEnCurso,
    mantenimientosRecientes,
    licenciasPorVencer,
  ] = await Promise.all([
    Vehicle.countDocuments(),

    Vehicle.countDocuments({ estado: "Disponible" }),

    Service.countDocuments({
      fecha: { $gte: desdeHoy, $lte: hastaHoy },
      estado: { $ne: "Cancelado" },
    }),

    Driver.countDocuments({ estado: { $ne: "Inactivo" } }),

    // Distribucion de la flota por estado operativo.
    Vehicle.aggregate([{ $group: { _id: "$estado", total: { $sum: 1 } } }]),

    // Proximos servicios: los que aun no han terminado.
    Service.find({
      fechaHoraRegreso: { $gte: ahora },
      estado: { $nin: ["Cancelado", "Finalizado"] },
    })
      .populate("vehiculo", "placa marca modelo")
      .populate("conductor", "nombre")
      .sort({ fechaHoraSalida: 1 })
      .limit(5),

    // Servicios que estan ocurriendo en este momento.
    Service.countDocuments({
      fechaHoraSalida: { $lte: ahora },
      fechaHoraRegreso: { $gte: ahora },
      estado: { $ne: "Cancelado" },
    }),

    Maintenance.find().populate("vehiculo", "placa marca modelo").sort({ fecha: -1 }).limit(4),

    // Licencias que vencen dentro de los proximos 60 dias.
    Driver.find({
      estado: { $ne: "Inactivo" },
      vencimientoLicencia: {
        $gte: ahora,
        $lte: new Date(ahora.getTime() + 60 * 24 * 60 * 60 * 1000),
      },
    })
      .sort({ vencimientoLicencia: 1 })
      .limit(3),
  ]);

  // Normaliza el resultado del aggregate para que la vista siempre reciba
  // los cuatro estados, incluso los que tienen cero vehiculos.
  const conteoFlota = new Map(flota.map((fila) => [fila._id, fila.total]));
  const estadoFlota = ESTADOS_VEHICULO.map((estado) => ({
    estado,
    total: conteoFlota.get(estado) || 0,
  }));

  res.render("dashboard/index", {
    titulo: "Dashboard",
    fechaHoy: formatFullDate(ahora),
    kpis: {
      totalVehiculos,
      vehiculosDisponibles,
      serviciosHoy,
      conductoresActivos,
      serviciosEnCurso,
    },
    estadoFlota,
    proximosServicios,
    mantenimientosRecientes,
    licenciasPorVencer,
  });
});

module.exports = { index };
