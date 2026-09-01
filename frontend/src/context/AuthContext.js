import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import Swal from "sweetalert2";

import { loginRequest } from "../api";
import { SESSION_EXPIRED_EVENT } from "./sessionEvents";

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: "admin",
  EMPLEADO: "empleado",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.EMPLEADO]: "Empleado",
};

const STORAGE_KEY = "brasa.session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      return raw
        ? JSON.parse(raw)
        : null;
    } catch {
      return null;
    }
  });

  const [sessionExpired, setSessionExpired] =
    useState(false);

  /* GUARDAR / ELIMINAR SESIÓN */
  useEffect(() => {
    if (session) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(session)
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  /* SESIÓN EXPIRADA */
  useEffect(() => {
    function handleExpired() {
      setSession(null);
      setSessionExpired(true);
    }

    window.addEventListener(
      SESSION_EXPIRED_EVENT,
      handleExpired
    );

    return () => {
      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleExpired
      );
    };
  }, []);

  /* LOGIN */
  async function login({
    username,
    password,
    role,
  }) {
    const cleanUsername = username?.trim() || "";
    const cleanPassword = password?.trim() || "";

    /* USUARIO VACÍO */
    if (!cleanUsername) {
      await Swal.fire({
        icon: "warning",
        title: "Usuario requerido",
        text: "Ingresa tu usuario para continuar.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#8b5e3c",
      });

      return {
        ok: false,
        error: "Ingresa tu usuario.",
      };
    }

    /* CONTRASEÑA VACÍA */
    if (!cleanPassword) {
      await Swal.fire({
        icon: "warning",
        title: "Contraseña requerida",
        text: "Ingresa tu contraseña para continuar.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#8b5e3c",
      });

      return {
        ok: false,
        error: "Ingresa tu contraseña.",
      };
    }

    /* ROL NO SELECCIONADO */
    if (!role) {
      await Swal.fire({
        icon: "warning",
        title: "Selecciona un perfil",
        text: "Debes seleccionar Administrador o Empleado.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#8b5e3c",
      });

      return {
        ok: false,
        error: "Selecciona un perfil.",
      };
    }

    try {
      /*
       * ENVÍA:
       * usuario
       * contraseña
       * rol seleccionado
       */
      const response = await loginRequest(
        cleanUsername,
        cleanPassword,
        role
      );

      const { token, user } = response;

      /* VALIDACIÓN DEL USUARIO */
      if (!user) {
        await Swal.fire({
          icon: "error",
          title: "Error de autenticación",
          text: "El servidor no devolvió información del usuario.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#8b5e3c",
        });

        return {
          ok: false,
          error: "Usuario inválido.",
        };
      }

      /*
       * VALIDACIÓN ADICIONAL DEL ROL
       *
       * Esto evita que:
       *
       * ADMIN + EMPLEADO
       *
       * pueda entrar si el backend devuelve el
       * verdadero rol del usuario.
       */
      if (user.role !== role) {
        const selectedLabel =
          ROLE_LABELS[role] || role;

        const realRole =
          ROLE_LABELS[user.role] || user.role;

        await Swal.fire({
          icon: "error",
          title: "Perfil incorrecto",
          html: `
            <div style="
              font-size: 15px;
              line-height: 1.6;
            ">
              El usuario
              <strong>${cleanUsername}</strong>
              pertenece al perfil
              <strong>${realRole}</strong>.
              <br><br>
              Has seleccionado
              <strong>${selectedLabel}</strong>.
              <br><br>
              Selecciona el perfil correcto para continuar.
            </div>
          `,
          confirmButtonText: "Cambiar perfil",
          confirmButtonColor: "#8b5e3c",
        });

        return {
          ok: false,
          error:
            "El perfil seleccionado no corresponde al usuario.",
        };
      }

      /* CREAR SESIÓN */
      setSession({
        token,
        user,
      });

      setSessionExpired(false);

      return {
        ok: true,
        role: user.role,
      };

    } catch (err) {
      console.error(
        "Error de login:",
        err
      );

      await Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text:
          err?.message ||
          "El usuario o la contraseña son incorrectos.",
        confirmButtonText: "Intentar nuevamente",
        confirmButtonColor: "#8b5e3c",
      });

      return {
        ok: false,
        error:
          err?.message ||
          "No se pudo iniciar sesión.",
      };
    }
  }

  /* LOGOUT */
  function logout() {
    setSession(null);
    setSessionExpired(false);
  }

  /* LIMPIAR AVISO */
  function clearSessionExpired() {
    setSessionExpired(false);
  }

  const value = {
    user: session?.user || null,
    token: session?.token || null,
    sessionExpired,
    clearSessionExpired,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider"
    );
  }

  return ctx;
}