import * as React from "react";
import LineGenerator from "./LineGenerator";
import LineRenderer, { Color } from "./LineRenderer";
import FeltPen from "./Pen/FeltPen";
import Pen from "./Pen/Pen";
import { FullMeshNetwork, TaggedCausalStableBroadcast as TCSB } from "network";
import Lines from "./Lines";
import ColorPicker from "./ColorPicker";

const fmn = new FullMeshNetwork("wss://rehnarama-notes.glitch.me");
const lines = new Lines(fmn);

fmn.onConnection.add(() => {
  console.log("yay");
});

const MIN_REMOVE_DISTANCE = 10;
const MIN_DISTANCE = 6;
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

interface State {
  color: Color;
  thickness: number;
}

class Painter extends React.PureComponent<Props, State> {
  previousPoint?: Point;

  isMoving = false;
  moveStart = { x: 0, y: 0 };

  pointerIsDown = false;
  erase = false;

  isDirty = false;

  pen: Pen = new FeltPen();
  lineGenerator = new LineGenerator(this.pen);
  lineRenderer: LineRenderer | null = null;
  targetRef = React.createRef<HTMLDivElement>();

  previewRef = React.createRef<HTMLDivElement>();
  previewRenderer: LineRenderer | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      color: [0, 0, 0, 1],
      thickness: 1
    };

    lines.onChange.add(msg => {
      if (msg.name === "add") {
        const line = lines.getLines().get(msg.id);
        if (line) {
          this.lineGenerator.addLine(msg.id, line);
        }
      } else if (msg.name === "rmv") {
        this.lineGenerator.removeLine(msg.id);
      }
      this.requestRenderFrame();
    });
  }

  componentDidMount() {
    if (this.targetRef.current === null || this.previewRef.current === null) {
      throw new Error("Could not find target element");
    }

    this.lineRenderer = new LineRenderer(this.targetRef.current);
    this.requestRenderFrame();

    this.previewRenderer = new LineRenderer(this.previewRef.current);
    this.renderPreview();

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
    this.targetRef.current.addEventListener(
      "contextmenu",
      this.handleOnContextMenu
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
      this.targetRef.current.removeEventListener(
        "contextmenu",
        this.handleOnContextMenu
      );
    }
  }

  handleOnContextMenu: EventListener = event => {
    event.preventDefault();
  };

  handleOnResize = () => {
    if (this.lineRenderer !== null) {
      this.lineRenderer.updateSize();
      this.requestRenderFrame();
    }
    if (this.previewRenderer !== null) {
      this.previewRenderer.updateSize();
      this.renderPreview();
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
    return ((button === 5 || button === -1) && buttons === 32) || buttons === 2; // 2 is right-click
  };

  handleOnPointerDown: PointerEventHandler = event => {
    if (event.pointerType === "touch") {
      this.isMoving = true;
      this.moveStart.x = event.clientX;
      this.moveStart.y = event.clientY;
      return;
    }

    this.pointerIsDown = true;

    if (!this.isEraseButtonDown(event)) {
      lines.beginLine(this.state.color, this.state.thickness);
      const point = new Point(event.clientX, event.clientY, event.pressure);

      this.addPoint(point);
    }
  };

  handleOnPointerUp: PointerEventHandler = event => {
    this.pointerIsDown = false;
    this.isMoving = false;
  };

  eraseLine: PointerEventHandler = event => {
    if (this.lineRenderer === null) {
      return;
    }

    const point = new Point(
      event.clientX - this.lineRenderer.position.x,
      event.clientY - this.lineRenderer.position.y
    );

    const allLines = lines.getLines();
    for (const [id, line] of allLines) {
      for (let pointIndex = 0; pointIndex < line.points.length; pointIndex++) {
        const dx = line.points[pointIndex].x - point.x;
        const dy = line.points[pointIndex].y - point.y;

        const distSq = dx * dx + dy * dy;

        // Found a line close enough
        if (distSq < MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE) {
          lines.removeLine(id);
        }
      }
    }
  };

  handleOnPointerMove: PointerEventHandler = event => {
    if (this.isMoving && this.lineRenderer) {
      const deltaX = this.moveStart.x - event.clientX;
      const deltaY = this.moveStart.y - event.clientY;
      this.lineRenderer.position.x -= deltaX;
      this.lineRenderer.position.y -= deltaY;
      this.moveStart.x = event.clientX;
      this.moveStart.y = event.clientY;
      this.requestRenderFrame();
      return;
    }
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

    const curX = event.clientX;
    const curY = event.clientY;
    const point = new Point(curX, curY, event.pressure);

    this.addPoint(point);
  };

  requestRenderFrame = () => {
    if (this.isDirty) {
      return;
    }

    this.isDirty = true;
    window.requestAnimationFrame(this.renderFrame);
  };

  private addPoint(point: Point) {
    if (this.lineRenderer) {
      point.x -= this.lineRenderer.position.x;
      point.y -= this.lineRenderer.position.y;
    }

    if (this.previousPoint) {
      const dx = this.previousPoint.x - point.x;
      const dy = this.previousPoint.y - point.y;
      // We subsample for better quality and memory efficiency
      if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) {
        return;
      }
    }
    lines.addPoint(point);
    this.previousPoint = point;
  }

  renderFrame: FrameRequestCallback = () => {
    if (this.lineRenderer === null) {
      return;
    }

    this.lineRenderer.clear();

    const data = this.lineGenerator.generateData();
    this.lineRenderer.draw(data.vertices, data.color);

    this.isDirty = false;
  };

  renderPreview = () => {
    if (this.previewRenderer === null) {
      return;
    }

    const generator = new LineGenerator(this.pen);
    generator.addLine(0, {
      points: [
        { pressure: 0.8, x: 10, y: 20 },
        { pressure: 0.6, x: 60, y: 60 },
        { pressure: 0.5, x: 70, y: 20 },
        { pressure: 0.2, x: 140, y: 60 }
      ],
      color: this.state.color,
      thickness: this.state.thickness
    });

    const data = generator.generateData();
    this.previewRenderer.draw(data.vertices, data.color);
  };

  getX = () => {
    return Math.random() * window.innerWidth;
  };
  getY = () => {
    return Math.random() * window.innerHeight;
  };

  clear = () => {
    this.requestRenderFrame();
  };

  onPick = (color: Color) => {
    this.setState(
      {
        color
      },
      this.renderPreview
    );
  };

  onThicknessChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    this.setState(
      {
        thickness: e.currentTarget.valueAsNumber
      },
      this.renderPreview
    );
  };

  goLeft = () => {
    if (this.lineRenderer) {
      this.lineRenderer.position.x -= 10;
    }
    this.requestRenderFrame();
  };
  goRight = () => {
    if (this.lineRenderer) {
      this.lineRenderer.position.x += 10;
    }
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
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            right: 0,
            height: 64,
            background: "white",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 0 8px rgba(0,0,0,0.4)"
          }}
        >
          <ColorPicker onPick={this.onPick} />
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.2"
            value={this.state.thickness}
            onChange={this.onThicknessChange}
          ></input>
          <div
            ref={this.previewRef}
            style={{
              width: 200,
              height: "100%"
            }}
          />
        </div>
      </React.Fragment>
    );
  }
}
export default Painter;
