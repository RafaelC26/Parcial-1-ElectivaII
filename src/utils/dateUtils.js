const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * Combina una fecha con una hora "HH:mm" en un unico Date local.
 * Se construye con el constructor de componentes (no parseando texto ISO)
 * para que la hora quede en la zona local y no se corra por UTC.
 */
function combinarFechaHora(fecha, hora) {
  const base = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(base.getTime())) return null;

  const [horas, minutos] = String(hora || "00:00")
    .split(":")
    .map((parte) => parseInt(parte, 10) || 0);

  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), horas, minutos, 0, 0);
}

/**
 * Interpreta el valor de un <input type="date"> ("2026-09-15") como fecha
 * local a medianoche. `new Date("2026-09-15")` la interpretaria como UTC y en
 * Colombia (UTC-5) mostraria el dia anterior.
 */
function parseDateInput(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  const partes = String(valor).trim().split("-");
  if (partes.length !== 3) {
    const fallback = new Date(valor);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [anio, mes, dia] = partes.map((parte) => parseInt(parte, 10));
  const fecha = new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Devuelve el mismo dia a las 23:59:59.999, para rangos "hasta" inclusivos. */
function finDelDia(fecha) {
  const base = fecha instanceof Date ? new Date(fecha) : parseDateInput(fecha);
  if (!base) return null;
  base.setHours(23, 59, 59, 999);
  return base;
}

/** Devuelve el mismo dia a las 00:00:00.000. */
function inicioDelDia(fecha) {
  const base = fecha instanceof Date ? new Date(fecha) : parseDateInput(fecha);
  if (!base) return null;
  base.setHours(0, 0, 0, 0);
  return base;
}

/** "15/09/2026" — formato corto para tablas. */
function formatDate(fecha) {
  if (!fecha) return "—";
  const base = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(base.getTime())) return "—";

  const dia = String(base.getDate()).padStart(2, "0");
  const mes = String(base.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${base.getFullYear()}`;
}

/** "15 septiembre 2026" — formato extendido para encabezados. */
function formatLongDate(fecha) {
  if (!fecha) return "—";
  const base = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(base.getTime())) return "—";

  return `${base.getDate()} ${MESES[base.getMonth()]} ${base.getFullYear()}`;
}

/** "Miércoles, 10 de septiembre de 2026" — encabezado del dashboard. */
function formatFullDate(fecha) {
  const base = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(base.getTime())) return "—";

  return `${DIAS[base.getDay()]}, ${base.getDate()} de ${MESES[base.getMonth()]} de ${base.getFullYear()}`;
}

/** Normaliza una hora a "HH:mm". */
function formatTime(hora) {
  if (!hora) return "—";
  if (hora instanceof Date) {
    return `${String(hora.getHours()).padStart(2, "0")}:${String(hora.getMinutes()).padStart(2, "0")}`;
  }
  return String(hora).slice(0, 5);
}

/** Convierte un Date al valor que espera un <input type="date">. */
function toDateInput(fecha) {
  if (!fecha) return "";
  const base = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(base.getTime())) return "";

  const mes = String(base.getMonth() + 1).padStart(2, "0");
  const dia = String(base.getDate()).padStart(2, "0");
  return `${base.getFullYear()}-${mes}-${dia}`;
}

/** "$ 450.000" en pesos colombianos, sin decimales. */
function formatCurrency(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

/** "125.420" — separador de miles colombiano. */
function formatNumber(valor) {
  if (valor === null || valor === undefined || valor === "") return "0";
  return new Intl.NumberFormat("es-CO").format(valor);
}

/** Compara dos horas "HH:mm" y responde si la segunda es posterior (Regla 6). */
function horaEsPosterior(horaInicio, horaFin) {
  const aMinutos = (hora) => {
    const [h, m] = String(hora || "00:00")
      .split(":")
      .map((parte) => parseInt(parte, 10) || 0);
    return h * 60 + m;
  };
  return aMinutos(horaFin) > aMinutos(horaInicio);
}

module.exports = {
  MESES,
  DIAS,
  combinarFechaHora,
  parseDateInput,
  inicioDelDia,
  finDelDia,
  formatDate,
  formatLongDate,
  formatFullDate,
  formatTime,
  toDateInput,
  formatCurrency,
  formatNumber,
  horaEsPosterior,
};
