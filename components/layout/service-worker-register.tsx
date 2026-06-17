"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const { hostname, protocol } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isSecureContext = protocol === "https:" || isLocalhost;

    if (!isSecureContext) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // App install still works as a web app fallback if registration is blocked.
    });
  }, []);

  return null;
}
