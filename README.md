# UPTC Transporte

**Sistema de Gestión de Transporte — Seccional Sogamoso**

Aplicación web administrativa para gestionar los vehículos, conductores, mantenimientos y
servicios de transporte de la oficina administrativa de la Universidad Pedagógica y
Tecnológica de Colombia, Seccional Sogamoso.

---

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Runtime | Node.js 22 |
| Servidor | Express 4 |
| Base de datos | MongoDB Atlas |
| ODM | Mongoose 8 |
| Vistas | EJS |
| Estilos | CSS3 (variables nativas, sin framework) |
| Cliente | JavaScript (ES5, sin build) |
| Iconos | Lucide (SVG incrustados localmente) |

No se utiliza React ni ningún framework de frontend: la interfaz se renderiza en el
servidor con EJS, tal como exige el enunciado.

---

## Instalación

```bash
git clone https://github.com/RafaelC26/Parcial-1-ElectivaII.git
cd Parcial-1-ElectivaII
npm install
```

Crear el archivo `.env` a partir de la plantilla:

```bash
cp .env.example .env
```

Y completar la cadena de conexión de MongoDB Atlas:

```env
PORT=3000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/uptc_transportes
NODE_ENV=development
SESSION_SECRET=un-valor-propio
```

Cargar datos de ejemplo (opcional, pero recomendado para la demostración):

```bash
npm run seed
```

Ejecutar:

```bash
npm run dev
```

La aplicación queda disponible en <http://localhost:3000>.

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm start` | Ejecuta el servidor en modo producción |
| `npm run dev` | Ejecuta el servidor con recarga automática (nodemon) |
| `npm run seed` | Carga 8 vehículos, 6 conductores, 13 servicios y 8 mantenimientos |

> `npm run seed` **borra** el contenido de las colecciones antes de insertar.

---

## Arquitectura

Patrón MVC con separación por responsabilidad:

```
uptc-transportes/
├── src/
│   ├── config/database.js        Conexión a MongoDB Atlas
│   ├── models/                   Esquemas de Mongoose
│   │   ├── Vehicle.js
│   │   ├── Driver.js
│   │   ├── Service.js
│   │   └── Maintenance.js
│   ├── controllers/              Lógica de cada módulo
│   ├── routes/                   Definición de rutas Express
│   ├── middleware/
│   │   ├── errorHandler.js       Manejo global de errores + asyncHandler
│   │   └── validation.js         Validaciones y traducción de errores de Mongo
│   ├── utils/
│   │   ├── availability.js       Reglas de negocio y disponibilidad
│   │   ├── serviceCode.js        Generación de SER-AAAA-NNNN
│   │   ├── dateUtils.js          Fechas, horas y formato colombiano
│   │   └── viewHelpers.js        Helpers disponibles en las vistas
│   └── app.js                    Configuración de Express
├── views/                        Plantillas EJS
├── public/                       CSS, JS de cliente e imágenes
├── scripts/seed.js               Datos de ejemplo
└── server.js                     Punto de entrada
```

### Flujo de datos

```
MongoDB Atlas → Mongoose → Controller → Express → EJS → Interfaz
```

Ninguna vista construye datos por su cuenta: todo llega desde el controlador.

---

## Modelo de datos

```
VEHICLE ──1──N── SERVICE ──N──1── DRIVER
   │
   └────1──N── MAINTENANCE
