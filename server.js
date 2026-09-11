require("dotenv").config();

const app = require("./src/app");
const { connectDatabase } = require("./src/config/database");

const PORT = process.env.PORT || 3000;

/**
 * Punto de entrada: primero se establece la conexion con MongoDB y solo
 * despues se abre el puerto, de forma que la aplicacion nunca atienda
 * peticiones sin base de datos disponible.
 */
async function bootstrap() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`[server] UPTC Transporte escuchando en http://localhost:${PORT}`);
    console.log(`[server] Entorno: ${process.env.NODE_ENV || "development"}`);
  });
}

bootstrap();
