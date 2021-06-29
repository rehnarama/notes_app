import * as twgl from "twgl.js";
import { AttributeData } from "../Pen/Pen";
import GLApp from "../GLApp";
import GLProgram from "../GLProgram";
import Canvas from "../Rendering/Canvas";
import Vector2 from "../Utils/Vector2";
import cursorImgSrc from "url:../../images/cursor@3x.png";
import { mat3, vec2 } from "gl-matrix";

export type Color = [number, number, number, number];

const vsSource = `#version 300 es
precision highp float;

in vec4 a_position;
in vec4 a_color;
in vec2 a_uv;

out vec4 v_color;
out vec2 v_uv;

uniform mat3 u_vp;

void main() {
  gl_Position = vec4(u_vp * vec3(a_position.xy, 1), a_position.w);
  v_color = a_color;
  v_uv = a_uv;
}
  `;
const fsSource = `#version 300 es
precision mediump float;

in vec4 v_color;
in vec2 v_uv;

out vec4 output_color;

uniform sampler2D u_texture;

void main(void) {
  output_color = texture(u_texture, v_uv);
}`;

export default class PointersRenderer extends GLProgram {
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

  private textures!: Record<string, WebGLTexture>;

  private cursorImg = new Image();
  private width = 20;

  constructor(glApp: GLApp, canvas: Canvas) {
    super(glApp);
    this.canvas = canvas;
    this.program = this.initProgram(glApp);
    this.cursorImg.src = cursorImgSrc;
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

    this.textures = twgl.createTextures(app.gl, {
      cursor: {
        src: cursorImgSrc
      }
    });
    this.glApp.gl.activeTexture(this.glApp.gl.TEXTURE0);
    this.glApp.gl.bindTexture(this.glApp.gl.TEXTURE_2D, this.textures.cursor);
    this.glApp.gl.uniform1i(this.uniformLocations.texture, 0);

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

  private makeQuad = (position: Vector2) => {
    const aspectRatio = this.cursorImg.height / this.cursorImg.width;
    const width = this.width;
    const height = aspectRatio * width;

    return [
      position.x,
      position.y,
      0,
      0,
      1,
      0,
      0,
      1,
      position.x + width,
      position.y,
      1,
      0,
      1,
      0,
      0,
      1,
      position.x,
      position.y + height,
      0,
      1,
      1,
      0,
      0,
      1,
      position.x,
      position.y + height,
      0,
      1,
      1,
      0,
      0,
      1,
      position.x + width,
      position.y,
      1,
      0,
      1,
      0,
      0,
      1,
      position.x + width,
      position.y + height,
      1,
      1,
      1,
      0,
      0,
      1
    ];
  };

  public loadData = (cursors: Vector2[]) => {
    this.data = cursors.map(this.makeQuad).flat();
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
