const Service = require("../models/Service");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const { TIPOS_SERVICIO, ESTADOS_SERVICIO } = require("../models/Service");
const { ESTADOS_NO_ASIGNABLES } = require("../models/Vehicle");
const { asyncHandler } = require("../middleware/errorHandler");
const { traducirErrorMongoose, validarServicio } = require("../middleware/validation");
const { validarAsignacionServicio } = require("../utils/availability");
const { generarCodigoServicio } = require("../utils/serviceCode");
const {
  parseDateInput,
  combinarFechaHora,
  horaEsPosterior,
  inicioDelDia,
  finDelDia,
} = require("../utils/dateUtils");

/** Extrae del formulario los campos del servicio. */
function extraerDatos(body) {
  return {
    tipoServicio: body.tipoServicio,
    fecha: parseDateInput(body.fecha),
    horaSalida: body.horaSalida,
    horaRegreso: body.horaRegreso,
    origen: (body.origen || "").trim(),
    destino: (body.destino || "").trim(),
    descripcion: (body.descripcion || "").trim(),
    pasajeros: body.pasajeros,
    responsable: (body.responsable || "").trim(),
    telefonoResponsable: (body.telefonoResponsable || "").trim(),
    vehiculo: body.vehiculo || null,
    conductor: body.conductor || null,
    estado: body.estado || "Programado",
    observaciones: (body.observaciones || "").trim(),
  };
}

/**
 * Datos que necesitan los formularios de crear y editar. Se listan todos los
 * vehiculos y conductores asignables; el cruce de horarios se valida al
 * guardar, porque el usuario todavia puede cambiar fecha y horas.
 */
async function cargarOpciones() {
  const [vehiculos, conductores] = await Promise.all([
    Vehicle.find({ estado: { $nin: ESTADOS_NO_ASIGNABLES } }).sort({ placa: 1 }),
    Driver.find({ estado: { $ne: "Inactivo" } }).sort({ nombre: 1 }),
  ]);

  return { vehiculos, conductores };
}

/** GET /services — listado con filtros por estado, tipo, fecha y vehiculo. */
const index = asyncHandler(async (req, res) => {
  const { estado = "", tipo = "", fecha = "", vehiculo = "" } = req.query;

  const filtro = {};
  if (estado) filtro.estado = estado;
  if (tipo) filtro.tipoServicio = tipo;
  if (vehiculo) filtro.vehiculo = vehiculo;

  if (fecha) {
    const dia = parseDateInput(fecha);
    if (dia) {
      filtro.fecha = { $gte: inicioDelDia(dia), $lte: finDelDia(dia) };
    }
  }

  const [services, vehiculos] = await Promise.all([
    Service.find(filtro)
      .populate("vehiculo", "placa marca modelo capacidad")
      .populate("conductor", "nombre")
      .sort({ fechaHoraSalida: -1 }),
    Vehicle.find().sort({ placa: 1 }),
  ]);

  res.render("services/index", {
    titulo: "Servicios",
    services,
    vehiculos,
    filtros: { estado, tipo, fecha, vehiculo },
    tipos: TIPOS_SERVICIO,
    estados: ESTADOS_SERVICIO,
  });
});

/** GET /services/new */
const nuevo = asyncHandler(async (req, res) => {
  const { vehiculos, conductores } = await cargarOpciones();

  res.render("services/new", {
    titulo: "Nuevo servicio",
    vehiculos,
    conductores,
    tipos: TIPOS_SERVICIO,
    estados: ESTADOS_SERVICIO,
    valores: {},
    errores: [],
  });
});

/**
 * POST /services
 *
 * Orden de validacion: primero los campos obligatorios, luego la coherencia
 * de horas y por ultimo las reglas que consultan la base (cupo, cruces,
 * licencia). Asi no se hacen consultas innecesarias sobre datos incompletos.
 */
const crear = asyncHandler(async (req, res) => {
  const datos = extraerDatos(req.body);

  const reRender = (errores, status = 400) =>
    cargarOpciones().then(({ vehiculos, conductores }) =>
      res.status(status).render("services/new", {
        titulo: "Nuevo servicio",
        vehiculos,
        conductores,
        tipos: TIPOS_SERVICIO,
        estados: ESTADOS_SERVICIO,
        valores: req.body,
        errores,
      })
    );

  const errores = validarServicio({ ...datos, fecha: req.body.fecha });
  if (errores.length) return reRender(errores);

  // Regla 6 — la hora de regreso debe ser posterior a la de salida.
  if (!horaEsPosterior(datos.horaSalida, datos.horaRegreso)) {
    return reRender(["La hora de regreso debe ser posterior a la hora de salida."]);
  }

  const inicio = combinarFechaHora(datos.fecha, datos.horaSalida);
  const fin = combinarFechaHora(datos.fecha, datos.horaRegreso);

  const erroresAsignacion = await validarAsignacionServicio({
    vehicleId: datos.vehiculo,
    driverId: datos.conductor,
    pasajeros: datos.pasajeros,
    inicio,
    fin,
  });

  if (erroresAsignacion.length) return reRender(erroresAsignacion);

  try {
    const codigo = await generarCodigoServicio(datos.fecha.getFullYear());
    const servicio = await Service.create({ ...datos, codigo });

    req.flash("success", `Servicio ${servicio.codigo} programado correctamente.`);
    res.redirect(`/services/${servicio._id}`);
  } catch (error) {
    reRender(traducirErrorMongoose(error));
  }
});

