// Evento global desacoplado de React: tanto api.js como AuthContext.jsx
// importan este archivo (nunca se importan entre sí), así se evita el
// ciclo api.js -> AuthContext.jsx -> api.js que rompía el build.
export const SESSION_EXPIRED_EVENT = "brasa:session-expired";

export function notifySessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}