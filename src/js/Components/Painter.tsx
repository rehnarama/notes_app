import * as React from "react";
import LineGenerator, { Point } from "../Lines/LineGenerator";
import LineRenderer, { Color } from "../Lines/LineRenderer";
import FeltPen from "../Pen/FeltPen";
import Lines from "../Lines/Lines";
import GestureRecognizer, { PanEvent, ZoomEvent, DownEvent } from "../GestureRecognizer";

const MIN_REMOVE_DISTANCE = 10;
const MIN_DISTANCE = 6;
// Default pressure is treated as
// pressure not supported, as per spec: https://www.w3.org/TR/pointerevents/
const DEFAULT_PRESSURE = 0.5;

type PointerEventHandler = (event: PointerEvent) => void;

enum Action {
  Draw,
  Move,
  Erase,
  Select
}

interface Props {
  color: Color;
  thickness: number;
  lines: Lines;
  alwaysDraw?: boolean;
  erase?: boolean;
}

class Painter extends React.PureComponent<Props> {
  previousPoint?: Point;

  moveStart = { x: 0, y: 0 };

  drawPointerIsDown = false;
  erase = false;

  isDirty = false;

  lineGenerator = new LineGenerator(FeltPen);
  lineRenderer: LineRenderer | null = null;
  targetRef = React.createRef<HTMLDivElement>();

  gestureRecognizer: GestureRecognizer | null = null;

  constructor(props: Props) {
    super(props);

    props.lines.onChange.add(msg => {
      if (msg.name === "add") {
        const line = props.lines.getLines().get(msg.id);
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
    if (this.targetRef.current === null) {
      throw new Error("Could not find target element");
    }

    this.lineRenderer = new LineRenderer(this.targetRef.current);
    this.requestRenderFrame();

    this.gestureRecognizer = new GestureRecognizer(this.targetRef.current);
    this.gestureRecognizer.onZoom.add(this.handleOnZoom);
    this.gestureRecognizer.onDown.add(this.handleOnDown);

    this.gestureRecognizer.onPan.add(this.handleOnPan);

    this.targetRef.current.addEventListener(
      "contextmenu",
      this.handleOnContextMenu
    );

    window.addEventListener("resize", this.handleOnResize);
  }

  private handleOnPan = (e: PanEvent) => {
    if (this.lineRenderer) {
      console.log(e.pointerType);
      if ((this.props.alwaysDraw && e.pointerType !== "scroll") ||
        e.pointerType === "pen") {
        const point = new Point(e.position.x, e.position.y, e.pressure);
        if (this.isEraseButtons(e.buttons) || this.props.erase) {
          this.eraseLine(point);
        }
        else {
          this.addPoint(point);
        }
      }
      else if (e.pointerType === "touch" || e.pointerType === "scroll") {
        this.lineRenderer.position.x += e.delta.x;
        this.lineRenderer.position.y += e.delta.y;
      }
      this.requestRenderFrame();
    }
  }

  private handleOnDown = (e: DownEvent) => {
    if (this.lineRenderer) {
      if (this.props.alwaysDraw || e.pointerType === "pen") {
        const point = new Point(e.position.x, e.position.y, e.pressure);
        if (this.isEraseButtons(e.buttons) || this.props.erase) {
          this.eraseLine(point);
        }
        else {
          this.props.lines.beginLine(this.props.color, this.props.thickness);
          this.addPoint(point);
        }
        this.requestRenderFrame();
      }
    }
  }

  private handleOnZoom = (e: ZoomEvent) => {
    if (this.lineRenderer) {
      this.lineRenderer.setZoom(this.lineRenderer.zoom + e.delta * 0.008 * this.lineRenderer.zoom, {
        x: e.around.x / this.lineRenderer.zoom,
        y: e.around.y / this.lineRenderer.zoom
      });
      this.requestRenderFrame();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleOnResize);

    this.gestureRecognizer?.dispose();

    if (this.targetRef.current !== null) {
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
  };

  isEraseButtons = (buttons: number) => {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#Determining_button_states
    return buttons === 32 || buttons === 2;
  };

  eraseLine = (point: Point) => {
    if (this.lineRenderer === null) {
      return;
    }

    const realPoint = new Point(
      (point.x - this.lineRenderer.position.x) / this.lineRenderer.zoom,
      (point.y - this.lineRenderer.position.y) / this.lineRenderer.zoom
    );

    const allLines = this.props.lines.getLines();
    for (const [id, line] of allLines) {
      for (let pointIndex = 0; pointIndex < line.points.length; pointIndex++) {
        const dx = line.points[pointIndex].x - realPoint.x;
        const dy = line.points[pointIndex].y - realPoint.y;

        const distSq = dx * dx + dy * dy;

        // Found a line close enough
        if (distSq < MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE) {
          this.props.lines.removeLine(id);
        }
      }
    }
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
      point.x /= this.lineRenderer.zoom;
      point.y /= this.lineRenderer.zoom;
    }

    if (this.previousPoint) {
      const dx = this.previousPoint.x - point.x;
      const dy = this.previousPoint.y - point.y;
      // We subsample for better quality and memory efficiency
      if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) {
        return;
      }
    }
    this.props.lines.addPoint(point);
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

  render() {
    return (
      <div
        ref={this.targetRef}
        style={{
          touchAction: "none",
          overflow: "hidden"
        }}
      />
    );
  }
}
export default Painter;
