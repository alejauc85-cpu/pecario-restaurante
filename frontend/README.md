# BRASA — App de gestión de restaurante

Proyecto React (Create React App) con login estilo Apple y 3 perfiles de usuario
(**Admin**, **Cocina**, **Mesero**), cada uno con acceso a distintas categorías del menú.

> Nota: este README quedó de la primera versión (login simulado). Ahora este
> frontend habla con el backend real en `../backend`. Instrucciones completas
> de cómo correr ambos juntos: ver el `README.md` en la raíz del proyecto.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # REACT_APP_API_URL apuntando al backend
npm start
```

Abre http://localhost:3000. La app arranca en `/login`. El login llama al
backend (`POST /api/auth/login`); el perfil seleccionado en el control
segmentado es solo referencia visual, el rol real lo confirma el servidor.

## Estructura

```
src/
  api.js                   → helper de fetch hacia el backend (login, menú)
  context/AuthContext.js   → maneja sesión (token + usuario) en localStorage
  pages/Login.js           → vista de login (selector de perfil + formulario)
  pages/Dashboard.js       → pide el menú a la API y arma el layout
  components/Sidebar.js    → menú lateral izquierdo, ya filtrado por el backend
  components/MenuGrid.js   → tarjetas de los ítems de la categoría activa
```

## Qué ve cada perfil

- **Admin**: todas las categorías, incluida "Gestión y costos".
- **Cocina**: entradas, platos fuertes y postres, con tiempos/notas de preparación
  en vez de precio de venta.
- **Mesero**: entradas, platos fuertes, bebidas y postres, con precios de venta
  (para tomar pedidos).

## Siguientes pasos sugeridos

- Agregar más vistas dentro del layout de `Dashboard` (pedidos, mesas, reportes, etc.)
  siguiendo el mismo patrón de rutas protegidas en `App.js`.
- Manejar la expiración del token de forma más fina (hoy, cualquier error que
  mencione "token" fuerza logout).
