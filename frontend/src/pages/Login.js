import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, ROLES, ROLE_LABELS } from "../context/AuthContext";
import logoBg from "../assets/Recurso 32PCR-ALTA.png";
import "./Login.css";

const ROLE_ORDER = [ROLES.ADMIN, ROLES.EMPLEADO];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);

  const sessionExpired =
    Boolean(location.state?.sessionExpired) ||
    searchParams.get("expired") === "1";

  const [role, setRole] = useState(ROLES.EMPLEADO);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const roleIndex = ROLE_ORDER.indexOf(role);

  function handleRoleChange(selectedRole) {
    setRole(selectedRole);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const result = await login({
        username,
        password,
        role,
      });

      if (!result.ok) {
        return;
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="login-screen"
      data-role={role}
    >
      <div
        className="login-ambient"
        aria-hidden="true"
      >
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
      </div>

      <div className="login-container">

        {/* LOGO */}
        <div className="login-logo-section">
          <div className="login-logo-bg">
            <img
              src={logoBg}
              alt="Pecario Restaurante"
            />
          </div>

          <div className="login-brand">
            <span className="login-wordmark">
              Pecario
            </span>

            <span className="login-tagline">
              Sistema de gestión del restaurante
            </span>
          </div>
        </div>

        {/* TARJETA LOGIN */}
        <main className="login-card">

          <div className="login-card-header">
            <h2>Iniciar sesión</h2>

            <p>
              Accede a tu panel de control
            </p>
          </div>

          {/* SESIÓN EXPIRADA */}
          {sessionExpired && (
            <p
              className="login-session-expired"
              role="alert"
            >
              Tu sesión ha expirado.
              Vuelve a iniciar sesión para continuar.
            </p>
          )}

          {/* SELECTOR DE ROL */}
          <div
            className="segmented"
            role="tablist"
            aria-label="Selecciona tu perfil"
          >
            <span
              className="segmented-thumb"
              style={{
                transform: `translateX(${roleIndex * 100}%)`,
              }}
            />

            {ROLE_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                className={`segmented-option ${
                  role === r ? "is-active" : ""
                }`}
                onClick={() => handleRoleChange(r)}
                disabled={submitting}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          {/* FORMULARIO */}
          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* USUARIO */}
            <label className="field">
              <span className="field-label">
                Usuario
              </span>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder={`${ROLE_LABELS[role].toLowerCase()}@pecario.com`}
                autoComplete="username"
                disabled={submitting}
              />
            </label>

            {/* CONTRASEÑA */}
            <label className="field">
              <span className="field-label">
                Contraseña
              </span>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={submitting}
              />
            </label>

            {/* BOTÓN */}
            <button
              type="submit"
              className="login-submit"
              disabled={submitting}
            >
              {submitting
                ? "Ingresando…"
                : "Iniciar sesión"}
            </button>

          </form>

          {/* AYUDA */}
          <p className="login-hint">
            Seleccionaste{" "}
            <strong>
              {ROLE_LABELS[role]}
            </strong>
            . Ingresa las credenciales correspondientes
            a este perfil.
          </p>

        </main>
      </div>
    </div>
  );
}