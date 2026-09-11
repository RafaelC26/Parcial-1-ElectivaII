const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");
const { TIPOS_MANTENIMIENTO } = require("../models/Maintenance");
const { asyncHandler } = require("../middleware/errorHandler");
const { traducirErrorMongoose, validarMantenimiento } = require("../middleware/validation");
const { parseDateInput } = require("../utils/dateUtils");

/** Extrae del formulario los campos del mantenimiento. */
function extraerDatos(body) {
  return {
    fecha: parseDateInput(body.fecha),
    tipo: body.tipo,
    kilometraje: body.kilometraje === "" || body.kilometraje === undefined ? undefined : body.kilometraje,
    descripcion: (body.descripcion || "").trim(),
    proveedor: (body.proveedor || "").trim(),
    costo: body.costo === "" || body.costo === undefined ? 0 : body.costo,
    proximoMantenimiento: body.proximoMantenimiento ? parseDateInput(body.proximoMantenimiento) : undefined,
    observaciones: (body.observaciones || "").trim(),
  };
}

/** GET /maintenance — historial completo de la flota. */
const index = asyncHandler(async (req, res) => {
  const { vehiculo = "", tipo = "" } = req.query;

  const filtro = {};
  if (vehiculo) filtro.vehiculo = vehiculo;
  if (tipo) filtro.tipo = tipo;

  const [mantenimientos, vehiculos] = await Promise.all([
    Maintenance.find(filtro).populate("vehiculo", "placa marca modelo").sort({ fecha: -1 }),
    Vehicle.find().sort({ placa: 1 }),
  ]);

  const costoTotal = mantenimientos.reduce((suma, item) => suma + (item.costo || 0), 0);

  res.render("maintenance/index", {
    titulo: "Mantenimientos",
    mantenimientos,
    vehiculos,
    costoTotal,
    filtros: { vehiculo, tipo },
    tipos: TIPOS_MANTENIMIENTO,
  });
});

/** GET /vehicles/:vehicleId/maintenance/new */
const nuevo = asyncHandler(async (req, res) => {
  const vehiculo = await Vehicle.findById(req.params.vehicleId);

  if (!vehiculo) {
    req.flash("error", "El vehículo solicitado no existe.");
    return res.redirect("/vehicles");
  }

  res.render("maintenance/new", {
    titulo: "Registrar mantenimiento",
    vehiculo,
    tipos: TIPOS_MANTENIMIENTO,
    valores: { kilometraje: vehiculo.kilometraje },
    errores: [],
  });
});

/**
 * POST /vehicles/:vehicleId/maintenance
 *
 * Al registrar un mantenimiento se actualiza tambien el kilometraje del
 * vehiculo si el reportado es mayor, ya que es el dato mas reciente.
 */
const crear = asyncHandler(async (req, res) => {
  const vehiculo = await Vehicle.findById(req.params.vehicleId);

  if (!vehiculo) {
    req.flash("error", "El vehículo solicitado no existe.");
    return res.redirect("/vehicles");
  }

  const datos = extraerDatos(req.body);
  const errores = validarMantenimiento({ ...datos, fecha: req.body.fecha });

  if (errores.length) {
    return res.status(400).render("maintenance/new", {
      titulo: "Registrar mantenimiento",
      vehiculo,
      tipos: TIPOS_MANTENIMIENTO,
      valores: req.body,
      errores,
    });
  }

  try {
    await Maintenance.create({ ...datos, vehiculo: vehiculo._id });

    const kilometrajeReportado = Number(datos.kilometraje);
    if (Number.isFinite(kilometrajeReportado) && kilometrajeReportado > (vehiculo.kilometraje || 0)) {
      vehiculo.kilometraje = kilometrajeReportado;
      await vehiculo.save();
    }

    req.flash("success", "Mantenimiento registrado correctamente.");
    res.redirect(`/vehicles/${vehiculo._id}`);
  } catch (error) {
    res.status(400).render("maintenance/new", {
      titulo: "Registrar mantenimiento",
      vehiculo,
      tipos: TIPOS_MANTENIMIENTO,
      valores: req.body,
      errores: traducirErrorMongoose(error),
    });
  }
});

/** GET /maintenance/:id/edit */
const editar = asyncHandler(async (req, res) => {
  const mantenimiento = await Maintenance.findById(req.params.id).populate("vehiculo");

  if (!mantenimiento) {
    req.flash("error", "El mantenimiento solicitado no existe.");
    return res.redirect("/vehicles");
  }

  res.render("maintenance/edit", {
    titulo: "Editar mantenimiento",
    mantenimiento,
    vehiculo: mantenimiento.vehiculo,
    tipos: TIPOS_MANTENIMIENTO,
    valores: mantenimiento.toObject(),
    errores: [],
  });
});

/** POST /maintenance/:id/update */
const actualizar = asyncHandler(async (req, res) => {
  const mantenimiento = await Maintenance.findById(req.params.id).populate("vehiculo");

  if (!mantenimiento) {
    req.flash("error", "El mantenimiento solicitado no existe.");
    return res.redirect("/vehicles");
  }

  const datos = extraerDatos(req.body);
  const errores = validarMantenimiento({ ...datos, fecha: req.body.fecha });

  if (errores.length) {
    return res.status(400).render("maintenance/edit", {
      titulo: "Editar mantenimiento",
      mantenimiento,
      vehiculo: mantenimiento.vehiculo,
      tipos: TIPOS_MANTENIMIENTO,
      valores: { ...req.body, _id: mantenimiento._id },
      errores,
    });
  }

  try {
    Object.assign(mantenimiento, datos);
    await mantenimiento.save();

    req.flash("success", "Mantenimiento actualizado correctamente.");
    res.redirect(`/vehicles/${mantenimiento.vehiculo._id}`);
  } catch (error) {
    res.status(400).render("maintenance/edit", {
      titulo: "Editar mantenimiento",
      mantenimiento,
      vehiculo: mantenimiento.vehiculo,
      tipos: TIPOS_MANTENIMIENTO,
      valores: { ...req.body, _id: mantenimiento._id },
      errores: traducirErrorMongoose(error),
    });
  }
});

/** POST /maintenance/:id/delete */
const eliminar = asyncHandler(async (req, res) => {
  const mantenimiento = await Maintenance.findById(req.params.id);

  if (!mantenimiento) {
    req.flash("error", "El mantenimiento solicitado no existe.");
    return res.redirect("/vehicles");
  }

  const vehiculoId = mantenimiento.vehiculo;
  await mantenimiento.deleteOne();

  req.flash("success", "Mantenimiento eliminado correctamente.");
  res.redirect(`/vehicles/${vehiculoId}`);
});

module.exports = { index, nuevo, crear, editar, actualizar, eliminar };
