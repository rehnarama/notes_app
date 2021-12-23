import * as React from "react";
import LineGenerator, { Point, Line } from "../Lines/LineGenerator";
import LineRenderer, { Color } from "../Lines/LineRenderer";
import FeltPen from "../Pen/FeltPen";
import Lines, { Box, LineId } from "../Data/Lines/Lines";
import GestureRecognizer, {
  PanEvent,
  ZoomEvent,
  DownEvent,
  UpEvent,
  HoverEvent,
  MoveEvent
} from "../GestureRecognizer";
import { intersects } from "../Lines/LineUtils";
import GLApp from "../GLApp";
import CommandManager from "../CommandManager";
import PointersData from "../Data/Pointers/PointersData";
import Canvas from "../Rendering/Canvas";
import PointersRenderer from "../Rendering/PointersRenderer";
import Vector2 from "../Utils/Vector2";

const MIN_REMOVE_DISTANCE = 6;
const MIN_DISTANCE = 2;
// Default pressure is treated as
// pressure not supported, as per spec: https://www.w3.org/TR/pointerevents/

interface Props {
  color: Color;
  thickness: number;
  lines: Lines;
  pointers: PointersData;
  cursorMode?: boolean;
  eraseMode?: boolean;
}

class Painter extends React.PureComponent<Props> {
  previousPoint?: Point;

  moveStart = { x: 0, y: 0 };
  previousErasePoint = { x: 0, y: 0 };

  selectStart = { x: 0, y: 0 };
  isSelecting = false;

  drawPointerIsDown = false;
  erase = false;

  isDirty = false;
  hasNew = false;

  lineGenerator = new LineGenerator(FeltPen);
  pointersRenderer: PointersRenderer | null = null;
  lineRenderer: LineRenderer | null = null;
  selectRenderer: LineRenderer | null = null;
  selectedLinesRenderer: LineRenderer | null = null;
  canvas: Canvas | null = null;
  targetRef = React.createRef<HTMLDivElement>();

  gestureRecognizer: GestureRecognizer | null = null;

  selectedLines = new Map<LineId, Line>();

  _canDrag: boolean = false;

  constructor(props: Props) {
    super(props);

    props.lines.onChange.add(msg => {
      if (msg.name === "add" || msg.name === "upd" || msg.name === "mv") {
        const line = props.lines.getLines().get(msg.id);
        if (line) {
          this.lineGenerator.addLine(msg.id, line);
        }
      } else if (msg.name === "rmv") {
        this.lineGenerator.removeLine(msg.id);
      }
      this.hasNew = true;

      this.lineRenderer?.loadData(this.lineGenerator);
    });
  }

  componentDidMount() {
    if (this.targetRef.current === null) {
      throw new Error("Could not find target element");
    }

    const glApp = new GLApp(this.targetRef.current);
    this.canvas = new Canvas(glApp);
    this.selectedLinesRenderer = glApp.addProgram(
      new LineRenderer(glApp, this.canvas)
    );
    this.lineRenderer = glApp.addProgram(new LineRenderer(glApp, this.canvas));
    this.selectRenderer = glApp.addProgram(
      new LineRenderer(glApp, this.canvas)
    );
    this.pointersRenderer = glApp.addProgram(
      new PointersRenderer(glApp, this.canvas)
    );
    this.setupPointers(this.pointersRenderer);

    this.gestureRecognizer = new GestureRecognizer(this.targetRef.current);
    this.gestureRecognizer.onZoom.add(this.handleOnZoom);
    this.gestureRecognizer.onDown.add(this.handleOnDown);
    this.gestureRecognizer.onUp.add(this.handleOnUp);
    this.gestureRecognizer.onHover.add(this.handleOnHover);
    this.gestureRecognizer.onMove.add(this.handleOnMove);
    this.gestureRecognizer.onPan.add(this.handleOnPan);

    this.targetRef.current.addEventListener(
      "contextmenu",
      this.handleOnContextMenu
    );

    CommandManager.Instance.on("delete", this.handleOnDelete);
  }

  private setupPointers = (pointersRenderer: PointersRenderer) => {
    this.props.pointers.onPointerMapUpdated.add(() => {
      pointersRenderer.loadData(
        Array.from(this.props.pointers.pointerMap.values()).map(
          p => new Vector2(p.x, p.y)
        )
      );
    });
  };

