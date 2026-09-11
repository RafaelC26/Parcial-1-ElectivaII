const Vehicle = require("../models/Vehicle");
const Service = require("../models/Service");
const Maintenance = require("../models/Maintenance");
const { TIPOS_VEHICULO, ESTADOS_VEHICULO } = require("../models/Vehicle");
const { asyncHandler } = require("../middleware/errorHandler");
const { estadoDinamicoVehiculo } = require("../utils/availability");
const {
  traducirErrorMongoose,
  normalizarPlaca,
  validarVehiculo,
} = require("../middleware/validation");

/** Extrae del formulario solo los campos del vehiculo, ya normalizados. */
function extraerDatos(body) {
  return {
    tipo: body.tipo,
    placa: normalizarPlaca(body.placa),
    marca: (body.marca || "").trim(),
    modelo: (body.modelo || "").trim(),
    anio: body.anio,
    capacidad: body.capacidad,
    kilometraje: body.kilometraje === "" || body.kilometraje === undefined ? 0 : body.kilometraje,
    estado: body.estado || "Disponible",
    observaciones: (body.observaciones || "").trim(),
  };
}

/** GET /vehicles — listado con buscador y filtros por tipo y estado. */
const index = asyncHandler(async (req, res) => {
  const { q = "", tipo = "", estado = "" } = req.query;

  const filtro = {};

  if (q.trim()) {
    const termino = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filtro.$or = [{ placa: termino }, { marca: termino }, { modelo: termino }];
  }
  if (tipo) filtro.tipo = tipo;
  if (estado) filtro.estado = estado;

  const vehicles = await Vehicle.find(filtro).sort({ createdAt: -1 });

  // Conteo de servicios por vehiculo, en una sola consulta agregada.
  const conteos = await Service.aggregate([
    { $match: { estado: { $ne: "Cancelado" } } },
    { $group: { _id: "$vehiculo", total: { $sum: 1 } } },
  ]);
  const serviciosPorVehiculo = new Map(conteos.map((fila) => [String(fila._id), fila.total]));

  res.render("vehicles/index", {
    titulo: "Vehículos",
    vehicles,
    serviciosPorVehiculo,
    filtros: { q, tipo, estado },
    tipos: TIPOS_VEHICULO,
    estados: ESTADOS_VEHICULO,
  });
});

/** GET /vehicles/new */
const nuevo = asyncHandler(async (req, res) => {
  res.render("vehicles/new", {
    titulo: "Registrar vehículo",
    tipos: TIPOS_VEHICULO,
    estados: ESTADOS_VEHICULO,
    valores: {},
    errores: [],
  });
});

/** POST /vehicles */
const crear = asyncHandler(async (req, res) => {
  const datos = extraerDatos(req.body);
  const errores = validarVehiculo(datos);

  if (errores.length) {
    return res.status(400).render("vehicles/new", {
      titulo: "Registrar vehículo",
      tipos: TIPOS_VEHICULO,
      estados: ESTADOS_VEHICULO,
      valores: datos,
      errores,
    });
  }

  try {
    const vehiculo = await Vehicle.create(datos);
    req.flash("success", `Vehículo ${vehiculo.placa} registrado correctamente.`);
    res.redirect(`/vehicles/${vehiculo._id}`);
  } catch (error) {
    res.status(400).render("vehicles/new", {
      titulo: "Registrar vehículo",
      tipos: TIPOS_VEHICULO,
      estados: ESTADOS_VEHICULO,
      valores: datos,
      errores: traducirErrorMongoose(error),
    });
  }
});

/** GET /vehicles/:id — detalle con servicios e historial de mantenimiento. */
const detalle = asyncHandler(async (req, res) => {
  const vehiculo = await Vehicle.findById(req.params.id);

  if (!vehiculo) {
    req.flash("error", "El vehículo solicitado no existe.");
    return res.redirect("/vehicles");
  }

  const [servicios, mantenimientos, estadoActual] = await Promise.all([
    Service.find({ vehiculo: vehiculo._id })
      .populate("conductor", "nombre")
      .sort({ fechaHoraSalida: -1 })
      .limit(20),
    Maintenance.find({ vehiculo: vehiculo._id }).sort({ fecha: -1 }),
    estadoDinamicoVehiculo(vehiculo),
  ]);

  res.render("vehicles/show", {
    titulo: `${vehiculo.marca} ${vehiculo.modelo}`,
    vehiculo,
    servicios,
    mantenimientos,
    estadoActual,
  });
});

/** GET /vehicles/:id/edit */
const editar = asyncHandler(async (req, res) => {
  const vehiculo = await Vehicle.findById(req.params.id);

  if (!vehiculo) {
    req.flash("error", "El vehículo solicitado no existe.");
    return res.redirect("/vehicles");
  }

  res.render("vehicles/edit", {
    titulo: "Editar vehículo",
    vehiculo,
    tipos: TIPOS_VEHICULO,
    estados: ESTADOS_VEHICULO,
    valores: vehiculo.toObject(),
    errores: [],
  });
});

/** POST /vehicles/:id/update */
const actualizar = asyncHandler(async (req, res) => {
  const vehiculo = await Vehicle.findById(req.params.id);

  if (!vehiculo) {
    req.flash("error", "El vehículo solicitado no existe.");
    return res.redirect("/vehicles");
  }

  const datos = extraerDatos(req.body);
  const errores = validarVehiculo(datos);

  if (errores.length) {
    return res.status(400).render("vehicles/edit", {
      titulo: "Editar vehículo",
      vehiculo,
      tipos: TIPOS_VEHICULO,
      estados: ESTADOS_VEHICULO,
      valores: { ...datos, _id: vehiculo._id },
      errores,
    });
  }

  try {
    Object.assign(vehiculo, datos);
    await vehiculo.save();

    req.flash("success", `Vehículo ${vehiculo.placa} actualizado correctamente.`);
    res.redirect(`/vehicles/${vehiculo._id}`);
  } catch (error) {
    res.status(400).render("vehicles/edit", {
      titulo: "Editar vehículo",
      vehiculo,
      tipos: TIPOS_VEHICULO,
      estados: ESTADOS_VEHICULO,
      valores: { ...datos, _id: vehiculo._id },
      errores: traducirErrorMongoose(error),
    });
  }
});

/**
 * POST /vehicles/:id/delete
 *
 * Un vehiculo con servicios registrados no se elimina: borrarlo dejaria
 * referencias rotas en el historial y en los informes. En ese caso se sugiere
 * cambiar el estado a "Fuera de servicio" (seccion 41).
 */
const eliminar = asyncHandler(async (req, res) => {
  const vehiculo = await Vehicle.findById(req.params.id);

  if (!vehiculo) {
    req.flash("error", "El vehículo solicitado no existe.");
    return res.redirect("/vehicles");
  }

  const serviciosAsociados = await Service.countDocuments({ vehiculo: vehiculo._id });

  if (serviciosAsociados > 0) {
    req.flash(
      "error",
      `Este vehículo posee ${serviciosAsociados} servicio(s) registrados y no puede ser eliminado. ` +
        'Puedes cambiar su estado a "Fuera de servicio".'
    );
    return res.redirect(`/vehicles/${vehiculo._id}`);
  }

  await Maintenance.deleteMany({ vehiculo: vehiculo._id });
  await vehiculo.deleteOne();

  req.flash("success", `Vehículo ${vehiculo.placa} eliminado correctamente.`);
  res.redirect("/vehicles");
});

module.exports = { index, nuevo, crear, detalle, editar, actualizar, eliminar };
