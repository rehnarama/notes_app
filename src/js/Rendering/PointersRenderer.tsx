import * as twgl from "twgl.js";
import { AttributeData } from "../Pen/Pen";
import GLApp from "../GLApp";
import GLProgram from "../GLProgram";
import Canvas from "../Rendering/Canvas";
import Vector2 from "../Utils/Vector2";

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

export default class PointersRenderer extends GLProgram {
  private canvas: Canvas;

  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private data: number[] = [];
  private isDirty = false;

  private programInfo: twgl.ProgramInfo | null = null;
  private attributeLocations = {
    position: 0,
    color: 0
  };

  private program: twgl.ProgramInfo;

  constructor(glApp: GLApp, canvas: Canvas) {
    super(glApp);
    this.canvas = canvas;
    this.program = this.initProgram(glApp);
  }

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

  public loadData = (cursors: Vector2[]) => {
    const firstCursor = cursors[0];
    if (firstCursor) {
      this.data = [
        firstCursor.x,
        firstCursor.y,
        1,
        0,
        0,
        1,
        firstCursor.x + 20,
        firstCursor.y,
        1,
        0,
        0,
        1,
        firstCursor.x,
        firstCursor.y + 30,
        1,
        0,
        0,
        1,
        firstCursor.x,
        firstCursor.y + 30,
        1,
        0,
        0,
        1,
        firstCursor.x + 20,
        firstCursor.y,
        1,
        0,
        0,
        1,
        firstCursor.x + 20,
        firstCursor.y + 30,
        1,
        0,
        0,
        1
      ];
      this.isDirty = true;
      this.glApp.requestFrame();
    }
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
        new Float32Array(this.data),
        this.glApp.gl.STREAM_DRAW
      );
      this.isDirty = false;
    }
    const trianglesToDraw = this.data.length / 6;

    twgl.setUniforms(this.programInfo, {
      u_vp: this.canvas.vp_matrix
    });

    app.gl.drawArrays(app.gl.TRIANGLES, 0, trianglesToDraw);
  };
}
