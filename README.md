# BRASA — App de gestión de restaurante

Monorepo con dos carpetas:

```
brasa/
  frontend/   → React (Create React App). Login + dashboard con menú por rol.
  backend/    → Node + Express + PostgreSQL. Auth con JWT y menú filtrado por rol.
```

Probado de punta a punta: login real contra PostgreSQL, JWT, y el menú devuelto
por el backend filtrado correctamente para `admin`, `cocina` y `mesero`.

## Arranque rápido (un solo comando)

Después de configurar el backend una vez (paso 1 de abajo), desde la raíz:

```bash
npm install     # instala frontend, backend y concurrently de una vez
npm start       # levanta backend (:4000) y frontend (:3000) juntos
```

Verás los logs de ambos procesos en la misma terminal, prefijados como
`[backend]` y `[frontend]`. `Ctrl+C` detiene los dos a la vez.

Esto funciona porque el `package.json` raíz usa **npm workspaces** (por eso un
solo `npm install` alcanza para las tres carpetas) y `concurrently` para correr
`npm start -w backend` y `npm start -w frontend` en paralelo.

Si prefieres correrlos por separado (por ejemplo para ver logs de cada uno en
su propia terminal), sigue los pasos 1 y 2 de abajo tal cual.

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env`:
- `DATABASE_URL`: tu Postgres local, o el que te da Railway.
- `JWT_SECRET`: cualquier string largo y aleatorio.

Crea las tablas y datos de prueba:

```bash
npm run seed
```

Esto crea 3 usuarios de prueba:

| Rol    | Usuario           | Contraseña  |
|--------|--------------------|-------------|
| Admin  | admin@brasa.com    | admin123    |
| Cocina | cocina@brasa.com   | cocina123   |
| Mesero | mesero@brasa.com   | mesero123   |

Levanta el servidor:

```bash
npm start
```

Queda en `http://localhost:4000`. Endpoints:
- `GET /health` — chequeo rápido
- `POST /api/auth/login` — `{ username, password }` → `{ token, user }`
- `GET /api/menu` — requiere `Authorization: Bearer <token>`, devuelve solo las
  categorías visibles para el rol del token

## 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Abre `http://localhost:3000`. El login llama al backend real (`REACT_APP_API_URL`
en `.env`, por defecto `http://localhost:4000`).

El selector de perfil en el login (Admin/Cocina/Mesero) es solo una referencia
visual antes de ingresar — el rol real de la sesión lo confirma el backend según
la cuenta con la que inicies sesión.

## 3. Desplegar en Railway

- Crea un servicio para `backend/` (Railway detecta `npm start` automáticamente)
  y agrega el plugin de **PostgreSQL**; Railway inyecta `DATABASE_URL` solo.
  Agrega `JWT_SECRET` y `CORS_ORIGIN` (la URL de tu frontend desplegado) como
  variables de entorno. Corre `npm run seed` una vez (Railway → shell del
  servicio, o localmente apuntando tu `DATABASE_URL` a la de Railway).
- Crea otro servicio para `frontend/` con `REACT_APP_API_URL` apuntando a la URL
  pública del backend.

## Siguiente paso sugerido

Agregar más vistas dentro del `Dashboard` del frontend (toma de pedidos para
Mesero, panel de preparación para Cocina, reportes para Admin), y sus endpoints
correspondientes en `backend/src/routes/`.
# pecario-restaurante
