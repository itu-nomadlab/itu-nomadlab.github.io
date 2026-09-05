/**
 * NomadLab Anatolian ibex hero.
 *
 * The artwork itself is inline SVG. JavaScript only controls subtle parallax,
 * network rewiring, node pulses, visibility-aware animation and Nomad Mode
 * recalibration. No image file is loaded by this component.
 */
(() => {
  "use strict";

  const scenes = Array.from(document.querySelectorAll("[data-nomadic-ibex]"));
  if (!scenes.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const PHASE_INTERVAL = 2850;
  const SIGNAL_INTERVAL = 980;
  const PHASE_COUNT = 3;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const createController = (scene) => {
    const svg = scene.querySelector("svg");
    const nodes = Array.from(scene.querySelectorAll(".nomad-ibex__node"));

    let phase = Number(scene.dataset.phase || 0) % PHASE_COUNT;
    let signalIndex = 0;
    let phaseTimer = null;
    let signalTimer = null;
    let shiftTimer = null;
    let shiftReleaseTimer = null;
    let recalibrationTimer = null;
    let inViewport = true;
    let destroyed = false;

    const setProperty = (name, value) => scene.style.setProperty(name, `${value.toFixed(2)}px`);

    const resetParallax = () => {
      [
        "--ibex-sky-x", "--ibex-sky-y",
        "--ibex-far-x", "--ibex-far-y",
        "--ibex-mid-x", "--ibex-mid-y",
        "--ibex-near-x", "--ibex-near-y",
        "--ibex-rock-x", "--ibex-rock-y",
        "--ibex-animal-x", "--ibex-animal-y",
        "--ibex-foreground-x", "--ibex-foreground-y",
      ].forEach((name) => scene.style.setProperty(name, "0px"));
    };

    const onPointerMove = (event) => {
      if (reducedMotion.matches) return;

      const rect = scene.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nx = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
      const ny = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);

      setProperty("--ibex-sky-x", nx * -2.2);
      setProperty("--ibex-sky-y", ny * -1.6);
      setProperty("--ibex-far-x", nx * 1.8);
      setProperty("--ibex-far-y", ny * 1.1);
      setProperty("--ibex-mid-x", nx * 3.2);
      setProperty("--ibex-mid-y", ny * 1.9);
      setProperty("--ibex-near-x", nx * 4.6);
      setProperty("--ibex-near-y", ny * 2.8);
      setProperty("--ibex-rock-x", nx * 5.5);
      setProperty("--ibex-rock-y", ny * 3.2);
      setProperty("--ibex-animal-x", nx * 3.8);
      setProperty("--ibex-animal-y", ny * 2.1);
      setProperty("--ibex-foreground-x", nx * 6.5);
      setProperty("--ibex-foreground-y", ny * 3.8);
    };

    const signalNextNode = () => {
      if (!nodes.length) return;
      nodes.forEach((node) => node.classList.remove("is-signaling"));
      nodes[signalIndex % nodes.length].classList.add("is-signaling");
      signalIndex = (signalIndex + 7) % nodes.length;
    };

    const shiftPhase = () => {
      window.clearTimeout(shiftTimer);
      window.clearTimeout(shiftReleaseTimer);
      scene.classList.add("is-shifting");

      shiftTimer = window.setTimeout(() => {
        phase = (phase + 1) % PHASE_COUNT;
        scene.dataset.phase = String(phase);
        signalNextNode();
      }, 95);

      shiftReleaseTimer = window.setTimeout(() => {
        scene.classList.remove("is-shifting");
      }, 260);
    };

    const startTimers = () => {
      if (phaseTimer === null) phaseTimer = window.setInterval(shiftPhase, PHASE_INTERVAL);
      if (signalTimer === null) {
        signalNextNode();
        signalTimer = window.setInterval(signalNextNode, SIGNAL_INTERVAL);
      }
    };

    const stopTimers = () => {
      if (phaseTimer !== null) window.clearInterval(phaseTimer);
      if (signalTimer !== null) window.clearInterval(signalTimer);
      phaseTimer = null;
      signalTimer = null;
    };

    const setSvgAnimationState = (active) => {
      if (!svg) return;
      try {
        if (active && typeof svg.unpauseAnimations === "function") svg.unpauseAnimations();
        if (!active && typeof svg.pauseAnimations === "function") svg.pauseAnimations();
      } catch (_) {
        // SVG animation control is optional; CSS animations still follow activity.
      }
    };

    const syncActivity = () => {
      const active = !destroyed && !reducedMotion.matches && inViewport && !document.hidden;
      scene.classList.toggle("is-paused", !active);
      setSvgAnimationState(active);

      if (active) {
        startTimers();
      } else {
        stopTimers();
        nodes.forEach((node) => node.classList.remove("is-signaling"));
        resetParallax();
      }
    };

    const recalibrate = () => {
      window.clearTimeout(recalibrationTimer);
      scene.classList.remove("is-recalibrating");
      void scene.offsetWidth;
      scene.classList.add("is-recalibrating");
      shiftPhase();
      recalibrationTimer = window.setTimeout(() => {
        scene.classList.remove("is-recalibrating");
      }, 460);
    };

    scene.addEventListener("pointermove", onPointerMove, { passive: true });
    scene.addEventListener("pointerleave", resetParallax);

    let observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          inViewport = entries.some((entry) => entry.isIntersecting);
          syncActivity();
        },
        { rootMargin: "120px", threshold: 0.04 },
      );
      observer.observe(scene);
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

    scene.dataset.phase = String(phase);
    syncActivity();

    return {
      destroy() {
        destroyed = true;
        stopTimers();
        window.clearTimeout(shiftTimer);
        window.clearTimeout(shiftReleaseTimer);
        window.clearTimeout(recalibrationTimer);
        observer?.disconnect();
        scene.removeEventListener("pointermove", onPointerMove);
        scene.removeEventListener("pointerleave", resetParallax);
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

  scenes.forEach(createController);
})();