  handleOnMove = (e: MoveEvent) => {
    this.props.pointers.updatePoint(this.windowToLocalPoint(e.position));
  };

  componentDidUpdate() {
    for (const [lineId, _] of this.selectedLines) {
      this.props.lines.updateLine(
        lineId,
        this.props.color,
        this.props.thickness
      );
    }
    if (this.selectedLines.size > 0) {
      // To apply new thickness to marked lines
      this.markSelectedLines();
    }

    CommandManager.Instance.off("delete", this.handleOnDelete);
  }

  private handleOnDelete = () => {
    if (this.selectedLines.size > 0) {
      for (const id of this.selectedLines.keys()) {
        this.props.lines.removeLine(id);
      }
    }

    this.clearSelectedLines();
  };

  private handleOnPan = (e: PanEvent) => {
    this.props.pointers.updatePoint(this.windowToLocalPoint(e.position));

    if (this.canvas) {
      if (this.isSelecting) {
        const a = this.selectStart;
        const b = e.position;
        const box: Box = this.windowToLocalBox({
          left: Math.min(a.x, b.x),
          top: Math.min(a.y, b.y),
          bottom: Math.max(a.y, b.y),
          right: Math.max(a.x, b.x)
        });
        const gen = new LineGenerator(FeltPen, false);
        this.genBox(gen, box);
        this.selectRenderer?.loadData(gen);

        const insides = this.props.lines.getLinesInside(box);
        this.selectedLines = insides;
        this.markSelectedLines();
      } else if (this._canDrag && e.pointerType !== "scroll") {
        for (const lineId of this.selectedLines.keys()) {
          this.props.lines.moveLine(lineId, {
            x: e.delta.x / this.canvas.zoom,
            y: e.delta.y / this.canvas.zoom
          });
        }

        this.markSelectedLines();
      } else if (
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
        this.canvas.position = {
          x: this.canvas.position.x + e.delta.x,
          y: this.canvas.position.y + e.delta.y
        };
      }
    }
  };

  private handleOnHover = (e: HoverEvent) => {
    if (this.selectedLines.size > 0) {
      const lineId = this.detectLineAt(this.windowToLocalPoint(e.position));

      // We can drag if we found something that is selected
      this.canDrag = lineId !== undefined;
    }
  };

  private handleOnUp = (e: UpEvent) => {
    if (this.isSelecting) {
      this.selectRenderer?.loadData(new LineGenerator(FeltPen));
      this.isSelecting = false;
    }
  };

  private handleOnDown = (e: DownEvent) => {
    if (this.lineRenderer) {
      if (
        (this.props.cursorMode || e.pointerType === "pen") &&
        !this._canDrag
      ) {
        const point = new Point(e.position.x, e.position.y, e.pressure);
        if (this.isEraseButtons(e.buttons) || this.props.eraseMode) {
          this.previousErasePoint = point;
        } else if (this.isSelectButtons(e.buttons)) {
          // To clear old selected lines
          this.clearSelectedLines();

          this.isSelecting = true;
          this.selectStart = e.position;
        } else {
          this.props.lines.beginLine(this.props.color, this.props.thickness);
          this.addPoint(point);
        }
      }
    }
  };

  private handleOnZoom = (e: ZoomEvent) => {
    if (this.canvas) {
      if (!(this.props.cursorMode && e.method === "pinch")) {
        this.canvas.setZoom(
          this.canvas.zoom + e.delta * 0.008 * this.canvas.zoom,
          {
            x: e.around.x / this.canvas.zoom,
            y: e.around.y / this.canvas.zoom
          }
        );
      }
    }
  };

  private clearSelectedLines() {
    this.selectedLines.clear();
    this.markSelectedLines();
  }

  private genBox(
    gen: LineGenerator,
    box: Box,
    color = [0.7, 0.7, 0.7, 1] as Color
  ) {
    gen.addLine(Math.round(Math.random() * Number.MAX_SAFE_INTEGER), {
      color,
      points: [
        new Point(box.left, box.top),
        new Point(box.right, box.top),
        new Point(box.right, box.bottom),
        new Point(box.left, box.bottom),
        new Point(box.left, box.top)
      ],
      thickness: 0.5
    });
  }

