/**
 * NomadLab two-tone pixel portraits.
 *
 * Keeps the original portrait in normal mode, then renders a deliberately
 * low-resolution, two-colour canvas for Nomad Mode. The colours always come
 * from the active --nomad-bg / --nomad-ink palette.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const PORTRAIT_SELECTOR = "[data-nomad-portrait]";
  const SOURCE_SELECTOR = ".nomad-portrait__source";
  const CANVAS_SELECTOR = ".nomad-portrait__canvas";
  const READY_CLASS = "nomad-portrait--ready";

  const DEFAULT_PIXEL_COLUMNS = 200;
  const DEFAULT_DITHER_STRENGTH = 6;

  // Ordered dithering. The result still contains exactly two palette colours.
  const BAYER_4X4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  const renderFrames = new WeakMap();
  const resizeObservers = new WeakMap();
  let renderAllFrame = 0;
  let fallbackResizeTimer = 0;

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = 1;
  colorCanvas.height = 1;
  const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const numericDataValue = (element, key, fallback, minimum, maximum) => {
    const parsed = Number.parseFloat(element.dataset[key]);
    return Number.isFinite(parsed) ? clamp(parsed, minimum, maximum) : fallback;
  };

  const cssColorToRgb = (value, fallback) => {
    if (!colorContext) return fallback;

    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = `rgb(${fallback[0]}, ${fallback[1]}, ${fallback[2]})`;
    colorContext.fillStyle = value;
    colorContext.fillRect(0, 0, 1, 1);

    const pixel = colorContext.getImageData(0, 0, 1, 1).data;
    return [pixel[0], pixel[1], pixel[2]];
  };

  const luminance = ([red, green, blue]) => 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  const activePalette = () => {
    const styles = getComputedStyle(root);
    const background = cssColorToRgb(styles.getPropertyValue("--nomad-bg").trim(), [239, 106, 71]);
    const ink = cssColorToRgb(styles.getPropertyValue("--nomad-ink").trim(), [17, 19, 24]);

    // Map dark parts of the face to the physically darker palette colour.
    // This keeps portraits readable even in palettes such as Matrix or Polar,
    // where --nomad-ink is lighter than --nomad-bg.
    return luminance(background) <= luminance(ink)
      ? { shadow: background, highlight: ink }
      : { shadow: ink, highlight: background };
  };

  const positionComponent = (token, axis) => {
    const normalized = String(token || "").toLowerCase();
    const keywordValues = axis === "x"
      ? { left: 0, center: 0.5, right: 1 }
      : { top: 0, center: 0.5, bottom: 1 };

    if (Object.prototype.hasOwnProperty.call(keywordValues, normalized)) {
      return keywordValues[normalized];
    }

    if (normalized.endsWith("%")) {
      const percentage = Number.parseFloat(normalized);
      return Number.isFinite(percentage) ? clamp(percentage / 100, 0, 1) : 0.5;
    }

    return 0.5;
  };

  const readObjectPosition = (image) => {
    const tokens = getComputedStyle(image).objectPosition.trim().split(/\s+/).filter(Boolean);

    if (tokens.length === 1) {
      if (["top", "bottom"].includes(tokens[0].toLowerCase())) {
        return { x: 0.5, y: positionComponent(tokens[0], "y") };
      }
      return { x: positionComponent(tokens[0], "x"), y: 0.5 };
    }

    return {
      x: positionComponent(tokens[0], "x"),
      y: positionComponent(tokens[1], "y"),
    };
  };

  const drawImageCover = (context, image, width, height) => {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawnWidth = sourceWidth * scale;
    const drawnHeight = sourceHeight * scale;
    const position = readObjectPosition(image);
    const offsetX = (width - drawnWidth) * position.x;
    const offsetY = (height - drawnHeight) * position.y;

    context.drawImage(image, offsetX, offsetY, drawnWidth, drawnHeight);
  };

  const otsuThreshold = (values) => {
    if (!values.length) return 127;

    const histogram = new Uint32Array(256);
    let total = 0;

    values.forEach((value) => {
      histogram[value] += 1;
      total += value;
    });

    let backgroundWeight = 0;
    let backgroundSum = 0;
    let maximumVariance = -1;
    let threshold = 127;

    for (let level = 0; level < 256; level += 1) {
      backgroundWeight += histogram[level];
      if (backgroundWeight === 0) continue;

      const foregroundWeight = values.length - backgroundWeight;
      if (foregroundWeight === 0) break;

      backgroundSum += level * histogram[level];
      const backgroundMean = backgroundSum / backgroundWeight;
      const foregroundMean = (total - backgroundSum) / foregroundWeight;
      const meanDifference = backgroundMean - foregroundMean;
      const variance = backgroundWeight * foregroundWeight * meanDifference * meanDifference;

      if (variance > maximumVariance) {
        maximumVariance = variance;
        threshold = level;
      }
    }

    return threshold;
  };

  const renderPortrait = (portrait) => {
    const image = portrait.querySelector(SOURCE_SELECTOR);
    const canvas = portrait.querySelector(CANVAS_SELECTOR);

    if (!(image instanceof HTMLImageElement) || !(canvas instanceof HTMLCanvasElement)) return;
    if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) return;

    const bounds = portrait.getBoundingClientRect();
    const displayedWidth = bounds.width || image.clientWidth || image.naturalWidth;
    const displayedHeight = bounds.height || image.clientHeight || image.naturalHeight;
    if (displayedWidth <= 0 || displayedHeight <= 0) return;

    const columns = Math.round(
      numericDataValue(portrait, "nomadPixelColumns", DEFAULT_PIXEL_COLUMNS, 12, 64),
    );
    const rows = Math.round(clamp(columns * (displayedHeight / displayedWidth), 12, 96));
    const ditherStrength = numericDataValue(
      portrait,
      "nomadDither",
      DEFAULT_DITHER_STRENGTH,
      0,
      64,
    );
    const thresholdShift = numericDataValue(portrait, "nomadThresholdShift", 0, -80, 80);

    canvas.width = columns;
    canvas.height = rows;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.clearRect(0, 0, columns, rows);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    drawImageCover(context, image, columns, rows);

    let imageData;
    try {
      imageData = context.getImageData(0, 0, columns, rows);
    } catch (error) {
      portrait.classList.remove(READY_CLASS);
      console.warn(
        "Nomad portrait could not read image pixels. Keep portraits under assets/img/people/ or configure CORS.",
        image.currentSrc || image.src,
        error,
      );
      return;
    }

    const pixels = imageData.data;
    const pixelCount = columns * rows;
    const luminanceValues = new Uint8Array(pixelCount);
    const visibleLuminance = [];

    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
      const dataIndex = pixelIndex * 4;
      const value = Math.round(
        0.2126 * pixels[dataIndex]
        + 0.7152 * pixels[dataIndex + 1]
        + 0.0722 * pixels[dataIndex + 2],
      );

      luminanceValues[pixelIndex] = value;
      if (pixels[dataIndex + 3] >= 16) visibleLuminance.push(value);
    }

    const threshold = clamp(otsuThreshold(visibleLuminance) + thresholdShift, 0, 255);
    const palette = activePalette();

    for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
      const dataIndex = pixelIndex * 4;
      const alpha = pixels[dataIndex + 3];
      if (alpha < 16) continue;

      const x = pixelIndex % columns;
      const y = Math.floor(pixelIndex / columns);
      const orderedOffset = (BAYER_4X4[y % 4][x % 4] / 15 - 0.5) * ditherStrength;
      const selected = luminanceValues[pixelIndex] + orderedOffset < threshold
        ? palette.shadow
        : palette.highlight;

      pixels[dataIndex] = selected[0];
      pixels[dataIndex + 1] = selected[1];
      pixels[dataIndex + 2] = selected[2];
      pixels[dataIndex + 3] = alpha;
    }

    context.putImageData(imageData, 0, 0);
    canvas.dataset.nomadRenderedPalette = root.dataset.nomadPalette || "ember";
    portrait.classList.add(READY_CLASS);
  };

  const schedulePortrait = (portrait) => {
    const pendingFrame = renderFrames.get(portrait);
    if (pendingFrame) window.cancelAnimationFrame(pendingFrame);

    const frame = window.requestAnimationFrame(() => {
      renderFrames.delete(portrait);
      renderPortrait(portrait);
    });

    renderFrames.set(portrait, frame);
  };

  const renderAll = () => {
    document.querySelectorAll(PORTRAIT_SELECTOR).forEach(schedulePortrait);
  };

  const scheduleAll = () => {
    if (renderAllFrame) window.cancelAnimationFrame(renderAllFrame);
    renderAllFrame = window.requestAnimationFrame(() => {
      renderAllFrame = 0;
      renderAll();
    });
  };

  const initializePortrait = (portrait) => {
    const image = portrait.querySelector(SOURCE_SELECTOR);
    if (!(image instanceof HTMLImageElement)) return;

    const renderWhenReady = () => schedulePortrait(portrait);

    if (image.complete && image.naturalWidth > 0) {
      if (typeof image.decode === "function") {
        image.decode().catch(() => {}).finally(renderWhenReady);
      } else {
        renderWhenReady();
      }
    } else {
      image.addEventListener("load", renderWhenReady, { once: true });
    }

    image.addEventListener("error", () => portrait.classList.remove(READY_CLASS));

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => schedulePortrait(portrait));
      resizeObserver.observe(portrait);
      resizeObservers.set(portrait, resizeObserver);
    }
  };

  const initialize = () => {
    document.querySelectorAll(PORTRAIT_SELECTOR).forEach(initializePortrait);
    scheduleAll();
  };

  // nomad-mode.js broadcasts both events. Re-rendering is scheduled, so the
  // palette event and the mode event collapse into one animation frame.
  window.addEventListener("nomad:palettechange", scheduleAll);
  window.addEventListener("nomad:modechange", (event) => {
    if (event.detail?.enabled) scheduleAll();
  });
  window.addEventListener("pageshow", scheduleAll);

  if (!("ResizeObserver" in window)) {
    window.addEventListener("resize", () => {
      window.clearTimeout(fallbackResizeTimer);
      fallbackResizeTimer = window.setTimeout(scheduleAll, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
