/**
 * Traduce los errores tecnicos de Mongoose a mensajes que puede leer un
 * funcionario de la oficina de transporte (seccion 39 del enunciado).
 *
 * En vez de "MongoServerError E11000 duplicate key" el usuario ve
 * "Ya existe un vehiculo registrado con la placa ABC-123."
 */

/** Nombre legible de cada campo con indice unico, por coleccion. */
const ETIQUETAS_UNICAS = {
  placa: (valor) => `Ya existe un vehículo registrado con la placa ${valor}.`,
  documento: (valor) => `Ya existe un conductor registrado con el documento ${valor}.`,
  licencia: (valor) => `Ya existe un conductor registrado con la licencia ${valor}.`,
  codigo: (valor) => `Ya existe un servicio registrado con el código ${valor}.`,
};

/**
 * Convierte un error de Mongoose/MongoDB en un arreglo de mensajes legibles.
 * Si el error no es reconocido devuelve un mensaje generico, de modo que
 * nunca se filtre texto tecnico a la interfaz.
 */
function traducirErrorMongoose(error) {
  if (!error) return [];

  // Violacion de indice unico.
  if (error.code === 11000) {
    const campo = Object.keys(error.keyValue || {})[0];
    const valor = campo ? error.keyValue[campo] : "";

    if (campo && ETIQUETAS_UNICAS[campo]) {
      return [ETIQUETAS_UNICAS[campo](valor)];
    }
    return ["Ya existe un registro con esos datos. Verifica la información ingresada."];
  }

  // Errores de validacion declarados en el schema.
  if (error.name === "ValidationError" && error.errors) {
    return Object.values(error.errors).map((detalle) => {
      // Un cast fallido (texto donde se espera numero) trae un mensaje tecnico.
      if (detalle.name === "CastError") {
        return `El campo "${detalle.path}" tiene un valor inválido.`;
      }
      return detalle.message;
    });
  }

  // ObjectId malformado en la URL.
  if (error.name === "CastError" && error.kind === "ObjectId") {
    return ["El registro solicitado no existe."];
  }

  return ["No fue posible completar la operación. Verifica los datos e intenta nuevamente."];
}

/**
 * Normaliza la placa: quita espacios, pasa a mayusculas y agrega el guion
 * cuando viene en el formato colombiano de 3 letras + 3 digitos (ABC123).
 */
function normalizarPlaca(placa) {
  if (!placa) return "";

  const limpia = String(placa).toUpperCase().replace(/[\s-]/g, "").trim();

  const formatoCarro = /^([A-Z]{3})(\d{3})$/;
  const formatoMoto = /^([A-Z]{3})(\d{2}[A-Z])$/;

  const carro = limpia.match(formatoCarro);
  if (carro) return `${carro[1]}-${carro[2]}`;

  const moto = limpia.match(formatoMoto);
  if (moto) return `${moto[1]}-${moto[2]}`;

  return limpia;
}

/** Valida un correo solo cuando viene diligenciado (es opcional). */
function correoEsValido(correo) {
  if (!correo || !String(correo).trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());
}

/**
 * Validaciones de vehiculo previas a Mongoose (seccion 36). Devuelve los
 * mensajes que impiden guardar; vacio significa que los datos son correctos.
 */
function validarVehiculo(datos) {
  const errores = [];
  const anioActual = new Date().getFullYear();

  if (!datos.tipo) errores.push("Debes seleccionar el tipo de vehículo.");
  if (!datos.placa || !String(datos.placa).trim()) errores.push("Debes ingresar la placa del vehículo.");
  if (!datos.marca || !String(datos.marca).trim()) errores.push("Debes ingresar la marca del vehículo.");
  if (!datos.modelo || !String(datos.modelo).trim()) errores.push("Debes ingresar el modelo del vehículo.");

  const anio = Number(datos.anio);
  if (!datos.anio || !Number.isFinite(anio)) {
    errores.push("Debes ingresar el año del vehículo.");
  } else if (anio < 1950 || anio > anioActual + 1) {
    errores.push(`El año debe estar entre 1950 y ${anioActual + 1}.`);
  }

  const capacidad = Number(datos.capacidad);
  if (!datos.capacidad || !Number.isFinite(capacidad)) {
    errores.push("Debes ingresar la capacidad del vehículo.");
  } else if (capacidad < 1) {
    errores.push("La capacidad debe ser de al menos 1 pasajero.");
  }

  if (datos.kilometraje !== undefined && datos.kilometraje !== "") {
    const kilometraje = Number(datos.kilometraje);
    if (!Number.isFinite(kilometraje) || kilometraje < 0) {
      errores.push("El kilometraje debe ser un número igual o mayor a cero.");
    }
  }

  return errores;
}

