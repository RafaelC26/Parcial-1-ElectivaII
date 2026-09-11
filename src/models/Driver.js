const mongoose = require("mongoose");

const TIPOS_DOCUMENTO = ["CC", "CE"];
const ESTADOS_CONDUCTOR = ["Disponible", "En servicio", "Inactivo"];
const CATEGORIAS_LICENCIA = ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "C3"];

const driverSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "Debes ingresar el nombre del conductor."],
      trim: true,
    },

    tipoDocumento: {
      type: String,
      enum: { values: TIPOS_DOCUMENTO, message: "Selecciona un tipo de documento válido." },
      default: "CC",
    },

    documento: {
      type: String,
      required: [true, "Debes ingresar el número de documento."],
      unique: true,
      trim: true,
    },

    licencia: {
      type: String,
      required: [true, "Debes ingresar el número de licencia."],
      unique: true,
      trim: true,
    },

    categoriaLicencia: {
      type: String,
      required: [true, "Debes ingresar la categoría de la licencia."],
      trim: true,
      uppercase: true,
    },

    vencimientoLicencia: {
      type: Date,
      required: [true, "Debes ingresar la fecha de vencimiento de la licencia."],
    },

    telefono: {
      type: String,
      required: [true, "Debes ingresar el teléfono del conductor."],
      trim: true,
    },

    correo: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    estado: {
      type: String,
      enum: { values: ESTADOS_CONDUCTOR, message: "Selecciona un estado de conductor válido." },
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

/** True cuando la licencia ya vencio respecto a la fecha actual (Regla 5). */
driverSchema.virtual("licenciaVencida").get(function () {
  if (!this.vencimientoLicencia) return false;
  return this.vencimientoLicencia.getTime() < Date.now();
});

/** Documento formateado con separadores de miles: "1.054.234.821". */
driverSchema.virtual("documentoFormateado").get(function () {
  const soloDigitos = String(this.documento || "").replace(/\D/g, "");
  if (!soloDigitos) return this.documento;
  return soloDigitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
});

driverSchema.set("toJSON", { virtuals: true });
driverSchema.set("toObject", { virtuals: true });

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;
module.exports.TIPOS_DOCUMENTO = TIPOS_DOCUMENTO;
module.exports.ESTADOS_CONDUCTOR = ESTADOS_CONDUCTOR;
module.exports.CATEGORIAS_LICENCIA = CATEGORIAS_LICENCIA;
