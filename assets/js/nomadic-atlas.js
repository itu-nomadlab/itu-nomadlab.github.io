/**
 * NomadLab brain-eye sentinel.
 *
 * The emblem is entirely inline SVG. JavaScript only adds behavioural layers:
 * the pupil follows nearby pointer movement, the eye blinks, terminal nodes
 * signal in sequence, and Nomad Mode triggers a stepped recalibration.
 */
(() => {
  "use strict";

  const sentinels = Array.from(document.querySelectorAll("[data-nomadic-sentinel]"));
  if (!sentinels.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const BLINK_MIN = 3600;
  const BLINK_MAX = 7600;
  const SIGNAL_INTERVAL = 1420;
  const MAX_GAZE_X = 13;
  const MAX_GAZE_Y = 9;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min));

  const createController = (sentinel) => {
    const gaze = sentinel.querySelector("[data-sentinel-gaze]");
    const terminals = Array.from(sentinel.querySelectorAll(".nomad-sentinel__terminal"));

    let blinkTimer = null;
    let blinkReleaseTimer = null;
    let doubleBlinkTimer = null;
    let signalTimer = null;
    let recalibrationTimer = null;
    let signalIndex = 0;
    let inViewport = true;
    let destroyed = false;

    const setGaze = (x = 0, y = 0) => {
      if (!gaze) return;
      gaze.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    };

    const resetGaze = () => setGaze(0, 0);

    const onPointerMove = (event) => {
      if (reducedMotion.matches || !gaze) return;

      const rect = sentinel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const distance = Math.hypot(normalizedX, normalizedY);
      const damping = distance > 1 ? 1 / distance : 1;

      setGaze(
        clamp(normalizedX * damping * MAX_GAZE_X, -MAX_GAZE_X, MAX_GAZE_X),
        clamp(normalizedY * damping * MAX_GAZE_Y, -MAX_GAZE_Y, MAX_GAZE_Y),
      );
    };

    const clearBlinkTimers = () => {
      window.clearTimeout(blinkTimer);
      window.clearTimeout(blinkReleaseTimer);
      window.clearTimeout(doubleBlinkTimer);
      blinkTimer = null;
      blinkReleaseTimer = null;
      doubleBlinkTimer = null;
    };

    const scheduleBlink = () => {
      window.clearTimeout(blinkTimer);
      if (destroyed || reducedMotion.matches || !inViewport || document.hidden) return;

      blinkTimer = window.setTimeout(() => {
        sentinel.classList.add("is-blinking");
        blinkReleaseTimer = window.setTimeout(() => {
          sentinel.classList.remove("is-blinking");

          // Occasional double blink keeps the symbol from feeling mechanical.
          if (Math.random() > 0.72) {
            doubleBlinkTimer = window.setTimeout(() => {
              sentinel.classList.add("is-blinking");
              blinkReleaseTimer = window.setTimeout(() => {
                sentinel.classList.remove("is-blinking");
                scheduleBlink();
              }, 105);
            }, 145);
          } else {
            scheduleBlink();
          }
        }, 115);
      }, randomBetween(BLINK_MIN, BLINK_MAX));
    };

    const signalNextTerminal = () => {
      if (!terminals.length) return;
      terminals.forEach((terminal) => terminal.classList.remove("is-signaling"));
      terminals[signalIndex % terminals.length].classList.add("is-signaling");
      signalIndex = (signalIndex + 3) % terminals.length;
    };

    const stopSignal = () => {
      if (signalTimer !== null) {
        window.clearInterval(signalTimer);
        signalTimer = null;
      }
    };

    const syncActivity = () => {
      const active = !reducedMotion.matches && inViewport && !document.hidden;

      if (!active) {
        clearBlinkTimers();
        stopSignal();
        sentinel.classList.remove("is-blinking");
        resetGaze();
        return;
      }

      if (blinkTimer === null) scheduleBlink();
      if (signalTimer === null) {
        signalNextTerminal();
        signalTimer = window.setInterval(signalNextTerminal, SIGNAL_INTERVAL);
      }
    };

    const recalibrate = () => {
      window.clearTimeout(recalibrationTimer);
      sentinel.classList.remove("is-recalibrating");
      // Force a layout read so repeated mode changes replay the stepped motion.
      void sentinel.offsetWidth;
      sentinel.classList.add("is-recalibrating");
      recalibrationTimer = window.setTimeout(() => {
        sentinel.classList.remove("is-recalibrating");
      }, 430);
      signalNextTerminal();
    };

    sentinel.addEventListener("pointermove", onPointerMove, { passive: true });
    sentinel.addEventListener("pointerleave", resetGaze);

    let observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          inViewport = entries.some((entry) => entry.isIntersecting);
          syncActivity();
        },
        { rootMargin: "100px", threshold: 0.05 },
      );
      observer.observe(sentinel);
    }

    const onVisibilityChange = () => syncActivity();
    const onModeChange = () => recalibrate();
    const onMotionPreferenceChange = () => syncActivity();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("nomad:modechange", onModeChange);

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", onMotionPreferenceChange);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(onMotionPreferenceChange);
    }

    syncActivity();

    return {
      destroy() {
        destroyed = true;
        clearBlinkTimers();
        stopSignal();
        window.clearTimeout(recalibrationTimer);
        observer?.disconnect();
        sentinel.removeEventListener("pointermove", onPointerMove);
        sentinel.removeEventListener("pointerleave", resetGaze);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("nomad:modechange", onModeChange);

        if (typeof reducedMotion.removeEventListener === "function") {
          reducedMotion.removeEventListener("change", onMotionPreferenceChange);
        } else if (typeof reducedMotion.removeListener === "function") {
          reducedMotion.removeListener(onMotionPreferenceChange);
        }
      },
    };
  };

  sentinels.forEach(createController);
})();