/** Validaciones de conductor previas a Mongoose (seccion 37). */
function validarConductor(datos) {
  const errores = [];

  if (!datos.nombre || !String(datos.nombre).trim()) errores.push("Debes ingresar el nombre del conductor.");
  if (!datos.documento || !String(datos.documento).trim()) errores.push("Debes ingresar el número de documento.");
  if (!datos.licencia || !String(datos.licencia).trim()) errores.push("Debes ingresar el número de licencia.");
  if (!datos.categoriaLicencia || !String(datos.categoriaLicencia).trim()) {
    errores.push("Debes ingresar la categoría de la licencia.");
  }

  if (!datos.vencimientoLicencia) {
    errores.push("Debes ingresar la fecha de vencimiento de la licencia.");
  } else if (Number.isNaN(new Date(datos.vencimientoLicencia).getTime())) {
    errores.push("La fecha de vencimiento de la licencia no es válida.");
  }

  if (!datos.telefono || !String(datos.telefono).trim()) errores.push("Debes ingresar el teléfono del conductor.");

  if (!correoEsValido(datos.correo)) {
    errores.push("El correo electrónico ingresado no tiene un formato válido.");
  }

  return errores;
}

/** Validaciones de campos del servicio, sin tocar disponibilidad (seccion 38). */
function validarServicio(datos) {
  const errores = [];

  if (!datos.tipoServicio) errores.push("Debes seleccionar el tipo de servicio.");
  if (!datos.fecha) errores.push("Debes ingresar la fecha del servicio.");
  if (!datos.horaSalida) errores.push("Debes ingresar la hora de salida.");
  if (!datos.horaRegreso) errores.push("Debes ingresar la hora estimada de regreso.");
  if (!datos.origen || !String(datos.origen).trim()) errores.push("Debes ingresar el lugar de origen.");
  if (!datos.destino || !String(datos.destino).trim()) errores.push("Debes ingresar el lugar de destino.");
  if (!datos.descripcion || !String(datos.descripcion).trim()) {
    errores.push("Debes ingresar la descripción o motivo del servicio.");
  }
  if (!datos.responsable || !String(datos.responsable).trim()) errores.push("Debes ingresar el responsable del servicio.");
  if (!datos.vehiculo) errores.push("Debes seleccionar un vehículo.");
  if (!datos.conductor) errores.push("Debes seleccionar un conductor.");

  const pasajeros = Number(datos.pasajeros);
  if (!datos.pasajeros || !Number.isFinite(pasajeros)) {
    errores.push("Debes ingresar el número de pasajeros.");
  } else if (pasajeros < 1) {
    errores.push("El servicio debe transportar al menos 1 pasajero.");
  }

  return errores;
}

/** Validaciones del mantenimiento. */
function validarMantenimiento(datos) {
  const errores = [];

  if (!datos.fecha) errores.push("Debes ingresar la fecha del mantenimiento.");
  if (!datos.tipo) errores.push("Debes seleccionar el tipo de mantenimiento.");
  if (!datos.descripcion || !String(datos.descripcion).trim()) {
    errores.push("Debes ingresar la descripción del mantenimiento.");
  }

  if (datos.kilometraje !== undefined && datos.kilometraje !== "") {
    const kilometraje = Number(datos.kilometraje);
    if (!Number.isFinite(kilometraje) || kilometraje < 0) {
      errores.push("El kilometraje debe ser un número igual o mayor a cero.");
    }
  }

  if (datos.costo !== undefined && datos.costo !== "") {
    const costo = Number(datos.costo);
    if (!Number.isFinite(costo) || costo < 0) {
      errores.push("El costo debe ser un número igual o mayor a cero.");
    }
  }

  return errores;
}

module.exports = {
  traducirErrorMongoose,
  normalizarPlaca,
  correoEsValido,
  validarVehiculo,
  validarConductor,
  validarServicio,
  validarMantenimiento,
};
