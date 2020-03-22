import * as React from "react";
import LineGenerator from "./LineGenerator";
import LineRenderer from "./LineRenderer";
import FeltPen from "./Pen/FeltPen";
import Pen from "./Pen/Pen";
import FullMeshNetwork from "./Network/FullMeshNetwork";
import BB from "./Network/BasicBroadcast";

const fmn = new FullMeshNetwork("wss://rehnarama-notes.glitch.me");
const bb = new BB(fmn);

fmn.onConnection.add(() => {
  console.log("yay");
});

const MIN_DISTANCE = 3;
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

type PointerEventHandler = (event: PointerEvent) => void;

interface Props {
  onSaveImage: (lines: Line[]) => void;
  initialLineData?: Line[];
}

class Painter extends React.PureComponent<Props> {
  currentLines: Map<number, Line> = new Map();

  pointerIsDown = false;
  erase = false;

  isDirty = false;

  pen: Pen = new FeltPen();
  lineGenerator = new LineGenerator(this.pen);
  lineRenderer: LineRenderer | null = null;
  targetRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);
    bb.bDeliver.add(arg => {
      if (arg.type === "ongoing") {
        const line = arg.line as Line;
        const id = arg.id as number;
        this.currentLines.set(id, line);
      } else if (arg.type === "done") {
        const id = arg.id as number;
        const line = this.currentLines.get(id);
        this.currentLines.delete(id);
        if (line) {
          this.lineGenerator.addLine(line);
        }
      }
      this.requestRenderFrame();
    });

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
    this.requestRenderFrame();

    this.targetRef.current.addEventListener(
      "pointermove",
      this.handleOnPointerMove,
      { passive: true }
    );
    this.targetRef.current.addEventListener(
      "pointerdown",
      this.handleOnPointerDown,
      { passive: true }
    );
    this.targetRef.current.addEventListener(
      "pointerup",
      this.handleOnPointerUp,
      { passive: true }
    );

    window.addEventListener("resize", this.handleOnResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleOnResize);

    if (this.targetRef.current !== null) {
      this.targetRef.current.removeEventListener(
        "pointermove",
        this.handleOnPointerMove
      );
      this.targetRef.current.removeEventListener(
        "pointerdown",
        this.handleOnPointerDown
      );
      this.targetRef.current.removeEventListener(
        "pointerup",
        this.handleOnPointerUp
      );
    }
  }

  handleOnResize = () => {
    if (this.lineRenderer !== null) {
      this.lineRenderer.updateSize();
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

  handleOnPointerDown: PointerEventHandler = event => {
    this.pointerIsDown = true;

    // This means that we are erasing
    if (this.isEraseButtonDown(event)) {
      return;
    }

    const currentLine = [];
    const point = new Point(
      event.clientX * Painter.getScaleFactor(),
      event.clientY * Painter.getScaleFactor(),
      event.pressure
    );
    currentLine.push(point);

    this.currentLines.set(fmn.localId as number, currentLine);
  };

  handleOnPointerUp: PointerEventHandler = () => {
    this.pointerIsDown = false;

    bb.bBroadcast({
      type: "done",
      id: fmn.localId
    });

    this.requestRenderFrame();
  };

  eraseLine: PointerEventHandler = event => {
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

  handleOnPointerMove: PointerEventHandler = event => {
    if (!this.pointerIsDown) {
      return;
    }
    if (this.isEraseButtonDown(event)) {
      this.eraseLine(event);
      return;
    }
    const coalescedEvents =
      typeof event.getCoalescedEvents !== "undefined"
        ? event.getCoalescedEvents()
        : [];
    if (coalescedEvents.length > 0) {
      for (const e of coalescedEvents) {
        this.handleOnPointerMove(e);
      }
      return;
    }

    const currentLine = this.currentLines.get(fmn.localId as number);
    if (!currentLine) {
      return;
    }
    const oldPoint = currentLine[currentLine.length - 1];
    const curX = event.clientX * Painter.getScaleFactor();
    const curY = event.clientY * Painter.getScaleFactor();
    const dx = oldPoint.x - curX;
    const dy = oldPoint.y - curY;

    // We subsample for better quality and memory efficiency
    if (
      dx * dx + dy * dy <
      MIN_DISTANCE * MIN_DISTANCE * Painter.getScaleFactor()
    ) {
      return;
    }

    const point = new Point(curX, curY, event.pressure);
    currentLine.push(point);

    bb.bBroadcast({
      type: "ongoing",
      id: fmn.localId,
      line: currentLine
    });
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

  renderFrame: FrameRequestCallback = () => {
    if (this.lineRenderer === null) {
      return;
    }

    this.lineRenderer.clear();
    this.lineRenderer.draw(this.lineGenerator.generateVertices());

    const generator = new LineGenerator(this.pen);
    for (const line of this.currentLines.values()) {
      generator.addLine(line);
    }
    this.lineRenderer.draw(generator.generateVertices());

    this.isDirty = false;
  };

  getX = () => {
    return Math.random() * window.innerWidth * this.pen.getScaleFactor();
  };
  getY = () => {
    return Math.random() * window.innerHeight * this.pen.getScaleFactor();
  };
  addRandomLine = () => {
    const line: Line = [
      new Point(this.getX(), this.getY(), Math.random()),
      new Point(this.getX(), this.getY(), Math.random()),
      new Point(this.getX(), this.getY(), Math.random())
    ];
    this.lineGenerator.addLine(line);
    this.requestRenderFrame();
    window.requestAnimationFrame(this.addRandomLine);
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
        />
        {/* <button */}
        {/*   style={{ */}
        {/*     position: "fixed", */}
        {/*     left: 0, */}
        {/*     top: 0, */}
        {/*     width: 100 */}
        {/*   }} */}
        {/*   onClick={this.addRandomLine} */}
        {/* > */}
        {/*   Test */}
        {/* </button> */}
      </React.Fragment>
    );
  }
}
export default Painter;
