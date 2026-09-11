const Service = require("../models/Service");

/**
 * Genera el siguiente codigo consecutivo del año: SER-2026-0001, SER-2026-0002...
 *
 * Busca el mayor consecutivo ya usado en el año en curso en lugar de contar
 * documentos: si un servicio se elimina, contar documentos reutilizaria un
 * codigo existente y el indice unico rechazaria el insert.
 */
async function generarCodigoServicio(anio = new Date().getFullYear()) {
  const prefijo = `SER-${anio}-`;

  const ultimo = await Service.findOne({ codigo: new RegExp(`^${prefijo}\\d+$`) })
    .sort({ codigo: -1 })
    .select("codigo")
    .lean();

  let consecutivo = 1;

  if (ultimo && ultimo.codigo) {
    const numero = parseInt(ultimo.codigo.replace(prefijo, ""), 10);
    if (!Number.isNaN(numero)) consecutivo = numero + 1;
  }

  return `${prefijo}${String(consecutivo).padStart(4, "0")}`;
}

module.exports = { generarCodigoServicio };
