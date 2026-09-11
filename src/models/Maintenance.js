const mongoose = require("mongoose");

const TIPOS_MANTENIMIENTO = [
  "Preventivo",
  "Correctivo",
  "Revisión general",
  "Cambio de aceite",
  "Frenos",
  "Llantas",
  "Motor",
  "Sistema eléctrico",
  "Otro",
];

const maintenanceSchema = new mongoose.Schema(
  {
    vehiculo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "El mantenimiento debe estar asociado a un vehículo."],
      index: true,
    },

    fecha: {
      type: Date,
      required: [true, "Debes ingresar la fecha del mantenimiento."],
    },

    tipo: {
      type: String,
      required: [true, "Debes seleccionar el tipo de mantenimiento."],
      enum: { values: TIPOS_MANTENIMIENTO, message: "Selecciona un tipo de mantenimiento válido." },
    },

    kilometraje: {
      type: Number,
      min: [0, "El kilometraje no puede ser negativo."],
    },

    descripcion: {
      type: String,
      required: [true, "Debes ingresar la descripción del mantenimiento."],
      trim: true,
    },

    proveedor: {
      type: String,
      default: "",
      trim: true,
    },

    costo: {
      type: Number,
      min: [0, "El costo no puede ser negativo."],
      default: 0,
    },

    proximoMantenimiento: {
      type: Date,
    },

    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

module.exports = Maintenance;
module.exports.TIPOS_MANTENIMIENTO = TIPOS_MANTENIMIENTO;
