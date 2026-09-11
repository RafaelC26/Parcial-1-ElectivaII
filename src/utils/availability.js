const Service = require("../models/Service");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const { ESTADOS_NO_ASIGNABLES } = require("../models/Vehicle");

/**
 * Reglas de negocio del enunciado (seccion 66). Todas se ejecutan en el
 * backend: el JavaScript del formulario solo adelanta informacion al usuario,
 * nunca decide si un servicio puede guardarse.
 */

/** Estados que NO ocupan la agenda: un servicio cancelado libera el horario. */
const ESTADOS_QUE_OCUPAN = { $ne: "Cancelado" };

/**
 * Construye el filtro de solapamiento entre periodos.
 *
 *   nuevoInicio < servicioFin  &&  nuevoFin > servicioInicio
 *
 * Dos periodos que solo se tocan en el extremo (uno termina 13:00 y el otro
 * empieza 13:00) NO se consideran conflicto, que es el comportamiento
 * esperado para agendar transportes consecutivos.
 */
function filtroSolapamiento(inicio, fin) {
  return {
    fechaHoraSalida: { $lt: fin },
    fechaHoraRegreso: { $gt: inicio },
  };
}

/**
 * Regla 3 — Un vehiculo no puede tener dos servicios simultaneos.
 * `excludeServiceId` permite editar un servicio sin que choque consigo mismo.
 */
async function checkVehicleAvailability(vehicleId, inicio, fin, excludeServiceId = null) {
  const filtro = {
    vehiculo: vehicleId,
    estado: ESTADOS_QUE_OCUPAN,
    ...filtroSolapamiento(inicio, fin),
  };

  if (excludeServiceId) {
    filtro._id = { $ne: excludeServiceId };
  }

  const conflicto = await Service.findOne(filtro).populate("conductor", "nombre").lean();

  return {
    disponible: !conflicto,
    conflicto,
  };
}

/**
 * Regla 4 — Un conductor no puede tener dos servicios simultaneos.
 */
async function checkDriverAvailability(driverId, inicio, fin, excludeServiceId = null) {
  const filtro = {
    conductor: driverId,
    estado: ESTADOS_QUE_OCUPAN,
    ...filtroSolapamiento(inicio, fin),
  };

  if (excludeServiceId) {
    filtro._id = { $ne: excludeServiceId };
  }

  const conflicto = await Service.findOne(filtro).populate("vehiculo", "placa").lean();

  return {
    disponible: !conflicto,
    conflicto,
  };
}

/**
 * Valida de una sola pasada todas las reglas que dependen del vehiculo y del
 * conductor elegidos. Devuelve un arreglo de mensajes listos para mostrar:
 * vacio significa que el servicio puede guardarse.
 */
async function validarAsignacionServicio({
  vehicleId,
  driverId,
  pasajeros,
  inicio,
  fin,
  excludeServiceId = null,
}) {
  const errores = [];

  const [vehiculo, conductor] = await Promise.all([
    Vehicle.findById(vehicleId),
    Driver.findById(driverId),
  ]);

  /* ------------------------------- Vehiculo ------------------------------- */

  if (!vehiculo) {
    errores.push("El vehículo seleccionado no existe o fue eliminado.");
  } else {
    // Regla 1 — vehiculos en mantenimiento o fuera de servicio no se asignan.
    if (ESTADOS_NO_ASIGNABLES.includes(vehiculo.estado)) {
      errores.push("Este vehículo actualmente no se encuentra disponible para prestar servicios.");
    }

    // Regla 2 — el cupo no puede superarse.
    const numeroPasajeros = Number(pasajeros);
    if (Number.isFinite(numeroPasajeros) && numeroPasajeros > vehiculo.capacidad) {
      errores.push(
        `El vehículo seleccionado tiene capacidad para ${vehiculo.capacidad} pasajeros ` +
          `y el servicio requiere transportar ${numeroPasajeros} personas. Seleccione otro vehículo.`
      );
    }

    // Regla 3 — cruce de horarios del vehiculo.
    if (inicio && fin) {
      const { disponible } = await checkVehicleAvailability(vehicleId, inicio, fin, excludeServiceId);
      if (!disponible) {
        errores.push("El vehículo seleccionado ya se encuentra asignado a otro servicio durante este horario.");
      }
    }
  }

  /* ------------------------------- Conductor ------------------------------ */

  if (!conductor) {
    errores.push("El conductor seleccionado no existe o fue eliminado.");
  } else {
    if (conductor.estado === "Inactivo") {
      errores.push("El conductor seleccionado se encuentra inactivo y no puede ser asignado.");
    }

    // Regla 5 — licencia vigente.
    if (conductor.licenciaVencida) {
      errores.push(
        "No es posible asignar este conductor porque su licencia de conducción se encuentra vencida."
      );
    }

    // Regla 4 — cruce de horarios del conductor.
    if (inicio && fin) {
      const { disponible } = await checkDriverAvailability(driverId, inicio, fin, excludeServiceId);
      if (!disponible) {
        errores.push("El conductor seleccionado ya tiene un servicio asignado durante este horario.");
      }
    }
  }

  return errores;
}

