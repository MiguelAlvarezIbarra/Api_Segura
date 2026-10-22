# Secure Task Manager: Full-Stack Tutorial

Aplicación full-stack para la gestión de tareas seguras construida con **Node.js, Express, PostgreSQL, Prisma** y un cliente móvil en **Flutter con Riverpod**.

Este repositorio implementa la arquitectura y los lineamientos de seguridad recomendados (OWASP API Security Top 10), incluyendo:
- Autenticación mediante **JWT de acceso de vida corta** (10 minutos).
- **Rotación de tokens de refresco** en cada uso (con expiración a 7 días).
- **Detección de reúso de tokens**: si un token revocado vuelve a presentarse, se revoca inmediatamente toda la familia (`familyId`).
- Hashing seguro de contraseñas con **bcrypt** (factor de costo 12).
- Autorización a nivel de objeto (**IDOR prevention**) en todas las operaciones sobre tareas.
- Validación estricta de esquemas de entrada con **Zod** y límites en el tamaño de los cuerpos HTTP.
- Registro estructurado con **Pino** redactando contraseñas y tokens.
- Manejo centralizado y seguro de errores sin revelar trazas ni consultas internas.
- Cliente en **Flutter** con cliente HTTP resiliente (*single-flight refresh* y reintento automático), persistencia segura con `FlutterSecureStorage` y separación por capas con `Riverpod`.

---

## Estructura del Proyecto

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                  # Esquema Prisma (User, Task, RefreshToken)
│   │   └── migrations/                    # Historial de migraciones SQL
│   ├── src/
│   │   ├── app.js                         # Configuración de Express, middlewares y rutas
│   │   ├── server.js                      # Inicialización del servidor y apagado elegante
│   │   ├── config.js                      # Validación de variables de entorno con Zod
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         # Verificación de Bearer JWT
│   │   │   ├── validate.middleware.js     # Validación con Zod
│   │   │   └── error.middleware.js        # Manejador centralizado de errores
│   │   ├── repositories/
│   │   │   ├── task.repository.js         # Operaciones CRUD sobre PostgreSQL con Prisma
│   │   │   └── refresh-token.repository.js# Manejo de tokens y familias de refresco
│   │   ├── routes/
│   │   │   ├── auth.routes.js             # Endpoints /auth con rate-limiting
│   │   │   └── task.routes.js             # Endpoints /tasks protegidos
│   │   ├── schemas/
│   │   │   ├── auth.schema.js             # Esquemas de registro, login y refresco
│   │   │   └── task.schema.js             # Esquemas de tareas y paginación
│   │   ├── services/
│   │   │   ├── auth.service.js            # Lógica de negocio de auth y rotación
│   │   │   └── task.service.js            # Reglas de tareas y propiedad de usuario
│   │   └── utils/
│   │       └── tokens.js                  # Firmado JWT y hashes criptográficos
│   ├── tests/
│   │   ├── health.test.js                 # Verificación del endpoint /health
│   │   ├── auth.test.js                   # Pruebas de rotación, reúso y revocación
│   │   ├── task.test.js                   # Pruebas de IDOR y autorización cruzada
│   │   └── verify_e2e_exercise.js         # Script E2E interactivo (Sección 19 & 19a)
│   ├── compose.yaml                       # Contenedor PostgreSQL 16 con healthcheck
│   ├── openapi.yaml                       # Documentación OpenAPI 3.0
│   ├── package.json
│   └── .env.example
└── mobile/
    ├── lib/
    │   ├── core/
    │   │   ├── config/app_config.dart     # Configuración con --dart-define
    │   │   ├── network/api_client.dart    # Cliente HTTP con refresco resiliente
    │   │   └── storage/token_store.dart   # Persistencia en FlutterSecureStorage
    │   ├── features/
    │   │   ├── auth/                      # Flujos de registro, login y logout
    │   │   └── tasks/                     # Dominio, repositorio, controlador y vistas
    │   └── main.dart
    ├── test/
    │   └── api_client_test.dart           # Pruebas con MockClient y FakeTokenStore
    └── pubspec.yaml
```

---

## Puesta en Marcha

### 1. Iniciar la Base de Datos con Docker
```bash
cd backend
docker compose up -d
```

### 2. Configurar Variables de Entorno del Backend
```bash
cp .env.example .env
# Modifica los secretos en .env asegurando al menos 32 caracteres
```

### 3. Migrar la Base de Datos y Generar Cliente Prisma
```bash
npm install
npx prisma migrate dev
```

### 4. Ejecutar Pruebas del Backend
```bash
npm test
```

Para correr la suite interactiva del ejercicio práctico de rotación y reúso (Sección 19 & 19a):
```bash
node tests/verify_e2e_exercise.js
```

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

---

## Cliente Móvil Flutter

Instalar dependencias y ejecutar en el emulador de Android (apuntando a `http://10.0.2.2:3000/api/v1`):
```bash
cd ../mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

Para correr las pruebas unitarias del cliente Flutter:
```bash
flutter test
```
