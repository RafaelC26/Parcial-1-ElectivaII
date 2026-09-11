/**
 * Carga datos de ejemplo en la base configurada en MONGODB_URI.
 *
 *   npm run seed
 *
 * ATENCION: borra el contenido de las colecciones Vehicle, Driver, Service y
 * Maintenance antes de insertar. Está pensado para desarrollo y demostración.
 *
 * Las fechas se generan relativas al día de ejecución, de modo que el
 * dashboard siempre muestre servicios pasados, uno en curso y varios próximos.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/database");

const Vehicle = require("../src/models/Vehicle");
const Driver = require("../src/models/Driver");
const Service = require("../src/models/Service");
const Maintenance = require("../src/models/Maintenance");

const { combinarFechaHora } = require("../src/utils/dateUtils");

/** Devuelve una fecha desplazada N días respecto de hoy, a medianoche. */
function dia(offset) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offset);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

/* ------------------------------- Vehículos -------------------------------- */

const VEHICULOS = [
  {
    tipo: "Bus",
    placa: "ABC-123",
    marca: "Mercedes Benz",
    modelo: "OF-1721",
    anio: 2022,
    capacidad: 40,
    kilometraje: 125420,
    estado: "Disponible",
    observaciones: "Bus principal para salidas académicas de larga distancia.",
  },
  {
    tipo: "Buseta",
    placa: "DEF-456",
    marca: "Chevrolet",
    modelo: "NKR",
    anio: 2021,
    capacidad: 24,
    kilometraje: 87300,
    estado: "Disponible",
    observaciones: "",
  },
  {
    tipo: "Camioneta",
    placa: "GHI-789",
    marca: "Renault",
    modelo: "Duster",
    anio: 2023,
    capacidad: 5,
    kilometraje: 41250,
    estado: "Disponible",
    observaciones: "Asignada preferentemente a comisiones administrativas.",
  },
  {
    tipo: "Automóvil",
    placa: "JKL-321",
    marca: "Toyota",
    modelo: "Corolla",
    anio: 2020,
    capacidad: 5,
    kilometraje: 96800,
    estado: "Disponible",
    observaciones: "",
  },
  {
    tipo: "Bus",
    placa: "MNO-654",
    marca: "Chevrolet",
    modelo: "LV-150",
    anio: 2019,
    capacidad: 36,
    kilometraje: 187900,
    estado: "En mantenimiento",
    observaciones: "En taller por revisión del sistema de frenos.",
  },
  {
    tipo: "Buseta",
    placa: "PQR-987",
    marca: "Nissan",
    modelo: "Civilian",
    anio: 2018,
    capacidad: 20,
    kilometraje: 213400,
    estado: "Disponible",
    observaciones: "",
  },
  {
    tipo: "Camioneta",
    placa: "STU-147",
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2022,
    capacidad: 5,
    kilometraje: 58600,
    estado: "Disponible",
    observaciones: "Vehículo 4x4 para desplazamientos a zona rural.",
  },
  {
    tipo: "Automóvil",
    placa: "VWX-258",
    marca: "Mazda",
    modelo: "Allegro",
    anio: 2016,
    capacidad: 5,
    kilometraje: 245100,
    estado: "Fuera de servicio",
    observaciones: "Pendiente de dar de baja por antigüedad.",
  },
];

/* ------------------------------- Conductores ------------------------------ */