/**
 * Estado mostrado en pantalla para un vehiculo. El estado persistido solo
 * representa la condicion operativa; "En servicio" se deduce de la agenda
 * (seccion 70 del enunciado), evitando inconsistencias al reprogramar.
 */
async function estadoDinamicoVehiculo(vehiculo) {
  if (ESTADOS_NO_ASIGNABLES.includes(vehiculo.estado)) {
    return vehiculo.estado;
  }

  const ahora = new Date();
  const enCurso = await Service.findOne({
    vehiculo: vehiculo._id,
    estado: ESTADOS_QUE_OCUPAN,
    fechaHoraSalida: { $lte: ahora },
    fechaHoraRegreso: { $gte: ahora },
  }).lean();

  return enCurso ? "En servicio" : "Disponible";
}

/** Misma logica para conductores (seccion 71). */
async function estadoDinamicoConductor(conductor) {
  if (conductor.estado === "Inactivo") return "Inactivo";

  const ahora = new Date();
  const enCurso = await Service.findOne({
    conductor: conductor._id,
    estado: ESTADOS_QUE_OCUPAN,
    fechaHoraSalida: { $lte: ahora },
    fechaHoraRegreso: { $gte: ahora },
  }).lean();

  return enCurso ? "En servicio" : "Disponible";
}

/**
 * Lista los vehiculos que quedan libres en una ventana de tiempo concreta.
 * Alimenta el formulario de servicios para que el usuario vea solo opciones
 * viables, sin que eso reemplace la validacion final al guardar.
 */
async function vehiculosDisponiblesEn(inicio, fin, excludeServiceId = null) {
  const asignables = await Vehicle.find({ estado: { $nin: ESTADOS_NO_ASIGNABLES } }).sort({ placa: 1 });

  if (!inicio || !fin) return asignables;

  const filtro = {
    estado: ESTADOS_QUE_OCUPAN,
    ...filtroSolapamiento(inicio, fin),
  };
  if (excludeServiceId) filtro._id = { $ne: excludeServiceId };

  const ocupados = await Service.find(filtro).distinct("vehiculo");
  const ocupadosSet = new Set(ocupados.map((id) => String(id)));

  return asignables.filter((vehiculo) => !ocupadosSet.has(String(vehiculo._id)));
}

/** Equivalente para conductores: activos, con licencia vigente y sin cruce. */
async function conductoresDisponiblesEn(inicio, fin, excludeServiceId = null) {
  const activos = await Driver.find({
    estado: { $ne: "Inactivo" },
    vencimientoLicencia: { $gte: new Date() },
  }).sort({ nombre: 1 });

  if (!inicio || !fin) return activos;

  const filtro = {
    estado: ESTADOS_QUE_OCUPAN,
    ...filtroSolapamiento(inicio, fin),
  };
  if (excludeServiceId) filtro._id = { $ne: excludeServiceId };

  const ocupados = await Service.find(filtro).distinct("conductor");
  const ocupadosSet = new Set(ocupados.map((id) => String(id)));

  return activos.filter((conductor) => !ocupadosSet.has(String(conductor._id)));
}

module.exports = {
  checkVehicleAvailability,
  checkDriverAvailability,
  validarAsignacionServicio,
  estadoDinamicoVehiculo,
  estadoDinamicoConductor,
  vehiculosDisponiblesEn,
  conductoresDisponiblesEn,
  filtroSolapamiento,
};