/** GET /services/:id */
const detalle = asyncHandler(async (req, res) => {
  const servicio = await Service.findById(req.params.id)
    .populate("vehiculo")
    .populate("conductor");

  if (!servicio) {
    req.flash("error", "El servicio solicitado no existe.");
    return res.redirect("/services");
  }

  res.render("services/show", {
    titulo: servicio.codigo,
    servicio,
  });
});

/** GET /services/:id/edit */
const editar = asyncHandler(async (req, res) => {
  const servicio = await Service.findById(req.params.id);

  if (!servicio) {
    req.flash("error", "El servicio solicitado no existe.");
    return res.redirect("/services");
  }

  const { vehiculos, conductores } = await cargarOpciones();

  res.render("services/edit", {
    titulo: `Editar ${servicio.codigo}`,
    servicio,
    vehiculos,
    conductores,
    tipos: TIPOS_SERVICIO,
    estados: ESTADOS_SERVICIO,
    valores: servicio.toObject(),
    errores: [],
  });
});

/** POST /services/:id/update */
const actualizar = asyncHandler(async (req, res) => {
  const servicio = await Service.findById(req.params.id);

  if (!servicio) {
    req.flash("error", "El servicio solicitado no existe.");
    return res.redirect("/services");
  }

  const datos = extraerDatos(req.body);

  const reRender = (errores, status = 400) =>
    cargarOpciones().then(({ vehiculos, conductores }) =>
      res.status(status).render("services/edit", {
        titulo: `Editar ${servicio.codigo}`,
        servicio,
        vehiculos,
        conductores,
        tipos: TIPOS_SERVICIO,
        estados: ESTADOS_SERVICIO,
        valores: { ...req.body, _id: servicio._id },
        errores,
      })
    );

  const errores = validarServicio({ ...datos, fecha: req.body.fecha });
  if (errores.length) return reRender(errores);

  if (!horaEsPosterior(datos.horaSalida, datos.horaRegreso)) {
    return reRender(["La hora de regreso debe ser posterior a la hora de salida."]);
  }

  const inicio = combinarFechaHora(datos.fecha, datos.horaSalida);
  const fin = combinarFechaHora(datos.fecha, datos.horaRegreso);

  // Un servicio cancelado no ocupa agenda, por lo que no necesita revalidarse.
  if (datos.estado !== "Cancelado") {
    const erroresAsignacion = await validarAsignacionServicio({
      vehicleId: datos.vehiculo,
      driverId: datos.conductor,
      pasajeros: datos.pasajeros,
      inicio,
      fin,
      excludeServiceId: servicio._id,
    });

    if (erroresAsignacion.length) return reRender(erroresAsignacion);
  }

  try {
    Object.assign(servicio, datos);
    await servicio.save();

    req.flash("success", `Servicio ${servicio.codigo} actualizado correctamente.`);
    res.redirect(`/services/${servicio._id}`);
  } catch (error) {
    reRender(traducirErrorMongoose(error));
  }
});

/** POST /services/:id/cancel — cancelar libera el horario sin perder el registro. */
const cancelar = asyncHandler(async (req, res) => {
  const servicio = await Service.findById(req.params.id);

  if (!servicio) {
    req.flash("error", "El servicio solicitado no existe.");
    return res.redirect("/services");
  }

  servicio.estado = "Cancelado";
  await servicio.save();

  req.flash("success", `Servicio ${servicio.codigo} cancelado correctamente.`);
  res.redirect(`/services/${servicio._id}`);
});

/** POST /services/:id/delete */
const eliminar = asyncHandler(async (req, res) => {
  const servicio = await Service.findById(req.params.id);

  if (!servicio) {
    req.flash("error", "El servicio solicitado no existe.");
    return res.redirect("/services");
  }

  const codigo = servicio.codigo;
  await servicio.deleteOne();

  req.flash("success", `Servicio ${codigo} eliminado correctamente.`);
  res.redirect("/services");
});

module.exports = { index, nuevo, crear, detalle, editar, actualizar, cancelar, eliminar };
