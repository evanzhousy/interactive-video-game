import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InternalHubApp } from "./components/InternalHubApp.js";
import "./styles/index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
  <StrictMode>
    <InternalHubApp />
  </StrictMode>
);
