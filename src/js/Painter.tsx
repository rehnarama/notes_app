import * as React from "react";

const MIN_DISTANCE = 3;
const MIN_REMOVE_DISTANCE = 10;
const DEFAULT_LINE_WIDTH = 1;
const POINT_PER_PIXEL = 0.5;
// Default pressure is treated as
// pressure not supported, as per spec: https://www.w3.org/TR/pointerevents/
const DEFAULT_PRESSURE = 0.5;
const CIRCLE_VERTICE_PER_PIXEL = 0.5;

const vsSource = `
  attribute vec3 position;
  uniform vec2 resolution; 
   
  void main() {
    vec3 coord_position = -1.0 + 2.0 * vec3(position.xy / resolution.xy, 0);
    gl_Position = vec4(vec3(1.0, -1.0, 1) * coord_position, 1.0);

  }`;
const fsSource = `

  void main(void) {
    gl_FragColor = vec4(0,0,0,1);//vec4(abs(sin(gl_FragCoord.x * 0.01)), abs(sin(gl_FragCoord.y * 0.01)), abs(sin(gl_FragCoord.x * gl_FragCoord.y * 0.001)), 1.0);
  }`;

class Point {
  x: number;
  y: number;
  pressure: number;
  constructor(x: number, y: number, pressure?: number) {
    this.x = x;
    this.y = y;
    this.pressure = pressure || DEFAULT_PRESSURE;
  }

  equals(other: Point) {
    return this.x === other.x && this.y === other.y;
  }
}
type Line = Point[];
export { Point, Line };

interface Props {
  visible: boolean;
  onRequestVisibility: (visibility: boolean) => void;
  onSaveImage: (lines: Line[]) => void;
  initialLineData?: Line[];
}

interface State {
  clearVisible: boolean;
}

class Painter extends React.PureComponent<Props, State> {
  canvasRef = React.createRef<HTMLCanvasElement>();
  gl: WebGLRenderingContext | null = null;
  vertexBuffer: WebGLBuffer | null = null;
  indexBuffer: WebGLBuffer | null = null;
  program: WebGLProgram | null = null;
  resolutionLocation: WebGLUniformLocation | null = null;
  positionLocation: number = 0;

  lines: Line[] = [];
  lineVertices: Float32Array = new Float32Array();
  currentLine: Line = [];
  lineIndex = -1;
  pointerIsDown = false;
  erase = false;

  isDirty = false;

  constructor(props: Props) {
    super(props);

    if (props.initialLineData) {
      this.lines = props.initialLineData;
      this.lineVertices = new Float32Array(
        props.initialLineData
          .map(line => this.generateLineVertices(line))
          .reduce((acc, val) => acc.concat(val), [])
      );
      this.lineIndex = this.lineVertices.length - 1;
    }

    this.state = {
      clearVisible: this.lineVertices.length > 0
    };
  }

