const Driver = require("../models/Driver");
const Service = require("../models/Service");
const { TIPOS_DOCUMENTO, ESTADOS_CONDUCTOR, CATEGORIAS_LICENCIA } = require("../models/Driver");
const { asyncHandler } = require("../middleware/errorHandler");
const { estadoDinamicoConductor } = require("../utils/availability");
const { traducirErrorMongoose, validarConductor } = require("../middleware/validation");
const { parseDateInput } = require("../utils/dateUtils");

/** Extrae del formulario solo los campos del conductor. */
function extraerDatos(body) {
  return {
    nombre: (body.nombre || "").trim(),
    tipoDocumento: body.tipoDocumento || "CC",
    documento: (body.documento || "").trim(),
    licencia: (body.licencia || "").trim(),
    categoriaLicencia: (body.categoriaLicencia || "").trim().toUpperCase(),
    vencimientoLicencia: parseDateInput(body.vencimientoLicencia),
    telefono: (body.telefono || "").trim(),
    correo: (body.correo || "").trim().toLowerCase(),
    estado: body.estado || "Disponible",
    observaciones: (body.observaciones || "").trim(),
  };
}

/** GET /drivers — listado con buscador y filtro por estado. */
const index = asyncHandler(async (req, res) => {
  const { q = "", estado = "" } = req.query;

  const filtro = {};

  if (q.trim()) {
    const termino = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filtro.$or = [{ nombre: termino }, { documento: termino }, { licencia: termino }];
  }
  if (estado) filtro.estado = estado;

  const drivers = await Driver.find(filtro).sort({ createdAt: -1 });

  const conteos = await Service.aggregate([
    { $match: { estado: { $ne: "Cancelado" } } },
    { $group: { _id: "$conductor", total: { $sum: 1 } } },
  ]);
  const serviciosPorConductor = new Map(conteos.map((fila) => [String(fila._id), fila.total]));

  res.render("drivers/index", {
    titulo: "Conductores",
    drivers,
    serviciosPorConductor,
    filtros: { q, estado },
    estados: ESTADOS_CONDUCTOR,
  });
});

/** GET /drivers/new */
const nuevo = asyncHandler(async (req, res) => {
  res.render("drivers/new", {
    titulo: "Registrar conductor",
    tiposDocumento: TIPOS_DOCUMENTO,
    estados: ESTADOS_CONDUCTOR,
    categorias: CATEGORIAS_LICENCIA,
    valores: {},
    errores: [],
  });
});

/** POST /drivers */
const crear = asyncHandler(async (req, res) => {
  const datos = extraerDatos(req.body);
  const errores = validarConductor({ ...datos, vencimientoLicencia: req.body.vencimientoLicencia });

  if (errores.length) {
    return res.status(400).render("drivers/new", {
      titulo: "Registrar conductor",
      tiposDocumento: TIPOS_DOCUMENTO,
      estados: ESTADOS_CONDUCTOR,
      categorias: CATEGORIAS_LICENCIA,
      valores: req.body,
      errores,
    });
  }

  try {
    const conductor = await Driver.create(datos);
    req.flash("success", `Conductor ${conductor.nombre} registrado correctamente.`);
    res.redirect(`/drivers/${conductor._id}`);
  } catch (error) {
    res.status(400).render("drivers/new", {
      titulo: "Registrar conductor",
      tiposDocumento: TIPOS_DOCUMENTO,
      estados: ESTADOS_CONDUCTOR,
      categorias: CATEGORIAS_LICENCIA,
      valores: req.body,
      errores: traducirErrorMongoose(error),
    });
  }
});

/** GET /drivers/:id — detalle con servicios asignados. */
const detalle = asyncHandler(async (req, res) => {
  const conductor = await Driver.findById(req.params.id);

  if (!conductor) {
    req.flash("error", "El conductor solicitado no existe.");
    return res.redirect("/drivers");
  }

  const [servicios, estadoActual] = await Promise.all([
    Service.find({ conductor: conductor._id })
      .populate("vehiculo", "placa marca modelo")
      .sort({ fechaHoraSalida: -1 })
      .limit(20),
    estadoDinamicoConductor(conductor),
  ]);

  res.render("drivers/show", {
    titulo: conductor.nombre,
    conductor,
    servicios,
    estadoActual,
  });
});

/** GET /drivers/:id/edit */
const editar = asyncHandler(async (req, res) => {
  const conductor = await Driver.findById(req.params.id);

  if (!conductor) {
    req.flash("error", "El conductor solicitado no existe.");
    return res.redirect("/drivers");
  }

  res.render("drivers/edit", {
    titulo: "Editar conductor",
    conductor,
    tiposDocumento: TIPOS_DOCUMENTO,
    estados: ESTADOS_CONDUCTOR,
    categorias: CATEGORIAS_LICENCIA,
    valores: conductor.toObject(),
    errores: [],
  });
});

/** POST /drivers/:id/update */
const actualizar = asyncHandler(async (req, res) => {
  const conductor = await Driver.findById(req.params.id);

  if (!conductor) {
    req.flash("error", "El conductor solicitado no existe.");
    return res.redirect("/drivers");
  }

  const datos = extraerDatos(req.body);
  const errores = validarConductor({ ...datos, vencimientoLicencia: req.body.vencimientoLicencia });

  if (errores.length) {
    return res.status(400).render("drivers/edit", {
      titulo: "Editar conductor",
      conductor,
      tiposDocumento: TIPOS_DOCUMENTO,
      estados: ESTADOS_CONDUCTOR,
      categorias: CATEGORIAS_LICENCIA,
      valores: { ...req.body, _id: conductor._id },
      errores,
    });
  }

  try {
    Object.assign(conductor, datos);
    await conductor.save();

    req.flash("success", `Conductor ${conductor.nombre} actualizado correctamente.`);
    res.redirect(`/drivers/${conductor._id}`);
  } catch (error) {
    res.status(400).render("drivers/edit", {
      titulo: "Editar conductor",
      conductor,
      tiposDocumento: TIPOS_DOCUMENTO,
      estados: ESTADOS_CONDUCTOR,
      categorias: CATEGORIAS_LICENCIA,
      valores: { ...req.body, _id: conductor._id },
      errores: traducirErrorMongoose(error),
    });
  }
});

/** POST /drivers/:id/delete — bloqueado si tiene historial de servicios. */
const eliminar = asyncHandler(async (req, res) => {
  const conductor = await Driver.findById(req.params.id);

  if (!conductor) {
    req.flash("error", "El conductor solicitado no existe.");
    return res.redirect("/drivers");
  }

  const serviciosAsociados = await Service.countDocuments({ conductor: conductor._id });

  if (serviciosAsociados > 0) {
    req.flash(
      "error",
      `Este conductor posee ${serviciosAsociados} servicio(s) registrados y no puede ser eliminado. ` +
        'Puedes cambiar su estado a "Inactivo".'
    );
    return res.redirect(`/drivers/${conductor._id}`);
  }

  await conductor.deleteOne();

  req.flash("success", `Conductor ${conductor.nombre} eliminado correctamente.`);
  res.redirect("/drivers");
});

module.exports = { index, nuevo, crear, detalle, editar, actualizar, eliminar };
