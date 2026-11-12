import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Route Supabase invite and recovery callbacks before the Auth client can
// consume their URL parameters. Dashboard invitations otherwise fall back to
// the project Site URL and can appear to open only the storefront.
const authHash = new URLSearchParams(window.location.hash.slice(1));
const authQuery = new URLSearchParams(window.location.search);
const authType = authHash.get("type") || authQuery.get("type");
const isPasswordCallback =
  authType === "invite" ||
  authType === "recovery" ||
  authHash.has("access_token") ||
  authQuery.has("code") ||
  authQuery.has("token_hash");

if (isPasswordCallback && window.location.pathname !== "/admin/set-password") {
  window.history.replaceState(
    null,
    "",
    `/admin/set-password${window.location.search}${window.location.hash}`,
  );
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
