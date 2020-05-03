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
    this.glApp.requestFrame();
  }
  public get position() {
    return this._position;
  }
  public _zoom: number = 1;
  public set zoom(value: number) {
    this._zoom = value;
    this.glApp.requestFrame();
  }
  public get zoom() {
    return this._zoom;
  }

  private vertexBuffer: WebGLBuffer | null = null;
  private data: AttributeData | null = null;

  private programInfo: twgl.ProgramInfo | null = null;
  private uniformLocations = {
    position: 0,
    color: 0
  };

  constructor(glApp: GLApp) {
    this._glApp = glApp;
    this.gl = this._glApp.gl;
    this.initProgram();

    this.updateSize();
    this.glApp.onDimensionChange.add(this.updateSize);
    this.glApp.onScaleChange.add(this.updateSize);

    this.glApp.onDraw.add(this.draw);
  }

  private updateSize = () => {
    if (this.programInfo) {
      this.gl.useProgram(this.programInfo.program);
      twgl.setUniforms(this.programInfo, {
        u_resolution: [
          this.glApp.width * this.glApp.actualScale,
          this.glApp.height * this.glApp.actualScale
        ],
        u_scale: this.glApp.actualScale
      });
    }
  };

  private initProgram = () => {
    this.programInfo = twgl.createProgramInfo(this.gl, [vsSource, fsSource]);
    this.gl.useProgram(this.programInfo.program);

    this.uniformLocations.position = this.gl.getAttribLocation(
      this.programInfo.program,
      "a_position"
    );
    this.uniformLocations.color = this.gl.getAttribLocation(
      this.programInfo.program,
      "a_color"
    );

    this.vertexBuffer = this.gl.createBuffer();
  };

  private bindBuffers() {
    if (this.programInfo) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

      this.gl.enableVertexAttribArray(this.uniformLocations.position);
      this.gl.enableVertexAttribArray(this.uniformLocations.color);

      this.gl.vertexAttribPointer(
        this.uniformLocations.position,
        2,
        this.gl.FLOAT,
        false,
        4 * 6,
        0
      );
      this.gl.vertexAttribPointer(
        this.uniformLocations.color,
        4,
        this.gl.FLOAT,
        false,
        4 * 6,
        4 * 2
      );
    }
  }

  public setZoom = (zoom: number, around: { x: number; y: number }) => {
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
  };

  public loadData = (data: AttributeData) => {
    this.data = data;
    this.glApp.requestFrame();
  };

  public draw = () => {
    if (this.gl === null || this.programInfo === null || this.data === null) {
      return;
    }

    this.gl.useProgram(this.programInfo.program);
    this.bindBuffers();

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.data.vertices),
      this.gl.STREAM_DRAW
    );
    const trianglesToDraw = this.data.vertices.length / 6;

    twgl.setUniforms(this.programInfo, {
      u_position: [this.position.x, this.position.y],
      u_zoom: this.zoom
    });

    this.gl.drawArrays(this.gl.TRIANGLES, 0, trianglesToDraw);
  };
}
