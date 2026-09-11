const path = require("path");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");

const dashboardRoutes = require("./routes/dashboardRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const reportRoutes = require("./routes/reportRoutes");

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const dateUtils = require("./utils/dateUtils");
const viewHelpers = require("./utils/viewHelpers");

const app = express();

/* ----------------------------- Motor de vistas ---------------------------- */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

/* -------------------------------- Middleware ------------------------------ */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "uptc-transporte",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
  })
);

app.use(flash());

/**
 * Variables disponibles en todas las vistas: mensajes flash, la ruta actual
 * (para marcar el item activo del sidebar) y los helpers de formato, de modo
 * que ninguna plantilla tenga que importar nada por su cuenta.
 */
app.use((req, res, next) => {
  res.locals.successMessages = req.flash("success");
  res.locals.errorMessages = req.flash("error");
  res.locals.currentPath = req.path;
  res.locals.formatDate = dateUtils.formatDate;
  res.locals.formatLongDate = dateUtils.formatLongDate;
  res.locals.formatTime = dateUtils.formatTime;
  res.locals.formatCurrency = dateUtils.formatCurrency;
  res.locals.formatNumber = dateUtils.formatNumber;
  res.locals.toDateInput = dateUtils.toDateInput;
  res.locals.badgeClass = viewHelpers.badgeClass;
  res.locals.iconoVehiculo = viewHelpers.iconoVehiculo;
  res.locals.truncar = viewHelpers.truncar;
  res.locals.iniciales = viewHelpers.iniciales;
  res.locals.conFiltros = viewHelpers.conFiltros;
  next();
});

/* --------------------------------- Rutas ---------------------------------- */

app.use("/", dashboardRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/drivers", driverRoutes);
app.use("/services", serviceRoutes);
app.use("/", maintenanceRoutes);
app.use("/reports", reportRoutes);

/* ------------------------------ Manejo de error --------------------------- */

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
