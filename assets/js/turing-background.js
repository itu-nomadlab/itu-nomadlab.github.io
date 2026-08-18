/**
 * Low-resolution WebGL Turing-pattern background for NomadLab.
 *
 * The field is procedural (noise feedback + band thresholding), which produces
 * reaction-diffusion-like structures without shipping images or running a costly
 * full simulation. A compact Canvas 2D renderer is used when WebGL is unavailable.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const canvas = document.getElementById("nomad-turing-canvas");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = false;
  let pageVisible = !document.hidden;
  let animationFrame = 0;
  let resizeTimer = 0;
  let lastFrameTime = 0;
  let startTime = performance.now();
  let seed = Math.random() * 37 + 1;
  let renderer = null;

  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_seed;
    uniform vec3 u_background;
    uniform vec3 u_ink;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32 + u_seed);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);

      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));

      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.52;
      mat2 turn = mat2(0.80, 0.60, -0.60, 0.80);
      for (int octave = 0; octave < 5; octave++) {
        value += amplitude * noise(p);
        p = turn * p * 2.03 + 13.17;
        amplitude *= 0.49;
      }
      return value;
    }

    void main() {
      vec2 centered = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
      vec2 p = centered * 5.4;
      float t = u_time * 0.075;

      float activator = fbm(p * 0.72 + vec2(t, -t * 0.67) + u_seed * 0.11);
      float inhibitor = fbm(
        p * 1.13
        + vec2(activator * 2.35, -activator * 1.72)
        + vec2(-t * 0.31, t * 0.43)
      );
      float feedback = fbm(p * 1.78 + vec2(inhibitor, -activator) + u_seed * 0.23);

      float reaction = sin(
        activator * 10.0
        + inhibitor * 6.1
        + feedback * 2.4
        + sin(p.x * 0.48 - p.y * 0.31)
      );

      float bands = 1.0 - smoothstep(0.20, 0.42, abs(reaction));
      float cells = smoothstep(0.67, 0.79, inhibitor + feedback * 0.16);
      float fine = 1.0 - smoothstep(0.10, 0.24, abs(sin(feedback * 17.0)));
      float mask = clamp(bands * 0.76 + cells * 0.18 + fine * 0.06, 0.0, 1.0);

      float edgeFade = smoothstep(1.24, 0.38, length(centered));
      mask *= mix(0.72, 1.0, edgeFade);

      vec3 color = mix(u_background, u_ink, mask * 0.82);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const parseColor = (value, fallback) => {
    const input = (value || "").trim();
    const fallbackValue = fallback.map((channel) => channel / 255);

    if (/^#[0-9a-f]{6}$/i.test(input)) {
      return [
        parseInt(input.slice(1, 3), 16) / 255,
        parseInt(input.slice(3, 5), 16) / 255,
        parseInt(input.slice(5, 7), 16) / 255,
      ];
    }

    const rgb = input.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
    if (rgb) return rgb.slice(1, 4).map((channel) => Number(channel) / 255);
    return fallbackValue;
  };

  const readPalette = () => {
    const styles = getComputedStyle(root);
    return {
      background: parseColor(styles.getPropertyValue("--nomad-bg"), [239, 106, 71]),
      ink: parseColor(styles.getPropertyValue("--nomad-ink"), [17, 19, 24]),
    };
  };

  const targetSize = () => {
    const step = window.innerWidth < 600 ? 7 : window.innerWidth < 1200 ? 5 : 4;
    const scale = Math.min(window.devicePixelRatio || 1, 1.35);
    return {
      width: Math.max(2, Math.floor((window.innerWidth / step) * scale)),
      height: Math.max(2, Math.floor((window.innerHeight / step) * scale)),
    };
  };

  const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "Unknown shader compile error";
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  };

  const createWebGLRenderer = () => {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) return null;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) || "Unknown shader link error";
      gl.deleteProgram(program);
      throw new Error(message);
    }

    const position = gl.getAttribLocation(program, "a_position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      seed: gl.getUniformLocation(program, "u_seed"),
      background: gl.getUniformLocation(program, "u_background"),
      ink: gl.getUniformLocation(program, "u_ink"),
    };

    const resize = () => {
      const size = targetSize();
      if (canvas.width !== size.width || canvas.height !== size.height) {
        canvas.width = size.width;
        canvas.height = size.height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (seconds) => {
      const palette = readPalette();
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, seconds);
      gl.uniform1f(uniforms.seed, seed);
      gl.uniform3fv(uniforms.background, palette.background);
      gl.uniform3fv(uniforms.ink, palette.ink);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    return { type: "webgl", resize, draw };
  };

  const createCanvas2DRenderer = () => {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return null;
    context.imageSmoothingEnabled = false;

    const resize = () => {
      const size = targetSize();
      if (canvas.width !== size.width || canvas.height !== size.height) {
        canvas.width = size.width;
        canvas.height = size.height;
      }
    };

    const draw = (seconds) => {
      const { background, ink } = readPalette();
      const bg = background.map((channel) => Math.round(channel * 255));
      const fg = ink.map((channel) => Math.round(channel * 255));
      const width = canvas.width;
      const height = canvas.height;
      const image = context.createImageData(width, height);
      const data = image.data;
      const t = seconds * 0.34;

      for (let y = 0; y < height; y += 1) {
        const ny = (y / height - 0.5) * 7.2;
        for (let x = 0; x < width; x += 1) {
          const nx = (x / height - width / height / 2) * 7.2;
          const waveA = Math.sin(nx * 1.7 + Math.sin(ny * 1.2 - t) * 2.3 + t);
          const waveB = Math.cos(ny * 1.9 + Math.sin(nx * 0.9 + t * 0.7) * 2.1 - t * 0.55);
          const reaction = Math.sin((waveA + waveB) * 4.1 + Math.sin((nx - ny) * 0.75 + seed));
          const mask = Math.abs(reaction) < 0.34 ? 0.78 : 0;
          const index = (y * width + x) * 4;
          data[index] = Math.round(bg[0] + (fg[0] - bg[0]) * mask);
          data[index + 1] = Math.round(bg[1] + (fg[1] - bg[1]) * mask);
          data[index + 2] = Math.round(bg[2] + (fg[2] - bg[2]) * mask);
          data[index + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);
    };

    return { type: "2d", resize, draw };
  };

  const initializeRenderer = () => {
    try {
      renderer = createWebGLRenderer();
    } catch (_error) {
      renderer = null;
    }

    if (!renderer) renderer = createCanvas2DRenderer();

    if (!renderer) {
      root.dataset.nomadRenderer = "fallback";
      return false;
    }

    root.dataset.nomadRenderer = renderer.type;
    renderer.resize();
    return true;
  };

  const renderOnce = (timestamp = performance.now()) => {
    if (!renderer && !initializeRenderer()) return;
    renderer.resize();
    const seconds = reducedMotion.matches ? seed * 0.1 : (timestamp - startTime) / 1000;
    renderer.draw(seconds);
  };

  const frame = (timestamp) => {
    animationFrame = 0;
    if (!active || !pageVisible || !renderer) return;

    // The intentionally low-resolution field does not need display-refresh-rate
    // updates. Throttling is especially important for the trigonometric 2D fallback.
    const frameInterval = renderer.type === "2d" ? 1000 / 18 : 1000 / 30;
    if (timestamp - lastFrameTime >= frameInterval) {
      renderOnce(timestamp);
      lastFrameTime = timestamp;
    }

    if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(frame);
  };

  const start = (reseed = false) => {
    active = true;
    if (reseed) seed = Math.random() * 37 + 1;
    startTime = performance.now() - seed * 110;
    lastFrameTime = 0;
    if (!renderer && !initializeRenderer()) return;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    renderOnce();
    if (!reducedMotion.matches && pageVisible) animationFrame = window.requestAnimationFrame(frame);
  };

  const stop = () => {
    active = false;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const handleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!renderer) return;
      renderer.resize();
      if (active) renderOnce();
    }, 100);
  };

  window.addEventListener("nomad:modechange", (event) => {
    if (event.detail?.enabled) start(true);
    else stop();
  });

  window.addEventListener("nomad:palettechange", () => {
    if (active) renderOnce();
  });

  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("orientationchange", handleResize, { passive: true });

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (!active) return;
    if (pageVisible) start(false);
    else if (animationFrame) window.cancelAnimationFrame(animationFrame);
  });

  reducedMotion.addEventListener?.("change", () => {
    if (!active) return;
    start(false);
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    renderer = createCanvas2DRenderer();
    if (renderer) {
      root.dataset.nomadRenderer = "2d";
      start(false);
    } else {
      root.dataset.nomadRenderer = "fallback";
    }
  });

  if (root.dataset.nomadMode === "on") start(false);
})();
