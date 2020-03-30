import * as twgl from "twgl.js";

export type Color = [number, number, number, number];

const vsSource = `
precision mediump float;

attribute vec4 a_position;
attribute vec4 a_color;

varying vec4 v_color;

uniform vec2 u_resolution; 

void main() {
  vec4 coord_position = -1.0 + 2.0 * vec4(a_position.xy / u_resolution.xy, 0, 1.0);
  gl_Position = vec4(1.0, -1.0, 1.0, 1.0) * coord_position;
  v_color = a_color;
}
  `;
const fsSource = `
precision mediump float;

varying vec4 v_color;

void main(void) {
  gl_FragColor = v_color;
}`;

export default class LineRenderer {
  private targetElement: HTMLElement;
  private gl: WebGLRenderingContext;

  private programInfo: twgl.ProgramInfo | null = null;
  constructor(targetElement: HTMLElement) {
    this.targetElement = targetElement;

    const canvas = document.createElement("canvas");
    this.targetElement.appendChild(canvas);

    this.gl = canvas.getContext("webgl") as WebGLRenderingContext;

    this.initWebGl();
  }

  private initWebGl() {
    // this.createProgram();
    this.programInfo = twgl.createProgramInfo(this.gl, [vsSource, fsSource]);
    this.gl.useProgram(this.programInfo.program);
    this.updateSize();
  }

  public updateSize() {
    if (this.gl.canvas === null) {
      return;
    }

    const scaleFactor = window.devicePixelRatio;
    const width = (this.gl.canvas.width =
      this.targetElement.offsetWidth * scaleFactor);
    const height = (this.gl.canvas.height =
      this.targetElement.offsetHeight * scaleFactor);

    if ("style" in this.gl.canvas) {
      this.gl.canvas.style.width = this.targetElement.offsetWidth + "px";
      this.gl.canvas.style.height = this.targetElement.offsetHeight + "px";
    }

    this.gl.viewport(0, 0, width, height);
    if (this.programInfo) {
      twgl.setUniforms(this.programInfo, {
        u_resolution: [width, height]
      });
    }
  }

  public clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  public draw(vertices: Float32Array, color: Float32Array) {
    if (this.gl === null || this.programInfo === null) {
      return;
    }
    if (vertices.length == 0) {
      return;
    }

    const bufferInfo = twgl.createBufferInfoFromArrays(
      this.gl,
      {
        position: {
          numComponents: 2,
          data: vertices,
          attribName: "a_position"
        },
        color: { data: color, attribName: "a_color" }
      },
      {
        numElements: vertices.length / 2
      }
    );

    this.gl.useProgram(this.programInfo.program);
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, bufferInfo);
    twgl.drawBufferInfo(this.gl, bufferInfo, this.gl.TRIANGLE_STRIP);

    // this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    // this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, vertices.length / 2);
  }
}
