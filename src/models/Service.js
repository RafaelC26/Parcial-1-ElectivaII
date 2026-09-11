const mongoose = require("mongoose");
const { combinarFechaHora } = require("../utils/dateUtils");

const TIPOS_SERVICIO = [
  "Actividad académica",
  "Visita académica",
  "Comisión",
  "Inducción",
  "Actividad complementaria",
  "Transporte funcionarios",
  "Transporte estudiantes",
  "Otro",
];

const ESTADOS_SERVICIO = ["Programado", "En curso", "Finalizado", "Cancelado"];

const serviceSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    tipoServicio: {
      type: String,
      enum: { values: TIPOS_SERVICIO, message: "Selecciona un tipo de servicio válido." },
      required: [true, "Debes seleccionar el tipo de servicio."],
    },

    fecha: {
      type: Date,
      required: [true, "Debes ingresar la fecha del servicio."],
    },

    horaSalida: {
      type: String,
      required: [true, "Debes ingresar la hora de salida."],
    },

    horaRegreso: {
      type: String,
      required: [true, "Debes ingresar la hora estimada de regreso."],
    },

    /**
     * Fecha y hora completas derivadas de `fecha` + `horaSalida` / `horaRegreso`.
     * Comparar Date contra Date evita los errores que aparecen al comparar
     * horas como texto, y es lo que usan las validaciones de cruce de horario.
     */
    fechaHoraSalida: {
      type: Date,
      required: true,
      index: true,
    },

    fechaHoraRegreso: {
      type: Date,
      required: true,
      index: true,
    },

    origen: {
      type: String,
      required: [true, "Debes ingresar el lugar de origen."],
      trim: true,
    },

    destino: {
      type: String,
      required: [true, "Debes ingresar el lugar de destino."],
      trim: true,
    },

    descripcion: {
      type: String,
      required: [true, "Debes ingresar la descripción o motivo del servicio."],
      trim: true,
    },

    pasajeros: {
      type: Number,
      required: [true, "Debes ingresar el número de pasajeros."],
      min: [1, "El servicio debe transportar al menos 1 pasajero."],
    },

    responsable: {
      type: String,
      required: [true, "Debes ingresar el responsable del servicio."],
      trim: true,
    },

    telefonoResponsable: {
      type: String,
      default: "",
      trim: true,
    },

    vehiculo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Debes seleccionar un vehículo."],
      index: true,
    },

    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: [true, "Debes seleccionar un conductor."],
      index: true,
    },

    estado: {
      type: String,
      enum: { values: ESTADOS_SERVICIO, message: "Selecciona un estado de servicio válido." },
      default: "Programado",
    },

    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

/**
 * Mantiene sincronizados los Date completos con `fecha` + las horas en texto.
 * Se ejecuta antes de validar para que `required` vea los campos ya calculados.
 */
serviceSchema.pre("validate", function (next) {
  if (this.fecha && this.horaSalida) {
    this.fechaHoraSalida = combinarFechaHora(this.fecha, this.horaSalida);
  }
  if (this.fecha && this.horaRegreso) {
    this.fechaHoraRegreso = combinarFechaHora(this.fecha, this.horaRegreso);
  }
  next();
});

/** Ruta legible para tablas: "Sogamoso -> Tunja". */
serviceSchema.virtual("ruta").get(function () {
  return `${this.origen} → ${this.destino}`;
});

/** True cuando el servicio ya paso segun la hora de regreso. */
serviceSchema.virtual("esPasado").get(function () {
  if (!this.fechaHoraRegreso) return false;
  return this.fechaHoraRegreso.getTime() < Date.now();
});

/**
 * "En curso" real: el momento actual cae dentro de la ventana del servicio.
 * Se calcula en vez de persistirse, tal como pide el enunciado (seccion 70).
 */
serviceSchema.virtual("enCursoAhora").get(function () {
  if (!this.fechaHoraSalida || !this.fechaHoraRegreso) return false;
  if (this.estado === "Cancelado") return false;
  const ahora = Date.now();
  return this.fechaHoraSalida.getTime() <= ahora && this.fechaHoraRegreso.getTime() >= ahora;
});

serviceSchema.set("toJSON", { virtuals: true });
serviceSchema.set("toObject", { virtuals: true });

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
module.exports.TIPOS_SERVICIO = TIPOS_SERVICIO;
module.exports.ESTADOS_SERVICIO = ESTADOS_SERVICIO;
