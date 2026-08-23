"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) || /^10\./.test(window.location.hostname) || /^192\.168\./.test(window.location.hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(window.location.hostname);

    if (process.env.NODE_ENV !== "production" || isLocalHost) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
