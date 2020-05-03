import * as React from "react";
import LineGenerator, { Point } from "../Lines/LineGenerator";
import LineRenderer, { Color } from "../Lines/LineRenderer";
import FeltPen from "../Pen/FeltPen";
import Lines from "../Lines/Lines";
import GestureRecognizer, {
  PanEvent,
  ZoomEvent,
  DownEvent
} from "../GestureRecognizer";
import { intersects } from "../Lines/LineUtils";

const MIN_REMOVE_DISTANCE = 6;
const MIN_DISTANCE = 2;
// Default pressure is treated as
// pressure not supported, as per spec: https://www.w3.org/TR/pointerevents/

interface Props {
  color: Color;
  thickness: number;
  lines: Lines;
  cursorMode?: boolean;
  eraseMode?: boolean;
}

class Painter extends React.PureComponent<Props> {
  previousPoint?: Point;

  moveStart = { x: 0, y: 0 };
  previousErasePoint = { x: 0, y: 0 };

  drawPointerIsDown = false;
  erase = false;

  isDirty = false;
  hasNew = false;

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
      this.hasNew = true;

      const data = this.lineGenerator.generateData();
      this.lineRenderer?.loadData(data);
    });
  }

  componentDidMount() {
    if (this.targetRef.current === null) {
      throw new Error("Could not find target element");
    }

    this.lineRenderer = new LineRenderer(this.targetRef.current);
    this.lineRenderer.updateSize();

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
      if (
        (this.props.cursorMode && e.pointerType !== "scroll") ||
        e.pointerType === "pen"
      ) {
        const point = new Point(e.position.x, e.position.y, e.pressure);
        if (this.isEraseButtons(e.buttons) || this.props.eraseMode) {
          this.eraseLine([
            this.windowToLocalPoint(this.previousErasePoint),
            this.windowToLocalPoint(point)
          ]);
          this.previousErasePoint = point;
        } else {
          this.addPoint(point);
        }
      } else if (e.pointerType === "touch" || e.pointerType === "scroll") {
        this.lineRenderer.position = {
          x: this.lineRenderer.position.x + e.delta.x,
          y: this.lineRenderer.position.y + e.delta.y
        };
      }
    }
  };

  private handleOnDown = (e: DownEvent) => {
    if (this.lineRenderer) {
      if (this.props.cursorMode || e.pointerType === "pen") {
        const point = new Point(e.position.x, e.position.y, e.pressure);
        if (this.isEraseButtons(e.buttons) || this.props.eraseMode) {
          this.previousErasePoint = point;
        } else {
          this.props.lines.beginLine(this.props.color, this.props.thickness);
          this.addPoint(point);
        }
      }
    }
  };

  private handleOnZoom = (e: ZoomEvent) => {
    if (this.lineRenderer) {
      if (!(this.props.cursorMode && e.method === "pinch")) {
        this.lineRenderer.setZoom(
          this.lineRenderer.zoom + e.delta * 0.008 * this.lineRenderer.zoom,
          {
            x: e.around.x / this.lineRenderer.zoom,
            y: e.around.y / this.lineRenderer.zoom
          }
        );
      }
    }
  };

  private windowToLocalPoint<T extends { x: number; y: number }>(point: T): T {
    if (this.lineRenderer === null) {
      return point;
    }
    return {
      ...point,
      x: (point.x - this.lineRenderer.position.x) / this.lineRenderer.zoom,
      y: (point.y - this.lineRenderer.position.y) / this.lineRenderer.zoom
    };
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
    }
  };

  isEraseButtons = (buttons: number) => {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#Determining_button_states
    return buttons === 32 || buttons === 2;
  };

  eraseLine = (
    eraseSegment: [{ x: number; y: number }, { x: number; y: number }]
  ) => {
    if (this.lineRenderer === null) {
      return;
    }

    const allLines = this.props.lines.getLines();
    for (const [id, line] of allLines) {
      if (line.points.length === 1) {
        // Can't build a segment out of one point, so let's just check if we're close
        for (const point of eraseSegment) {
          const dx = line.points[0].x - point.x;
          const dy = line.points[0].y - point.y;

          const distSq = dx * dx + dy * dy;

          // Found a line close enough
          if (distSq < MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE) {
            this.props.lines.removeLine(id);
          }
        }
      } else {
        for (
          let pointIndex = 1;
          pointIndex < line.points.length;
          pointIndex++
        ) {
          const first = line.points[pointIndex - 1];
          const second = line.points[pointIndex - 0];
          const segment: [Point, Point] = [first, second];

          if (intersects(eraseSegment, segment)) {
            this.props.lines.removeLine(id);
          }
        }
      }
    }
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
