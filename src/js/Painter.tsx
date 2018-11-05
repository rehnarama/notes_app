import * as React from "react";

const MIN_DISTANCE = 3;
const MIN_REMOVE_DISTANCE = 10;
const DEFAULT_LINE_WIDTH = 1;
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
  context2d: CanvasRenderingContext2D | null = null;

  lines: Line[] = [];
  lineIndex = -1;
  pointerIsDown = false;
  erase = false;

  isDirty = false;

  constructor(props: Props) {
    super(props);

    if (props.initialLineData) {
      this.lines = props.initialLineData;
      this.lineIndex = this.lines.length - 1;
    }

    this.state = {
      clearVisible: this.lines.length > 0
    };
  }

  componentDidMount() {
    if (this.canvasRef.current !== null) {
      this.context2d = this.canvasRef.current.getContext("2d");
      if (this.context2d) {
        this.context2d.strokeStyle = "black";
      }
    }
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
    window.addEventListener("pointerover", this.handleOnPointerOver);
    window.addEventListener("pointerout", this.handleOnPointerLeave);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeCanvas);
    window.removeEventListener("pointerover", this.handleOnPointerOver);
    window.removeEventListener("pointerout", this.handleOnPointerLeave);
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
    if (pointerEvent.pointerType === "pen" && this.lines.length === 0) {
      this.props.onRequestVisibility(false);
    }
  };

  resizeCanvas = () => {
    if (this.canvasRef.current !== null) {
      this.canvasRef.current.width =
        window.innerWidth * window.devicePixelRatio;
      this.canvasRef.current.height =
        window.innerHeight * window.devicePixelRatio;
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

    const point = new Point(
      event.clientX * window.devicePixelRatio,
      event.clientY * window.devicePixelRatio,
      event.pressure
    );
    this.lines.push([point]);
    this.lineIndex++;

    this.updateClearVisible();
  };

  updateClearVisible = () => {
    // We check this in callback function instead of taking an argument because
    // setState is asynchronous, and amount of lines might have changed
    // in-between calling this and actually running
    this.setState(() => ({
      clearVisible: this.lines.length > 0
    }));
  };

  handleOnPointerUp: React.PointerEventHandler = () => {
    this.pointerIsDown = false;

    if (this.lines.length > 0 && this.lines[this.lineIndex].length < 3) {
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
          dirty = true;
          this.lineIndex--;
          lineIndex--;
          break;
        }
      }
    }

    if (this.lines.length === 0) {
      this.updateClearVisible();
    }

    if (dirty) {
      this.requestRenderFrame();
    }
  };

  handleOnPointerMove: React.PointerEventHandler = event => {
    if (this.context2d === null) {
      return;
    }
    if (!this.pointerIsDown) {
      return;
    }
    if (this.isEraseButtonDown(event)) {
      this.eraseLine(event);
      return;
    }

    const currentLine = this.lines[this.lineIndex];
    const oldPoint = currentLine[currentLine.length - 1];
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
    this.lines[this.lineIndex].push(point);

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
    const start = {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2
    };
    const end = {
      x: (points[1].x + points[2].x) / 2,
      y: (points[1].y + points[2].y) / 2
    };
    const control = points[1];
    return { start, end, control };
  }

  drawLine(line: Line) {
    if (this.context2d === null) {
      return;
    }

    let oldPoint = null;

    let meshPoints = new Array(line.length * 2);
    let oldC = null,
      oldD = null;

    for (let index = 0; index < line.length; index++) {
      const point = line[index];

      if (oldPoint === null) {
        oldPoint = point;
        continue;
      }

      const nextPoint = line[index + 1];

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

      if (index === 1) {
        meshPoints[0] = A;
        meshPoints[meshPoints.length - 1] = B;
      }
      meshPoints[index] = C;
      meshPoints[meshPoints.length - 1 - index] = D;

      oldPoint = point;
    }

    const prevPoints = Array(3);
    // Insert original point again to "loop back" around
    meshPoints.push(meshPoints[0]);
    this.context2d.beginPath();
    this.context2d.moveTo(meshPoints[0].x, meshPoints[0].y);
    for (const point of meshPoints) {
      prevPoints[0] = prevPoints[1];
      prevPoints[1] = prevPoints[2];
      prevPoints[2] = point;

      if (!prevPoints[0]) {
        continue;
      }

      const quadPoints = this.calculateQuadraticPoints(prevPoints);

      this.context2d.quadraticCurveTo(
        quadPoints.control.x,
        quadPoints.control.y,
        quadPoints.end.x,
        quadPoints.end.y
      );
    }
    this.context2d.fill();
  }

  renderFrame: FrameRequestCallback = () => {
    if (this.context2d === null) {
      return;
    }

    this.context2d.clearRect(
      0,
      0,
      this.context2d.canvas.width,
      this.context2d.canvas.height
    );

    for (const line of this.lines) {
      if (line.length < 3) {
        this.context2d.beginPath();
        this.context2d.arc(
          line[0].x,
          line[0].y,
          Painter.getPointRadius(line[0]),
          0,
          2 * Math.PI
        );
        this.context2d.fill();
        continue;
      }

      this.drawLine(line);
    }

    this.isDirty = false;
  };

  clear = () => {
    this.lines = [];
    this.lineIndex = -1;
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
            display: this.lines.length > 0 ? "block" : "none"
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