const CONDUCTORES = [
  {
    nombre: "Carlos Alberto Pérez",
    tipoDocumento: "CC",
    documento: "1058457214",
    licencia: "LC-458721",
    categoriaLicencia: "C2",
    vencimientoLicencia: dia(550),
    telefono: "3104567890",
    correo: "carlos.perez@uptc.edu.co",
    estado: "Disponible",
    observaciones: "Conductor con experiencia en rutas intermunicipales.",
  },
  {
    nombre: "Luis Fernando Gómez",
    tipoDocumento: "CC",
    documento: "7412589630",
    licencia: "LC-332145",
    categoriaLicencia: "C2",
    vencimientoLicencia: dia(320),
    telefono: "3127845612",
    correo: "luis.gomez@uptc.edu.co",
    estado: "Disponible",
    observaciones: "",
  },
  {
    nombre: "Pedro Antonio López",
    tipoDocumento: "CC",
    documento: "9635214780",
    licencia: "LC-778412",
    categoriaLicencia: "C3",
    vencimientoLicencia: dia(45),
    telefono: "3159874521",
    correo: "pedro.lopez@uptc.edu.co",
    estado: "Disponible",
    observaciones: "Licencia próxima a vencer, gestionar renovación.",
  },
  {
    nombre: "María Elena Rodríguez",
    tipoDocumento: "CC",
    documento: "5214789630",
    licencia: "LC-951357",
    categoriaLicencia: "C1",
    vencimientoLicencia: dia(680),
    telefono: "3208541296",
    correo: "maria.rodriguez@uptc.edu.co",
    estado: "Disponible",
    observaciones: "",
  },
  {
    nombre: "Jorge Iván Sánchez",
    tipoDocumento: "CC",
    documento: "8523697410",
    licencia: "LC-147258",
    categoriaLicencia: "C2",
    vencimientoLicencia: dia(-30),
    telefono: "3115557788",
    correo: "jorge.sanchez@uptc.edu.co",
    estado: "Disponible",
    observaciones: "Licencia vencida: no puede ser asignado hasta renovarla.",
  },
  {
    nombre: "Ana Milena Castro",
    tipoDocumento: "CE",
    documento: "3697412580",
    licencia: "LC-369852",
    categoriaLicencia: "B1",
    vencimientoLicencia: dia(420),
    telefono: "3183214567",
    correo: "ana.castro@uptc.edu.co",
    estado: "Inactivo",
    observaciones: "En licencia no remunerada hasta nuevo aviso.",
  },
];

/* -------------------------------- Servicios -------------------------------- */

/**
 * Plantillas de servicio. Los índices de vehículo y conductor apuntan a las
 * listas anteriores; el seed los resuelve a ObjectId tras insertarlos.
 */
