const mongoose = require("mongoose");

/**
 * Abre la conexion contra MongoDB Atlas (o la instancia definida en MONGODB_URI).
 * Si la conexion falla no tiene sentido levantar el servidor, por eso se corta
 * el proceso con un mensaje entendible en lugar de dejar Express escuchando
 * sobre una base inexistente.
 */
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("[db] Falta la variable MONGODB_URI. Copia .env.example a .env y completala.");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[db] Conectado a MongoDB -> ${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error("[db] No fue posible conectar con MongoDB.");
    console.error(`[db] ${error.message}`);
    process.exit(1);
  }
}

module.exports = { connectDatabase };
