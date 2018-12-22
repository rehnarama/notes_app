import * as React from "react";
import LineGenerator from "./LineGenerator";
import LineRenderer from "./LineRenderer";

const MIN_DISTANCE = 3;
const POINT_PER_PIXEL = 0.5;
// Default pressure is treated as
// pressure not supported, as per spec: https://www.w3.org/TR/pointerevents/
const DEFAULT_PRESSURE = 0.5;

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
  onSaveImage: (lines: Line[]) => void;
  initialLineData?: Line[];
}

class Painter extends React.PureComponent<Props> {
  currentLine: Line = [];

  pointerIsDown = false;
  erase = false;

  isDirty = false;

  lineGenerator = new LineGenerator();
  lineRenderer: LineRenderer | null = null;
  targetRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    if (props.initialLineData) {
      for (const line of props.initialLineData) {
        this.lineGenerator.addLine(line);
      }
    }
  }

  componentDidMount() {
    if (this.targetRef.current === null) {
      throw new Error("Could not find target element");
    }

    this.lineRenderer = new LineRenderer(this.targetRef.current);
  }

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
    this.pointerIsDown = true;

    // This means that we are erasing
    if (this.isEraseButtonDown(event)) {
      return;
    }

    this.currentLine = [];
    const point = new Point(
      event.clientX * Painter.getScaleFactor(),
      event.clientY * Painter.getScaleFactor(),
      event.pressure
    );
    this.currentLine.push(point);
  };

  handleOnPointerUp: React.PointerEventHandler = () => {
    this.pointerIsDown = false;

    this.lineGenerator.addLine(this.currentLine);

    this.currentLine = [];

    this.requestRenderFrame();
  };

  eraseLine: React.PointerEventHandler = event => {
    let dirty = false;

    const point = new Point(
      event.clientX * Painter.getScaleFactor(),
      event.clientY * Painter.getScaleFactor()
    );

    const line = this.lineGenerator.findLine(point);
    if (line !== null) {
      dirty = true;
      this.lineGenerator.removeLine(line);
    }

    if (dirty) {
      this.requestRenderFrame();
    }
  };

  handleOnPointerMove: React.PointerEventHandler = event => {
    if (!this.pointerIsDown) {
      return;
    }
    if (this.isEraseButtonDown(event)) {
      this.eraseLine(event);
      return;
    }

    const oldPoint = this.currentLine[this.currentLine.length - 1];
    const curX = event.clientX * Painter.getScaleFactor();
    const curY = event.clientY * Painter.getScaleFactor();
    const dx = oldPoint.x - curX;
    const dy = oldPoint.y - curY;

    // We subsample for better quality and memory efficiency
    if (
      dx * dx + dy * dy <
      MIN_DISTANCE * MIN_DISTANCE * Painter.getScaleFactor()
    ) {
      console.log(dx * dx + dy * dy);
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

  static getScaleFactor() {
    return window.devicePixelRatio;
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

  renderFrame: FrameRequestCallback = () => {
    if (this.lineRenderer === null) {
      return;
    }

    this.lineRenderer.clear();
    this.lineRenderer.draw(this.lineGenerator.generateVertices());

    const generator = new LineGenerator();
    generator.addLine(this.currentLine);
    this.lineRenderer.draw(generator.generateVertices());

    this.isDirty = false;
  };

  clear = () => {
    this.requestRenderFrame();
  };

  render() {
    return (
      <React.Fragment>
        <div
          ref={this.targetRef}
          style={{
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            touchAction: "none",
            overflow: "hidden"
          }}
          onPointerMove={this.handleOnPointerMove}
          onPointerDown={this.handleOnPointerDown}
          onPointerUp={this.handleOnPointerUp}
        />
      </React.Fragment>
    );
  }
}
export default Painter;