const SERVICIOS = [
  // --- Pasados (finalizados) ---
  { v: 0, c: 0, offset: -7,  salida: "07:00", regreso: "15:00", tipo: "Visita académica",
    origen: "Sogamoso", destino: "Tunja", pasajeros: 28, estado: "Finalizado",
    desc: "Visita académica al laboratorio de suelos de la sede central.",
    resp: "Ing. Juan Martínez", tel: "3112223344" },

  { v: 2, c: 1, offset: -6,  salida: "06:30", regreso: "18:00", tipo: "Comisión",
    origen: "Sogamoso", destino: "Bogotá", pasajeros: 4, estado: "Finalizado",
    desc: "Comisión administrativa ante el Ministerio de Educación.",
    resp: "Dra. Patricia Ruiz", tel: "3145556677" },

  { v: 1, c: 2, offset: -4,  salida: "08:00", regreso: "17:30", tipo: "Inducción",
    origen: "Sogamoso", destino: "Soatá", pasajeros: 22, estado: "Finalizado",
    desc: "Jornada de inducción para estudiantes de primer semestre.",
    resp: "Lic. Andrés Vargas", tel: "3167778899" },

  { v: 0, c: 0, offset: -3,  salida: "05:30", regreso: "20:00", tipo: "Actividad académica",
    origen: "Sogamoso", destino: "Villa de Leyva", pasajeros: 38, estado: "Finalizado",
    desc: "Salida de campo del programa de Ingeniería Geológica.",
    resp: "Ing. Claudia Torres", tel: "3123334455" },

  { v: 3, c: 3, offset: -1,  salida: "09:00", regreso: "16:00", tipo: "Transporte funcionarios",
    origen: "Sogamoso", destino: "Duitama", pasajeros: 3, estado: "Finalizado",
    desc: "Traslado de funcionarios a reunión interinstitucional.",
    resp: "Adm. Ricardo Peña", tel: "3134445566" },

  // --- En curso (hoy, ventana amplia para que caiga dentro) ---
  { v: 6, c: 3, offset: 0,   salida: "06:00", regreso: "22:00", tipo: "Actividad complementaria",
    origen: "Sogamoso", destino: "Paipa", pasajeros: 5, estado: "En curso",
    desc: "Acompañamiento a jornada deportiva interuniversitaria.",
    resp: "Prof. Sandra Gil", tel: "3156667788" },

  // --- Próximos (programados) ---
  { v: 0, c: 0, offset: 2,   salida: "07:30", regreso: "16:30", tipo: "Visita académica",
    origen: "Sogamoso", destino: "Tunja", pasajeros: 32, estado: "Programado",
    desc: "Visita académica al centro de investigación de la sede central.",
    resp: "Ing. Juan Martínez", tel: "3112223344" },

  { v: 1, c: 1, offset: 3,   salida: "09:00", regreso: "14:00", tipo: "Comisión",
    origen: "Sogamoso", destino: "Duitama", pasajeros: 18, estado: "Programado",
    desc: "Comisión de docentes al encuentro regional de investigación.",
    resp: "Dra. Patricia Ruiz", tel: "3145556677" },

  { v: 5, c: 2, offset: 4,   salida: "13:00", regreso: "19:00", tipo: "Inducción",
    origen: "Sogamoso", destino: "Nobsa", pasajeros: 16, estado: "Programado",
    desc: "Inducción empresarial para estudiantes de últimos semestres.",
    resp: "Lic. Andrés Vargas", tel: "3167778899" },

  { v: 2, c: 3, offset: 5,   salida: "08:00", regreso: "12:00", tipo: "Transporte funcionarios",
    origen: "Sogamoso", destino: "Tunja", pasajeros: 4, estado: "Programado",
    desc: "Traslado de directivos a consejo académico.",
    resp: "Adm. Ricardo Peña", tel: "3134445566" },

  { v: 0, c: 1, offset: 8,   salida: "06:00", regreso: "21:00", tipo: "Transporte estudiantes",
    origen: "Sogamoso", destino: "Bogotá", pasajeros: 36, estado: "Programado",
    desc: "Asistencia al congreso nacional de estudiantes de ingeniería.",
    resp: "Ing. Claudia Torres", tel: "3123334455" },

  { v: 3, c: 0, offset: 10,  salida: "10:00", regreso: "15:00", tipo: "Otro",
    origen: "Sogamoso", destino: "Iza", pasajeros: 4, estado: "Programado",
    desc: "Desplazamiento para gestión documental en sede alterna.",
    resp: "Adm. Ricardo Peña", tel: "3134445566" },

  // --- Cancelado (no ocupa agenda) ---
  { v: 1, c: 3, offset: 6,   salida: "07:00", regreso: "18:00", tipo: "Actividad complementaria",
    origen: "Sogamoso", destino: "Monguí", pasajeros: 20, estado: "Cancelado",
    desc: "Salida cultural cancelada por condiciones climáticas.",
    resp: "Prof. Sandra Gil", tel: "3156667788" },
];

/* ------------------------------ Mantenimientos ----------------------------- */

const MANTENIMIENTOS = [
  { v: 0, offset: -45, tipo: "Cambio de aceite", km: 120000, costo: 480000,
    desc: "Cambio de aceite de motor, filtro de aceite y filtro de aire.",
    proveedor: "Serviteca El Rodeo", proximo: 45 },

  { v: 0, offset: -120, tipo: "Frenos", km: 112500, costo: 1250000,
    desc: "Rectificación de discos y cambio de pastillas en los cuatro ejes.",
    proveedor: "Frenos y Embragues Boyacá", proximo: -30 },

  { v: 1, offset: -60, tipo: "Revisión general", km: 85000, costo: 720000,
    desc: "Revisión general preventiva antes de temporada académica.",
    proveedor: "Taller Autorizado Chevrolet", proximo: 30 },

  { v: 4, offset: -5, tipo: "Frenos", km: 187500, costo: 1850000,
    desc: "Reparación del sistema de frenos: cilindro maestro y bomba.",
    proveedor: "Frenos y Embragues Boyacá", proximo: 90 },

  { v: 2, offset: -30, tipo: "Llantas", km: 39800, costo: 2400000,
    desc: "Cambio de juego completo de llantas y alineación.",
    proveedor: "Llantas del Norte", proximo: 180 },

  { v: 6, offset: -20, tipo: "Preventivo", km: 56000, costo: 390000,
    desc: "Mantenimiento preventivo de 55.000 km según manual del fabricante.",
    proveedor: "Toyota Sogamoso", proximo: 75 },

  { v: 5, offset: -90, tipo: "Motor", km: 210000, costo: 3200000,
    desc: "Ajuste de motor y cambio de correa de repartición.",
    proveedor: "Mecánica Industrial JR", proximo: 120 },

  { v: 3, offset: -15, tipo: "Sistema eléctrico", km: 96200, costo: 280000,
    desc: "Reemplazo de batería y revisión del alternador.",
    proveedor: "Electroautos Sogamoso", proximo: 200 },
];

