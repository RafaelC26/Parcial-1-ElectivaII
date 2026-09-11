const mongoose = require("mongoose");

const TIPOS_VEHICULO = ["Bus", "Buseta", "Camioneta", "Automóvil"];
const ESTADOS_VEHICULO = ["Disponible", "En servicio", "En mantenimiento", "Fuera de servicio"];

/** Estados operativos que impiden asignar el vehiculo a un servicio (Regla 1). */
const ESTADOS_NO_ASIGNABLES = ["En mantenimiento", "Fuera de servicio"];

const vehicleSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: { values: TIPOS_VEHICULO, message: "Selecciona un tipo de vehículo válido." },
      required: [true, "Debes seleccionar el tipo de vehículo."],
    },

    placa: {
      type: String,
      required: [true, "Debes ingresar la placa del vehículo."],
      unique: true,
      uppercase: true,
      trim: true,
    },

    marca: {
      type: String,
      required: [true, "Debes ingresar la marca del vehículo."],
      trim: true,
    },

    modelo: {
      type: String,
      required: [true, "Debes ingresar el modelo del vehículo."],
      trim: true,
    },

    anio: {
      type: Number,
      required: [true, "Debes ingresar el año del vehículo."],
      min: [1950, "El año del vehículo no puede ser anterior a 1950."],
      max: [new Date().getFullYear() + 1, "El año del vehículo no puede ser futuro."],
    },

    capacidad: {
      type: Number,
      required: [true, "Debes ingresar la capacidad del vehículo."],
      min: [1, "La capacidad debe ser de al menos 1 pasajero."],
    },

    kilometraje: {
      type: Number,
      default: 0,
      min: [0, "El kilometraje no puede ser negativo."],
    },

    estado: {
      type: String,
      enum: { values: ESTADOS_VEHICULO, message: "Selecciona un estado de vehículo válido." },
      default: "Disponible",
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
 * Etiqueta corta usada en tablas y selects: "Mercedes Benz OF-1721".
 */
vehicleSchema.virtual("nombreCompleto").get(function () {
  return `${this.marca} ${this.modelo}`.trim();
});

/** True cuando el estado operativo permite programar servicios. */
vehicleSchema.virtual("esAsignable").get(function () {
  return !ESTADOS_NO_ASIGNABLES.includes(this.estado);
});

vehicleSchema.set("toJSON", { virtuals: true });
vehicleSchema.set("toObject", { virtuals: true });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
module.exports.TIPOS_VEHICULO = TIPOS_VEHICULO;
module.exports.ESTADOS_VEHICULO = ESTADOS_VEHICULO;
module.exports.ESTADOS_NO_ASIGNABLES = ESTADOS_NO_ASIGNABLES;