  private markSelectedLines() {
    const selectedGen = new LineGenerator(FeltPen, false);
    for (const [lineId, line] of this.selectedLines) {
      const selectionLine: Line = {
        points: line.points,
        color: [0.8, 0.8, 0.8, 1],
        thickness: line.thickness + 2
      };
      selectedGen.addLine(lineId, selectionLine);
    }
    this.selectedLinesRenderer?.loadData(selectedGen);
  }

  private windowToLocalPoint<T extends { x: number; y: number }>(point: T): T {
    if (this.canvas === null) {
      return point;
    }
    return {
      ...point,
      x: (point.x - this.canvas.position.x) / this.canvas.zoom,
      y: (point.y - this.canvas.position.y) / this.canvas.zoom
    };
  }
  private windowToLocalBox<T extends Box>(box: T): T {
    if (this.canvas === null) {
      return box;
    }
    return {
      ...box,
      left: (box.left - this.canvas.position.x) / this.canvas.zoom,
      right: (box.right - this.canvas.position.x) / this.canvas.zoom,
      top: (box.top - this.canvas.position.y) / this.canvas.zoom,
      bottom: (box.bottom - this.canvas.position.y) / this.canvas.zoom
    };
  }

  componentWillUnmount() {
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

  isEraseButtons = (buttons: number) => {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#Determining_button_states
    return buttons === 32;
  };

  isSelectButtons = (buttons: number) => {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#Determining_button_states
    return buttons === 2;
  };

  eraseLine = (
    eraseSegment: [{ x: number; y: number }, { x: number; y: number }]
  ) => {
    const id = this.detectLineBetween(eraseSegment);
    if (id) {
      this.props.lines.removeLine(id);
    }
  };

  detectLineAt = (point: { x: number; y: number }, sensitivity = 5) => {
    const top = { x: point.x, y: point.y + sensitivity };
    const bottom = { x: point.x, y: point.y - sensitivity };
    const left = { x: point.x - sensitivity, y: point.y };
    const right = { x: point.x + sensitivity, y: point.y };

    let lineId =
      this.detectLineBetween([top, bottom]) ??
      this.detectLineBetween([left, right]);

    return lineId;
  };

  detectLineBetween = (
    detectionPoints: [{ x: number; y: number }, { x: number; y: number }]
  ) => {
    if (this.lineRenderer === null) {
      throw "LineRenderer is null. Perhaps something isn't initialised yet?";
    }

    const allLines = this.props.lines.getLines();
    for (const [id, line] of allLines) {
      if (line.points.length === 1) {
        // Can't build a segment out of one point, so let's just check if we're close
        for (const point of detectionPoints) {
          const dx = line.points[0].x - point.x;
          const dy = line.points[0].y - point.y;

          const distSq = dx * dx + dy * dy;

          // Found a line close enough
          if (distSq < MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE) {
            return id;
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

          if (intersects(detectionPoints, segment)) {
            return id;
          }
        }
      }
    }
  };

  private addPoint(point: Point) {
    if (this.canvas) {
      point.x -= this.canvas.position.x;
      point.y -= this.canvas.position.y;
      point.x /= this.canvas.zoom;
      point.y /= this.canvas.zoom;
    }

    if (this.previousPoint) {
      const dx = this.previousPoint.x - point.x;
      const dy = this.previousPoint.y - point.y;
      // We subsample for better quality and memory efficiency
      // Higher zoom requires higher resolution, scale by zoom value
      const minDistance = MIN_DISTANCE / (this.canvas?.zoom ?? 1);
      if (dx * dx + dy * dy < minDistance * minDistance) {
        return;
      }
    }
    this.props.lines.addPoint(point);
    this.previousPoint = point;
  }

  private set canDrag(value: boolean) {
    if (value !== this._canDrag && this.targetRef.current !== null) {
      this.targetRef.current.style.cursor = value ? "move" : "auto";
    }

    this._canDrag = value;
  }

  render() {
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <div
          ref={this.targetRef}
          style={{
            touchAction: "none",
            overflow: "hidden",
            height: "100%"
          }}
        />
      </div>
    );
  }
}
export default Painter;