/* --------------------------------- Proceso -------------------------------- */

async function seed() {
  await connectDatabase();

  console.log("\n[seed] Limpiando colecciones...");
  await Promise.all([
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    Service.deleteMany({}),
    Maintenance.deleteMany({}),
  ]);

  console.log("[seed] Insertando vehículos...");
  const vehiculos = await Vehicle.create(VEHICULOS);
  console.log(`        ${vehiculos.length} vehículos`);

  console.log("[seed] Insertando conductores...");
  const conductores = await Driver.create(CONDUCTORES);
  console.log(`        ${conductores.length} conductores`);

  console.log("[seed] Insertando servicios...");
  const anio = new Date().getFullYear();
  const documentosServicio = SERVICIOS.map((plantilla, indice) => {
    const fecha = dia(plantilla.offset);

    return {
      codigo: `SER-${anio}-${String(indice + 1).padStart(4, "0")}`,
      tipoServicio: plantilla.tipo,
      fecha,
      horaSalida: plantilla.salida,
      horaRegreso: plantilla.regreso,
      fechaHoraSalida: combinarFechaHora(fecha, plantilla.salida),
      fechaHoraRegreso: combinarFechaHora(fecha, plantilla.regreso),
      origen: plantilla.origen,
      destino: plantilla.destino,
      descripcion: plantilla.desc,
      pasajeros: plantilla.pasajeros,
      responsable: plantilla.resp,
      telefonoResponsable: plantilla.tel,
      vehiculo: vehiculos[plantilla.v]._id,
      conductor: conductores[plantilla.c]._id,
      estado: plantilla.estado,
      observaciones: "",
    };
  });

  const servicios = await Service.create(documentosServicio);
  console.log(`        ${servicios.length} servicios`);

  console.log("[seed] Insertando mantenimientos...");
  const documentosMantenimiento = MANTENIMIENTOS.map((plantilla) => ({
    vehiculo: vehiculos[plantilla.v]._id,
    fecha: dia(plantilla.offset),
    tipo: plantilla.tipo,
    kilometraje: plantilla.km,
    descripcion: plantilla.desc,
    proveedor: plantilla.proveedor,
    costo: plantilla.costo,
    proximoMantenimiento: dia(plantilla.offset + plantilla.proximo),
    observaciones: "",
  }));

  const mantenimientos = await Maintenance.create(documentosMantenimiento);
  console.log(`        ${mantenimientos.length} mantenimientos`);

  console.log("\n[seed] Listo. Datos de ejemplo cargados.\n");
  console.log("  Resumen:");
  console.log(`    Vehículos ....... ${vehiculos.length}`);
  console.log(`    Conductores ..... ${conductores.length}`);
  console.log(`    Servicios ....... ${servicios.length}`);
  console.log(`    Mantenimientos .. ${mantenimientos.length}`);
  console.log("\n  Ejecuta 'npm run dev' y abre http://localhost:3000\n");

  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error("\n[seed] Error cargando los datos de ejemplo:");
  console.error(error.message);
  await mongoose.connection.close();
  process.exit(1);
});
