import React from "react";
import "./placeholder.css";

export default function Placeholder({ title }) {
  return (
    <div className="placeholder-panel">
      <h1>{title}</h1>
      <p>Esta vista todavía no tiene funcionalidad conectada — es el siguiente módulo a construir.</p>
    </div>
  );
}