  componentDidMount() {
    this.initWebGL();
    if (this.gl) {
      this.gl.useProgram(this.program);
      this.resizeCanvas();
    }

    window.addEventListener("resize", this.resizeCanvas);
    window.addEventListener("pointerover", this.handleOnPointerOver);
    window.addEventListener("pointerout", this.handleOnPointerLeave);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeCanvas);
    window.removeEventListener("pointerover", this.handleOnPointerOver);
    window.removeEventListener("pointerout", this.handleOnPointerLeave);
  }

  createProgram(gl: WebGLRenderingContext) {
    const program = (this.program = gl.createProgram());
    if (program === null) {
      return;
    }

    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (vs === null || fs === null) {
      return;
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

  initWebGL() {
    if (this.canvasRef.current === null) {
      return;
    }
    const gl = (this.gl = this.canvasRef.current.getContext(
      "webgl2"
    ) as WebGLRenderingContext);
    if (gl === null) {
      return;
    }

    this.createProgram(gl);
    this.vertexBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
  }

  handleOnPointerOver: EventListener = event => {
    let pointerEvent = event as PointerEvent;
    if (pointerEvent.pointerType === "pen") {
      this.props.onRequestVisibility(true);
    }
  };

  handleOnPointerLeave: EventListener = event => {
    let pointerEvent = event as PointerEvent;
    // Hide if empty
    if (pointerEvent.pointerType === "pen" && this.lineVertices.length === 0) {
      this.props.onRequestVisibility(false);
    }
  };

  resizeCanvas = () => {
    if (this.canvasRef.current !== null) {
      const width = (this.canvasRef.current.width =
        window.innerWidth * window.devicePixelRatio);
      const height = (this.canvasRef.current.height =
        window.innerHeight * window.devicePixelRatio);

      if (this.gl) {
        this.gl.viewport(0, 0, width, height);
        this.gl.uniform2f(this.resolutionLocation, width, height);
      }
      this.requestRenderFrame();
    }
  };

  isEraseButtonDown = ({
    button,
    buttons
  }: {
    button: number;
    buttons: number;
  }) => {
    // This is the combination of having erase button down
    // See https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#Determining_button_states
    // button -1 happens when moving with erase down, though this seems to be undocumented
    return (button === 5 || button === -1) && buttons === 32;
  };

  handleOnPointerDown: React.PointerEventHandler = event => {
    // Only allow pen input
    if (event.pointerType !== "pen") {
      return;
    }

    this.pointerIsDown = true;

    // This means that we are erasing
    if (this.isEraseButtonDown(event)) {
      return;
    }

    this.currentLine = [];
    const point = new Point(
      event.clientX * window.devicePixelRatio,
      event.clientY * window.devicePixelRatio,
      event.pressure
    );
    this.currentLine.push(point);

    this.updateClearVisible();
  };

  updateClearVisible = () => {
    // We check this in callback function instead of taking an argument because
    // setState is asynchronous, and amount of lines might have changed
    // in-between calling this and actually running
    this.setState(() => ({
      clearVisible: this.lineVertices.length > 0
    }));
  };

  handleOnPointerUp: React.PointerEventHandler = () => {
    this.pointerIsDown = false;

    this.lineIndex++;
    this.lines.push(this.currentLine);
    this.lineVertices = new Float32Array(
      Array.from(this.lineVertices).concat(
        this.generateLineVertices(this.currentLine)
      )
    );

    this.currentLine = [];

    if (this.lineVertices.length > 0) {
      this.requestRenderFrame();
    }

    this.saveImage();
  };

  eraseLine: React.PointerEventHandler = event => {
    let dirty = false;

    const curX = event.clientX * window.devicePixelRatio;
    const curY = event.clientY * window.devicePixelRatio;
    for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex++) {
      const line = this.lines[lineIndex];

      for (let pointIndex = 0; pointIndex < line.length; pointIndex++) {
        const point = line[pointIndex];
        const dx = point.x - curX;
        const dy = point.y - curY;

        const distSq = dx * dx + dy * dy;

        // Found a line close enough to remove
        if (
          distSq <
          MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE * window.devicePixelRatio
        ) {
          this.lines.splice(lineIndex, 1);
          this.lineVertices = new Float32Array(
            this.lines
              .map(line => this.generateLineVertices(line))
              .reduce((acc, val) => acc.concat(val), [])
          );
          dirty = true;
          this.lineIndex--;
          lineIndex--;
          break;
        }
      }
    }

    if (this.lineVertices.length === 0) {
      this.updateClearVisible();
    }

    if (dirty) {
      this.requestRenderFrame();
    }
  };

  handleOnPointerMove: React.PointerEventHandler = event => {
    if (this.gl === null) {
      return;
    }
    if (!this.pointerIsDown) {
      return;
    }
    if (this.isEraseButtonDown(event)) {
      this.eraseLine(event);
      return;
    }

    const oldPoint = this.currentLine[this.currentLine.length - 1];
    const curX = event.clientX * window.devicePixelRatio;
    const curY = event.clientY * window.devicePixelRatio;
    const dx = oldPoint.x - curX;
    const dy = oldPoint.y - curY;

    // We subsample for better quality and memory efficiency
    if (
      dx * dx + dy * dy <
      MIN_DISTANCE * MIN_DISTANCE * window.devicePixelRatio
    ) {
      return;
    }

    const point = new Point(curX, curY, event.pressure);
    this.currentLine.push(point);

    this.requestRenderFrame();
  };

  requestRenderFrame = () => {
    if (this.isDirty) {
      return;
    }

    this.isDirty = true;
    window.requestAnimationFrame(this.renderFrame);
  };

  static getPointRadius(point: Point) {
    const pressure = point.pressure;
    const pointCube = pressure * pressure * pressure;
    return (DEFAULT_LINE_WIDTH + 5 * pointCube) * window.devicePixelRatio;
  }

  calculateQuadraticPoints(points: Line) {
    const start = new Point(
      (points[0].x + points[1].x) / 2,
      (points[0].y + points[1].y) / 2,
      (points[0].pressure + points[1].pressure) / 2
    );
    const end = new Point(
      (points[1].x + points[2].x) / 2,
      (points[1].y + points[2].y) / 2,
      (points[1].pressure + points[2].pressure) / 2
    );
    const control = points[1];
    return { start, end, control };
  }

  interpolatePoints(t: number, p1: Point, p2: Point, p3: Point) {
    const it = 1 - t;
    const x = it * it * p1.x + 2 * t * it * p2.x + t * t * p3.x;
    const y = it * it * p1.y + 2 * t * it * p2.y + t * t * p3.y;
    const pressure =
      it * it * p1.pressure + 2 * t * it * p2.pressure + t * t * p3.pressure;

    return new Point(x, y, pressure);
  }

  interpolateLine(line: Line) {
    const newLine: Line = [];

    // Since every point requries three points,
    // we have to pad to display first and last point
    const n = line.length;
    const paddedLine = [line[0], ...line, line[n - 1]];

    const points = new Array(3);

    for (const point of paddedLine) {
      points[0] = points[1];
      points[1] = points[2];
      points[2] = point;

      if (!points[0]) {
        continue;
      }

      const { start, control, end } = this.calculateQuadraticPoints(points);

      const dx = start.x - control.x + (control.x - end.x);
      const dy = start.y - control.y + (control.y - end.y);

      const nPoints = Math.sqrt(dx * dx + dy * dy) * POINT_PER_PIXEL;

      for (let t = 0; t <= 1; t += 1 / nPoints) {
        let point = this.interpolatePoints(t, start, control, end);
        newLine.push(point);
      }
    }
    return newLine;
  }

  generateCircleVertices(point: Point) {
    const vertices = [];

    const radius = Painter.getPointRadius(point);
    const circumference = radius * Math.PI;
    const nVertices = CIRCLE_VERTICE_PER_PIXEL * circumference;
    const dTheta = (2 * Math.PI) / nVertices;

    for (let theta = 0; theta < 2 * Math.PI; theta += 2 * dTheta) {
      const x1 = radius * Math.cos(theta) + point.x;
      const y1 = radius * Math.sin(theta) + point.y;

      const x2 = radius * Math.cos(theta + dTheta) + point.x;
      const y2 = radius * Math.sin(theta + dTheta) + point.y;
      vertices.push(x1, y1, point.x, point.y, x2, y2);
    }

    // Connect to the first vertice to "close" the circle
    vertices.push(vertices[0], vertices[1]);

    return vertices;
  }

  generateLineVertices(line: Line) {
    let oldPoint = null;
    const interpolatedLine: Line = this.interpolateLine(line);

    let meshPoints: number[] = [];
    let oldC = null,
      oldD = null;

    for (let index = 0; index < interpolatedLine.length; index++) {
      const point = interpolatedLine[index];

      if (oldPoint === null) {
        oldPoint = point;
        continue;
      }

      const nextPoint = interpolatedLine[index + 1];

      // Get the deltas, required for angle calculation
      const dx = point.x - oldPoint.x;
      const dy = point.y - oldPoint.y;
      let ndx = dx;
      let ndy = dy;

      if (nextPoint) {
        ndx = nextPoint.x - point.x;
        ndy = nextPoint.y - point.y;
      }

      const meanAngle = Math.atan2((dy + ndy) / 2, (dx + ndx) / 2);

      // Get the perpendicular angle between the points,
      // required to know where to shift the points in the triangles ABC and BCD
      let perp = meanAngle + Math.PI / 2;

      let perpX = Math.cos(perp);
      let perpY = Math.sin(perp);

      let A = oldC
        ? oldC
        : {
            x: oldPoint.x + perpX * Painter.getPointRadius(oldPoint),
            y: oldPoint.y + perpY * Painter.getPointRadius(oldPoint)
          };

      let B = oldD
        ? oldD
        : {
            x: oldPoint.x - perpX * Painter.getPointRadius(oldPoint),
            y: oldPoint.y - perpY * Painter.getPointRadius(oldPoint)
          };

      let C = {
        x: point.x + perpX * Painter.getPointRadius(point),
        y: point.y + perpY * Painter.getPointRadius(point)
      };

      let D = {
        x: point.x - perpX * Painter.getPointRadius(point),
        y: point.y - perpY * Painter.getPointRadius(point)
      };
      oldD = D;
      oldC = C;

      meshPoints.push(A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y);

      oldPoint = point;
    }

    const firstBall = this.generateCircleVertices(line[0]);
    const lastBall = this.generateCircleVertices(line[line.length - 1]);
    const n = lastBall.length;
    // We add these vertices so that flat triangles
    // are drawn between disjoint objects
    meshPoints.splice(0, 0, firstBall[0], firstBall[1], ...firstBall);
    meshPoints.push(
      ...lastBall,
      lastBall[n - 2],
      lastBall[n - 1],
      lastBall[n - 2],
      lastBall[n - 1]
    );

    return meshPoints;
  }

  renderFrame: FrameRequestCallback = () => {
    if (
      this.gl === null ||
      this.program === null ||
      this.canvasRef.current === null
    ) {
      return;
    }

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.positionLocation);

    this.drawTriangles(this.lineVertices, this.gl.TRIANGLE_STRIP);

    if (this.currentLine.length > 0) {
      this.drawTriangles(
        new Float32Array(this.generateLineVertices(this.currentLine)),
        this.gl.TRIANGLE_STRIP
      );
    }

    this.gl.disableVertexAttribArray(this.positionLocation);

    this.isDirty = false;
  };

  drawTriangles(vertices: Float32Array, drawMode: number) {
    if (
      this.gl === null ||
      this.program === null ||
      this.canvasRef.current === null
    ) {
      return;
    }
    if (!vertices || vertices.length < 3) {
      return;
    }
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.gl.drawArrays(drawMode, 0, vertices.length / 2);
  }

  clear = () => {
    this.lineVertices = new Float32Array();
    this.lines = [];
    this.lineIndex = -1;
    this.saveImage();
    this.updateClearVisible();
    this.requestRenderFrame();
  };

  handleOnClearClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    this.clear();
  };

  saveImage = () => {
    this.props.onSaveImage(this.lines);
  };

  render() {
    const { visible } = this.props;
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: visible ? undefined : "none"
        }}
      >
        <canvas
          ref={this.canvasRef}
          width={500}
          height={500}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            touchAction: "none"
          }}
          onPointerMove={this.handleOnPointerMove}
          onPointerDown={this.handleOnPointerDown}
          onPointerUp={this.handleOnPointerUp}
        />
        <button
          style={{
            position: "absolute",
            left: 0,
            display: this.lineVertices.length > 0 ? "block" : "none"
          }}
          onClick={this.handleOnClearClick}
        >
          Clear
        </button>
      </div>
    );
  }
}
export default Painter;
