import * as twgl from "twgl.js";
import { AttributeData } from "../Pen/Pen";
import GLApp from "../GLApp";

const MAX_RESOLUTION = 1920;

export type Color = [number, number, number, number];

const vsSource = `
precision highp float;

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
precision highp float;

varying vec4 v_color;

void main(void) {
  gl_FragColor = v_color;
}`;

export default class LineRenderer {
  private gl: WebGLRenderingContext;
  private _glApp: GLApp;
  public get glApp() {
    return this._glApp;
  }

  public _position = { x: 0, y: 0 };
  public set position(value: { x: number; y: number }) {
    this._position = value;
    this.requestFrame();
  }
  public get position() {
    return this._position;
  }
  public _zoom: number = 1;
  public set zoom(value: number) {
    this._zoom = value;
    this.requestFrame();
  }
  public get zoom() {
    return this._zoom;
  }

  private vertexBuffer: WebGLBuffer | null = null;

  private isDirty = false;
  private trianglesToDraw: number = 0;

  private programInfo: twgl.ProgramInfo | null = null;
  constructor(glApp: GLApp) {
    this._glApp = glApp;
    this.gl = this._glApp.gl;
    this.initProgram();

    this.updateSize();
    this.glApp.onDimensionChange.add(this.updateSize);
    this.glApp.onScaleChange.add(this.updateSize);
  }

  private updateSize = () => {
    if (this.programInfo) {
      twgl.setUniforms(this.programInfo, {
        u_resolution: [
          this.glApp.width * this.glApp.actualScale,
          this.glApp.height * this.glApp.actualScale
        ],
        u_scale: this.glApp.actualScale
      });
    }
  };

  private initProgram() {
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

  public clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  private requestFrame() {
    if (this.isDirty) {
      return;
    }

    this.isDirty = true;
    window.requestAnimationFrame(this.onFrame);
  }

  private onFrame = () => {
    this.isDirty = false;
    this.clear();
    this.draw();
  };

  public loadData(data: AttributeData) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(data.vertices),
      this.gl.STREAM_DRAW
    );
    this.trianglesToDraw = data.vertices.length / 6;

    this.requestFrame();
  }

  public draw() {
    if (this.gl === null || this.programInfo === null) {
      return;
    }

    twgl.setUniforms(this.programInfo, {
      u_position: [this.position.x, this.position.y],
      u_zoom: this.zoom
    });

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.trianglesToDraw);
  }
}
