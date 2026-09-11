/**
 * Envuelve un controlador async para que cualquier promesa rechazada llegue
 * al middleware de errores, en lugar de quedar como unhandled rejection.
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Cualquier ruta no declarada cae aqui y renderiza el 404 propio. */
function notFoundHandler(req, res) {
  res.status(404).render("errors/404", {
    titulo: "Página no encontrada",
  });
}

/**
 * Middleware global de errores: registra el detalle tecnico en consola y
 * muestra al usuario un mensaje neutro, nunca el stack ni el error de Mongo.
 */
function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).render("errors/500", {
    titulo: "Error del servidor",
    message: "Ocurrió un problema procesando la solicitud.",
  });
}

module.exports = { asyncHandler, notFoundHandler, errorHandler };
