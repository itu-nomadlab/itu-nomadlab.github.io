/**
 * NomadLab mode controller.
 *
 * Keeps the experimental visual mode and palette in localStorage, updates
 * accessible controls, and broadcasts state changes to the background renderer.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const MODE_KEY = "nomad-mode";
  const PALETTE_KEY = "nomad-palette";
  const PALETTES = ["ember", "signal", "matrix", "polar", "orchid", "chalk"];
  const THEME_COLORS = {
    ember: "#ef6a47",
    signal: "#f0d84a",
    matrix: "#121713",
    polar: "#101a33",
    orchid: "#4b1c55",
    chalk: "#eee8dd",
  };

  const safeStorage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (_error) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (_error) {
        // The experience still works when storage is blocked.
      }
    },
  };

  const normalizePalette = (value) => (PALETTES.includes(value) ? value : "ember");

  const chooseDifferentPalette = (current) => {
    const alternatives = PALETTES.filter((name) => name !== current);
    return alternatives[Math.floor(Math.random() * alternatives.length)] || "ember";
  };

  const emit = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const updateThemeColor = (palette, enabled) => {
    const meta = document.getElementById("nomad-theme-color");
    if (!meta) return;

    if (enabled) {
      meta.setAttribute("content", THEME_COLORS[palette] || THEME_COLORS.ember);
      return;
    }

    const computed = getComputedStyle(root).getPropertyValue("--global-bg-color").trim();
    meta.setAttribute("content", computed || "#fff8ef");
  };

  const updateControls = (enabled, palette) => {
    const button = document.getElementById("nomad-mode-toggle");
    if (!button) return;

    const label = button.querySelector(".nomad-mode-toggle__label");
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute(
      "title",
      enabled ? `Exit Nomad Mode — palette: ${palette}` : "Enter Nomad Mode",
    );
    if (label) label.textContent = enabled ? "Exit Nomad Mode" : "Nomad Mode";
  };

  const setPalette = (palette, persist = true) => {
    const normalized = normalizePalette(palette);
    root.dataset.nomadPalette = normalized;
    if (persist) safeStorage.set(PALETTE_KEY, normalized);
    emit("nomad:palettechange", { palette: normalized });
    return normalized;
  };

  const setMode = (enabled, options = {}) => {
    const { persist = true, rotatePalette = false } = options;
    let palette = normalizePalette(root.dataset.nomadPalette || safeStorage.get(PALETTE_KEY));

    if (enabled && rotatePalette) {
      palette = chooseDifferentPalette(palette);
      setPalette(palette, persist);
    } else {
      setPalette(palette, persist);
    }

    root.dataset.nomadMode = enabled ? "on" : "off";
    if (persist) safeStorage.set(MODE_KEY, enabled ? "on" : "off");

    if (enabled) {
      root.classList.remove("nomad-mode-entering");
      // Force a reflow so the short stepped transition also runs on re-entry.
      void root.offsetWidth;
      root.classList.add("nomad-mode-entering");
      window.setTimeout(() => root.classList.remove("nomad-mode-entering"), 520);
    } else {
      root.classList.remove("nomad-mode-entering");
    }

    updateControls(enabled, palette);
    updateThemeColor(palette, enabled);
    emit("nomad:modechange", { enabled, palette });
  };

  const initialize = () => {
    const storedPalette = normalizePalette(safeStorage.get(PALETTE_KEY) || root.dataset.nomadPalette);
    const enabled = (safeStorage.get(MODE_KEY) || root.dataset.nomadMode) === "on";

    setPalette(storedPalette, false);
    setMode(enabled, { persist: false, rotatePalette: false });

    const button = document.getElementById("nomad-mode-toggle");
    if (button) {
      button.addEventListener("click", (event) => {
        const enabled = root.dataset.nomadMode === "on";

        // Shift-click keeps the mode open and changes only the two-color palette.
        if (enabled && event.shiftKey) {
          const palette = setPalette(chooseDifferentPalette(root.dataset.nomadPalette), true);
          updateControls(true, palette);
          updateThemeColor(palette, true);
          return;
        }

        const willEnable = !enabled;
        // Every entry into Nomad Mode starts with a fresh two-color palette.
        setMode(willEnable, { persist: true, rotatePalette: willEnable });
      });
    }

    // Keyboard shortcuts work only when the user is not typing in a field.
    window.addEventListener("keydown", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
      if (event.ctrlKey || event.metaKey) return;

      const key = event.key.toLowerCase();
      if (event.altKey && key === "n") {
        event.preventDefault();
        const willEnable = root.dataset.nomadMode !== "on";
        setMode(willEnable, { persist: true, rotatePalette: willEnable });
      }

      if (event.altKey && key === "p" && root.dataset.nomadMode === "on") {
        event.preventDefault();
        const palette = setPalette(chooseDifferentPalette(root.dataset.nomadPalette), true);
        updateControls(true, palette);
        updateThemeColor(palette, true);
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key === MODE_KEY) {
        setMode(event.newValue === "on", { persist: false, rotatePalette: false });
      }
      if (event.key === PALETTE_KEY) {
        const palette = setPalette(event.newValue, false);
        updateControls(root.dataset.nomadMode === "on", palette);
        updateThemeColor(palette, root.dataset.nomadMode === "on");
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
