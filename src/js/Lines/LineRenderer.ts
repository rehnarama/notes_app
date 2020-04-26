import * as twgl from "twgl.js";
import { AttributeData } from "../Pen/Pen";

export type Color = [number, number, number, number];

const vsSource = `
precision mediump float;

attribute vec4 a_position;
attribute vec4 a_color;

varying vec4 v_color;

uniform vec2 u_resolution; 
uniform float u_scale;
uniform float u_zoom;
uniform vec2 u_position;

void main() {
  vec4 coord_position = -1.0 + 2.0 * vec4(u_scale * (u_zoom * a_position.xy + u_position) / u_resolution.xy, 0, 1.0);
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
  public position = { x: 0, y: 0 };
  public zoom: number = 1;

  public width: number = 0;
  public height: number = 0;

  private indexBuffer: WebGLBuffer | null = null;
  private vertexBuffer: WebGLBuffer | null = null;

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

    this.vertexBuffer = this.gl.createBuffer();
    const positionLocation = this.gl.getAttribLocation(
      this.programInfo.program,
      "a_position"
    );
    const colorLocation = this.gl.getAttribLocation(
      this.programInfo.program,
      "a_color"
    );
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      4 * 6,
      0
    );
    this.gl.vertexAttribPointer(
      colorLocation,
      4,
      this.gl.FLOAT,
      false,
      4 * 6,
      4 * 2
    );

    this.indexBuffer = this.gl.createBuffer();

    this.updateSize();
  }

  public setZoom(zoom: number, around: { x: number; y: number }) {
    let zoomDelta = zoom - this.zoom;
    const oldZoom = this.zoom;

    if (oldZoom + zoomDelta < 0.1) {
      zoomDelta = 0.1 - oldZoom;
    }

    const deltaX = around.x - this.position.x / this.zoom;
    this.position.x -= deltaX * zoomDelta;

    const deltaY = around.y - this.position.y / this.zoom;
    this.position.y -= deltaY * zoomDelta;

    this.zoom += zoomDelta;
  }

  public updateSize() {
    if (this.gl.canvas === null) {
      return;
    }

    this.width = this.targetElement.offsetWidth;
    this.height = this.targetElement.offsetHeight;

    const scaleFactor = window.devicePixelRatio;
    const width = (this.gl.canvas.width = this.width * scaleFactor);
    const height = (this.gl.canvas.height = this.height * scaleFactor);

    if ("style" in this.gl.canvas) {
      this.gl.canvas.style.width = this.targetElement.offsetWidth + "px";
      this.gl.canvas.style.height = this.targetElement.offsetHeight + "px";
    }

    this.gl.viewport(0, 0, width, height);
    if (this.programInfo) {
      twgl.setUniforms(this.programInfo, {
        u_resolution: [width, height],
        u_scale: scaleFactor
      });
    }
  }

  public clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  public draw(data: AttributeData) {
    if (this.gl === null || this.programInfo === null) {
      return;
    }
    if (data.vertices.length == 0) {
      return;
    }

    this.clear();

    this.gl.useProgram(this.programInfo.program);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(data.vertices),
      this.gl.STREAM_DRAW
    );

    twgl.setUniforms(this.programInfo, {
      u_position: [this.position.x, this.position.y],
      u_zoom: this.zoom
    });

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, data.vertices.length / 6);
  }
}
