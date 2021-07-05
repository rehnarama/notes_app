import * as twgl from "twgl.js";
import GLApp from "../GLApp";
import GLProgram from "../GLProgram";
import Canvas from "../Rendering/Canvas";

export type Color = [number, number, number, number];

const vsSource = `#version 300 es
precision highp float;

in vec4 a_position;
in vec4 a_color;
in vec2 a_uv;

out vec4 v_color;
out vec2 v_uv;
out vec4 v_position;

uniform mat3 u_vp;

void main() {
  gl_Position = a_position;
  v_color = a_color;
  v_uv = a_uv;
  v_position = vec4(inverse(u_vp) * vec3(a_position.xy, 1), a_position.w);
}
  `;
const fsSource = `#version 300 es
precision mediump float;

in vec4 v_position;
in vec4 v_color;
in vec2 v_uv;

out vec4 output_color;

void main(void) {
  float LINE_EVERY_PX = 20.0;
  float LINE_THICKNESS = 1.0;

  float x = mod(v_position.x, LINE_EVERY_PX);
  float y = mod(v_position.y, LINE_EVERY_PX);

  float edge = LINE_EVERY_PX - LINE_THICKNESS;

  float alpha = step(0.5, step(edge, x) + step(edge, y));
  
  output_color = vec4(v_color.rgb, alpha * v_color.a);
}`;

export default class GridRenderer extends GLProgram {
  private canvas: Canvas;

  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private data: number[] = [];
  private isDirty = false;

  private programInfo: twgl.ProgramInfo | null = null;
  private attrbuteLocations = {
    position: 0,
    uv: 0,
    color: 0
  };
  private uniformLocations = {
    texture: 0
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

    this.attrbuteLocations.position = this.glApp.gl.getAttribLocation(
      this.programInfo.program,
      "a_position"
    );
    this.attrbuteLocations.uv = this.glApp.gl.getAttribLocation(
      this.programInfo.program,
      "a_uv"
    );
    this.attrbuteLocations.color = this.glApp.gl.getAttribLocation(
      this.programInfo.program,
      "a_color"
    );
    this.uniformLocations.texture = this.glApp.gl.getUniformLocation(
      this.programInfo.program,
      "u_texture"
    ) as number;

    this.setupBuffers(app);

    this.glApp.gl.blendFunc(
      this.glApp.gl.SRC_ALPHA,
      this.glApp.gl.ONE_MINUS_SRC_ALPHA
    );
    this.glApp.gl.enable(this.glApp.gl.BLEND);

    return this.programInfo;
  };

  private setupBuffers(app: GLApp) {
    if (this.programInfo) {
      this.vao = this.glApp.gl.createVertexArray();

      app.gl.bindVertexArray(this.vao);

      this.vbo = this.glApp.gl.createBuffer();
      app.gl.bindBuffer(this.glApp.gl.ARRAY_BUFFER, this.vbo);

      app.gl.enableVertexAttribArray(this.attrbuteLocations.position);
      app.gl.enableVertexAttribArray(this.attrbuteLocations.uv);
      app.gl.enableVertexAttribArray(this.attrbuteLocations.color);

      app.gl.vertexAttribPointer(
        this.attrbuteLocations.position,
        2,
        this.glApp.gl.FLOAT,
        false,
        4 * 8,
        0
      );
      app.gl.vertexAttribPointer(
        this.attrbuteLocations.uv,
        2,
        this.glApp.gl.FLOAT,
        false,
        4 * 8,
        4 * 2
      );
      app.gl.vertexAttribPointer(
        this.attrbuteLocations.color,
        4,
        this.glApp.gl.FLOAT,
        false,
        4 * 8,
        4 * 4
      );
    }
  }

  private makeQuad = () => {
    const COLOR = [0.7, 0.7, 0.7, 0.8];
    return [
      -1, // Vert 1
      1,
      0,
      0,
      ...COLOR,
      -1, // Vert 2
      -1,
      1,
      0,
      ...COLOR,
      1, // Vert 3
      1,
      0,
      1,
      ...COLOR,
      1, // Vert 4
      1,
      0,
      1,
      ...COLOR,
      -1, // Vert 5
      -1,
      1,
      0,
      ...COLOR,
      1, // Vert 6
      -1,
      1,
      1,
      ...COLOR,
    ];
  };

  public loadData = () => {
    this.data = this.makeQuad();
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
        new Float32Array(this.data),
        this.glApp.gl.STREAM_DRAW
      );
      this.isDirty = false;
    }
    const trianglesToDraw = this.data.length / 8;

    twgl.setUniforms(this.programInfo, {
      u_vp: this.canvas.vp_matrix
    });

    app.gl.drawArrays(app.gl.TRIANGLES, 0, trianglesToDraw);
  };
}
