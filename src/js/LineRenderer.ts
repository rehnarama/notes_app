const vsSource = `
  attribute vec3 position;
  uniform vec2 resolution; 
   
  void main() {
    vec3 coord_position = -1.0 + 2.0 * vec3(position.xy / resolution.xy, 0);
    gl_Position = vec4(vec3(1.0, -1.0, 1) * coord_position, 1.0);

  }`;
const fsSource = `

  void main(void) {
    gl_FragColor = vec4(0,0,0,1);
  }`;

export default class LineRenderer {
  private targetElement: HTMLElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;

  private vertexBuffer: WebGLBuffer | null = null;

  private resolutionLocation: WebGLUniformLocation | null = null;
  private positionLocation: number = 0;

  constructor(targetElement: HTMLElement) {
    this.targetElement = targetElement;

    const canvas = document.createElement("canvas");
    this.targetElement.appendChild(canvas);

    this.gl = canvas.getContext("webgl") as WebGLRenderingContext;

    this.initWebGl();
  }

  private initWebGl() {
    this.createProgram();
    this.gl.useProgram(this.program);
    this.updateSize();

    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    // Tell WebGL how to read from vertex buffer
    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.positionLocation);
  }

  private createProgram() {
    const program = (this.program = this.gl.createProgram());
    if (program === null) {
      throw new Error("Could not create program");
    }
    this.program = program;

    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (vs === null) {
      throw new Error("Could not create vertex shader");
    }
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (fs === null) {
      throw new Error("Could not create fragment shader");
    }

    gl.shaderSource(vs, vsSource);
    gl.shaderSource(fs, fsSource);

    gl.compileShader(vs);
    gl.compileShader(fs);

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.linkProgram(program);
    this.resolutionLocation = gl.getUniformLocation(program, "resolution");
    this.positionLocation = gl.getAttribLocation(program, "position");
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

    this.gl.canvas.style.width = this.targetElement.offsetWidth + "px";
    this.gl.canvas.style.height = this.targetElement.offsetHeight + "px";

    this.gl.viewport(0, 0, width, height);
    this.gl.uniform2f(this.resolutionLocation, width, height);
  }

  public clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  public draw(vertices: Float32Array) {
    if (this.gl === null || this.program === null) {
      return;
    }
    if (vertices.length == 0) {
      return;
    }

    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, vertices.length / 2);
  }
}
