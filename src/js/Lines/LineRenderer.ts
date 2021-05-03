import * as twgl from "twgl.js";
import { AttributeData } from "../Pen/Pen";
import GLApp from "../GLApp";
import GLProgram from "../GLProgram";

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

export default class LineRenderer extends GLProgram {
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

  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private data: AttributeData | null = null;
  private isDirty = false;

  private programInfo: twgl.ProgramInfo | null = null;
  private uniformLocations = {
    position: 0,
    color: 0
  };

  private program: twgl.ProgramInfo;

  constructor(glApp: GLApp) {
    super(glApp);
    this.program = this.initProgram(glApp);
  }

  // constructor(glApp: GLApp) {
  //   this._glApp = glApp;
  //   this.gl = this._glApp.gl;
  //   this.initProgram();

  //   this.updateSize();
  //   this.glApp.onDimensionChange.add(this.updateSize);
  //   this.glApp.onScaleChange.add(this.updateSize);

  //   this.glApp.onDraw.add(this.draw);
  // }

  private updateSize = (app: GLApp) => {
    if (this.programInfo) {
      this.useProgram(this.programInfo);

      twgl.setUniforms(this.programInfo, {
        u_resolution: [
          app.width * app.actualScale,
          app.height * app.actualScale
        ],
        u_scale: this.glApp.actualScale
      });
    }
  };

  public initProgram = (app: GLApp) => {
    this.programInfo = this.createProgramInfo(vsSource, fsSource);

    this.useProgram(this.programInfo);

    this.uniformLocations.position = this.glApp.gl.getAttribLocation(
      this.programInfo.program,
      "a_position"
    );
    this.uniformLocations.color = this.glApp.gl.getAttribLocation(
      this.programInfo.program,
      "a_color"
    );

    this.setupBuffers(app);

    return this.programInfo;
  };

  private setupBuffers(app: GLApp) {
    if (this.programInfo) {
      this.vao = this.glApp.gl.createVertexArray();

      app.gl.bindVertexArray(this.vao);

      this.vbo = this.glApp.gl.createBuffer();
      app.gl.bindBuffer(this.glApp.gl.ARRAY_BUFFER, this.vbo);

      app.gl.enableVertexAttribArray(this.uniformLocations.position);
      app.gl.enableVertexAttribArray(this.uniformLocations.color);

      app.gl.vertexAttribPointer(
        this.uniformLocations.position,
        2,
        this.glApp.gl.FLOAT,
        false,
        4 * 6,
        0
      );
      app.gl.vertexAttribPointer(
        this.uniformLocations.color,
        4,
        this.glApp.gl.FLOAT,
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
    this.isDirty = true;
    this.glApp.requestFrame();
  };

  public draw = (app: GLApp) => {
    if (this.programInfo === null || this.data === null) {
      return;
    }

    this.useProgram(this.program);
    app.gl.bindVertexArray(this.vao);
    this.updateSize(app);

    if (this.isDirty) {
      app.gl.bindBuffer(this.glApp.gl.ARRAY_BUFFER, this.vbo);
      app.gl.bufferData(
        this.glApp.gl.ARRAY_BUFFER,
        new Float32Array(this.data.vertices),
        this.glApp.gl.STREAM_DRAW
      );
      this.isDirty = false;
    }
    const trianglesToDraw = this.data.vertices.length / 6;

    twgl.setUniforms(this.programInfo, {
      u_position: [this.position.x, this.position.y],
      u_zoom: this.zoom
    });

    app.gl.drawArrays(app.gl.TRIANGLES, 0, trianglesToDraw);
  };
}
