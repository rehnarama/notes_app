import * as React from "react";

const MIN_DISTANCE = 1;
const MIN_REMOVE_DISTANCE = 10;
const DEFAULT_LINE_WIDTH = 1;

class Point {
  x: number;
  y: number;
  pressure: number;
  constructor(x: number, y: number, pressure?: number) {
    this.x = x;
    this.y = y;
    this.pressure = pressure || 0.5;
  }
}
type Line = Point[];

class Painter extends React.PureComponent {
  canvasRef = React.createRef<HTMLCanvasElement>();
  context2d: CanvasRenderingContext2D = null;

  lines: Line[] = [];
  lineIndex = -1;
  pointerIsDown = false;
  erase = false;

  isDirty = false;

  componentDidMount() {
    if (this.canvasRef.current !== null) {
      this.context2d = this.canvasRef.current.getContext("2d");
      this.context2d.strokeStyle = "black";
    }
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeCanvas);
  }

  resizeCanvas = () => {
    if (this.canvasRef.current !== null) {
      this.canvasRef.current.width = window.innerWidth;
      this.canvasRef.current.height = window.innerHeight;
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
    this.pointerIsDown = true;

    // This means that we are erasing
    if (this.isEraseButtonDown(event)) {
      return;
    }

    const point = new Point(event.clientX, event.clientY, event.pressure);
    this.lines.push([point]);
    this.lineIndex++;
  };

  handleOnPointerUp: React.PointerEventHandler = () => {
    this.pointerIsDown = false;
  };

  eraseLine: React.PointerEventHandler = event => {
    let dirty = false;

    const curX = event.clientX;
    const curY = event.clientY;
    for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex++) {
      const line = this.lines[lineIndex];
      for (let pointIndex = 0; pointIndex < line.length; pointIndex++) {
        const point = line[pointIndex];
        const dx = point.x - curX;
        const dy = point.y - curY;

        const distSq = dx * dx + dy * dy;

        // Found a line close enough to remove
        if (distSq < MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE) {
          this.lines.splice(lineIndex, 1);
          dirty = true;
          this.lineIndex--;
          lineIndex--;
          break;
        }
      }
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
    const curX = event.clientX;
    const curY = event.clientY;
    const dx = oldPoint.x - curX;
    const dy = oldPoint.y - curY;

    // We subsample for better quality and memory efficiency
    if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) {
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
      for (let i = 1; i < line.length; i++) {
        this.context2d.beginPath();

        const pressure = line[i].pressure;
        const pressureCube = pressure * pressure * pressure;
        this.context2d.lineWidth = 1 + 5 * pressureCube;

        this.context2d.moveTo(line[i - 1].x, line[i - 1].y);
        this.context2d.lineTo(line[i].x, line[i].y);

        this.context2d.stroke();
      }
    }

    this.isDirty = false;
  };

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        width={500}
        height={500}
        style={{ position: "fixed", top: 0, left: 0, touchAction: "none" }}
        onPointerMove={this.handleOnPointerMove}
        onPointerDown={this.handleOnPointerDown}
        onPointerUp={this.handleOnPointerUp}
      />
    );
  }
}
export default Painter;
