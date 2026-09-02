import { useEffect, useRef } from 'react'

/**
 * The hero field: thin-film interference, computed rather than faked.
 *
 * Iridium is named for Iris; iridescence is what a thin film does to white light. When light
 * reflects off both surfaces of a film a few hundred nanometres thick, the two reflections
 * travel different distances, arrive out of phase, and cancel or reinforce *per wavelength* --
 * so the colour you see is a function of thickness and viewing angle. That is the closed form
 * in `filmReflectance` below, evaluated at three wavelengths for R, G and B.
 *
 * This is why the site's accent is a hue that shifts at constant lightness, and why this is a
 * shader and not a PNG: the field is a continuous function of thickness, and thickness varies
 * smoothly across the surface and slowly in time. There is no geometry -- one triangle, one
 * fragment program. Everything else on this site is drawn with canvas 2D, because for forty
 * nodes and sixty edges canvas is the correct tool and WebGL would be a costume.
 *
 * Rendered at a hard-capped DPR, paused whenever it leaves the viewport, and reduced to a
 * single static frame when the visitor asks for less motion.
 */

const VERT = /* glsl */ `#version 300 es
// A single oversized triangle covering the clip volume. Cheaper than a quad: no shared
// edge for the rasteriser to process twice, and no vertex buffer at all -- positions are
// derived from gl_VertexID.
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_tint;    // palette hue, resolved from CSS so the shader stays in-system
uniform float u_amp;     // master amplitude; 0 would be a flat ink field

out vec4 outColour;

const float PI = 3.14159265359;

// --- value noise ----------------------------------------------------------------------
float hash(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  // Quintic fade: C2-continuous, so the field has no visible cell seams under magnification.
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

// Three octaves, not four. The fourth contributes detail at a spatial frequency this
// field never shows -- it is blurred by the radial falloff and the screen blend before a
// viewer could resolve it -- while costing a full extra noise evaluation per pixel.
float fbm(vec2 p) {
  float sum = 0.0, amp = 0.5;
  // Rotating between octaves breaks up the axis-aligned grid artefacts of value noise.
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    sum += amp * noise(p);
    p = rot * p * 2.03;
    amp *= 0.5;
  }
  return sum;
}

// --- thin-film interference -------------------------------------------------------------
// Two-beam interference for a film of thickness d (nm) and refractive index n, viewed at
// angle with cosine cosT, evaluated at wavelength lambda (nm). The optical path difference
// is 2*n*d*cosT; dividing by lambda and scaling to radians gives the phase, and the
// reflected intensity goes as sin^2(phase/2).
float filmReflectance(float lambda, float d, float cosT, float n) {
  float phase = 4.0 * PI * n * d * cosT / lambda;
  return 0.5 - 0.5 * cos(phase);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;

  // Film thickness: a slow, warped field. The domain warp (feeding noise into noise) is
  // what gives the oil-slick look rather than uniform blobs.
  vec2 warp = vec2(fbm(uv * 1.6 + u_time * 0.021),
                   fbm(uv * 1.6 - u_time * 0.017 + 4.7));
  float t = fbm(uv * 2.1 + warp * 1.35 + u_time * 0.013);

  float thickness = 260.0 + 430.0 * t; // nm, the visible-interference band

  // Viewing angle across the surface. Analytic rather than another fbm: a fourth noise
  // field here was a third of the shader's cost and is indistinguishable from a smooth
  // radial ramp once the interference term is applied on top of it.
  float cosT = 0.72 + 0.28 * (1.0 - min(1.0, dot(uv, uv)));

  // Sampled at roughly the peak sensitivities of the three cone types.
  vec3 film = vec3(
    filmReflectance(612.0, thickness, cosT, 1.42),
    filmReflectance(549.0, thickness, cosT, 1.42),
    filmReflectance(462.0, thickness, cosT, 1.42)
  );

  // Pull the full spectrum most of the way toward the section's accent hue. Left raw this
  // reads as a rainbow, which belongs to a different website.
  float luma = dot(film, vec3(0.2126, 0.7152, 0.0722));
  vec3 col = mix(film, u_tint * (0.45 + 0.75 * luma), 0.74);

  // Concentrate the effect away from the centre, where the name sits and needs a calm ground.
  float radial = smoothstep(0.05, 1.25, length(uv * vec2(0.72, 1.0)));
  col *= u_amp * (0.10 + 0.90 * radial);

  // A little dither. Dark gradients band badly on 8-bit displays; a fraction of a code
  // value of noise costs nothing and removes the contouring entirely.
  float grain = (hash(gl_FragCoord.xy + fract(u_time) * 137.0) - 0.5) * (1.5 / 255.0);

  outColour = vec4(col + grain, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Not thrown: a broken shader must degrade to the CSS fallback, never to a blank page.
    console.warn('[iridescence] shader failed to compile\n', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/** Reads the live value of a CSS custom property and resolves it to linear-ish RGB in 0..1. */
function readTint(el: Element): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue('--iri').trim()
  if (!raw) return [0.62, 0.77, 0.91]

  // getComputedStyle serialises colours to rgb()/oklch() depending on the engine; a canvas
  // does the conversion for us without shipping a colour-space library.
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return [0.62, 0.77, 0.91]
  probe.fillStyle = '#000'
  probe.fillStyle = raw
  const hex = probe.fillStyle as string
  if (!hex.startsWith('#') || hex.length < 7) return [0.62, 0.77, 0.91]
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ]
}

type Props = {
  /** When true the field paints exactly one frame and stops. */
  still: boolean
  /** Set false while the hero is offscreen so the rAF loop stops entirely. */
  active: boolean
}

export default function IridescenceField({ still, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const runningRef = useRef(active)
  runningRef.current = active

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false, // nothing here has an edge to alias
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      /**
       * In production, refuse a software-rasterised context: this field is decorative and
       * SwiftShader would burn a phone's battery to draw a texture nobody asked for. In dev
       * the opposite is true -- headless browsers only ever have SwiftShader, and the
       * shader has to be inspectable.
       */
      failIfMajorPerformanceCaveat: !import.meta.env.DEV,
    })
    if (!gl) return // CSS fallback stays visible

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[iridescence] link failed\n', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uTint = gl.getUniformLocation(program, 'u_tint')
    const uAmp = gl.getUniformLocation(program, 'u_amp')

    gl.uniform3fv(uTint, readTint(canvas))
    /* Tuned against the ink ground under a screen blend, where the shader output is
       essentially the final pixel. Above ~0.2 the field stops being a sheen on metal and
       starts being a grey wash over the type. */
    gl.uniform1f(uAmp, 0.17)

    /**
     * Render below CSS resolution and let the compositor scale the result up.
     *
     * Fragment cost is quadratic in the buffer size, and this field has no edges, no text
     * and no high-frequency detail -- it is a smooth low-contrast gradient. Drawing it at
     * 0.6x (0.45x on touch devices, which are the ones that can least afford it) and
     * letting bilinear upscaling do the rest is visually indistinguishable and cuts the
     * per-frame work by roughly three to five times.
     */
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (coarse ? 0.45 : 0.6)

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale))
      const h = Math.max(1, Math.round(canvas.clientHeight * scale))
      if (canvas.width === w && canvas.height === h) return
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const draw = (tSeconds: number) => {
      gl.uniform1f(uTime, tSeconds)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    let raf = 0
    const start = performance.now()

    if (still) {
      // One frame, at a fixed offset that happens to compose well behind the type.
      draw(18)
    } else {
      /**
       * ~20fps, not 60.
       *
       * The field advances at 0.013 to 0.021 units of noise per second -- it takes the best
       * part of a minute to visibly change. Painting it 60 times a second spends three
       * frames' worth of GPU on every frame a viewer could distinguish, and on a phone that
       * is battery and thermal headroom given away for nothing.
       */
      const MIN_FRAME_MS = 50
      let last = -Infinity
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        if (!runningRef.current) return
        if (now - last < MIN_FRAME_MS) return
        last = now
        draw((now - start) / 1000)
      }
      raf = requestAnimationFrame(loop)
    }

    // WebGL contexts are a finite resource; a lost context must not leave a frozen frame.
    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      canvas.style.opacity = '0'
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      /**
       * Deliberately NOT calling WEBGL_lose_context.loseContext() here.
       *
       * getContext() is idempotent per canvas: once a context is force-lost, a later
       * getContext('webgl2') on the same element returns that same dead context rather
       * than a fresh one. It is non-null, so every guard below it passes, and then every
       * compileShader fails with a null info log. React StrictMode's mount/unmount/remount
       * triggers exactly that in development, and any future remount would in production.
       * The context is released with the canvas when the element is collected.
       */
    }
  }, [still])

  return <canvas ref={canvasRef} className="field" aria-hidden="true" />
}
