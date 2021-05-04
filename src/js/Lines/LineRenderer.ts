import * as twgl from "twgl.js";
import { AttributeData } from "../Pen/Pen";
import GLApp from "../GLApp";
import GLProgram from "../GLProgram";
import { mat3 } from "gl-matrix";

export type Color = [number, number, number, number];

const vsSource = `#version 300 es
precision highp float;

in vec4 a_position;
in vec4 a_color;

out vec4 v_color;

uniform mat3 u_vp;

void main() {
  gl_Position = vec4(u_vp * vec3(a_position.xy, 1), a_position.w);
  v_color = a_color;
}
  `;
const fsSource = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 output_color;

void main(void) {
  output_color = v_color;
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

  public get projection(): mat3 {
    const projection = mat3.projection(
      mat3.create(),
      this.glApp.width,
      this.glApp.height
    );

    return projection;
  }
  public get view(): mat3 {
    const scale = mat3.fromScaling(mat3.create(), [this.zoom, this.zoom]);
    const translation = mat3.fromTranslation(mat3.create(), [
      this.position.x,
      this.position.y
    ]);
    return mat3.mul(mat3.create(), translation, scale);
  }

  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private data: AttributeData | null = null;
  private isDirty = false;

  private programInfo: twgl.ProgramInfo | null = null;
  private attributeLocations = {
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


  public initProgram = (app: GLApp) => {
    this.programInfo = this.createProgramInfo(vsSource, fsSource);

    this.useProgram(this.programInfo);

    this.attributeLocations.position = this.glApp.gl.getAttribLocation(
      this.programInfo.program,
      "a_position"
    );
    this.attributeLocations.color = this.glApp.gl.getAttribLocation(
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

      app.gl.enableVertexAttribArray(this.attributeLocations.position);
      app.gl.enableVertexAttribArray(this.attributeLocations.color);

      app.gl.vertexAttribPointer(
        this.attributeLocations.position,
        2,
        this.glApp.gl.FLOAT,
        false,
        4 * 6,
        0
      );
      app.gl.vertexAttribPointer(
        this.attributeLocations.color,
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
      u_vp: mat3.mul(mat3.create(), this.projection, this.view)
    });

    app.gl.drawArrays(app.gl.TRIANGLES, 0, trianglesToDraw);
  };
}
