"use client";

import { useEffect, useState } from "react";

const OVERLAY_TOGGLE_KEY = "idleGame_offlineOverlayEnabled";

export default function DevToolbar() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OVERLAY_TOGGLE_KEY);
      if (raw === null) {
        setEnabled(true);
      } else {
        setEnabled(raw === "1");
      }
    } catch {}
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(OVERLAY_TOGGLE_KEY, next ? "1" : "0");
      // Notify listeners (e.g., GameCanvas) to react immediately
      window.dispatchEvent(
        new CustomEvent("idleGame:overlayToggle", { detail: { enabled: next } })
      );
    } catch {}
  };

  return (
    <div className="dev-toolbar" role="region" aria-label="Developer Toolbar">
      <a
        className="dev-link"
        href="/sprite-gen"
        target="_blank"
        rel="noreferrer"
      >
        Sprite Generator
      </a>
      <button
        className="dev-toggle"
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
      >
        Offline Popup: {enabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}