```

- Un vehículo tiene muchos servicios y muchos mantenimientos.
- Un conductor tiene muchos servicios.
- Cada servicio tiene exactamente un vehículo y un conductor.

### Índices únicos

| Colección | Campo |
| --- | --- |
| `vehicles` | `placa` |
| `drivers` | `documento`, `licencia` |
| `services` | `codigo` |

### Decisión de diseño: fecha y hora

Además de `fecha`, `horaSalida` y `horaRegreso`, cada servicio guarda
`fechaHoraSalida` y `fechaHoraRegreso` como objetos `Date` completos, derivados
automáticamente en un hook `pre("validate")`.

Comparar `Date` contra `Date` evita los errores que aparecen al comparar horas
como texto y permite que la detección de cruces sea una consulta directa a MongoDB.

---

## Reglas de negocio

Las diez reglas se validan **en el backend**, dentro de `src/utils/availability.js`.
El JavaScript del formulario solo adelanta avisos al usuario; nunca decide si un
servicio puede guardarse.

| # | Regla | Mensaje al usuario |
| --- | --- | --- |
| 1 | Un vehículo en mantenimiento o fuera de servicio no puede asignarse | *Este vehículo actualmente no se encuentra disponible para prestar servicios.* |
| 2 | El número de pasajeros no puede superar la capacidad | *El vehículo seleccionado tiene capacidad para N pasajeros y el servicio requiere transportar M personas. Seleccione otro vehículo.* |
| 3 | Un vehículo no puede tener dos servicios simultáneos | *El vehículo seleccionado ya se encuentra asignado a otro servicio durante este horario.* |
| 4 | Un conductor no puede tener dos servicios simultáneos | *El conductor seleccionado ya tiene un servicio asignado durante este horario.* |
| 5 | Un conductor con licencia vencida no puede ser asignado | *No es posible asignar este conductor porque su licencia de conducción se encuentra vencida.* |
| 6 | La hora de regreso debe ser posterior a la de salida | *La hora de regreso debe ser posterior a la hora de salida.* |
| 7 | Las fechas del informe deben ser válidas y coherentes | *La fecha inicial debe ser anterior o igual a la fecha final.* |
| 8 | Los campos requeridos no pueden ir vacíos | *Debes ingresar la capacidad del vehículo.* |
| 9 | Placas, documentos y licencias no se duplican | *Ya existe un vehículo registrado con la placa ABC-123.* |
| 10 | Toda validación crítica se ejecuta en el servidor | — |

### Detección de cruces de horario

```js
nuevoInicio < servicioFin && nuevoFin > servicioInicio
```

Traducido a MongoDB:

```js
{
  vehiculo: vehicleId,
  estado: { $ne: "Cancelado" },
  fechaHoraSalida:  { $lt: nuevoFin },
  fechaHoraRegreso: { $gt: nuevoInicio }
}
```

Dos servicios que solo se tocan en el extremo (uno termina 13:00 y el siguiente
empieza 13:00) **no** se consideran conflicto, lo que permite programar transportes
consecutivos. Un servicio cancelado libera el horario.

### Estado operativo frente a estado calculado

El campo `estado` del vehículo representa únicamente su **condición operativa**
(`Disponible`, `En mantenimiento`, `Fuera de servicio`). La condición `En servicio`
**no se persiste**: se calcula consultando si existe un servicio en curso en este
momento.

Esto evita que un vehículo quede marcado como ocupado permanentemente por tener
una reserva para la próxima semana. La misma lógica aplica a los conductores.

---

## Módulos

### Dashboard (`/`)

Indicadores calculados con `countDocuments()` y `aggregate()` sobre MongoDB —
ninguna cifra está fija en la vista. Muestra vehículos registrados, disponibles,
servicios del día, conductores activos, próximos servicios, estado de la flota,
licencias por vencer y mantenimientos recientes.

### Vehículos (`/vehicles`)

CRUD completo con buscador por placa, marca o modelo, y filtros por tipo y estado.
La ficha de cada vehículo reúne su información general, los servicios realizados y
el historial de mantenimientos.

La placa se normaliza automáticamente: `abc123` se guarda como `ABC-123`.

**Integridad:** un vehículo con servicios registrados no puede eliminarse. El sistema
sugiere cambiar su estado a *Fuera de servicio* para no romper el historial ni los
informes. La misma protección aplica a los conductores.

### Conductores (`/drivers`)

CRUD completo con control de vigencia de licencia. Los conductores con licencia
vencida quedan deshabilitados en el formulario de servicios y se marcan visualmente
en el listado.

### Mantenimientos

Se registran desde la ficha del vehículo. Si el kilometraje reportado supera al
registrado, el vehículo se actualiza automáticamente con el dato más reciente.
`/maintenance` ofrece el historial consolidado de toda la flota con su costo total.

### Servicios (`/services`)

Módulo central. Al guardar se validan, en orden: campos obligatorios, coherencia de
horarios y, por último, las reglas que consultan la base de datos (cupo, cruces,
licencia, estado del vehículo).

El código se genera automáticamente con el formato `SER-2026-0001`, buscando el mayor
consecutivo del año en lugar de contar documentos —así, si un servicio se elimina, no
se reutiliza un código existente.

Cancelar un servicio conserva el registro histórico pero libera el horario del
vehículo y del conductor.

### Informes (`/reports`)

Consulta los servicios de un vehículo dentro de un rango de fechas e informa
servicios realizados, pasajeros transportados y destinos visitados.

El rango es **inclusivo en ambos extremos**: la fecha final se ajusta a las 23:59:59
para que los servicios del último día aparezcan en el resultado.

```js
Service.find({
  vehiculo: vehicleId,
  fecha: { $gte: inicioDelDia(desde), $lte: finDelDia(hasta) }
})
  .populate("vehiculo")
  .populate("conductor")
  .sort({ fecha: 1 });
