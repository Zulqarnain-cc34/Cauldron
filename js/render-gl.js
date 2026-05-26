import { DISPLAY_SCALE } from './world.js';
import { fillWorldPixelBuffer, simTextureSize } from './pixel-buffer.js';

const VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision mediump float;
uniform sampler2D u_tex;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  fragColor = texture(u_tex, v_uv);
}`;

function compileShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
  }
  return sh;
}

function linkProgram(gl, vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'program link failed');
  }
  return prog;
}

/**
 * WebGL2 renderer — uploads sim RGBA texture and draws a scaled fullscreen quad.
 * @param {HTMLCanvasElement} canvas display-sized canvas (DISPLAY_SCALE applied)
 */
export function createWebGLRenderer(canvas) {
  const gl =
    canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    }) ?? null;

  if (!gl) {
    throw new Error('WebGL2 is not available in this browser');
  }

  const vs = compileShader(gl, gl.VERTEX_SHADER, VS);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS);
  const program = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const uTex = gl.getUniformLocation(program, 'u_tex');
  const aPos = gl.getAttribLocation(program, 'a_pos');

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  /** @type {Uint8Array | null} */
  let pixels = null;
  let texW = 0;
  let texH = 0;

  gl.useProgram(program);
  gl.uniform1i(uTex, 0);

  return {
    /** @param {import('./world.js').World} world */
    render(world) {
      const { width: tw, height: th } = simTextureSize(world);
      const displayW = Math.round(tw * DISPLAY_SCALE);
      const displayH = Math.round(th * DISPLAY_SCALE);

      if (canvas.width !== displayW || canvas.height !== displayH) {
        canvas.width = displayW;
        canvas.height = displayH;
      }

      const byteLen = tw * th * 4;
      if (!pixels || pixels.length !== byteLen) {
        pixels = new Uint8Array(byteLen);
        texW = tw;
        texH = th;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      } else if (texW !== tw || texH !== th) {
        texW = tw;
        texH = th;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }

      fillWorldPixelBuffer(world, pixels, tw, th);

      gl.viewport(0, 0, displayW, displayH);
      gl.clearColor(0.07, 0.07, 0.09, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, tw, th, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

/** @param {ReturnType<createWebGLRenderer>} renderer @param {import('./world.js').World} world */
export function renderWorld(renderer, world) {
  renderer.render(world);
}
