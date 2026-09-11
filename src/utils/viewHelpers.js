/**
 * Helpers disponibles en todas las vistas EJS.
 * Centralizar aqui el mapeo estado -> color evita repetir condicionales en
 * cada plantilla y garantiza que un mismo estado se vea igual en todo el sistema.
 */

const CLASES_ESTADO = {
  // Vehiculos
  Disponible: "badge--success",
  "En servicio": "badge--info",
  "En mantenimiento": "badge--warning",
  "Fuera de servicio": "badge--neutral",

  // Conductores
  Inactivo: "badge--neutral",

  // Servicios
  Programado: "badge--info",
  "En curso": "badge--warning",
  Finalizado: "badge--success",
  Cancelado: "badge--danger",
};

/** Clase de badge correspondiente a un estado. */
function badgeClass(estado) {
  return CLASES_ESTADO[estado] || "badge--neutral";
}

/** Icono de Lucide segun el tipo de vehiculo. */
function iconoVehiculo(tipo) {
  const iconos = {
    Bus: "bus-front",
    Buseta: "bus",
    Camioneta: "truck",
    Automóvil: "car-front",
  };
  return iconos[tipo] || "car";
}

/** Trunca un texto largo agregando puntos suspensivos. */
function truncar(texto, limite = 60) {
  const valor = String(texto || "");
  if (valor.length <= limite) return valor;
  return `${valor.slice(0, limite - 1).trimEnd()}…`;
}

/** Iniciales de un nombre: "Carlos Alberto Pérez" -> "CP". */
function iniciales(nombre) {
  const partes = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Construye un query string conservando los filtros actuales y cambiando
 * solo las claves indicadas. Sirve para los enlaces de "limpiar filtro".
 */
function conFiltros(filtrosActuales, cambios = {}) {
  const params = new URLSearchParams();

  Object.entries({ ...filtrosActuales, ...cambios }).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(clave, valor);
    }
  });

  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

module.exports = { badgeClass, iconoVehiculo, truncar, iniciales, conFiltros };