```

Si no hay datos se explica el motivo en lugar de mostrar una tabla vacía. El informe
puede imprimirse: los estilos `@media print` ocultan la navegación.

---

## Interfaz

Estética institucional y minimalista construida sobre un sistema de tokens en
`public/css/variables.css`: color, espaciado, tipografía, radios y elevación en un
único lugar.

- **Tipografía:** Inter
- **Color principal:** azul petróleo `#164E63`, inspirado en los encabezados
  institucionales de la UPTC
- **Sidebar fija:** 260 px, colapsable por debajo de 1024 px
- **Responsive:** verificado sin desbordes horizontales en 1920, 1440, 1366, 1024 y 768 px

Los iconos de Lucide van incrustados como SVG en `public/js/icons.js` en lugar de
cargarse desde un CDN, de modo que la interfaz se ve igual sin conexión a internet.

### Mensajes de error

Ningún error técnico llega a la pantalla. `src/middleware/validation.js` traduce los
errores de Mongoose antes de mostrarlos:

| Error técnico | Mensaje mostrado |
| --- | --- |
| `MongoServerError E11000 duplicate key` | Ya existe un vehículo registrado con la placa ABC-123. |
| `ValidationError: Path 'capacidad' is required` | Debes ingresar la capacidad del vehículo. |

El middleware global `errorHandler` registra el detalle en consola y muestra al
usuario la página `errors/500` con un mensaje neutro.

---

## Rutas

### Dashboard
```
GET    /
```

### Vehículos
```
GET    /vehicles                  Listado con búsqueda y filtros
GET    /vehicles/new              Formulario de registro
POST   /vehicles                  Crear
GET    /vehicles/:id              Detalle
GET    /vehicles/:id/edit         Formulario de edición
POST   /vehicles/:id/update       Actualizar
POST   /vehicles/:id/delete       Eliminar
```

### Conductores
```
GET    /drivers
GET    /drivers/new
POST   /drivers
GET    /drivers/:id
GET    /drivers/:id/edit
POST   /drivers/:id/update
POST   /drivers/:id/delete
```

### Servicios
```
GET    /services
GET    /services/new
POST   /services
GET    /services/:id
GET    /services/:id/edit
POST   /services/:id/update
POST   /services/:id/cancel       Cancelar (libera el horario)
POST   /services/:id/delete
```

### Mantenimientos
```
GET    /maintenance                            Historial de la flota
GET    /vehicles/:vehicleId/maintenance/new
POST   /vehicles/:vehicleId/maintenance
GET    /maintenance/:id/edit
POST   /maintenance/:id/update
POST   /maintenance/:id/delete
```

### Informes
```
GET    /reports
GET    /reports/vehicle?vehicleId=...&startDate=2026-09-01&endDate=2026-09-30
```

---

## Seguridad de configuración

- `.env` está en `.gitignore` y **nunca** se sube al repositorio.
- `.env.example` documenta las variables necesarias sin exponer credenciales.
- Las credenciales de MongoDB Atlas viven únicamente en el `.env` local.

---

## Autor

Rafael Cristancho — Electiva II
Universidad Pedagógica y Tecnológica de Colombia, Seccional Sogamoso
