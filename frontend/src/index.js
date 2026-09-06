import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";  // ← Importado
import { Buffer } from 'buffer';
import "./index.css";
import App from "./App";

window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>  {/* ← AHORA SÍ lo estás usando */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);